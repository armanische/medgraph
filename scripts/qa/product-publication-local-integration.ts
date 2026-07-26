import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const DATABASE = "cybermedica_product_publication_test";
const CONTAINER = `cybermedica-product-publication-${process.pid}`;
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

function runAsync(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (value: string) => { stdout += value; });
    child.stderr.setEncoding("utf8").on("data", (value: string) => { stderr += value; });
    child.on("error", reject);
    child.on("close", (status) => {
      if (status !== 0) {
        reject(new Error(`${command} ${args.join(" ")} failed with status ${status}: ${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
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
    "POSTGRES_PASSWORD=local_product_publication_test",
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
    path.join(ROOT, "supabase/tests/004_product_publication_integration.sql"),
    `${CONTAINER}:/tmp/004_product_publication_integration.sql`,
  ]);
  run("docker", [
    "cp",
    path.join(ROOT, "supabase/tests/005_product_publication_concurrent_approval.sql"),
    `${CONTAINER}:/tmp/005_product_publication_concurrent_approval.sql`,
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
    "/tmp/004_product_publication_integration.sql",
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
      'revisions', (select count(*) from cloud.product_publication_revisions),
      'approvals', (select count(*) from cloud.product_publication_approvals),
      'batches', (select count(*) from cloud.product_publication_batches),
      'events', (select count(*) from cloud.publication_events)
    ) from cloud.products`,
  ], { quiet: true });
  const postTest = JSON.parse(audit.stdout.trim()) as Record<string, number>;
  if (Object.values(postTest).some((value) => value !== 0)) {
    throw new Error(`Transactional fixture left local rows behind: ${JSON.stringify(postTest)}`);
  }

  dockerExec(
    "psql",
    "-U",
    "supabase_admin",
    "-d",
    DATABASE,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "/tmp/005_product_publication_concurrent_approval.sql",
  );

  const concurrentApprovalSql = `with claims as materialized (
    select
      set_config('request.jwt.claim.role', 'service_role', false),
      set_config('request.jwt.claim.sub', '', false),
      set_config(
        'request.jwt.claims',
        '{"role":"service_role","app_metadata":{"app_role":"service"}}',
        false
      )
  )
  select cloud_api.approve_product_publication_revision_v1(
    (select id from cloud.product_publication_revisions
     where idempotency_key = 'product-publication-concurrent-revision'),
    (select id from cloud.review_decisions
     where product_publication_revision_id = (
       select id from cloud.product_publication_revisions
       where idempotency_key = 'product-publication-concurrent-revision'
     ))
  ) from claims`;
  const concurrentCommand = [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-Atc", concurrentApprovalSql,
  ];
  const concurrentRuns = await Promise.all([
    runAsync("docker", concurrentCommand),
    runAsync("docker", concurrentCommand),
  ]);
  const concurrentResults = concurrentRuns.map(({ stdout }) => JSON.parse(stdout.trim()) as {
    approvalId: string;
    idempotent: boolean;
  });
  if (new Set(concurrentResults.map(({ approvalId }) => approvalId)).size !== 1
      || concurrentResults.filter(({ idempotent }) => idempotent).length !== 1) {
    throw new Error(`Concurrent approval was not exactly idempotent: ${JSON.stringify(concurrentResults)}`);
  }

  const concurrencyAuditResult = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    `select jsonb_build_object(
      'approvalCount', (select count(*) from cloud.product_publication_approvals),
      'productState', (select publication_status from cloud.products
        where id = '50000000-0000-4000-8000-000000000050'),
      'reviewItemState', (select status from cloud.review_items
        where import_product_id = '50000000-0000-4000-8000-000000000060'),
      'approvalAuditCount', (select count(*) from cloud.audit_log
        where action = 'approve' and entity_type = 'product_publication_revision'),
      'auditReviewerId', (select actor_id from cloud.audit_log
        where action = 'approve' and entity_type = 'product_publication_revision' limit 1)
    )`,
  ], { quiet: true });
  const concurrencyAudit = JSON.parse(concurrencyAuditResult.stdout.trim()) as {
    approvalCount: number;
    productState: string;
    reviewItemState: string;
    approvalAuditCount: number;
    auditReviewerId: string;
  };
  if (concurrencyAudit.approvalCount !== 1
      || concurrencyAudit.productState !== "approved"
      || concurrencyAudit.reviewItemState !== "approved"
      || concurrencyAudit.approvalAuditCount !== 1
      || concurrencyAudit.auditReviewerId !== "50000000-0000-4000-8000-000000000002") {
    throw new Error(`Concurrent approval audit failed: ${JSON.stringify(concurrencyAudit)}`);
  }

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: 16,
    integration: [
      "imported-to-review-state",
      "immutable-revision-and-checksums",
      "trusted-authenticated-reviewer-and-service-actor",
      "revision-bound-approval",
      "current-approved-revision-only",
      "service-only-publication",
      "idempotent-revision-approval-publication",
      "concurrent-idempotent-approval",
      "persistent-published-dependency-guards",
      "atomic-failure-rollback",
      "archive-and-exact-rollback",
      "idempotent-rollback",
      "direct-state-bypass-rejection",
      "post-approval-content-lock",
      "append-only-audit-history",
      "fail-closed-rls-and-grants",
    ],
    postTest,
    concurrencyAudit,
    concurrentResults,
    disposableDatabaseRemoved: true,
    remoteConnections: 0,
  }, null, 2)}\n`);
} finally {
  if (started) {
    run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
  }
}
