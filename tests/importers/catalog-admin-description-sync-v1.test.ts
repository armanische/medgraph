import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = "supabase/migrations/202607280002_catalog_admin_product_description_sync_corrective_v1.sql";
const integration = "supabase/tests/010_catalog_admin_product_description_sync.sql";
const hamiltonRegression = "supabase/tests/012_catalog_admin_hamilton_79_regression.sql";

test("Catalog Admin description sync preserves the SQL signature and requires a version token", async () => {
  const source = await readFile(migration, "utf8");

  assert.match(
    source,
    /cloud\.catalog_admin_patch_product\(p_id uuid, p_patch jsonb, p_actor text\) returns jsonb/u,
  );
  assert.match(source, /'expectedUpdatedAt'/u);
  assert.match(source, /expectedUpdatedAt is required/u);
  assert.match(source, /expectedUpdatedAt must be an ISO timestamp with timezone/u);
  assert.match(source, /current_updated_at is distinct from expected_updated_at/u);
  assert.match(source, /stale catalog admin patch/u);
  assert.doesNotMatch(source, /create or replace function cloud_api\.catalog_admin_patch_product/u);
});

test("only the canonical ru row participates in active description synchronization", async () => {
  const source = await readFile(migration, "utf8");

  assert.match(source, /description\.product_id = p_id[\s\S]*description\.locale = 'ru'[\s\S]*for update/u);
  assert.match(source, /description\.id = canonical_description_uuid/u);
  assert.match(source, /description\.locale = 'ru'/u);
  assert.doesNotMatch(source, /delete from cloud\.product_descriptions/u);
  assert.doesNotMatch(source, /insert into cloud\.product_descriptions/u);
  assert.doesNotMatch(source, /update cloud\.import_sources|update cloud\.import_products/u);
  assert.doesNotMatch(source, /source_checksum\s*=/u);
});

test("the database integration fixture covers stale, locale, atomicity and revision regressions", async () => {
  const source = await readFile(integration, "utf8");

  assert.match(source, /^begin;/mu);
  assert.match(source, /^rollback;/mu);
  assert.match(source, /missing expectedUpdatedAt was accepted/u);
  assert.match(source, /stale patch was accepted/u);
  assert.match(source, /non-canonical locale was changed/u);
  assert.match(source, /missing canonical ru row was accepted/u);
  assert.match(source, /duplicate canonical row was accepted/u);
  assert.match(source, /forced failure left a partial update/u);
  assert.match(source, /publication revision contains stale or missing approved description/u);
  assert.match(source, /immutable provenance changed/u);
  assert.match(source, /corrective regression created approval or publication evidence/u);
});

test("the production-shaped Hamilton regression uses the immutable 79-product Git baseline", async () => {
  const [source, runner] = await Promise.all([
    readFile(hamiltonRegression, "utf8"),
    readFile("scripts/qa/catalog-admin-description-sync-local-integration.ts", "utf8"),
  ]);

  assert.match(runner, /5ca5fe24c308fd636743eaf78874f4647749dc21/u);
  assert.match(runner, /13176ac8b5a7ffca86ecae0250a3345dd2ddcdda75ee8e1445e85546ccd3ca8c/u);
  assert.match(source, /approved immutable batch did not produce the expected unpublished 79-product baseline/u);
  assert.match(source, /92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb/u);
  assert.match(source, /Hamilton immutable provenance changed or lost its historical source evidence/u);
  assert.match(source, /Hamilton revision does not match the corrected canonical active state/u);
  assert.match(source, /Hamilton corrective regression performed Review, Approval or Publication/u);
  assert.match(source, /^rollback;/mu);
});
