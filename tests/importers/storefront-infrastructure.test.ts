import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { CategoryService } from "../../lib/storefront/category-service.ts";
import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { ManufacturerService } from "../../lib/storefront/manufacturer-service.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";
import {
  buildStorefrontSitemap,
  STOREFRONT_SITE_URL,
} from "../../lib/storefront/storefront-sitemap.ts";

const root = process.cwd();

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

function services() {
  const repository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  return {
    productService: new ProductService(repository),
    manufacturerService: new ManufacturerService(repository),
    categoryService: new CategoryService(repository),
  };
}

test("sitemap generation uses active Storefront catalog entities", async () => {
  const sitemap = await buildStorefrontSitemap(services());
  const urls = sitemap.map(({ url }) => url);

  assert.ok(urls.includes(`${STOREFRONT_SITE_URL}/catalog/fs510`));
  assert.ok(
    urls.includes(`${STOREFRONT_SITE_URL}/catalog/ambu-vivasight-2-dlt`),
  );
  assert.ok(urls.includes(`${STOREFRONT_SITE_URL}/manufacturers/alba-healthcare`));
  assert.ok(urls.includes(`${STOREFRONT_SITE_URL}/manufacturers/ambu`));
  assert.equal(new Set(urls).size, urls.length);
});

test("Storefront sitemap excludes products in inactive categories", async () => {
  const catalog = services();
  const sitemap = await buildStorefrontSitemap({
    ...catalog,
    categoryService: { getCategories: async () => [] },
  });

  assert.equal(
    sitemap.some(({ url }) => url.includes("/catalog/fs510")),
    false,
  );
});

test("sitemap infrastructure has no publication or draft imports", async () => {
  const combined = (
    await Promise.all([
      source("app/sitemap.ts"),
      source("lib/storefront/storefront-sitemap.ts"),
    ])
  ).join("\n");

  assert.match(combined, /ProductService/);
  assert.match(combined, /ManufacturerService/);
  assert.match(combined, /CategoryService/);
  assert.doesNotMatch(combined, /published-catalog/);
  assert.doesNotMatch(combined, /catalog-drafts/);
  assert.doesNotMatch(combined, /data\/public|data\/research/);
});

test("sitemap URLs and route canonicals use the same public paths", async () => {
  const sitemap = await buildStorefrontSitemap(services());
  const urls = new Set(sitemap.map(({ url }) => new URL(url).pathname));
  const [productPage, manufacturerPage, robots] = await Promise.all([
    source("app/catalog/[slug]/page.tsx"),
    source("app/manufacturers/[slug]/page.tsx"),
    source("app/robots.ts"),
  ]);

  assert.match(productPage, /canonical: `\/catalog\/\$\{product\.slug\}`/);
  assert.match(
    manufacturerPage,
    /canonical: `\/manufacturers\/\$\{manufacturer\.slug\}`/,
  );
  assert.ok(urls.has("/catalog/fs510"));
  assert.ok(urls.has("/manufacturers/ambu"));
  assert.match(robots, /sitemap: `\$\{siteUrl\}\/sitemap\.xml`/);
});

test("Storefront dynamic routes generate static params through services", async () => {
  const [productPage, manufacturerPage] = await Promise.all([
    source("app/catalog/[slug]/page.tsx"),
    source("app/manufacturers/[slug]/page.tsx"),
  ]);

  assert.match(productPage, /productService\.getActiveProducts\(\)/);
  assert.match(
    manufacturerPage,
    /manufacturerService\.getManufacturers\(\)/,
  );
});
