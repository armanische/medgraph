import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

test("catalog experience keeps the Storefront service boundary", async () => {
  const page = await source("app/catalog/page.tsx");

  assert.match(page, /productService\.getActiveProducts\(\)/);
  assert.match(page, /categoryService\.getCategories\(\)/);
  assert.match(page, /manufacturerService\.getManufacturers\(\)/);
  assert.match(page, /Promise\.all/);
  assert.doesNotMatch(page, /getProductBySlug|data\/storefront|\.json|supabase/i);
});

test("catalog cards expose required public list fields", async () => {
  const explorer = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(explorer, /product\.media\.find/);
  assert.match(explorer, /alt=\{image\.alt\}/);
  assert.match(explorer, /product\.name/);
  assert.match(explorer, /presentation\.shortDescription/);
  assert.match(explorer, /manufacturerEntry\.name/);
  assert.match(explorer, /product\.applicationAreas\.slice\(0, 2\)/);
  assert.match(explorer, /href=\{`\/catalog\/\$\{product\.slug\}`\}/);
});

test("catalog state is encoded in URL and browser history restores the list", async () => {
  const [explorer, backButton] = await Promise.all([
    source("components/catalog/CatalogExplorer.tsx"),
    source("components/catalog/BackToCatalogButton.tsx"),
  ]);

  assert.match(explorer, /useSearchParams\(\)/);
  assert.match(explorer, /new URLSearchParams\(urlSearchParams\.toString\(\)\)/);
  assert.match(explorer, /window\.history\.replaceState\(null, "", nextUrl\)/);
  assert.match(explorer, /<a href=\{`\/catalog\/\$\{product\.slug\}`\}/);
  for (const parameter of ["q", "category", "manufacturer", "applicationArea", "sort"]) {
    assert.match(explorer, new RegExp(`params,\\s*"${parameter}"`, "u"));
  }
  assert.match(backButton, /router\.back\(\)/);
  assert.match(backButton, /router\.push\("\/catalog"\)/);
});

test("catalog has accessible skeleton, empty and recoverable error states", async () => {
  const [loading, skeleton, error, explorer] = await Promise.all([
    source("app/catalog/loading.tsx"),
    source("components/catalog/CatalogSkeleton.tsx"),
    source("app/catalog/error.tsx"),
    source("components/catalog/CatalogExplorer.tsx"),
  ]);

  assert.match(loading, /CatalogSkeleton/);
  assert.match(skeleton, /aria-busy="true"/);
  assert.doesNotMatch(skeleton, /spinner/i);
  assert.match(explorer, /Каталог пока пуст/);
  assert.match(error, /Не удалось загрузить каталог/);
  assert.match(error, /onClick=\{reset\}/);
});

test("catalog grid is responsive and uses no client pagination or detail preloading", async () => {
  const explorer = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(explorer, /md:grid-cols-3 2xl:grid-cols-4/);
  assert.doesNotMatch(explorer, /getProductBySlug|pageSize|loadMore|infinite/i);
});
