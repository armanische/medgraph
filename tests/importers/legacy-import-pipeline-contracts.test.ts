import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { runLegacyImportPipeline } from "../../scripts/importers/legacy/core-pipeline.ts";
import type { LegacyImportRequest } from "../../scripts/importers/legacy/contracts.ts";

const repositoryRoot = process.cwd();

const coreModules = [
  "contracts.ts",
  "parser.ts",
  "normalization.ts",
  "resolvers.ts",
  "core-pipeline.ts",
].map((file) => path.join(repositoryRoot, "scripts/importers/legacy", file));

function importStatements(source: string): string {
  return source
    .split("\n")
    .filter((line) => /^\s*(?:import|export)\b/u.test(line) || /^\s*\}\s*from\s+/u.test(line))
    .join("\n");
}

test("Core Pipeline has no Storefront, Review, Publication, Cloud or Supabase imports", async () => {
  const contents = await Promise.all(coreModules.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
  for (const { file, source } of contents) {
    assert.doesNotMatch(
      importStatements(source),
      /(?:lib\/storefront|adapters\/(?:storefront|review|publication|cloud)|supabase|cloud_api|data\/review)/iu,
      `forbidden core dependency in ${path.basename(file)}`,
    );
  }
});

test("adapter dependencies point outward from the independent Core Pipeline", async () => {
  const storefrontAdapter = await readFile("scripts/importers/legacy/adapters/storefront-adapter.ts", "utf8");
  const reviewAdapter = await readFile("scripts/importers/legacy/adapters/review-adapter.ts", "utf8");
  const publicationAdapter = await readFile("scripts/importers/legacy/adapters/publication-adapter.ts", "utf8");
  assert.match(importStatements(storefrontAdapter), /lib\/storefront\//u);
  assert.doesNotMatch(importStatements(reviewAdapter), /lib\/storefront|adapters\/storefront/u);
  assert.match(importStatements(publicationAdapter), /review-adapter/u);
});

test("Core Pipeline produces a portable result before adapter selection", () => {
  const request: LegacyImportRequest = {
    source: {
      sourceId: "legacy-contract-test",
      sourceKind: "legacy_product",
      sourceUrl: "https://example.test/products/contract-test",
      sourcePath: "fixture://contract-test",
      legacySlug: "contract-test",
      legacyTitle: "Контрактный аппарат",
      rawManufacturer: "Example Manufacturer",
      rawCategory: "Example Category",
      rawApplicationAreas: ["Example Area"],
      rawDescription: "Краткое описание.\n\nПолное описание.",
      rawCharacteristics: [{ label: "Масса", value: "10 кг" }],
      rawBulletItems: ["Функция"],
      rawImages: [],
      rawDocuments: [],
      rawAccessories: [],
      rawRegistrationData: null,
      rawModel: "CT-1",
      rawPackageContents: [],
      extractedAt: "2026-07-22T00:00:00.000Z",
    },
    references: {
      manufacturers: [],
      categories: [],
      mappings: [],
      applicationAreas: [],
    },
    runTimestamp: "2026-07-22T00:00:00.000Z",
  };
  const result = runLegacyImportPipeline(request);
  assert.equal(result.normalizedProduct.slug, "contract-test");
  assert.equal(result.normalizedProduct.specifications.length, 1);
  assert.equal(result.reviewHint.disposition, "blocked");
  assert.ok(result.errors.some(({ code }) => code === "manufacturer_unresolved"));
  assert.equal("blockingErrors" in result.normalizedProduct.manufacturer, false);
  assert.equal("reviewerRequired" in result.normalizedProduct.manufacturer, false);
  assert.equal("publicationCandidate" in result, false);
  assert.equal("review" in result, false);
});
