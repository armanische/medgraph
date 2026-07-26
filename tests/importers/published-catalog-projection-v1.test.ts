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
        url: "https://example.invalid/equipment.webp",
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

test("Published Catalog local QA covers visibility, determinism, leakage and cleanup", async () => {
  const [fixture, runner, packageJson] = await Promise.all([
    readFile("supabase/tests/006_published_catalog_projection.sql", "utf8"),
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
  assert.match(fixture, /public document URL changed without an advancing projection clock/u);
  assert.match(fixture, /malformed numeric child was not isolated fail-closed/u);
  assert.match(fixture, /malformed boolean child was not isolated fail-closed/u);
  assert.match(fixture, /malformed mandatory nested object was not Product-isolated/u);
  assert.match(fixture, /invisible structured row affected payload or generatedAt/u);
  assert.match(fixture, /valid structured row was omitted from payload or generatedAt/u);
  assert.match(fixture, /for call_number in 1\.\.100/u);
  assert.doesNotMatch(fixture, /hamilton|330695211247/iu);

  assert.equal(
    packageJson.scripts["qa:published-catalog:local"],
    "node scripts/qa/published-catalog-projection-local-integration.ts",
  );
  assert.match(runner, /This QA command never pulls images automatically/u);
  assert.match(runner, /parsePublishedCatalogProjection/u);
  assert.match(runner, /migrationCount: 18/u);
  assert.match(runner, /remoteConnections: 0/u);
  assert.match(runner, /remoteWrites: 0/u);
  assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE/u);
});
