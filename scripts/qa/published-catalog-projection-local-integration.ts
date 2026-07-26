import { spawnSync } from "node:child_process";
import path from "node:path";

import { parsePublishedCatalogProjection } from "../../lib/published-catalog/contracts.ts";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const DATABASE = "cybermedica_published_projection_test";
const CONTAINER = `cybermedica-published-projection-${process.pid}`;
const ROOT = process.cwd();

interface RunOptions {
  allowFailure?: boolean;
  quiet?: boolean;
}

function run(command: string, args: string[], options: RunOptions = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : ["ignore", "pipe", "pipe"],
  });
  if (!options.quiet && result.stdout) process.stdout.write(result.stdout);
  if (!options.quiet && result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
  return result;
}

function wait(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function dockerExec(...args: string[]) {
  return run("docker", ["exec", CONTAINER, ...args]);
}

const image = run("docker", ["image", "inspect", IMAGE], {
  allowFailure: true,
  quiet: true,
});
if (image.status !== 0) {
  throw new Error(
    `Required local image ${IMAGE} is absent. This QA command never pulls images automatically.`,
  );
}

let started = false;
try {
  run("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    CONTAINER,
    "-e",
    "POSTGRES_PASSWORD=local_published_projection_test",
    "-e",
    `POSTGRES_DB=${DATABASE}`,
    IMAGE,
  ]);
  started = true;

  let ready = false;
  let consecutiveReadyProbes = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const probe = run("docker", [
      "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
      "-v", "ON_ERROR_STOP=1", "-Atc", "select 1",
    ], { allowFailure: true, quiet: true });
    consecutiveReadyProbes = probe.status === 0 ? consecutiveReadyProbes + 1 : 0;
    if (consecutiveReadyProbes >= 2) {
      ready = true;
      break;
    }
    wait(500);
  }
  if (!ready) throw new Error("Local PostgreSQL did not become ready within 30 seconds.");

  run("docker", [
    "cp",
    path.join(ROOT, "supabase/tests/000_local_auth_bootstrap.sql"),
    `${CONTAINER}:/tmp/000_local_auth_bootstrap.sql`,
  ]);
  run("docker", [
    "cp",
    path.join(ROOT, "supabase/migrations/."),
    `${CONTAINER}:/tmp/cybermedica-migrations`,
  ]);
  run("docker", [
    "cp",
    path.join(ROOT, "supabase/tests/006_published_catalog_projection.sql"),
    `${CONTAINER}:/tmp/006_published_catalog_projection.sql`,
  ]);

  dockerExec(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/000_local_auth_bootstrap.sql",
  );
  dockerExec(
    "bash",
    "-lc",
    `set -euo pipefail
for file in /tmp/cybermedica-migrations/*.sql; do
  psql -U supabase_admin -d ${DATABASE} -v ON_ERROR_STOP=1 -f "$file" >/tmp/migration.out 2>&1 || {
    cat /tmp/migration.out
    exit 1
  }
done`,
  );
  dockerExec(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/006_published_catalog_projection.sql",
  );

  const emptyProjectionResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-Atc",
    `with claims as materialized (
      select set_config('request.jwt.claim.role', 'service_role', false)
    )
    select cloud_api.cloud_published_storefront_catalog_v1() from claims`,
  ], { quiet: true });
  const emptyProjection = parsePublishedCatalogProjection(
    JSON.parse(emptyProjectionResult.stdout.trim()),
  );

  const fixtureAuditResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    `select jsonb_build_object(
      'products', (select count(*) from cloud.products),
      'imports', (select count(*) from cloud.import_products),
      'revisions', (select count(*) from cloud.product_publication_revisions),
      'approvals', (select count(*) from cloud.product_publication_approvals),
      'batches', (select count(*) from cloud.product_publication_batches),
      'structuredBatches', (select count(*) from cloud.product_detail_publication_batches),
      'keyFeatures', (select count(*) from cloud.product_key_features),
      'audit', (select count(*) from cloud.audit_log)
    )`,
  ], { quiet: true });
  const fixtureAudit = JSON.parse(fixtureAuditResult.stdout.trim()) as Record<string, number>;
  if (Object.values(fixtureAudit).some((count) => count !== 0)) {
    throw new Error(`Transactional fixture left local rows behind: ${JSON.stringify(fixtureAudit)}`);
  }

  const privilegeAuditResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    `select jsonb_build_object(
      'anonExecute', has_function_privilege(
        'anon', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
      ),
      'authenticatedExecute', has_function_privilege(
        'authenticated', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
      ),
      'serviceExecute', has_function_privilege(
        'service_role', 'cloud_api.cloud_published_storefront_catalog_v1()', 'EXECUTE'
      ),
      'volatility', (select provolatile from pg_proc
        where oid = 'cloud_api.cloud_published_storefront_catalog_v1()'::regprocedure),
      'securityDefiner', (select prosecdef from pg_proc
        where oid = 'cloud_api.cloud_published_storefront_catalog_v1()'::regprocedure)
    )`,
  ], { quiet: true });
  const privilegeAudit = JSON.parse(privilegeAuditResult.stdout.trim()) as {
    anonExecute: boolean;
    authenticatedExecute: boolean;
    serviceExecute: boolean;
    volatility: string;
    securityDefiner: boolean;
  };
  if (privilegeAudit.anonExecute
      || privilegeAudit.authenticatedExecute
      || !privilegeAudit.serviceExecute
      || privilegeAudit.volatility !== "s"
      || !privilegeAudit.securityDefiner) {
    throw new Error(`Published projection privilege audit failed: ${JSON.stringify(privilegeAudit)}`);
  }

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: 18,
    rpc: "cloud_api.cloud_published_storefront_catalog_v1",
    integration: [
      "published-only-product-visibility",
      "immutable-revision-approval-batch-binding",
      "mandatory-reference-visibility",
      "unresolved-blocker-exclusion",
      "independently-published-structured-fields",
      "public-media-document-registration-filtering",
      "preview-child-isolation",
      "deterministic-slug-ordering",
      "internal-metadata-non-disclosure",
      "public-document-dependency-clock",
      "type-safe-malformed-child-isolation",
      "exact-visible-structured-field-clock",
      "one-hundred-call-determinism",
      "service-only-read-only-grants",
      "empty-projection-schema-validation",
    ],
    testBaseline: {
      products: 2,
      manufacturers: 1,
      categories: 1,
      applicationAreas: 1,
    },
    emptyProjection,
    fixtureAudit,
    privilegeAudit,
    disposableDatabaseRemoved: true,
    remoteConnections: 0,
    remoteWrites: 0,
  }, null, 2)}\n`);
} finally {
  if (started) {
    run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
  }
}
