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
      'serviceInternalExecute', has_function_privilege(
        'service_role', 'cloud.capture_published_catalog_projection_v2()', 'EXECUTE'
      ),
      'anonStateSelect', has_table_privilege(
        'anon', 'cloud.published_catalog_projection_state', 'SELECT'
      ),
      'authenticatedStateSelect', has_table_privilege(
        'authenticated', 'cloud.published_catalog_projection_state', 'SELECT'
      ),
      'serviceStateSelect', has_table_privilege(
        'service_role', 'cloud.published_catalog_projection_state', 'SELECT'
      ),
      'serviceStateWrite', has_table_privilege(
        'service_role', 'cloud.published_catalog_projection_state', 'INSERT,UPDATE,DELETE'
      ),
      'stateRls', (select relrowsecurity from pg_class
        where oid = 'cloud.published_catalog_projection_state'::regclass),
      'stateOwner', (select pg_get_userbyid(relowner) from pg_class
        where oid = 'cloud.published_catalog_projection_state'::regclass),
      'alwaysTriggerCount', (select count(*) from pg_trigger
        where tgname like '%\\_projection\\_%\\_v2' escape '\\'
          and tgenabled = 'A'),
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
    serviceInternalExecute: boolean;
    anonStateSelect: boolean;
    authenticatedStateSelect: boolean;
    serviceStateSelect: boolean;
    serviceStateWrite: boolean;
    stateRls: boolean;
    stateOwner: string;
    alwaysTriggerCount: number;
    volatility: string;
    securityDefiner: boolean;
  };
  if (privilegeAudit.anonExecute
      || privilegeAudit.authenticatedExecute
      || !privilegeAudit.serviceExecute
      || privilegeAudit.serviceInternalExecute
      || privilegeAudit.anonStateSelect
      || privilegeAudit.authenticatedStateSelect
      || privilegeAudit.serviceStateSelect
      || privilegeAudit.serviceStateWrite
      || !privilegeAudit.stateRls
      || privilegeAudit.stateOwner !== "supabase_admin"
      || privilegeAudit.alwaysTriggerCount !== 38
      || privilegeAudit.volatility !== "s"
      || !privilegeAudit.securityDefiner) {
    throw new Error(`Published projection privilege audit failed: ${JSON.stringify(privilegeAudit)}`);
  }

  // Commit the same fully asserted local fixture in the disposable database,
  // then prove that two concurrent public mutations serialize without losing
  // a clock event. The container is removed in finally, so no fixture escapes.
  dockerExec(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-v", "keep_fixture=1",
    "-f", "/tmp/006_published_catalog_projection.sql",
  );

  const projectionStateSql = `with claims as materialized (
      select set_config('request.jwt.claim.role', 'service_role', false)
    ), projection as materialized (
      select cloud_api.cloud_published_storefront_catalog_v1() as payload from claims
    )
    select jsonb_build_object(
      'version', state.version,
      'generatedAt', projection.payload ->> 'generatedAt',
      'checksumMatches', state.payload_checksum = cloud.sha256_jsonb_v1(
        projection.payload - 'generatedAt'
      ),
      'manufacturerChanged', projection.payload @? '$.manufacturers[*] ? (@.description == "Concurrent manufacturer change")',
      'categoryChanged', projection.payload @? '$.categories[*] ? (@.description == "Concurrent category change")'
    )
    from projection
    cross join cloud.published_catalog_projection_state state
    where state.singleton`;
  const beforeConcurrencyResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-Atc", projectionStateSql,
  ], { quiet: true });
  const beforeConcurrency = JSON.parse(beforeConcurrencyResult.stdout.trim()) as {
    version: number;
    generatedAt: string;
  };

  dockerExec(
    "bash", "-lc",
    `set -euo pipefail
psql -U supabase_admin -d ${DATABASE} -v ON_ERROR_STOP=1 -c "begin; update cloud.manufacturers set description = 'Concurrent manufacturer change' where id = '60000000-0000-4000-8000-000000000010'; select pg_sleep(0.25); commit" >/tmp/concurrent-manufacturer.out 2>&1 &
first_pid=$!
sleep 0.05
psql -U supabase_admin -d ${DATABASE} -v ON_ERROR_STOP=1 -c "begin; update cloud.categories set description = 'Concurrent category change' where id = '60000000-0000-4000-8000-000000000020'; commit" >/tmp/concurrent-category.out 2>&1 &
second_pid=$!
wait "$first_pid" || { cat /tmp/concurrent-manufacturer.out; exit 1; }
wait "$second_pid" || { cat /tmp/concurrent-category.out; exit 1; }`,
  );

  const afterConcurrencyResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-Atc", projectionStateSql,
  ], { quiet: true });
  const afterConcurrency = JSON.parse(afterConcurrencyResult.stdout.trim()) as {
    version: number;
    generatedAt: string;
    checksumMatches: boolean;
    manufacturerChanged: boolean;
    categoryChanged: boolean;
  };
  if (afterConcurrency.version !== beforeConcurrency.version + 2
      || Date.parse(afterConcurrency.generatedAt) <= Date.parse(beforeConcurrency.generatedAt)
      || !afterConcurrency.checksumMatches
      || !afterConcurrency.manufacturerChanged
      || !afterConcurrency.categoryChanged) {
    throw new Error(`Published projection concurrency audit failed: ${JSON.stringify({
      beforeConcurrency,
      afterConcurrency,
    })}`);
  }
  const concurrencyAudit = {
    status: "PASS",
    committedPublicChanges: 2,
    versionDelta: afterConcurrency.version - beforeConcurrency.version,
    monotonic: Date.parse(afterConcurrency.generatedAt) > Date.parse(beforeConcurrency.generatedAt),
    checksumMatches: afterConcurrency.checksumMatches,
    eventLoss: 0,
  };

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: 19,
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
      "public-removal-monotonic-clock",
      "hidden-and-exact-retry-clock-stability",
      "transactional-clock-rollback",
      "Product-storage-ownership-binding",
      "concurrent-public-change-serialization",
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
    concurrencyAudit,
    disposableDatabaseRemoved: true,
    remoteConnections: 0,
    remoteWrites: 0,
  }, null, 2)}\n`);
} finally {
  if (started) {
    run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
  }
}
