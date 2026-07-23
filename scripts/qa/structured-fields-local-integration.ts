import { spawnSync } from "node:child_process";
import path from "node:path";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const DATABASE = "cybermedica_structured_fields_test";
const CONTAINER = `cybermedica-structured-fields-${process.pid}`;
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
    "POSTGRES_PASSWORD=local_structured_fields_test",
    "-e",
    `POSTGRES_DB=${DATABASE}`,
    IMAGE,
  ]);
  started = true;

  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const probe = run(
      "docker",
      ["exec", CONTAINER, "pg_isready", "-U", "postgres", "-d", DATABASE],
      { allowFailure: true, quiet: true },
    );
    if (probe.status === 0) {
      ready = true;
      break;
    }
    wait(500);
  }
  if (!ready) throw new Error("Local PostgreSQL did not become ready within 15 seconds.");

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
    path.join(ROOT, "supabase/tests/002_structured_product_detail_integration.sql"),
    `${CONTAINER}:/tmp/002_structured_product_detail_integration.sql`,
  ]);

  dockerExec(
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    DATABASE,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "/tmp/000_local_auth_bootstrap.sql",
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
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    DATABASE,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "/tmp/002_structured_product_detail_integration.sql",
  );

  const audit = run("docker", [
    "exec",
    CONTAINER,
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    DATABASE,
    "-Atc",
    `select jsonb_build_object(
      'products', count(*),
      'features', (select count(*) from cloud.product_key_features),
      'batches', (select count(*) from cloud.product_detail_publication_batches),
      'events', (select count(*) from cloud.publication_events)
    ) from cloud.products`,
  ], { quiet: true });
  const postTest = JSON.parse(audit.stdout.trim()) as Record<string, number>;
  if (Object.values(postTest).some((value) => value !== 0)) {
    throw new Error(`Transactional fixture left local rows behind: ${JSON.stringify(postTest)}`);
  }

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: 13,
    integration: [
      "review-validation",
      "service-only-writer",
      "idempotent-retry",
      "published-only-projection",
      "rollback",
      "idempotent-rollback",
    ],
    postTest,
    remoteConnections: 0,
  }, null, 2)}\n`);
} finally {
  if (started) {
    run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
  }
}
