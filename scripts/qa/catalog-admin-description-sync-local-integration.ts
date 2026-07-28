import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const DATABASE = "cybermedica_catalog_admin_description_sync_test";
const CONTAINER = `cybermedica-catalog-admin-description-sync-${process.pid}`;
const ROOT = process.cwd();
const APPROVED_SNAPSHOT_COMMIT = "5ca5fe24c308fd636743eaf78874f4647749dc21";
const APPROVED_DATASET_SHA256 = "13176ac8b5a7ffca86ecae0250a3345dd2ddcdda75ee8e1445e85546ccd3ca8c";

function run(command: string, args: string[], options: { allowFailure?: boolean; quiet?: boolean } = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : ["ignore", "pipe", "pipe"],
  });
  if (!options.quiet && result.stdout) process.stdout.write(result.stdout);
  if (!options.quiet && result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (!options.allowFailure && result.status !== 0) {
    const details = options.quiet
      ? `\n${[result.stdout, result.stderr].filter(Boolean).join("\n")}`
      : "";
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}${details}`);
  }
  return result;
}

function runAsync(command: string, args: string[]) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (value: string) => { stdout += value; });
    child.stderr.setEncoding("utf8").on("data", (value: string) => { stderr += value; });
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function wait(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function dockerExec(...args: string[]) {
  return run("docker", ["exec", CONTAINER, ...args]);
}

function dockerExecQuiet(...args: string[]) {
  return run("docker", ["exec", CONTAINER, ...args], { quiet: true });
}

function gitShow(relativePath: string) {
  const result = run("git", ["show", `${APPROVED_SNAPSHOT_COMMIT}:${relativePath}`], { quiet: true });
  return result.stdout;
}

function approvedProductImportPayload() {
  const manifest = JSON.parse(gitShow("data/legacy/manifest.json")) as {
    schemaVersion: string;
    recordCount: number;
    datasetSha256: string;
    records: Array<{
      sourceId: string;
      path: string;
      fileSha256: string;
      payloadSha256: string;
    }>;
  };
  if (manifest.schemaVersion !== "immutable-source-snapshot-v1"
      || manifest.recordCount !== 79
      || manifest.records.length !== 79
      || manifest.datasetSha256 !== APPROVED_DATASET_SHA256) {
    throw new Error("Approved immutable 79-product Git baseline metadata mismatch.");
  }

  const snapshots = manifest.records.map((entry) => {
    const source = gitShow(entry.path);
    const fileSha256 = createHash("sha256").update(source).digest("hex");
    const snapshot = JSON.parse(source) as {
      payloadSha256: string;
      raw: { product: { uid?: string | number } };
    };
    if (fileSha256 !== entry.fileSha256
        || snapshot.payloadSha256 !== entry.payloadSha256
        || String(snapshot.raw.product.uid) !== entry.sourceId) {
      throw new Error(`Approved immutable snapshot mismatch: ${entry.path}`);
    }
    return snapshot;
  }).sort((left, right) => String(left.raw.product.uid).localeCompare(String(right.raw.product.uid)));

  return {
    manifest: {
      schemaVersion: manifest.schemaVersion,
      recordCount: manifest.recordCount,
      datasetSha256: manifest.datasetSha256,
      records: manifest.records,
    },
    snapshots,
  };
}

const image = run("docker", ["image", "inspect", IMAGE], { allowFailure: true, quiet: true });
if (image.status !== 0) {
  throw new Error(`Required local image ${IMAGE} is absent; this command never pulls automatically.`);
}

let started = false;
const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "cybermedica-catalog-admin-sync-"));
try {
  const approvedPayloadPath = path.join(temporaryDirectory, "approved-79-payload.json");
  writeFileSync(approvedPayloadPath, JSON.stringify(approvedProductImportPayload()));

  run("docker", [
    "run", "-d", "--rm", "--name", CONTAINER,
    "-e", "POSTGRES_PASSWORD=local_catalog_admin_description_sync_test",
    "-e", `POSTGRES_DB=${DATABASE}`,
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

  for (const file of [
    "supabase/tests/000_local_auth_bootstrap.sql",
    "supabase/tests/009_cloud_internal_function_grants_hardening.sql",
    "supabase/tests/010_catalog_admin_product_description_sync.sql",
    "supabase/tests/011_catalog_admin_product_description_concurrency.sql",
    "supabase/tests/012_catalog_admin_hamilton_79_regression.sql",
  ]) {
    run("docker", ["cp", path.join(ROOT, file), `${CONTAINER}:/tmp/${path.basename(file)}`]);
  }
  run("docker", [
    "cp", path.join(ROOT, "supabase/migrations/."),
    `${CONTAINER}:/tmp/cybermedica-migrations`,
  ]);
  run("docker", [
    "cp", approvedPayloadPath,
    `${CONTAINER}:/tmp/catalog-admin-approved-79-payload.json`,
  ]);

  dockerExec(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/000_local_auth_bootstrap.sql",
  );
  dockerExec(
    "bash", "-lc",
    `set -euo pipefail
for file in /tmp/cybermedica-migrations/*.sql; do
  psql -U supabase_admin -d ${DATABASE} -v ON_ERROR_STOP=1 -f "$file" >/tmp/migration.out 2>&1 || {
    cat /tmp/migration.out
    exit 1
  }
done`,
  );

  dockerExecQuiet(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/010_catalog_admin_product_description_sync.sql",
  );
  dockerExecQuiet(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/012_catalog_admin_hamilton_79_regression.sql",
  );
  const definitionMd5 = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    "select md5(pg_get_functiondef('cloud.catalog_admin_patch_product(uuid,jsonb,text)'::regprocedure))",
  ], { quiet: true });
  process.stdout.write(`Catalog Admin function definition MD5: ${definitionMd5.stdout.trim()}\n`);
  dockerExecQuiet(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/009_cloud_internal_function_grants_hardening.sql",
  );

  dockerExecQuiet(
    "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/011_catalog_admin_product_description_concurrency.sql",
  );

  const concurrentStatement = (value: string, delaySeconds: number) => [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE,
    "-v", "ON_ERROR_STOP=1", "-c",
    `begin;
set local request.jwt.claim.role = 'service_role';
select set_config('request.jwt.claims', '{"role":"service_role","app_metadata":{"app_role":"service"}}', true);
select cloud_api.catalog_admin_patch_product(
  'a2000000-0000-4000-8000-000000000050',
  jsonb_build_object(
    'expectedUpdatedAt', '2026-07-28T11:00:00Z',
    'shortDescription', '${value}'
  ),
  'catalog-admin-concurrency-test'
);
select pg_sleep(${delaySeconds});
commit;`,
  ];

  const first = runAsync("docker", concurrentStatement("Concurrent winner", 0.75));
  await new Promise((resolve) => setTimeout(resolve, 150));
  const second = runAsync("docker", concurrentStatement("Concurrent stale loser", 0));
  const [firstResult, secondResult] = await Promise.all([first, second]);
  if (firstResult.status !== 0) {
    throw new Error(`winning concurrent patch failed: ${firstResult.stderr}`);
  }
  if (secondResult.status === 0 || !secondResult.stderr.includes("stale catalog admin patch")) {
    throw new Error(`stale concurrent patch did not fail closed: ${secondResult.stderr}`);
  }

  const concurrencyAudit = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    `select jsonb_build_object(
      'productShort', product.short_description,
      'ruShort', ru.short_description,
      'enShort', en.short_description,
      'productVersionAdvanced', product.updated_at > '2026-07-28T11:00:00Z'::timestamptz
    )
    from cloud.products product
    join cloud.product_descriptions ru on ru.product_id = product.id and ru.locale = 'ru'
    join cloud.product_descriptions en on en.product_id = product.id and en.locale = 'en'
    where product.id = 'a2000000-0000-4000-8000-000000000050'`,
  ], { quiet: true });
  const concurrency = JSON.parse(concurrencyAudit.stdout.trim()) as Record<string, unknown>;
  if (concurrency.productShort !== "Concurrent winner"
      || concurrency.ruShort !== "Concurrent winner"
      || concurrency.enShort !== "Concurrent English short"
      || concurrency.productVersionAdvanced !== true) {
    throw new Error(`concurrency result mismatch: ${JSON.stringify(concurrency)}`);
  }

  const migrationFiles = readdirSync(path.join(ROOT, "supabase/migrations"))
    .filter((file) => file.endsWith(".sql"))
    .length;
  const signature = run("docker", [
    "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", DATABASE, "-Atc",
    "select to_regprocedure('cloud.catalog_admin_patch_product(uuid,jsonb,text)')::text",
  ], { quiet: true }).stdout.trim();

  process.stdout.write(`Catalog Admin description synchronization local integration PASS\n${JSON.stringify({
    migrationFiles,
    functionSignature: signature,
    concurrency: "PASS",
  })}\n`);
} finally {
  if (started) run("docker", ["rm", "-f", CONTAINER], { allowFailure: true, quiet: true });
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
