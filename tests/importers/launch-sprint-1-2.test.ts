import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("catalog cards reserve consistent vertical regions", async () => {
  const catalog = await source("components/catalog/CatalogExplorer.tsx");
  assert.match(catalog, /line-clamp-2 min-h-10/u);
  assert.match(catalog, /min-h-7 text-xs/u);
  assert.match(catalog, /min-h-9/u);
  assert.match(catalog, /min-h-\[3\.625rem\]/u);
});

test("product metadata exposes labeled and value-only presentation variants", async () => {
  const page = await source("app/catalog/[slug]/page.tsx");
  assert.match(page, /metadataMode/u);
  assert.match(page, /metadata === "values"/u);
  assert.match(page, /data-metadata-mode/u);
  assert.match(page, /className=\{metadataMode === "labels"/u);
  assert.doesNotMatch(page, /Модель \/ артикул/u);
});

test("product description stays visible and application metadata is not duplicated", async () => {
  const page = await source("app/catalog/[slug]/page.tsx");
  assert.doesNotMatch(page, /<details/u);
  assert.match(page, /<SafeProductDescription html=\{experience\.description\}/u);
  assert.doesNotMatch(page, /<h3 className="cm-label">Области применения<\/h3>/u);
});

test("advantages use short presentation copy and corrected icon geometry", async () => {
  const [page, experience] = await Promise.all([
    source("app/catalog/[slug]/page.tsx"),
    source("lib/storefront/product-detail-experience.ts"),
  ]);
  assert.match(experience, /compactAdvantage/u);
  assert.match(experience, /conciseText\(headline, 72\)/u);
  assert.match(page, /grid size-7 shrink-0 place-items-center/u);
  assert.match(page, /min-h-\[4\.25rem\]/u);
});
