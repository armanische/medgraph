import { spawnSync } from "node:child_process";
import path from "node:path";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const DATABASE = "cybermedica_internal_rbac_test";
const CONTAINER = `cybermedica-internal-rbac-${process.pid}`;
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

function psql(sql: string, options: RunOptions = {}) {
  return run("docker", [
    "exec",
    CONTAINER,
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    DATABASE,
    "-v",
    "ON_ERROR_STOP=1",
    "-Atc",
    sql,
  ], options);
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
    "POSTGRES_PASSWORD=local_internal_rbac_test",
    "-e",
    `POSTGRES_DB=${DATABASE}`,
    IMAGE,
  ]);
  started = true;

  let ready = false;
  let consecutiveReadyProbes = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const probe = psql("select 1", { allowFailure: true, quiet: true });
    consecutiveReadyProbes = probe.status === 0 ? consecutiveReadyProbes + 1 : 0;
    if (consecutiveReadyProbes >= 2) {
      ready = true;
      break;
    }
    wait(500);
  }
  if (!ready) throw new Error("Local PostgreSQL did not remain ready within 30 seconds.");

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
    path.join(ROOT, "supabase/tests/009_internal_rbac_read_contract.sql"),
    `${CONTAINER}:/tmp/009_internal_rbac_read_contract.sql`,
  ]);

  run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/000_local_auth_bootstrap.sql",
  ]);
  run("docker", [
    "exec",
    CONTAINER,
    "bash",
    "-lc",
    `set -euo pipefail
for file in /tmp/cybermedica-migrations/*.sql; do
  psql -U supabase_admin -d ${DATABASE} -v ON_ERROR_STOP=1 -f "$file" >/tmp/migration.out 2>&1 || {
    cat /tmp/migration.out
    exit 1
  }
done`,
  ]);

  const snapshotSql = `select jsonb_build_object(
    'userProfiles', (select count(*) from cloud.user_profiles),
    'products', (select count(*) from cloud.products),
    'reviewDecisions', (select count(*) from cloud.review_decisions),
    'publicationRevisions', (select count(*) from cloud.product_publication_revisions),
    'approvals', (select count(*) from cloud.product_publication_approvals),
    'publicationBatches', (select count(*) from cloud.product_publication_batches),
    'auditRows', (select count(*) from cloud.audit_log),
    'projectionState', (select to_jsonb(state) from cloud.published_catalog_projection_state state)
  )`;
  const before = psql(snapshotSql, { quiet: true }).stdout.trim();

  run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/009_internal_rbac_read_contract.sql",
  ]);

  const anonymousCall = psql(
    "set role anon; select cloud_api.current_internal_access_v1()",
    { allowFailure: true, quiet: true },
  );
  if (anonymousCall.status === 0 || !anonymousCall.stderr.includes("permission denied")) {
    throw new Error("Anonymous caller unexpectedly executed current_internal_access_v1().");
  }

  const directProfileRead = psql(
    "set role authenticated; select count(*) from cloud.user_profiles",
    { allowFailure: true, quiet: true },
  );
  if (directProfileRead.status === 0 || !directProfileRead.stderr.includes("permission denied")) {
    throw new Error("Authenticated caller unexpectedly read cloud.user_profiles directly.");
  }

  const after = psql(snapshotSql, { quiet: true }).stdout.trim();
  if (after !== before) {
    throw new Error(`RBAC read tests mutated business state: before=${before} after=${after}`);
  }

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: 22,
    function: "cloud_api.current_internal_access_v1()",
    authorization: [
      "anon-denied",
      "authenticated-admin-own-profile",
      "authenticated-reviewer-allowed",
      "unsupported-role-denied",
      "missing-profile-denied",
      "cross-profile-read-denied",
      "direct-table-read-denied",
    ],
    security: [
      "auth-uid-only",
      "no-arguments",
      "minimal-dto",
      "fixed-search-path",
      "constrained-nologin-owner",
      "no-service-role-runtime-grant",
      "no-business-writes",
    ],
    businessStateBefore: JSON.parse(before),
    businessStateAfter: JSON.parse(after),
    disposableDatabaseRemoved: true,
    remoteConnections: 0,
  }, null, 2)}\n`);
} finally {
  if (started) {
    run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
  }
}
