import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parsePublishedCatalogProjection,
  publishedCatalogProjectionSchema,
} from "../../lib/published-catalog/contracts.ts";

const timestamp = "2026-07-26T00:00:00.000Z";

function validProjection() {
  return {
    schemaVersion: 1 as const,
    generatedAt: timestamp,
    products: [{
      id: "published-product",
      slug: "published-product",
      title: "Published Product",
      model: "PP-1",
      shortDescription: "Public summary.",
      description: "Public description.",
      manufacturerId: "published-manufacturer",
      categoryId: "published-category",
      status: "active" as const,
      applicationAreas: [{ id: "published-area", name: "Published Area" }],
      keyFeatures: [{ text: "Approved feature", sortOrder: 1 }],
      characteristicGroups: [{
        key: "technical",
        title: "Technical",
        sortOrder: 1,
        items: [{ label: "Flow", value: "42", unit: "L/min", sortOrder: 1 }],
      }],
      media: [{
        url: "https://static.tildacdn.com/equipment.webp",
        role: "primary" as const,
        format: "image/webp",
        sortOrder: 0,
      }],
      documents: [{
        title: "Datasheet",
        kind: "datasheet" as const,
        publicUrl: "https://example.invalid/datasheet.pdf",
        language: "ru",
        isOfficial: true,
      }],
      registrations: [{
        registrationNumber: "TEST-1",
        status: "verified_exact" as const,
        sourceUrl: null,
      }],
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    manufacturers: [{
      id: "published-manufacturer",
      slug: "published-manufacturer",
      name: "Published Manufacturer",
      description: "Public manufacturer description.",
      countryCode: "CH",
      website: "https://example.invalid/manufacturer",
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    categories: [{
      id: "published-category",
      slug: "published-category",
      name: "Published Category",
      description: "Public category description.",
      position: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    applicationAreas: [{
      id: "published-area",
      slug: "published-area",
      name: "Published Area",
      description: "Public area description.",
      createdAt: timestamp,
      updatedAt: timestamp,
    }],
    summary: {
      productCount: 1,
      manufacturerCount: 1,
      categoryCount: 1,
      applicationAreaCount: 1,
    },
  };
}

test("Published Catalog contract accepts only public-safe, referentially complete payloads", () => {
  const projection = validProjection();
  assert.deepEqual(parsePublishedCatalogProjection(projection), projection);

  assert.equal(publishedCatalogProjectionSchema.safeParse({
    ...projection,
    products: [{ ...projection.products[0], status: "preview_draft" }],
  }).success, false);
  assert.equal(publishedCatalogProjectionSchema.safeParse({
    ...projection,
    products: [{
      ...projection.products[0],
      approvalId: "60000000-0000-4000-8000-000000000001",
    }],
  }).success, false);
  assert.equal(publishedCatalogProjectionSchema.safeParse({
    ...projection,
    products: [{ ...projection.products[0], manufacturerId: "missing-manufacturer" }],
  }).success, false);
  assert.equal(publishedCatalogProjectionSchema.safeParse({
    ...projection,
    summary: { ...projection.summary, productCount: 2 },
  }).success, false);
  assert.equal(publishedCatalogProjectionSchema.safeParse({
    ...projection,
    products: [{
      ...projection.products[0],
      media: [{ ...projection.products[0].media[0], url: "http://example.invalid/image" }],
    }],
  }).success, false);
});

test("Published Catalog migration enforces immutable publication evidence and service-only reads", async () => {
  const migration = await readFile(
    "supabase/migrations/202607260002_published_catalog_projection_v1.sql",
    "utf8",
  );

  assert.match(migration, /cloud_published_storefront_catalog_v1/u);
  assert.match(migration, /auth\.role\(\) <> 'service_role'/u);
  assert.match(migration, /product\.publication_status = 'published'/u);
  assert.match(migration, /product\.active_product_publication_batch_id/u);
  assert.match(migration, /product\.current_product_publication_revision_id/u);
  assert.match(migration, /product\.current_product_publication_approval_id/u);
  assert.match(migration, /batch\.action = 'publish'/u);
  assert.match(migration, /revision\.product_identity_checksum = cloud\.sha256_jsonb_v1/u);
  assert.match(migration, /decision\.approved_value = revision\.candidate_payload/u);
  assert.match(migration, /blocking_error\.resolved_at is null/u);
  assert.match(migration, /published_manufacturers/u);
  assert.match(migration, /published_categories/u);
  assert.match(migration, /published_application_areas/u);
  assert.match(migration, /detail_candidate\.validation_status in \('approved', 'published'\)/u);
  assert.match(migration, /storage\.access_status = 'public'/u);
  assert.match(migration, /order by product\.slug/u);
  assert.match(migration, /revoke all on function cloud_api\.cloud_published_storefront_catalog_v1\(\)[\s\S]+from public, anon, authenticated/u);
  assert.match(migration, /grant execute on function cloud_api\.cloud_published_storefront_catalog_v1\(\)[\s\S]+to service_role/u);
  assert.doesNotMatch(migration, /cloud_storefront_preview_catalog\(/u);
  assert.doesNotMatch(migration, /preview_draft|reviewerId|actorId|payloadChecksum/u);
  assert.doesNotMatch(migration, /insert into|update cloud\.|delete from/u);
});

test("Published Catalog corrective migration hardens public dependency clocks and malformed children", async () => {
  const [foundationMigration, correctiveMigration] = await Promise.all([
    readFile("supabase/migrations/202607260002_published_catalog_projection_v1.sql", "utf8"),
    readFile(
      "supabase/migrations/202607260003_published_catalog_projection_corrective_v1.sql",
      "utf8",
    ),
  ]);

  assert.equal(
    createHash("sha256").update(foundationMigration).digest("hex"),
    "a1c16479913dafb602640019fd8ae7e73391f191552f0f3282b8453557e41e48",
  );
  assert.match(correctiveMigration, /public_json_nonnegative_integer_v1/u);
  assert.match(correctiveMigration, /public_json_boolean_v1/u);
  assert.match(correctiveMigration, /storage_objects_published_projection_clock/u);
  assert.match(correctiveMigration, /visible_key_features as materialized/u);
  assert.match(correctiveMigration, /visible_characteristics as materialized/u);
  assert.match(correctiveMigration, /visible_documents as materialized/u);
  assert.match(correctiveMigration, /union all select updated_at from visible_key_features/u);
  assert.match(correctiveMigration, /union all select updated_at from visible_characteristics/u);
  assert.match(correctiveMigration, /union all select storage_updated_at from visible_documents/u);
  assert.match(correctiveMigration, /storage\.source_url ~ '\^https:\/\/'/u);
  assert.match(correctiveMigration, /storage\.access_status = 'public'/u);
  assert.match(correctiveMigration, /revoke all on function cloud\.public_json_text_v1/u);
  assert.doesNotMatch(correctiveMigration, /cloud_storefront_preview_catalog\(/u);
});

test("Published Catalog corrective v2 binds Product storage and uses a private monotonic clock", async () => {
  const migration = await readFile(
    "supabase/migrations/202607260004_published_catalog_projection_corrective_v2.sql",
    "utf8",
  );

  assert.equal(
    createHash("sha256").update(migration).digest("hex"),
    "26f7dd90e65665ade5729dc5e0934fe7b8f15979cdaaee1c92cc859d66d6162d",
  );
  assert.match(migration, /published_catalog_projection_state/u);
  assert.match(migration, /payload_checksum text/u);
  assert.match(migration, /for update/u);
  assert.match(migration, /state\.version \+ 1/u);
  assert.match(migration, /state\.changed_at \+ interval '1 microsecond'/u);
  assert.match(migration, /join cloud\.product_documents ownership/u);
  assert.match(migration, /ownership\.product_id = product\.id/u);
  assert.match(migration, /ownership\.storage_object_id = storage\.id/u);
  assert.match(migration, /ownership\.publication_status = 'published'/u);
  assert.match(migration, /revoke all on table cloud\.published_catalog_projection_state/u);
  assert.match(migration, /from public, anon, authenticated, service_role/u);
  assert.doesNotMatch(migration, /cloud_storefront_preview_catalog\(/u);
  assert.doesNotMatch(migration, /execute format|execute immediate/iu);
});

test("Published Catalog corrective v3 finalizes one clock state per transaction", async () => {
  const migration = await readFile(
    "supabase/migrations/202607270001_published_catalog_projection_corrective_v3.sql",
    "utf8",
  );

  assert.equal(
    createHash("sha256").update(migration).digest("hex"),
    "0838fd15d9e484ac76dde4417ce528a1dbae6f40b0ca4d023a777c97aed0b79d",
  );
  assert.match(migration, /published_catalog_projection_initialization_v3/u);
  assert.match(migration, /initialized_existing_baseline/u);
  assert.match(migration, /published_catalog_projection_transactions_v3/u);
  assert.match(migration, /pg_current_xact_id\(\)/u);
  assert.match(migration, /deferrable initially deferred/u);
  assert.match(migration, /mutation_statement_count/u);
  assert.match(migration, /queued_checksum is distinct from final_checksum/u);
  assert.match(migration, /published projection finalizer ran before a tracked mutation completed/u);
  assert.match(migration, /drop trigger products_projection_before_v2/u);
  assert.match(migration, /enable always trigger products_projection_before_v3/u);
  assert.match(migration, /revoke all on table cloud\.published_catalog_projection_transactions_v3/u);
  assert.doesNotMatch(migration, /join cloud\.product_documents ownership/u);
  assert.doesNotMatch(migration, /cloud_storefront_preview_catalog\(/u);
  assert.doesNotMatch(migration, /execute format|execute immediate/iu);
});

test("Published Catalog corrective v4 closes one caller-proof clock slot", async () => {
  const migration = await readFile(
    "supabase/migrations/202607270002_published_catalog_projection_corrective_v4.sql",
    "utf8",
  );

  assert.equal(
    createHash("sha256").update(migration).digest("hex"),
    "aae4a78dfe6f353f994e02bf1e2781a581ec97bf09fd391278ec51bd6c5637f2",
  );
  assert.match(migration, /published_catalog_projection_initialization_state_v4/u);
  assert.match(migration, /published_catalog_projection_initialization_v4/u);
  assert.match(migration, /initialize_published_catalog_projection_v4/u);
  assert.match(migration, /published_catalog_projection_transactions_v4/u);
  assert.match(migration, /published_catalog_projection_events_v4/u);
  assert.match(migration, /transaction_id xid8 primary key/u);
  assert.match(migration, /terminal_finalized boolean/u);
  assert.match(migration, /clock_slot_reserved boolean/u);
  assert.match(migration, /reconciled_generation/u);
  assert.match(migration, /target_version := transaction_state\.entry_version \+ 1/u);
  assert.match(migration, /drop trigger published_projection_transaction_finalize_v3/u);
  assert.match(migration, /enable always trigger products_projection_before_v4/u);
  assert.match(migration, /revoke all on table cloud\.published_catalog_projection_transactions_v4/u);
  assert.doesNotMatch(
    migration,
    /current_setting\('cybermedica\.published_projection_finalized_v3'/u,
  );
  assert.doesNotMatch(migration, /cloud_storefront_preview_catalog\(/u);
  assert.doesNotMatch(migration, /execute format|execute immediate/iu);
});

test("Published Catalog local QA covers visibility, determinism, leakage and cleanup", async () => {
  const [fixture, clockFixture, terminalFixture, runner, packageJson] = await Promise.all([
    readFile("supabase/tests/006_published_catalog_projection.sql", "utf8"),
    readFile("supabase/tests/007_published_catalog_projection_clock_v3.sql", "utf8"),
    readFile("supabase/tests/008_published_catalog_projection_terminal_v4.sql", "utf8"),
    readFile("scripts/qa/published-catalog-projection-local-integration.ts", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
  ]);

  assert.match(fixture, /^begin;/mu);
  assert.match(fixture, /^rollback;/mu);
  assert.match(fixture, /empty projection is not a valid empty result/u);
  assert.match(fixture, /published products are not ordered by stable slug/u);
  assert.match(fixture, /stale Product identity unexpectedly remained visible/u);
  assert.match(fixture, /invalid approval binding unexpectedly remained visible/u);
  assert.match(fixture, /invalid active batch binding unexpectedly remained visible/u);
  assert.match(fixture, /Product with unpublished manufacturer remained visible/u);
  assert.match(fixture, /Product with unpublished category remained visible/u);
  assert.match(fixture, /Product with unpublished application area remained visible/u);
  assert.match(fixture, /Product with unresolved blocking error remained visible/u);
  assert.match(fixture, /Preview-only child content leaked/u);
  assert.match(fixture, /internal publication or Preview metadata leaked/u);
  assert.match(fixture, /read-only projection mutated operational data/u);
  assert.match(fixture, /public document URL did not change inside the writer transaction/u);
  assert.match(fixture, /malformed numeric child was not isolated fail-closed/u);
  assert.match(fixture, /malformed boolean child was not isolated fail-closed/u);
  assert.match(fixture, /malformed mandatory nested object was not Product-isolated/u);
  assert.match(fixture, /visible structured field removal/u);
  assert.match(fixture, /visible structured timestamp-only mutation/u);
  assert.match(fixture, /public document deletion/u);
  assert.match(fixture, /Product archive/u);
  assert.match(fixture, /Product publication rollback/u);
  assert.match(fixture, /hidden storage mutation/u);
  assert.match(fixture, /exact retry advanced projection version/u);
  assert.match(fixture, /rolled-back public mutation retained a projection event/u);
  assert.match(fixture, /storage object owned by another Product leaked/u);
  assert.match(fixture, /unbound public storage object leaked/u);
  assert.match(fixture, /for call_number in 1\.\.100/u);
  assert.doesNotMatch(fixture, /hamilton|330695211247/iu);
  assert.match(clockFixture, /net-zero committed transaction advanced projection clock/u);
  assert.match(clockFixture, /multi-statement public transaction did not advance exactly once/u);
  assert.match(clockFixture, /session_replication_role = replica/u);
  assert.match(clockFixture, /initialization evidence TRUNCATE unexpectedly succeeded/u);
  assert.match(clockFixture, /exact committed retry advanced projection clock/u);
  assert.match(clockFixture, /hidden-only committed transaction advanced projection clock/u);
  assert.match(clockFixture, /rolled-back transaction retained projection state/u);
  assert.doesNotMatch(clockFixture, /hamilton|330695211247/iu);
  assert.match(terminalFixture, /caller-resettable GUC exploit advanced or finalized clock incorrectly/u);
  assert.match(terminalFixture, /net-zero transaction after early finalization changed public clock/u);
  assert.match(terminalFixture, /repeated finalizer events did not coalesce three writers/u);
  assert.match(terminalFixture, /savepoint rollback was not reflected in final projection state/u);
  assert.match(terminalFixture, /full rollback retained transaction state or changed projection clock/u);
  assert.match(terminalFixture, /missing initialization evidence was silently recreated/u);
  assert.doesNotMatch(terminalFixture, /hamilton|330695211247/iu);

  assert.equal(
    packageJson.scripts["qa:published-catalog:local"],
    "node scripts/qa/published-catalog-projection-local-integration.ts",
  );
  assert.match(runner, /This QA command never pulls images automatically/u);
  assert.match(runner, /parsePublishedCatalogProjection/u);
  assert.match(runner, /migrationCount: MIGRATION_COUNT/u);
  assert.match(runner, /concurrent-public-change-serialization/u);
  assert.match(runner, /concurrent-identical-change-coalescing/u);
  assert.match(runner, /controlled-baseline-initialization/u);
  assert.match(runner, /caller-resettable-guc-exploit-closed/u);
  assert.match(runner, /concurrent-initialization-single-evidence/u);
  assert.match(runner, /eventLoss: 0/u);
  assert.match(runner, /remoteConnections: 0/u);
  assert.match(runner, /remoteWrites: 0/u);
  assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE/u);
});
