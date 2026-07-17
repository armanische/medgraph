import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { CompareService } from "../../lib/storefront/compare-service.ts";
import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";
import type { Product } from "../../lib/storefront/types.ts";

const root = process.cwd();
const service = new CompareService(
  new ProductService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  ),
);
const compareFiles = [
  "app/compare/page.tsx",
  "components/compare/ComparisonTable.tsx",
  "lib/storefront/compare-service.ts",
  "lib/workspace/mock-data.ts",
  "lib/workspace/types.ts",
];

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

test("CompareService exposes active Storefront products", async () => {
  assert.deepEqual(
    (await service.getComparableProducts()).map(({ slug }) => slug).sort(),
    ["ambu-vivasight-2-dlt", "fs510"],
  );
});

test("comparison resolves products by slug through ProductService", async () => {
  const result = await service.compareProducts([
    "fs510",
    "missing-product",
    "ambu-vivasight-2-dlt",
    "fs510",
  ]);

  assert.deepEqual(
    result.products.map(({ slug }) => slug),
    ["fs510", "ambu-vivasight-2-dlt"],
  );
  assert.equal(result.summary.products, 2);
});

test("comparison table aligns ProductSpecification values by label", async () => {
  const products = (await service.getComparableProducts()) as readonly Product[];
  const shared = {
    ...products[0],
    specifications: [
      {
        group: "Общее",
        label: "Масса",
        value: "10",
        unit: "г",
        position: 1,
      },
    ],
  } satisfies Product;
  const different = {
    ...products[1],
    specifications: [
      {
        group: "Физические параметры",
        label: "Масса",
        value: "20",
        unit: "г",
        position: 2,
      },
    ],
  } satisfies Product;
  const rows = service.buildComparisonTable([shared, different]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.label, "Масса");
  assert.deepEqual(
    rows[0]?.cells.map(({ specification }) => specification?.value ?? ""),
    ["10", "20"],
  );
  assert.equal(rows[0]?.hasDifference, true);
});

test("missing specifications become empty comparison cells", async () => {
  const products = await service.getComparableProducts();
  const rows = service.buildComparisonTable(products);
  const breathingVolume = rows.find(({ label }) => label === "Дыхательный объём");

  assert.ok(breathingVolume);
  assert.deepEqual(
    breathingVolume.cells.map(({ specification }) => specification?.value ?? ""),
    ["100–2000", ""],
  );
});

test("comparison view uses Storefront documents and compatibility", async () => {
  const table = await source("components/compare/ComparisonTable.tsx");

  assert.match(table, /product\.documents/);
  assert.match(table, /product\.compatibility/);
  assert.match(table, /document\.publicUrl/);
  assert.doesNotMatch(
    table,
    /publication|review|verification|research|coverage|readiness|evidence/i,
  );
});

test("compare consumers have no publication, draft, or legacy compare imports", async () => {
  const combined = (await Promise.all(compareFiles.map(source))).join("\n");

  assert.doesNotMatch(combined, /lib\/published-catalog/);
  assert.doesNotMatch(combined, /lib\/catalog-drafts/);
  assert.doesNotMatch(combined, /(?:\.\.\/|@\/lib\/)compare\/(?:engine|mock-data|types)/);
  assert.doesNotMatch(combined, /data\/public|data\/research/);
});

test("CompareService depends only on ProductService for catalog reads", async () => {
  const compareService = await source("lib/storefront/compare-service.ts");

  assert.match(compareService, /ProductService/);
  assert.doesNotMatch(compareService, /node:fs|readFile|CatalogRepository|\.json/);
});
