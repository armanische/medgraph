import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { CategoryService } from "../../lib/storefront/category-service.ts";
import { ManufacturerService } from "../../lib/storefront/manufacturer-service.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";

const root = process.cwd();
const homepageFiles = [
  "app/page.tsx",
  "components/home/Hero.tsx",
  "components/home/Search.tsx",
  "components/home/FeaturedProducts.tsx",
  "components/home/FeaturedManufacturers.tsx",
  "components/home/Categories.tsx",
  "components/home/PlatformStats.tsx",
  "components/home/WhyCyberMedica.tsx",
  "components/home/CTA.tsx",
  "components/home/Footer.tsx",
  "components/layout/Header.tsx",
];

async function source(path: string) {
  return readFile(resolve(root, path), "utf8");
}

test("homepage loads data through storefront services", async () => {
  const page = await source("app/page.tsx");

  assert.match(page, /from "@\/lib\/storefront"/);
  assert.match(page, /productService\.getProducts\(\)/);
  assert.match(page, /productService\.getFeaturedProducts\(\)/);
  assert.match(page, /manufacturerService\.getManufacturers\(\)/);
  assert.match(page, /categoryService\.getCategories\(\)/);
});

test("homepage does not import legacy catalog sources", async () => {
  const combined = (await Promise.all(homepageFiles.map(source))).join("\n");

  assert.doesNotMatch(combined, /lib\/published-catalog/);
  assert.doesNotMatch(combined, /lib\/catalog-drafts/);
  assert.doesNotMatch(combined, /lib\/platform-stats/);
  assert.doesNotMatch(combined, /data\/public|data\/research/);
});

test("featured products come from ProductService", async () => {
  const repository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  const service = new ProductService(repository);
  const featured = await service.getFeaturedProducts();

  assert.deepEqual(featured.map(({ slug }) => slug), ["fs510"]);
  assert.ok(featured.every(({ status }) => status === "active" || status === "on_request"));
});

test("homepage platform stats use active storefront entities", async () => {
  const repository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  const products = new ProductService(repository);
  const manufacturers = new ManufacturerService(repository);
  const categories = new CategoryService(repository);
  const [activeProducts, activeManufacturers, activeCategories] = await Promise.all([
    products.getProducts(),
    manufacturers.getManufacturers(),
    categories.getCategories(),
  ]);

  assert.deepEqual(
    {
      productCount: activeProducts.length,
      manufacturerCount: activeManufacturers.length,
      categoryCount: activeCategories.length,
    },
    { productCount: 2, manufacturerCount: 2, categoryCount: 2 },
  );
});

test("rendered homepage copy contains no legacy positioning", async () => {
  const combined = (await Promise.all(homepageFiles.map(source))).join("\n");
  const forbidden = [
    "research",
    "knowledge",
    "verification",
    "evidence",
    "publication",
    "review",
    "candidate facts",
    "источник знаний",
    "проверенные знания",
    "экспертная база",
    "база знаний",
  ];
  const normalized = combined.toLocaleLowerCase("ru-RU");

  for (const phrase of forbidden) {
    const present = /^[a-z ]+$/u.test(phrase)
      ? new RegExp(`\\b${phrase.replace(/ /gu, "\\s+")}\\b`, "iu").test(combined)
      : normalized.includes(phrase);
    assert.equal(
      present,
      false,
      `Homepage still contains forbidden phrase: ${phrase}`,
    );
  }
});
