import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadHomepageOverviewSources } from "../../lib/storefront/homepage-overview.ts";

async function source(path: string) {
  return readFile(path, "utf8");
}

function loaders({
  products = Promise.resolve(["product"]),
  manufacturers = Promise.resolve(["manufacturer"]),
  categories = Promise.resolve(["category"]),
}: {
  products?: Promise<readonly string[]>;
  manufacturers?: Promise<readonly string[]>;
  categories?: Promise<readonly string[]>;
} = {}) {
  return {
    products: () => products,
    manufacturers: () => manufacturers,
    categories: () => categories,
  };
}

test("Homepage overview reads settle independently", async () => {
  const categoryError = await loadHomepageOverviewSources(loaders({
    categories: Promise.reject(new Error("category unavailable")),
  }));
  assert.deepEqual(categoryError.products, ["product"]);
  assert.deepEqual(categoryError.manufacturers, ["manufacturer"]);
  assert.equal(categoryError.categories, null);

  const manufacturerError = await loadHomepageOverviewSources(loaders({
    manufacturers: Promise.reject(new Error("manufacturer unavailable")),
  }));
  assert.deepEqual(manufacturerError.products, ["product"]);
  assert.equal(manufacturerError.manufacturers, null);
  assert.deepEqual(manufacturerError.categories, ["category"]);

  const bothErrors = await loadHomepageOverviewSources(loaders({
    manufacturers: Promise.reject(new Error("manufacturer unavailable")),
    categories: Promise.reject(new Error("category unavailable")),
  }));
  assert.deepEqual(bothErrors.products, ["product"]);
  assert.equal(bothErrors.manufacturers, null);
  assert.equal(bothErrors.categories, null);
});

test("Homepage overview preserves successful empty and partial results", async () => {
  const empty = await loadHomepageOverviewSources(loaders({
    products: Promise.resolve([]),
    manufacturers: Promise.resolve([]),
    categories: Promise.resolve([]),
  }));
  assert.deepEqual(empty, { products: [], manufacturers: [], categories: [] });

  const productError = await loadHomepageOverviewSources(loaders({
    products: Promise.reject(new Error("products unavailable")),
  }));
  assert.equal(productError.products, null);
  assert.deepEqual(productError.manufacturers, ["manufacturer"]);
  assert.deepEqual(productError.categories, ["category"]);
});

test("Homepage limits data failures to their overview sections", async () => {
  const [page, categories, manufacturers] = await Promise.all([
    source("app/page.tsx"),
    source("components/home/Categories.tsx"),
    source("components/home/FeaturedManufacturers.tsx"),
  ]);

  assert.match(page, /loadHomepageOverviewSources/u);
  assert.match(page, /products && categories \? categories/u);
  assert.match(page, /products && manufacturers \? manufacturers/u);
  assert.match(categories, /const unavailable = categories === null/u);
  assert.match(categories, /Категории временно недоступны/u);
  assert.match(categories, /Повторить/u);
  assert.match(categories, /<form action="\/" method="get">/u);
  assert.match(categories, /if \(categories\?\.length === 0\) return null/u);
  assert.match(manufacturers, /const unavailable = manufacturers === null/u);
  assert.match(manufacturers, /Производители временно недоступны/u);
  assert.match(manufacturers, /Повторить/u);
  assert.match(manufacturers, /<form action="\/" method="get">/u);
  assert.match(manufacturers, /if \(manufacturers\?\.length === 0\) return null/u);
});

test("all Homepage H2 headings use the approved responsive scale", async () => {
  const paths = [
    "components/home/Categories.tsx",
    "components/home/FeaturedManufacturers.tsx",
    "components/home/Equipment.tsx",
    "components/home/WhyCyberMedica.tsx",
    "components/home/CTA.tsx",
  ];
  const sources = await Promise.all(paths.map(source));

  for (const component of sources) {
    const headings = component.match(/<h2[\s\S]*?>/gu) ?? [];
    assert.ok(headings.length >= 1);
    for (const heading of headings) {
      assert.match(heading, /text-2xl/u);
      assert.match(heading, /sm:text-\[26px\]/u);
      assert.match(heading, /lg:text-\[30px\]/u);
    }
  }
});

test("Homepage controls honor approved minimum and exact target heights", async () => {
  const [header, hero, search, categories, manufacturers, equipment, cta] = await Promise.all([
    source("components/layout/Header.tsx"),
    source("components/home/Hero.tsx"),
    source("components/home/Search.tsx"),
    source("components/home/Categories.tsx"),
    source("components/home/FeaturedManufacturers.tsx"),
    source("components/home/Equipment.tsx"),
    source("components/home/CTA.tsx"),
  ]);

  assert.match(header, /className="flex min-h-\[44px\] shrink-0/u);
  assert.match(header, /className="cm-button-primary !min-h-\[44px\]/u);
  assert.equal(
    (header.match(/inline-flex min-h-\[44px\] shrink-0 items-center rounded-lg px-2/gu) ?? []).length,
    2,
  );
  assert.match(hero, /cm-button-secondary !min-h-\[44px\]/u);
  assert.match(search, /className="min-h-\[44px\][\s\S]*<\/span>/u);
  assert.match(search, /cm-button-primary !min-h-\[48px\]/u);
  assert.match(categories, /cm-button-secondary mt-4 !min-h-\[44px\] w-full sm:!hidden/u);
  assert.match(manufacturers, /cm-button-secondary mt-4 !min-h-\[44px\] w-full sm:!hidden/u);
  assert.match(equipment, /cm-button-secondary !min-h-\[44px\] w-full sm:w-auto/u);
  assert.equal((cta.match(/!min-h-\[48px\]/gu) ?? []).length, 2);
});

test("Homepage Search reuses the established Catalog icon without changing routing", async () => {
  const search = await source("components/home/Search.tsx");
  const catalog = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(search, /aria-hidden="true"[\s\S]*⌕/u);
  assert.match(catalog, /⌕/u);
  assert.doesNotMatch(search, /function SearchIcon|<svg/u);
  assert.match(search, /router\.push\(`\/catalog\?q=\$\{encodeURIComponent\(query\)\}`\)/u);
});
