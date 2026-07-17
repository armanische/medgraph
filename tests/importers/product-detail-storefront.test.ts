import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import type { CatalogRepository } from "../../lib/storefront/catalog-repository.ts";
import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";
import type { Product } from "../../lib/storefront/types.ts";

const root = process.cwd();
const pagePath = resolve(root, "app/catalog/[slug]/page.tsx");

async function pageSource() {
  return readFile(pagePath, "utf8");
}

test("product detail uses ProductService and CatalogRepository", async () => {
  const source = await pageSource();

  assert.match(source, /catalogRepository, productService/);
  assert.match(source, /productService\.getProductBySlug\(slug\)/);
  assert.match(source, /catalogRepository\.getManufacturers\(\)/);
  assert.match(source, /catalogRepository\.getCategories\(\)/);
});

test("slug lookup returns an active Storefront Product and null for missing slug", async () => {
  const service = new ProductService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );

  assert.equal((await service.getProductBySlug("fs510"))?.model, "FS510");
  assert.equal(await service.getProductBySlug("missing-product"), null);
});

test("missing Storefront Product invokes notFound", async () => {
  const source = await pageSource();

  assert.match(source, /if \(!product\) notFound\(\)/);
  assert.doesNotMatch(source, /getDraftCatalogProduct|getPublishedProduct/);
});

test("specifications are grouped from ProductSpecification", async () => {
  const source = await pageSource();

  assert.match(source, /groupSpecifications\(product\.specifications\)/);
  assert.match(source, /specification\.group/);
  assert.match(source, /specification\.label/);
  assert.match(source, /specification\.value/);
  assert.match(source, /specification\.unit/);
});

test("documents expose only ProductDocument public fields", async () => {
  const source = await pageSource();

  assert.match(source, /document\.title/);
  assert.match(source, /document\.kind/);
  assert.match(source, /document\.language/);
  assert.match(source, /document\.publicUrl/);
  assert.doesNotMatch(source, /document\.sha256|artifactPath|documentVersion/i);
});

test("compatibility uses ProductCompatibility without evidence", async () => {
  const source = await pageSource();

  assert.match(source, /product\.compatibility/);
  assert.match(source, /item\.label/);
  assert.match(source, /item\.note/);
  assert.doesNotMatch(source, /evidence|provenance/i);
});

test("relatedProductIds are resolved through ProductService", async () => {
  const filesystemRepository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  const products = (await filesystemRepository.getActiveProducts()).map((product) => ({
    ...product,
    relatedProductIds: [...product.relatedProductIds],
  }));
  const primary = products.find(({ slug }) => slug === "fs510") as Product;
  const related = products.find(
    ({ slug }) => slug === "ambu-vivasight-2-dlt",
  ) as Product;
  primary.relatedProductIds = [related.id];

  const repository: CatalogRepository = {
    getProducts: async () => products,
    getActiveProducts: async () => products,
    getProductBySlug: async (slug) =>
      products.find((product) => product.slug === slug) ?? null,
    getProductsByManufacturer: async () => [],
    getProductsByCategory: async () => [],
    getFeaturedProducts: async () => [],
    getManufacturers: async () => [],
    getManufacturerBySlug: async () => null,
    getCategories: async () => [],
    getCategoryBySlug: async () => null,
    searchProducts: async () => [],
    getCatalogSummary: () => filesystemRepository.getCatalogSummary(),
  };
  const service = new ProductService(repository);

  assert.deepEqual(
    (await service.getRelatedProducts(primary)).map(({ slug }) => slug),
    ["ambu-vivasight-2-dlt"],
  );
  assert.match(await pageSource(), /productService\.getRelatedProducts\(product\)/);
});

test("product detail has no publication or draft catalog imports", async () => {
  const source = await pageSource();

  assert.doesNotMatch(source, /lib\/published-catalog/);
  assert.doesNotMatch(source, /lib\/catalog-drafts/);
  assert.doesNotMatch(source, /data\/public|data\/research|supabase/i);
});

test("metadata is generated from Storefront Product", async () => {
  const source = await pageSource();

  assert.match(source, /title: `\$\{product\.name\}/);
  assert.match(source, /description: product\.shortDescription/);
  assert.match(source, /canonical: `\/catalog\/\$\{product\.slug\}`/);
});
