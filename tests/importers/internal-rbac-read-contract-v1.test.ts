import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/202607280001_internal_rbac_read_contract_v1.sql";

test("internal access RPC is auth.uid-only, argument-free and read-only", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(
    migration,
    /create function cloud_api\.current_internal_access_v1\(\)/u,
  );
  assert.match(migration, /returns jsonb/u);
  assert.match(migration, /security definer/u);
  assert.match(migration, /stable/u);
  assert.match(migration, /set search_path = pg_catalog, auth, cloud/u);
  assert.match(migration, /select auth\.uid\(\) as user_id/u);
  assert.match(migration, /profile\.id = caller\.user_id/u);
  assert.match(migration, /profile\.role in \('admin', 'reviewer'\)/u);
  assert.match(migration, /'userId', caller\.user_id/u);
  assert.match(migration, /'role', allowed_profile\.role/u);
  assert.match(migration, /'displayName', allowed_profile\.display_name/u);
  assert.match(migration, /'allowed', allowed_profile\.id is not null/u);

  assert.doesNotMatch(
    migration,
    /current_internal_access_v1\([^)]*(user|email|role)/u,
  );
  assert.doesNotMatch(migration, /\b(insert|update|delete|merge)\b/iu);
  assert.doesNotMatch(migration, /execute\s+format/iu);
  assert.doesNotMatch(migration, /email|token|metadata/iu);
});

test("internal access owner, grants and RLS remain least-privilege", async () => {
  const migration = await readFile(migrationPath, "utf8");

  assert.match(
    migration,
    /create role cybermedica_internal_access_reader[\s\S]+nologin[\s\S]+noinherit[\s\S]+nobypassrls/u,
  );
  assert.match(
    migration,
    /grant select \(id, role, display_name\) on table cloud\.user_profiles/u,
  );
  assert.match(
    migration,
    /create policy user_profiles_internal_access_reader_self_v1[\s\S]+using \(id = auth\.uid\(\)\)/u,
  );
  assert.match(
    migration,
    /alter function cloud_api\.current_internal_access_v1\(\)[\s\S]+owner to cybermedica_internal_access_reader/u,
  );
  assert.match(
    migration,
    /revoke all on function cloud_api\.current_internal_access_v1\(\)[\s\S]+from public, anon, service_role/u,
  );
  assert.match(
    migration,
    /grant execute on function cloud_api\.current_internal_access_v1\(\)[\s\S]+to authenticated/u,
  );
  assert.doesNotMatch(
    migration,
    /grant select on (table )?cloud\.user_profiles to authenticated/u,
  );
  assert.doesNotMatch(
    migration,
    /create policy[\s\S]+to authenticated[\s\S]+on cloud\.user_profiles/u,
  );
});

test("local RBAC integration covers authorization and business-state invariance", async () => {
  const [fixture, runner, packageJson] = await Promise.all([
    readFile("supabase/tests/009_internal_rbac_read_contract.sql", "utf8"),
    readFile("scripts/qa/internal-rbac-read-contract-local-integration.ts", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
  ]);

  assert.match(fixture, /authenticated_admin_receives_own_minimal_dto/u);
  assert.match(fixture, /authenticated_reviewer_is_allowed/u);
  assert.match(fixture, /unsupported_role_fails_closed/u);
  assert.match(fixture, /missing_profile_fails_closed/u);
  assert.match(fixture, /caller_cannot_read_another_profile/u);
  assert.match(fixture, /authenticated retained direct user profile read access/u);
  assert.match(fixture, /^rollback;/mu);

  assert.equal(
    packageJson.scripts["qa:internal-rbac:local"],
    "node scripts/qa/internal-rbac-read-contract-local-integration.ts",
  );
  assert.match(runner, /migrationCount: 22/u);
  assert.match(runner, /Anonymous caller unexpectedly executed/u);
  assert.match(runner, /Authenticated caller unexpectedly read/u);
  assert.match(runner, /RBAC read tests mutated business state/u);
  assert.match(runner, /remoteConnections: 0/u);
  assert.doesNotMatch(
    runner,
    /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE|gjlpkqdhlzbfnzzoxlsk|clbzibuusyuajsylcbvl/u,
  );
});
