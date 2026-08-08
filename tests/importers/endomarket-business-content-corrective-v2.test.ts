import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import snapshotJson from "../../data/import/endomarket-wave1-stage-catalog.json" with { type: "json" };
import auditJson from "../../data/import/endomarket-wave1-audit.json" with { type: "json" };
import mediaManifestJson from "../../data/import/endomarket-wave1-media-manifest.json" with { type: "json" };
import correctiveJson from "../../data/import/source/endomarket-business-content-corrective-v2.json" with { type: "json" };
import {
  mapCloudPreviewSnapshot,
  type CloudPreviewCatalogSnapshot,
} from "../../lib/storefront/cloud-preview-mapper.ts";
import {
  ENDOMARKET_STAGE_FEATURED_MODELS,
  selectEndoMarketStageFeaturedProducts,
} from "../../lib/storefront/featured-products.ts";
import { formatCountryForPublic } from "../../lib/storefront/country-presentation.ts";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("corrective v2 applies the exact JSON content to all 42 draft Products", () => {
  assert.equal(correctiveJson.products.length, 42);
  const draftProducts = snapshotJson.products.filter(
    ({ stageImport }) => stageImport.entityOrigin === "new_candidate",
  );
  assert.equal(draftProducts.length, 42);
  const bySlug = new Map(draftProducts.map((product) => [product.slug, product]));

  for (const correction of correctiveJson.products) {
    const product = bySlug.get(correction.candidate_slug);
    assert.ok(product, `Missing corrected Product ${correction.candidate_slug}`);
    assert.equal(product.title, correction.name);
    assert.equal(product.model, correction.model);
    assert.equal(product.shortDescription, correction.short_description);
    assert.equal(product.description, correction.full_description);
    assert.equal(product.seoTitle, correction.seo_title);
    assert.equal(product.seoDescription, correction.seo_description);
    assert.deepEqual(
      product.applicationAreas.map(({ name }) => name),
      correction.presentation.applicationAreaTags,
    );
    assert.deepEqual(
      product.keyFeatures.map(({ text }) => text),
      correction.presentation.showFeatureSection ? correction.key_features : [],
    );
    assert.equal(product.applicationAreas.some(({ name }) => name.includes("•")), false);
  }

  assert.equal(auditJson.businessContentCorrective.version, 2);
  assert.equal(auditJson.businessContentCorrective.productCount, 42);
  assert.equal(auditJson.businessContentCorrective.csvJsonConsistency, "pass");
  assert.equal(auditJson.businessContentCorrective.hiddenFeatureSections, 12);
});

test("corrective media keeps only clean local assets and selects a clean hero", async () => {
  assert.equal(snapshotJson.summary.watermarkedMediaRemoved, 67);
  assert.equal(snapshotJson.summary.duplicateMediaRemoved, 0);
  assert.equal(snapshotJson.summary.mediaAssignments, 84);
  assert.equal(snapshotJson.summary.uniqueMediaAssets, 65);
  assert.equal(mediaManifestJson.assets.length, 84);
  assert.equal(
    mediaManifestJson.assets.some(({ sourceMediaUrl }) =>
      /\.(?:1200x1200|420x400)w\./iu.test(new URL(sourceMediaUrl).pathname),
    ),
    false,
  );
  const expectedPaths = new Set(mediaManifestJson.assets.map(({ localPath }) => localPath));
  const diskPaths = new Set(
    (await readdir("public/media/endomarket-wave1"))
      .map((fileName) => `/media/endomarket-wave1/${fileName}`),
  );
  assert.deepEqual(diskPaths, expectedPaths);

  for (const product of snapshotJson.products) {
    if (product.media.length === 0) continue;
    assert.equal(product.media[0].role, "hero");
    assert.equal(product.media.every(({ url }) => expectedPaths.has(url)), true);
  }
});

test("Stage homepage selects the exact eight clean Product cards in approved order", () => {
  const mapped = mapCloudPreviewSnapshot(snapshotJson as unknown as CloudPreviewCatalogSnapshot);
  const selected = selectEndoMarketStageFeaturedProducts(mapped.products);
  assert.deepEqual(
    selected.map(({ model }) => model),
    ENDOMARKET_STAGE_FEATURED_MODELS.slice(0, 8),
  );
  assert.equal(selected.length, 8);
  assert.equal(selected.every(({ media }) => media.some(({ type }) => type === "image")), true);
});

test("catalog and Product Detail implement the corrective presentation contract", async () => {
  const [card, detail, experience, equipment, service] = await Promise.all([
    source("components/storefront/ProductCard.tsx"),
    source("app/catalog/[slug]/page.tsx"),
    source("lib/storefront/product-detail-experience.ts"),
    source("components/home/Equipment.tsx"),
    source("components/home/WhyCyberMedica.tsx"),
  ]);

  assert.doesNotMatch(card, /isTechnicalProductSpecification|cardSpecifications/u);
  assert.match(card, /applicationAreas\.slice\(0, 2\)/u);
  assert.match(card, /\+\{product\.applicationAreas\.length - 2\}/u);
  assert.match(detail, /featureSectionTitle/u);
  assert.match(detail, /Ключевые особенности/u);
  assert.match(detail, /experience\.applicationAreas\.slice\(0, 2\)/u);
  assert.doesNotMatch(experience, /applicationAreas\.join/u);
  assert.match(
    equipment,
    /Оборудование для эндоскопии, диагностики и оснащения клиник — в наличии и с рассрочкой 0%\./u,
  );
  assert.match(service, /Сервис и сопровождение оборудования/u);
  assert.equal(formatCountryForPublic("Страна не указана"), null);
});

test("corrective remains Stage-only and creates no Production or lifecycle boundary", async () => {
  const [script, page, dataSource] = await Promise.all([
    source("scripts/importers/apply-endomarket-business-content-corrective-v2.ts"),
    source("app/page.tsx"),
    source("lib/storefront/data-source.ts"),
  ]);
  assert.match(page, /storefrontDataSource === "cloud_preview"/u);
  assert.match(dataSource, /ENDOMARKET_STAGE_PREVIEW_BRANCH/u);
  assert.doesNotMatch(
    script,
    /SUPABASE|service_role|cloud_api|create_product_publication_revision|approve_product|publish_product/iu,
  );
  assert.equal(auditJson.safety.productionWrites, 0);
  assert.equal(auditJson.safety.lifecycleWrites, 0);
  assert.equal(auditJson.safety.migrations, 0);
});
