import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildProductDetailExperience } from "../../lib/storefront/product-detail-experience.ts";
import type { Product } from "../../lib/storefront/types.ts";

async function source(path: string) {
  return readFile(path, "utf8");
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "hamilton-t1",
    slug: "hamilton-t1",
    manufacturerId: "hamilton",
    categoryId: "ventilators",
    name: "Hamilton T1",
    model: "T1",
    shortDescription: "Транспортный аппарат ИВЛ. Работает для взрослых и детей. Используется при транспортировке. Поддерживает интеллектуальную вентиляцию. Пятое предложение не входит.",
    description: "<p>Полное описание.</p><ul><li><strong>Турбинный привод:</strong> автономная вентиляция</li><li><strong>Аккумулятор:</strong> более 9 часов работы</li><li><strong>Пациенты:</strong> взрослые и дети</li><li><strong>Транспортировка:</strong> мобильное применение</li><li><strong>Режим ASV:</strong> интеллектуальная вентиляция</li><li><strong>Экран:</strong> сенсорное управление</li><li><strong>Вес:</strong> 6,5 кг</li><li><strong>PEEP:</strong> 0–35 см H2O</li></ul>",
    status: "preview_draft",
    catalogQualityStatus: "READY",
    featured: false,
    applicationAreas: ["Реанимация"],
    keyFeatures: [],
    specifications: [],
    media: [],
    documents: [],
    registrationRecords: [],
    compatibility: [],
    relatedProductIds: [],
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
    ...overrides,
  };
}

test("product summary is limited to four source sentences", () => {
  const experience = buildProductDetailExperience({ product: product() });
  assert.equal((experience.summary?.match(/[.!?]/gu) ?? []).length, 4);
  assert.doesNotMatch(experience.summary ?? "", /Пятое предложение/u);
});

test("advantages and specifications may be derived only from explicit source list items", () => {
  const experience = buildProductDetailExperience({ product: product() });
  assert.deepEqual(experience.advantages, [
    "Турбинный привод: автономная вентиляция",
    "Аккумулятор: более 9 часов работы",
    "Пациенты: взрослые и дети",
    "Транспортировка: мобильное применение",
    "Режим ASV: интеллектуальная вентиляция",
    "Экран: сенсорное управление",
  ]);
  assert.deepEqual(experience.specifications.map(({ label, value }) => ({ label, value })), [
    { label: "Вес", value: "6,5 кг" },
    { label: "PEEP", value: "0–35 см H2O" },
  ]);
});

test("product page exposes catalog return, scroll-to-top and complete lightbox controls", async () => {
  const [page, navigation, gallery] = await Promise.all([
    source("app/catalog/[slug]/page.tsx"),
    source("components/catalog/ProductPageNavigation.tsx"),
    source("components/catalog/ProductGallery.tsx"),
  ]);
  assert.match(page, /<ProductPageNavigation \/>/u);
  assert.match(navigation, /Назад к каталогу/u);
  assert.match(navigation, /window\.scrollY > 560/u);
  assert.match(navigation, /aria-label="Наверх"/u);
  assert.match(gallery, /event\.key === "Escape"/u);
  assert.match(gallery, /event\.key === "ArrowLeft"/u);
  assert.match(gallery, /event\.key === "ArrowRight"/u);
  assert.match(gallery, /onTouchStart/u);
  assert.match(gallery, /onTouchEnd/u);
  assert.doesNotMatch(gallery, /target="_blank"/u);
});

test("catalog cards use Category as the single public classification label", async () => {
  const [catalog, experience] = await Promise.all([
    source("components/catalog/CatalogExplorer.tsx"),
    source("lib/storefront/product-detail-experience.ts"),
  ]);
  assert.match(catalog, /Категория: /u);
  assert.match(experience, /label: "Категория"/u);
  assert.doesNotMatch(catalog, /Тип товара/u);
  assert.doesNotMatch(experience, /label: "Тип"/u);
});
