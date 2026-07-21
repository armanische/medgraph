import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("catalog uses the compact responsive density contract", async () => {
  const catalog = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(catalog, /md:grid-cols-3 2xl:grid-cols-4/u);
  assert.match(catalog, /aspect-\[16\/6\.5\]/u);
  assert.match(catalog, /cm-field cm-field-compact/u);
  assert.match(catalog, /flex flex-1 flex-col p-3/u);
  assert.match(catalog, /bg-cm-teal-soft px-2 py-1 font-bold/u);
  assert.doesNotMatch(catalog, /Категория уточняется/u);
  assert.match(catalog, /Данные уточняются/u);
});

test("catalog summary exposes four public storefront metrics", async () => {
  const page = await source("app/catalog/page.tsx");

  for (const label of [
    "Товары",
    "Производители",
    "Категории",
    "Области применения",
  ]) {
    assert.match(page, new RegExp(`\\[\"${label}\"`, "u"));
  }
  assert.match(page, /products\.flatMap\(\(product\) => product\.applicationAreas\)/u);
});

test("catalog presentation uses the shared fail-closed product contract", async () => {
  const catalog = await source("components/catalog/CatalogExplorer.tsx");
  assert.match(catalog, /getProductPresentation/u);
  assert.match(catalog, /presentation\.mediaFallbackLabel/u);
  assert.match(catalog, /presentation\.canCompare/u);
});
