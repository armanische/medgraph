import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { CategoryService } from "../../lib/storefront/category-service.ts";
import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { ManufacturerService } from "../../lib/storefront/manufacturer-service.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";
import { SearchService } from "../../lib/storefront/search-service.ts";

const root = process.cwd();
const catalogFiles = [
  "app/catalog/page.tsx",
  "components/catalog/CatalogExplorer.tsx",
];

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

test("catalog loads active products through ProductService", async () => {
  const page = await source("app/catalog/page.tsx");

  assert.match(page, /from "@\/lib\/storefront"/);
  assert.match(page, /productService\.getActiveProducts\(\)/);

  const service = new ProductService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );
  assert.deepEqual(
    (await service.getActiveProducts()).map(({ slug }) => slug),
    ["fs510", "ambu-vivasight-2-dlt"],
  );
});

test("catalog filters use storefront category and manufacturer services", async () => {
  const page = await source("app/catalog/page.tsx");
  const explorer = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(page, /categoryService\.getCategories\(\)/);
  assert.match(page, /manufacturerService\.getManufacturers\(\)/);
  assert.match(explorer, /product\.categoryId === category/);
  assert.match(explorer, /product\.manufacturerId === manufacturer/);

  const repository = new FilesystemCatalogRepository(resolve(root, "data/storefront"));
  const [categories, manufacturers] = await Promise.all([
    new CategoryService(repository).getCategories(),
    new ManufacturerService(repository).getManufacturers(),
  ]);
  assert.equal(categories.length, 2);
  assert.equal(manufacturers.length, 2);
});

test("catalog search uses SearchService", async () => {
  const page = await source("app/catalog/page.tsx");
  const explorer = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(page, /searchService\.searchProducts\(q\)/);
  assert.match(explorer, /SearchService\.forProducts/);
  assert.match(explorer, /productSearchService\.searchProducts\(query\)/);

  const service = new SearchService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );
  assert.deepEqual(
    (await service.searchProducts("Alba Healthcare")).map(({ slug }) => slug),
    ["fs510"],
  );
});

test("catalog has no publication or draft catalog imports", async () => {
  const combined = (await Promise.all(catalogFiles.map(source))).join("\n");

  assert.doesNotMatch(combined, /lib\/published-catalog/);
  assert.doesNotMatch(combined, /lib\/catalog-drafts/);
  assert.doesNotMatch(combined, /data\/public|data\/research/);
});

test("catalog cards expose only storefront merchandising fields", async () => {
  const explorer = await source("components/catalog/CatalogExplorer.tsx");

  for (const internalField of [
    "displayStatus",
    "researchStatus",
    "publicationStatus",
    "candidateFacts",
    "reviewProgress",
    "evidence",
    "readiness",
    "sourceCount",
    "coverage",
  ]) {
    assert.doesNotMatch(explorer, new RegExp(`\\b${internalField}\\b`, "i"));
  }
  assert.match(explorer, /product\.name/);
  assert.match(explorer, /presentation\.shortDescription/);
  assert.match(explorer, /product\.media/);
  assert.match(explorer, /product\.manufacturerId/);
  assert.match(explorer, /product\.categoryId/);
  assert.match(explorer, /href={`\/catalog\/\$\{product\.slug\}`}/);
});
