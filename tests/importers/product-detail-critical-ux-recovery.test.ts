import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(path, "utf8");
}

test("catalog cards use a single category presentation and retain stable alignment", async () => {
  const catalog = await source("components/catalog/CatalogExplorer.tsx");

  assert.match(catalog, /<span className="sr-only">Категория: <\/span>/u);
  assert.match(catalog, /filter\(isTechnicalProductSpecification\)/u);
  assert.match(catalog, /line-clamp-2 min-h-10/u);
  assert.match(catalog, /min-h-\[3\.625rem\]/u);
  assert.doesNotMatch(catalog, /Тип товара<\/dt>/u);
});

test("product detail exposes a real return path, only real section links, and an accessible top action", async () => {
  const [page, backToCatalog, backToTop] = await Promise.all([
    source("app/catalog/[slug]/page.tsx"),
    source("components/catalog/BackToCatalog.tsx"),
    source("components/catalog/BackToTop.tsx"),
  ]);

  assert.match(page, /<BackToCatalog productSlug=\{product\.slug\}/u);
  assert.match(page, /<BackToTop \/>/u);
  assert.match(page, /aria-label="Навигация по странице товара"/u);
  assert.match(page, /experience\.description/u);
  assert.match(page, /experience\.manufacturer/u);
  assert.doesNotMatch(page, /href: "#documents"/u);
  assert.doesNotMatch(page, /href: "#regulatory"/u);
  assert.match(backToCatalog, /window\.history\.back\(\)/u);
  assert.match(backToCatalog, /router\.push\("\/catalog"\)/u);
  assert.match(backToCatalog, /sessionStorage/u);
  assert.match(backToTop, /prefers-reduced-motion/u);
  assert.match(backToTop, /aria-label="Наверх"/u);
});

test("gallery has compact conditional controls and preserves keyboard and touch lightbox behavior", async () => {
  const gallery = await source("components/catalog/ProductGallery.tsx");

  assert.match(gallery, /imageMedia\.length > 1/u);
  assert.match(gallery, /aria-label="Предыдущее изображение"/u);
  assert.match(gallery, /aria-label="Следующее изображение"/u);
  assert.match(gallery, /event\.key === "Escape"/u);
  assert.match(gallery, /event\.key === "ArrowLeft"/u);
  assert.match(gallery, /event\.key === "ArrowRight"/u);
  assert.match(gallery, /event\.key !== "Tab"/u);
  assert.match(gallery, /document\.body\.style\.overflow = "hidden"/u);
  assert.match(gallery, /trigger\?\.focus\(\)/u);
  assert.match(gallery, /onTouchStart/u);
  assert.match(gallery, /onTouchEnd/u);
});
