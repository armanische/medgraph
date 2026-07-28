import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.147";
const CONTAINER = `cybermedica-publication-candidate-owner-${process.pid}`;
const ROOT = process.cwd();
const ALIGNMENT_MIGRATION =
  "202607290002_publication_candidate_function_owner_alignment_v1.sql";
const APPROVED_PAYLOAD_MIGRATION =
  "202607290001_publication_candidate_payload_completeness_corrective_v1.sql";
const APPROVED_PAYLOAD_SHA256 =
  "38f3f9c0180960675eade1dded1b705f55e9bfa390ee12af0eaded34350fc309";

interface RunOptions {
  allowFailure?: boolean;
  quiet?: boolean;
}

interface FunctionSnapshot {
  owner: string;
  definitionChecksum: string;
  identityArguments: string;
  resultType: string;
  securityDefiner: boolean;
  volatility: string;
  settings: string[];
  runtimeAcl: {
    public: boolean;
    anon: boolean;
    authenticated: boolean;
    serviceRole: boolean;
  };
  containsSeoTitle: boolean;
  containsSeoDescription: boolean;
  containsCharacteristics: boolean;
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
    const details = options.quiet
      ? `\n${[result.stdout, result.stderr].filter(Boolean).join("\n")}`
      : "";
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}${details}`);
  }
  return result;
}

function dockerExec(...args: string[]) {
  return run("docker", ["exec", CONTAINER, ...args]);
}

function dockerExecQuiet(...args: string[]) {
  return run("docker", ["exec", CONTAINER, ...args], { quiet: true });
}

function sha256(contents: string | Buffer) {
  return createHash("sha256").update(contents).digest("hex");
}

function applyPreAlignmentChain(database: string, actor: "postgres" | "supabase_admin") {
  dockerExec(
    "psql", "-U", actor, "-d", database,
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/000_local_auth_bootstrap.sql",
  );
  dockerExec(
    "bash",
    "-lc",
    `set -euo pipefail
for file in /tmp/cybermedica-migrations/*.sql; do
  if [ "$(basename "$file")" = "${ALIGNMENT_MIGRATION}" ]; then
    break
  fi
  psql -U ${actor} -d ${database} -v ON_ERROR_STOP=1 -f "$file" >/tmp/migration.out 2>&1 || {
    cat /tmp/migration.out
    exit 1
  }
done`,
  );
}

function applyAlignment(database: string, actor: "postgres" | "supabase_admin") {
  dockerExec(
    "psql", "-U", actor, "-d", database,
    "-v", "ON_ERROR_STOP=1",
    "-f", `/tmp/cybermedica-migrations/${ALIGNMENT_MIGRATION}`,
  );
}

function snapshot(database: string, actor: "postgres" | "supabase_admin") {
  const result = dockerExecQuiet(
    "psql", "-U", actor, "-d", database, "-Atc",
    `select jsonb_build_object(
      'owner', pg_get_userbyid(proc.proowner),
      'definitionChecksum', md5(pg_get_functiondef(proc.oid)),
      'identityArguments', pg_get_function_identity_arguments(proc.oid),
      'resultType', pg_get_function_result(proc.oid),
      'securityDefiner', proc.prosecdef,
      'volatility', proc.provolatile,
      'settings', to_jsonb(proc.proconfig),
      'runtimeAcl', jsonb_build_object(
        'public', has_function_privilege(
          'public', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
        ),
        'anon', has_function_privilege(
          'anon', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
        ),
        'authenticated', has_function_privilege(
          'authenticated', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
        ),
        'serviceRole', has_function_privilege(
          'service_role', 'cloud.product_publication_candidate_payload_v1(uuid)', 'execute'
        )
      ),
      'containsSeoTitle', position('seoTitle' in pg_get_functiondef(proc.oid)) > 0,
      'containsSeoDescription', position('seoDescription' in pg_get_functiondef(proc.oid)) > 0,
      'containsCharacteristics', position('characteristics' in pg_get_functiondef(proc.oid)) > 0
    )
    from pg_proc proc
    where proc.oid = 'cloud.product_publication_candidate_payload_v1(uuid)'::regprocedure`,
  );
  return JSON.parse(result.stdout.trim()) as FunctionSnapshot;
}

function assertStableContract(
  label: string,
  before: FunctionSnapshot,
  after: FunctionSnapshot,
  expectedBeforeOwner: "postgres" | "supabase_admin",
) {
  if (before.owner !== expectedBeforeOwner || after.owner !== "postgres") {
    throw new Error(`${label} owner normalization failed: ${JSON.stringify({ before, after })}`);
  }
  const invariantKeys: Array<keyof FunctionSnapshot> = [
    "definitionChecksum",
    "identityArguments",
    "resultType",
    "securityDefiner",
    "volatility",
    "settings",
    "runtimeAcl",
    "containsSeoTitle",
    "containsSeoDescription",
    "containsCharacteristics",
  ];
  for (const key of invariantKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      throw new Error(`${label} changed ${key}: ${JSON.stringify({ before, after })}`);
    }
  }
  if (after.securityDefiner
      || after.volatility !== "s"
      || after.resultType !== "jsonb"
      || after.identityArguments !== "p_product_id uuid"
      || JSON.stringify(after.settings) !== JSON.stringify(["search_path=pg_catalog, cloud"])
      || Object.values(after.runtimeAcl).some(Boolean)
      || !after.containsSeoTitle
      || !after.containsSeoDescription
      || !after.containsCharacteristics) {
    throw new Error(`${label} post-alignment contract mismatch: ${JSON.stringify(after)}`);
  }
}

const migrationFiles = readdirSync(path.join(ROOT, "supabase/migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort();
if (migrationFiles.at(-1) !== ALIGNMENT_MIGRATION) {
  throw new Error("Owner alignment migration is not the terminal local migration.");
}
const approvedPayloadSource = readFileSync(
  path.join(ROOT, "supabase/migrations", APPROVED_PAYLOAD_MIGRATION),
);
if (sha256(approvedPayloadSource) !== APPROVED_PAYLOAD_SHA256) {
  throw new Error("Approved payload corrective migration checksum drifted.");
}

const image = run("docker", ["image", "inspect", IMAGE], { allowFailure: true, quiet: true });
if (image.status !== 0) {
  throw new Error(`Required local image ${IMAGE} is absent; this command never pulls automatically.`);
}

let started = false;
try {
  run("docker", [
    "run", "-d", "--rm", "--name", CONTAINER,
    "-e", "POSTGRES_PASSWORD=local_publication_candidate_owner_test",
    IMAGE,
  ]);
  started = true;

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const probe = run("docker", [
      "exec", CONTAINER, "psql", "-U", "supabase_admin", "-d", "postgres", "-Atc", "select 1",
    ], { allowFailure: true, quiet: true });
    if (probe.status === 0) {
      ready = true;
      break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
  if (!ready) throw new Error("Disposable PostgreSQL did not become ready within 30 seconds.");

  dockerExec(
    "createdb", "-U", "supabase_admin", "-O", "postgres", "owner_production_shape",
  );
  dockerExec(
    "createdb", "-U", "supabase_admin", "-O", "supabase_admin", "owner_divergent_local",
  );
  run("docker", [
    "cp", path.join(ROOT, "supabase/tests/000_local_auth_bootstrap.sql"),
    `${CONTAINER}:/tmp/000_local_auth_bootstrap.sql`,
  ]);
  run("docker", [
    "cp", path.join(ROOT, "supabase/tests/013_publication_candidate_payload_completeness.sql"),
    `${CONTAINER}:/tmp/013_publication_candidate_payload_completeness.sql`,
  ]);
  run("docker", [
    "cp", path.join(ROOT, "supabase/migrations/."),
    `${CONTAINER}:/tmp/cybermedica-migrations`,
  ]);

  applyPreAlignmentChain("owner_production_shape", "postgres");
  const productionBefore = snapshot("owner_production_shape", "postgres");
  applyAlignment("owner_production_shape", "postgres");
  const productionAfter = snapshot("owner_production_shape", "postgres");
  assertStableContract("Production-shaped", productionBefore, productionAfter, "postgres");

  applyPreAlignmentChain("owner_divergent_local", "supabase_admin");
  const divergentBefore = snapshot("owner_divergent_local", "supabase_admin");
  applyAlignment("owner_divergent_local", "supabase_admin");
  const divergentAfter = snapshot("owner_divergent_local", "supabase_admin");
  assertStableContract("Divergent local", divergentBefore, divergentAfter, "supabase_admin");

  dockerExec(
    "psql", "-U", "supabase_admin", "-d", "owner_divergent_local",
    "-v", "ON_ERROR_STOP=1", "-f", "/tmp/013_publication_candidate_payload_completeness.sql",
  );

  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    image: IMAGE,
    migrationCount: migrationFiles.length,
    approvedPayloadMigrationSha256: APPROVED_PAYLOAD_SHA256,
    alignmentMigrationSha256: sha256(readFileSync(
      path.join(ROOT, "supabase/migrations", ALIGNMENT_MIGRATION),
    )),
    productionShaped: { before: productionBefore, after: productionAfter },
    divergentLocal: { before: divergentBefore, after: divergentAfter },
    candidatePayloadAndChecksumBeforeAfterOwnerAlignment: "PASS",
    remoteConnections: 0,
    remoteWrites: 0,
    disposableDatabasesRemoved: true,
  }, null, 2)}\n`);
} finally {
  if (started) run("docker", ["stop", CONTAINER], { allowFailure: true, quiet: true });
}
