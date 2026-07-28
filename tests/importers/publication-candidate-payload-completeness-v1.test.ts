import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration =
  "supabase/migrations/202607290001_publication_candidate_payload_completeness_corrective_v1.sql";
const integration = "supabase/tests/013_publication_candidate_payload_completeness.sql";
const hamiltonRegression = "supabase/tests/012_catalog_admin_hamilton_79_regression.sql";
const runner = "scripts/qa/catalog-admin-description-sync-local-integration.ts";

test("candidate payload additively covers canonical Product SEO", async () => {
  const source = await readFile(migration, "utf8");

  assert.match(
    source,
    /create or replace function cloud\.product_publication_candidate_payload_v1\(p_product_id uuid\)/u,
  );
  assert.match(source, /'seoTitle', nullif\(btrim\(product\.seo_title\), ''\)/u);
  assert.match(source, /'seoDescription', nullif\(btrim\(product\.seo_description\), ''\)/u);
  assert.doesNotMatch(source, /alter table|update cloud\.products|insert into cloud\.products/iu);
});

test("candidate characteristics use stable namespaced identities and explicit public ordering", async () => {
  const source = await readFile(migration, "utf8");

  assert.match(source, /'characteristics', coalesce/u);
  assert.match(source, /'structured:' \|\| source\.structured_item_id/u);
  assert.match(source, /'legacy:' \|\| source\.key/u);
  assert.match(
    source,
    /order by\s+characteristic\.public_group_sort_order,\s+characteristic\.public_group_key,\s+characteristic\.sort_order,\s+characteristic\.stable_key,\s+lower\(btrim\(characteristic\.display_name\)\),\s+characteristic\.display_name/u,
  );
  assert.match(source, /source\.archived_at is null/u);
  assert.match(source, /source\.record_origin = 'legacy'[\s\S]*source\.content_kind = 'legacy_metadata'/u);
  assert.match(
    source,
    /source\.record_origin = 'structured_product_detail'[\s\S]*source\.publication_status = 'published'[\s\S]*source\.reviewer_status = 'approved'/u,
  );

  const characteristicPayload = source.slice(
    source.indexOf("'characteristics'"),
    source.indexOf("'applicationAreas'"),
  );
  assert.doesNotMatch(characteristicPayload, /source\.id|characteristic\.id/u);
  assert.doesNotMatch(characteristicPayload, /source_reference|raw_value|created_at|updated_at/iu);
});

test("candidate helper preserves the closed internal ACL boundary", async () => {
  const source = await readFile(migration, "utf8");

  assert.match(source, /set search_path = pg_catalog, cloud/u);
  assert.match(
    source,
    /revoke all on function cloud\.product_publication_candidate_payload_v1\(uuid\)\s+from public, anon, authenticated, service_role/u,
  );
  assert.doesNotMatch(source, /grant execute/iu);
  assert.doesNotMatch(source, /security definer/iu);
});

test("transactional fixture proves deterministic checksum and revision invalidation", async () => {
  const [fixture, localRunner] = await Promise.all([
    readFile(integration, "utf8"),
    readFile(runner, "utf8"),
  ]);

  assert.match(fixture, /^begin;/mu);
  assert.match(fixture, /^rollback;/mu);
  assert.match(fixture, /for loop_index in 1\.\.100 loop/u);
  assert.match(fixture, /query plan changed candidate characteristic order/u);
  assert.match(fixture, /environment-local characteristic UUID\/source data changed/u);
  assert.match(fixture, /SEO title change did not invalidate candidate checksum/u);
  assert.match(fixture, /SEO description change did not invalidate candidate checksum/u);
  assert.match(fixture, /characteristic value change did not invalidate candidate checksum/u);
  assert.match(fixture, /characteristic unit change did not invalidate candidate checksum/u);
  assert.match(fixture, /characteristic order change did not invalidate candidate checksum/u);
  assert.match(fixture, /characteristic addition did not invalidate candidate checksum/u);
  assert.match(fixture, /characteristic removal did not invalidate candidate checksum/u);
  assert.match(fixture, /non-publishable metadata changed candidate checksum/u);
  assert.match(fixture, /SEO mutation did not make revision stale at approval/u);
  assert.match(fixture, /characteristic mutation did not make revision stale at approval/u);
  assert.match(fixture, /candidate payload corrective changed the approved ACL boundary/u);
  assert.match(localRunner, /013_publication_candidate_payload_completeness\.sql/u);
  assert.match(localRunner, /publicationCandidatePayloadCompleteness: "PASS"/u);
});

test("production-shaped Hamilton fixture requires three characteristics and three media", async () => {
  const source = await readFile(hamiltonRegression, "utf8");

  assert.match(source, /jsonb_array_length\(revision\.candidate_payload -> 'characteristics'\) <> 3/u);
  assert.match(source, /array\['legacy:raw-001', 'legacy:raw-002', 'legacy:raw-003'\]/u);
  assert.match(source, /'activeCharacteristics'/u);
  assert.match(source, /'candidateCharacteristics'/u);
  assert.match(source, /'candidateMedia'/u);
  assert.match(source, /'candidateChecksum'/u);
  assert.match(source, /'oldClaimPresent', false/u);
  assert.match(source, /^rollback;/mu);
});
