import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { SearchService } from "../../lib/storefront/search-service.ts";

const root = process.cwd();
const userSearchFiles = [
  "app/search/page.tsx",
  "components/search/SearchExperience.tsx",
  "app/page.tsx",
  "components/home/Search.tsx",
  "app/catalog/page.tsx",
  "components/catalog/CatalogExplorer.tsx",
  "components/layout/Header.tsx",
  "app/workspace/page.tsx",
  "lib/workspace/mock-data.ts",
  "lib/workspace/types.ts",
];

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

test("Header Search uses Storefront search and preserves the full search route", async () => {
  const [header, searchPage] = await Promise.all([
    source("components/layout/Header.tsx"),
    source("app/search/page.tsx"),
  ]);

  assert.match(header, /SearchService\.forProducts/);
  assert.match(header, /`\/search\?q=\$\{encodeURIComponent\(query\.trim\(\)\)\}`/);
  assert.match(header, /Все результаты/);
  assert.match(searchPage, /searchService\.searchProducts\(q\)/);
});

test("Homepage Search delegates the complete query to Catalog", async () => {
  const [page, search] = await Promise.all([
    source("app/page.tsx"),
    source("components/home/Search.tsx"),
  ]);

  assert.match(page, /<Hero products=\{catalogEquipment \?\? \[\]\} \/>/u);
  assert.doesNotMatch(page, /products=\{products\}|manufacturers=\{manufacturers\}|categories=\{categories\}/u);
  assert.match(search, /router\.push\(`\/catalog\?q=\$\{encodeURIComponent\(query\)\}`\)/u);
  assert.match(search, /if \(!query\)/u);
  assert.match(search, /inputRef\.current\?\.focus\(\)/u);
  assert.doesNotMatch(search, /SearchService|Product\[\]|Manufacturer\[\]|Category\[\]/u);
});

test("Catalog Search continues to use Storefront SearchService", async () => {
  const [page, explorer] = await Promise.all([
    source("app/catalog/page.tsx"),
    source("components/catalog/CatalogExplorer.tsx"),
  ]);

  assert.match(page, /searchService\.searchProducts\(q\)/);
  assert.match(explorer, /SearchService\.forProducts/);
  assert.match(explorer, /productSearchService\.searchProducts\(query\)/);
});

test("Homepage Search does not duplicate Catalog autocomplete", async () => {
  const homepageSearch = await source("components/home/Search.tsx");

  assert.doesNotMatch(homepageSearch, /setResults|results\.map|product\.media|role="listbox"/u);
  assert.doesNotMatch(homepageSearch, /popularQueries|Популярные запросы/u);
  assert.match(homepageSearch, /name="q"/u);
  assert.match(homepageSearch, /type="search"/u);
});

test("Storefront search supports manufacturer and category names", async () => {
  const search = new SearchService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );

  assert.deepEqual(
    (await search.searchProducts("Alba Healthcare")).map(({ slug }) => slug),
    ["fs510"],
  );
  assert.deepEqual(
    (await search.searchProducts("Управление дыхательными путями")).map(
      ({ slug }) => slug,
    ),
    ["ambu-vivasight-2-dlt"],
  );
});

test("Storefront search supports name, model, slug and key features", async () => {
  const search = new SearchService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );

  for (const query of [
    "Тепловлагообменный фильтр",
    "FS510",
    "ambu-vivasight-2-dlt",
    "Встроенная камера",
  ]) {
    assert.ok((await search.searchProducts(query)).length > 0, query);
  }
});

test("global search results expose only Storefront merchandising fields", async () => {
  const experience = await source("components/search/SearchExperience.tsx");

  assert.match(experience, /product\.media/);
  assert.match(experience, /product\.name/);
  assert.match(experience, /manufacturer/);
  assert.match(experience, /category/);
  assert.match(experience, /`\/catalog\/\$\{product\.slug\}`/);
  assert.doesNotMatch(
    experience,
    /publication|verification|evidence|review|readiness|source metrics|lastUpdated|matchedFields/i,
  );
});

test("user search scenarios have no legacy search imports", async () => {
  const combined = (await Promise.all(userSearchFiles.map(source))).join("\n");

  assert.doesNotMatch(combined, /lib\/published-catalog/);
  assert.doesNotMatch(combined, /lib\/catalog-drafts/);
  assert.doesNotMatch(combined, /lib\/search(?:\/index)?["']/);
  assert.doesNotMatch(combined, /data\/public|data\/research/);
});

test("server-side workspace search uses Storefront SearchService", async () => {
  const workspace = await source("lib/workspace/mock-data.ts");

  assert.match(workspace, /new SearchService/);
  assert.match(workspace, /\.searchProducts\(query\)/);
  assert.doesNotMatch(workspace, /searchMedicalDevices|\.\.\/search\/index/);
});
