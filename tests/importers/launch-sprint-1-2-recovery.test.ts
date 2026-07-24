import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("catalog cards reserve a stable title, manufacturer, description and detail region", async () => {
  const [catalog, productCard] = await Promise.all([
    source("components/catalog/CatalogExplorer.tsx"),
    source("components/storefront/ProductCard.tsx"),
  ]);

  assert.match(productCard, /line-clamp-2 min-h-10/u);
  assert.match(productCard, /min-h-7 text-xs/u);
  assert.match(productCard, /min-h-9/u);
  assert.match(productCard, /min-h-\[3\.625rem\]/u);
  assert.match(catalog, /md:grid-cols-3 2xl:grid-cols-4/u);
  assert.match(productCard, /<span className="sr-only">Категория: <\/span>/u);
});

test("hero defaults to accessible value-only metadata and contains no decorative model or status block", async () => {
  const page = await source("app/catalog/[slug]/page.tsx");

  assert.match(page, /aria-label="Ключевая информация о товаре"/u);
  assert.match(page, /<dt className="sr-only">\{label\}<\/dt>/u);
  assert.doesNotMatch(page, /Модель \/ артикул|Модель \/ SKU/u);
  assert.doesNotMatch(page, /presentation\.statusLabel|key-specifications/u);
  assert.match(page, /aria-label="Навигация по странице товара"/u);
  assert.doesNotMatch(page, /<h3 className="cm-label">Области применения<\/h3>/u);
});

test("gallery uses a keyboard-accessible magnifier and controlled lightbox instead of links", async () => {
  const gallery = await source("components/catalog/ProductGallery.tsx");

  assert.match(gallery, /aria-label="Увеличить изображение"/u);
  assert.match(gallery, /<svg/u);
  assert.match(gallery, /event\.key === "Escape"/u);
  assert.match(gallery, /event\.key === "ArrowLeft"/u);
  assert.match(gallery, /event\.key === "ArrowRight"/u);
  assert.match(gallery, /onTouchStart/u);
  assert.match(gallery, /onTouchEnd/u);
  assert.doesNotMatch(gallery, />Увеличить</u);
  assert.doesNotMatch(gallery, /target="_blank"/u);
});

test("presentation contract retains fail-closed structured advantages and specifications", async () => {
  const experience = await source("lib/storefront/product-detail-experience.ts");

  assert.match(experience, /product\.keyFeatures/u);
  assert.match(experience, /filter\(isTechnicalProductSpecification\)/u);
  assert.match(experience, /NON_TECHNICAL_MARKETING_LABELS/u);
  assert.match(experience, /const source = publicOptionalText\(product\.shortDescription\)/u);
  assert.doesNotMatch(experience, /matchAll|<li|product\.description\);\n  if \(!source\)/u);
});
