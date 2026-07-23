import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildProductDetailExperience,
  isTechnicalProductSpecification,
} from "../../lib/storefront/product-detail-experience.ts";
import type {
  Category,
  Manufacturer,
  Product,
} from "../../lib/storefront/types.ts";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "hamilton-t1",
    slug: "hamilton-t1",
    manufacturerId: "hamilton-medical",
    categoryId: "ventilators",
    name: "Hamilton T1",
    model: "T1",
    shortDescription:
      "Транспортный аппарат ИВЛ поддерживает режим ASV. Система рассчитана на работу в пути. Данные взяты из публичной карточки. Четвёртое предложение сохраняется. Пятое предложение не входит.",
    description:
      "<p>Полное описание.</p><ul><li>Скрытый пункт не становится преимуществом</li><li>Вес: 6,5 кг</li></ul>",
    status: "preview_draft",
    catalogQualityStatus: "READY",
    featured: false,
    applicationAreas: ["Реанимация", "Транспортировка"],
    keyFeatures: ["Турбинный привод.", "Автономная работа более 9 часов;"],
    specifications: [
      { group: "Метаданные", label: "Модель", value: "T1", unit: null, position: 1 },
      { group: "Параметры", label: "Вес", value: "6,5", unit: "кг", position: 3 },
      { group: "Параметры", label: "PEEP", value: "0–35", unit: "см H2O", position: 2 },
    ],
    media: [],
    documents: [],
    registrationRecords: [],
    compatibility: [],
    relatedProductIds: [],
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

const manufacturer: Manufacturer = {
  id: "hamilton-medical",
  slug: "hamilton-medical",
  name: "Hamilton Medical",
  country: "CH",
  shortDescription: "Производитель аппаратов искусственной вентиляции лёгких.",
  description: "",
  logoUrl: null,
  websiteUrl: "https://www.hamilton-medical.com/",
  status: "active",
  createdAt: "2026-07-23T00:00:00.000Z",
  updatedAt: "2026-07-23T00:00:00.000Z",
};

const category: Category = {
  id: "ventilators",
  slug: "ventilators",
  name: "Аппараты ИВЛ",
  shortDescription: "",
  description: "",
  parentId: null,
  imageUrl: null,
  position: 1,
  status: "active",
  createdAt: "2026-07-23T00:00:00.000Z",
  updatedAt: "2026-07-23T00:00:00.000Z",
};

test("summary is sourced from public copy without invented facts or case loss", () => {
  const experience = buildProductDetailExperience({
    product: product(),
    manufacturer,
    category,
  });

  assert.equal(
    experience.summary,
    "Транспортный аппарат ИВЛ поддерживает режим ASV. Система рассчитана на работу в пути. Данные взяты из публичной карточки. Четвёртое предложение сохраняется.",
  );
  assert.match(experience.summary ?? "", /ИВЛ.*ASV/u);
  assert.doesNotMatch(experience.summary ?? "", /основные возможности|технические сведения/iu);
});

test("advantages are fail-closed and never inferred from description HTML", () => {
  const explicit = buildProductDetailExperience({ product: product() });
  assert.deepEqual(explicit.advantages, [
    "Турбинный привод",
    "Автономная работа более 9 часов",
  ]);

  const absent = buildProductDetailExperience({
    product: product({ keyFeatures: [] }),
  });
  assert.deepEqual(absent.advantages, []);
  assert.doesNotMatch(absent.advantages.join(" "), /Скрытый пункт|Вес/u);
});

test("metadata is value-only, complete and de-duplicates model and application areas", () => {
  const experience = buildProductDetailExperience({
    product: product(),
    manufacturer,
    category,
  });

  assert.deepEqual(experience.badges, [
    {
      label: "Производитель",
      value: "Hamilton Medical",
      href: "/manufacturers/hamilton-medical",
    },
    { label: "Страна", value: "Швейцария" },
    { label: "Применение", value: "Реанимация · Транспортировка" },
    { label: "Категория", value: "Аппараты ИВЛ" },
  ]);
  assert.equal(experience.badges.some(({ label }) => label === "Модель"), false);

  const distinctModel = buildProductDetailExperience({
    product: product({
      name: "Транспортный аппарат ИВЛ",
      model: "T1",
      applicationAreas: [],
    }),
  });
  assert.deepEqual(distinctModel.badges, [{ label: "Модель", value: "T1" }]);
});

test("technical specifications use only explicit structured specifications", () => {
  const experience = buildProductDetailExperience({ product: product() });
  assert.deepEqual(
    experience.technicalSpecifications.map(({ label }) => label),
    ["PEEP", "Вес"],
  );
  assert.equal(
    isTechnicalProductSpecification({
      group: "Метаданные",
      label: "Тип товара",
      value: "Аппарат ИВЛ",
      unit: null,
      position: 0,
    }),
    false,
  );
});

test("presentation contract remains server-only and preserves current Product Detail semantics", async () => {
  const [page, experience, manufacturerSource] = await Promise.all([
    readFile("app/catalog/[slug]/page.tsx", "utf8"),
    readFile("lib/storefront/product-detail-experience.ts", "utf8"),
    readFile("components/catalog/ProductManufacturer.tsx", "utf8"),
  ]);

  assert.match(page, /<ProductGallery product=\{product\}/u);
  assert.match(page, /<ProductManufacturer manufacturer=\{experience\.manufacturer\}/u);
  assert.match(page, /aria-label="Ключевая информация о товаре"/u);
  assert.match(page, /<dt className="sr-only">\{label\}<\/dt>/u);
  assert.match(page, /title="Регистрационная информация"/u);
  assert.match(page, /title="Документы и загрузки"/u);
  assert.match(page, /productService\.getRelatedProducts\(product\)/u);
  assert.doesNotMatch(page, /<h3 className="cm-label">Области применения<\/h3>/u);
  assert.doesNotMatch(page, /["']use client["']/u);
  assert.doesNotMatch(experience, /CatalogRepository|ProductService|Supabase|cloud|review|publication/iu);
  assert.doesNotMatch(manufacturerSource, /["']use client["']/u);
});
