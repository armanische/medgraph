import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  STRUCTURED_PRODUCT_DETAIL_SCHEMA_VERSION,
  structuredProductDetailCandidateSchema,
} from "../../lib/product-detail-publication/contracts.ts";
import {
  mapCloudPreviewSnapshot,
  type CloudPreviewCatalogSnapshot,
} from "../../lib/storefront/cloud-preview-mapper.ts";

const timestamp = "2026-07-23T10:00:00.000Z";
const productId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function candidate() {
  return {
    schemaVersion: STRUCTURED_PRODUCT_DETAIL_SCHEMA_VERSION,
    product: { id: productId, sourceUid: "source-product-1" },
    keyFeatures: [{
      key: "autonomy",
      text: "Автономная работа до 9 часов",
      sortOrder: 20,
      source: {
        type: "official_datasheet",
        ref: "datasheet:page-2",
        url: "https://manufacturer.example/product/datasheet.pdf",
      },
    }],
    specifications: [{
      key: "weight",
      label: "Масса",
      value: "6.5",
      unit: "кг",
      sortOrder: 10,
      group: { key: "dimensions", title: "Габариты и масса", sortOrder: 20 },
      source: {
        type: "official_datasheet",
        ref: "datasheet:page-4",
        url: "https://manufacturer.example/product/datasheet.pdf",
      },
    }],
  };
}

test("candidate contract accepts atomic provenance-bearing structured fields", () => {
  assert.deepEqual(structuredProductDetailCandidateSchema.parse(candidate()), candidate());
});

test("candidate contract fails closed for metadata, missing provenance and duplicate keys", () => {
  const metadata = candidate();
  metadata.specifications[0].label = "Категория";
  assert.equal(structuredProductDetailCandidateSchema.safeParse(metadata).success, false);

  const missingProvenance = candidate();
  missingProvenance.keyFeatures[0].source.ref = "";
  assert.equal(structuredProductDetailCandidateSchema.safeParse(missingProvenance).success, false);

  const duplicate = candidate();
  duplicate.keyFeatures.push({ ...duplicate.keyFeatures[0] });
  assert.equal(structuredProductDetailCandidateSchema.safeParse(duplicate).success, false);

  const insecureSource = candidate();
  insecureSource.specifications[0].source.url = "http://manufacturer.example/specification.pdf";
  assert.equal(structuredProductDetailCandidateSchema.safeParse(insecureSource).success, false);

  assert.equal(structuredProductDetailCandidateSchema.safeParse({
    ...candidate(),
    schemaVersion: 2,
  }).success, false);
});

test("migration reuses review/publication entities and creates an additive reversible batch", async () => {
  const migration = await readFile(
    "supabase/migrations/202607230001_structured_product_detail_fields_v1.sql",
    "utf8",
  );

  assert.match(migration, /create table cloud\.product_key_features/u);
  assert.match(migration, /alter table cloud\.product_characteristics/u);
  assert.match(migration, /content_kind in \('legacy_metadata', 'technical_specification'\)/u);
  assert.match(migration, /cloud\.publication_candidates%rowtype/u);
  assert.match(migration, /cloud\.review_decisions%rowtype/u);
  assert.match(migration, /decision\.decision <> 'approve'/u);
  assert.match(migration, /decision\.approved_value is distinct from item/u);
  assert.match(migration, /candidate\.validation_status <> 'approved'/u);
  assert.match(migration, /alter policy product_characteristics_public_read[\s\S]+publication_status = 'published'/u);
  assert.match(migration, /previous_state jsonb not null/u);
  assert.match(migration, /idempotency_key text not null unique/u);
  assert.match(migration, /pg_advisory_xact_lock/u);
  assert.match(migration, /only the latest published product-detail batch can be rolled back/u);
  assert.match(migration, /set status = 'rolled_back', rolled_back_at = now\(\)/u);
  assert.doesNotMatch(migration, /\bdelete\s+from\b|\btruncate\b/iu);
  assert.doesNotMatch(migration, /hamilton|apparat-ivl-hamilton/u);
  assert.doesNotMatch(migration, /full_description|short_description/u);
});

test("writer surface is server-only, scoped to cloud_api and unavailable to public roles", async () => {
  const [server, migration] = await Promise.all([
    readFile("lib/product-detail-publication/server.ts", "utf8"),
    readFile("supabase/migrations/202607230001_structured_product_detail_fields_v1.sql", "utf8"),
  ]);

  assert.match(server, /^import "server-only";/u);
  assert.match(server, /access: "service_role"/u);
  assert.match(server, /"Accept-Profile": "cloud_api"/u);
  assert.match(server, /"Content-Profile": "cloud_api"/u);
  assert.match(server, /method: "POST"/u);
  assert.match(server, /publish_structured_product_detail_v1/u);
  assert.match(server, /rollback_structured_product_detail_v1/u);
  assert.match(migration, /revoke all on function cloud_api\.publish_structured_product_detail_v1[\s\S]+from public, anon, authenticated/u);
  assert.match(migration, /grant execute on function cloud_api\.publish_structured_product_detail_v1[\s\S]+to service_role/u);
  assert.match(migration, /revoke all on function cloud_api\.rollback_structured_product_detail_v1[\s\S]+from public, anon, authenticated/u);
  assert.match(migration, /grant execute on function cloud_api\.rollback_structured_product_detail_v1[\s\S]+to service_role/u);
});

test("projection and mapper expose only approved published structured fields in stable order", async () => {
  const projection = await readFile(
    "supabase/migrations/202607230002_structured_product_detail_projection_v1.sql",
    "utf8",
  );
  assert.match(projection, /feature\.review_status = 'approved'/u);
  assert.match(projection, /feature\.publication_status = 'published'/u);
  assert.match(projection, /characteristic\.content_kind = 'technical_specification'/u);
  assert.match(projection, /characteristic\.reviewer_status = 'approved'/u);
  assert.match(projection, /characteristic\.publication_status = 'published'/u);
  assert.doesNotMatch(
    projection,
    /feature\.(?:source_ref|source_url|approval_decision_id)|characteristic\.(?:source_reference|source_url|approval_decision_id)/u,
  );

  const snapshot: CloudPreviewCatalogSnapshot = {
    generatedAt: timestamp,
    manufacturers: [],
    categories: [],
    applicationAreas: [],
    products: [{
      id: productId,
      slug: "device",
      title: "Device",
      model: null,
      shortDescription: null,
      description: null,
      manufacturerId: null,
      categoryId: null,
      publicationStatus: "draft",
      published: false,
      reviewState: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
      applicationAreas: [],
      characteristics: [{ name: "Страна производства", value: "Россия", unit: null }],
      keyFeatures: [
        { text: "Второе преимущество", sortOrder: 20 },
        { text: "Первое преимущество", sortOrder: 10 },
        { text: "<b>unsafe</b>", sortOrder: 30 },
      ],
      characteristicGroups: [
        {
          key: "performance",
          title: "Производительность",
          sortOrder: 20,
          items: [{ label: "Поток", value: "120", unit: "л/мин", sortOrder: 20 }],
        },
        {
          key: "dimensions",
          title: "Габариты",
          sortOrder: 10,
          items: [{ label: "Масса", value: "6.5", unit: "кг", sortOrder: 10 }],
        },
      ],
      media: [],
      documents: [],
      registrations: [],
    }],
  };

  const mapped = mapCloudPreviewSnapshot(snapshot).products[0];
  assert.deepEqual(mapped.keyFeatures, ["Первое преимущество", "Второе преимущество"]);
  assert.deepEqual(mapped.specifications.map(({ group, label }) => [group, label]), [
    ["Габариты", "Масса"],
    ["Производительность", "Поток"],
  ]);
  assert.equal(mapped.specifications.some(({ label }) => label === "Страна производства"), false);
});
