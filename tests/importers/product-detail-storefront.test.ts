import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import type { CatalogRepository } from "../../lib/storefront/catalog-repository.ts";
import { FilesystemCatalogRepository } from "../../lib/storefront/filesystem-catalog-repository.ts";
import { buildProductDetailExperience } from "../../lib/storefront/product-detail-experience.ts";
import { ProductService } from "../../lib/storefront/product-service.ts";
import type { Product } from "../../lib/storefront/types.ts";

const root = process.cwd();
const pagePath = resolve(root, "app/catalog/[slug]/page.tsx");
const galleryPath = resolve(root, "components/catalog/ProductGallery.tsx");
const documentsPath = resolve(root, "components/catalog/ProductDocuments.tsx");
const specificationsPath = resolve(root, "components/catalog/ProductSpecifications.tsx");

async function pageSource() {
  return readFile(pagePath, "utf8");
}

test("product detail uses ProductService and CatalogRepository", async () => {
  const source = await pageSource();

  assert.match(source, /catalogRepository, productService/);
  assert.match(source, /productService\.getProductBySlug\(slug\)/);
  assert.match(source, /catalogRepository\.getManufacturers\(\)/);
  assert.match(source, /catalogRepository\.getCategories\(\)/);
});

test("slug lookup returns an active Storefront Product and null for missing slug", async () => {
  const service = new ProductService(
    new FilesystemCatalogRepository(resolve(root, "data/storefront")),
  );

  assert.equal((await service.getProductBySlug("fs510"))?.model, "FS510");
  assert.equal(await service.getProductBySlug("missing-product"), null);
});

test("missing Storefront Product invokes notFound", async () => {
  const source = await pageSource();

  assert.match(source, /if \(!product\) notFound\(\)/);
  assert.doesNotMatch(source, /getDraftCatalogProduct|getPublishedProduct/);
});

test("specifications use the universal ProductSpecification component", async () => {
  const [source, specificationSource] = await Promise.all([
    pageSource(),
    readFile(specificationsPath, "utf8"),
  ]);

  assert.match(source, /buildProductDetailExperience/);
  assert.match(source, /<ProductSpecifications specifications=\{technicalSpecifications\}/);
  assert.match(specificationSource, /groupSpecifications\(specifications\)/);
  assert.match(specificationSource, /specification\.group/);
  assert.match(specificationSource, /specification\.label/);
  assert.match(specificationSource, /specification\.value/);
  assert.match(specificationSource, /specification\.unit/);
});

test("documents expose only ProductDocument public fields", async () => {
  const [source, documentSource] = await Promise.all([
    pageSource(),
    readFile(documentsPath, "utf8"),
  ]);

  assert.match(source, /<ProductDocuments documents=\{experience\.documents\}/);
  assert.match(documentSource, /document\.title/);
  assert.match(documentSource, /document\.kind/);
  assert.match(documentSource, /document\.language/);
  assert.match(documentSource, /document\.publicUrl/);
  assert.doesNotMatch(documentSource, /document\.sha256|artifactPath|documentVersion/i);
});

test("compatibility uses ProductCompatibility without evidence", async () => {
  const source = await pageSource();

  assert.match(source, /product\.compatibility/);
  assert.match(source, /item\.label/);
  assert.match(source, /item\.note/);
  assert.doesNotMatch(source, /evidence|provenance/i);
});

test("relatedProductIds are resolved through ProductService", async () => {
  const filesystemRepository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  const products = (await filesystemRepository.getActiveProducts()).map((product) => ({
    ...product,
    relatedProductIds: [...product.relatedProductIds],
  }));
  const primary = products.find(({ slug }) => slug === "fs510") as Product;
  const related = products.find(
    ({ slug }) => slug === "ambu-vivasight-2-dlt",
  ) as Product;
  primary.relatedProductIds = [related.id];

  const repository: CatalogRepository = {
    getProducts: async () => products,
    getActiveProducts: async () => products,
    getProductBySlug: async (slug) =>
      products.find((product) => product.slug === slug) ?? null,
    getProductsByManufacturer: async () => [],
    getProductsByCategory: async () => [],
    getFeaturedProducts: async () => [],
    getManufacturers: async () => [],
    getManufacturerBySlug: async () => null,
    getCategories: async () => [],
    getCategoryBySlug: async () => null,
    searchProducts: async () => [],
    getCatalogSummary: () => filesystemRepository.getCatalogSummary(),
  };
  const service = new ProductService(repository);

  assert.deepEqual(
    (await service.getRelatedProducts(primary)).map(({ slug }) => slug),
    ["ambu-vivasight-2-dlt"],
  );
  assert.match(await pageSource(), /productService\.getRelatedProducts\(product\)/);
});

test("product detail has no publication or draft catalog imports", async () => {
  const source = await pageSource();

  assert.doesNotMatch(source, /lib\/published-catalog/);
  assert.doesNotMatch(source, /lib\/catalog-drafts/);
  assert.doesNotMatch(source, /data\/public|data\/research|supabase/i);
});

test("metadata is generated from Storefront Product", async () => {
  const source = await pageSource();

  assert.match(source, /title: `\$\{product\.name\}/);
  assert.match(source, /description: presentation\.shortDescription/);
  assert.match(source, /canonical: `\/catalog\/\$\{product\.slug\}`/);
  assert.match(source, /product\.media\.find\(\(\{ type \}\) => type === "image"\)/);
  assert.match(source, /image: image \? \{ url: image\.url, alt: image\.alt \} : undefined/);
});

test("Ambu VivaSight image is catalog-ready and available to catalog and product UI", async () => {
  const repository = new FilesystemCatalogRepository(
    resolve(root, "data/storefront"),
  );
  const product = await repository.getProductBySlug("ambu-vivasight-2-dlt");
  assert.ok(product);
  const image = product.media.find(({ type }) => type === "image");

  assert.deepEqual(image, {
    type: "image",
    url: "/products/ambu-vivasight-2-dlt/photo.jpg",
    alt: "Ambu VivaSight 2 DLT, подключённая к монитору Ambu aView 2 Advance",
    position: 10,
  });
  await access(resolve(root, "public", image.url.slice(1)));

  const [productPage, catalogExplorer] = await Promise.all([
    pageSource(),
    readFile(resolve(root, "components/catalog/CatalogExplorer.tsx"), "utf8"),
  ]);
  assert.match(productPage, /media=\{experience\.media\}/u);
  assert.match(catalogExplorer, /product\.media\.find/u);
});

test("product hero uses a media-first 40/60 layout with catalog details", async () => {
  const source = await pageSource();

  assert.match(source, /data-testid="product-hero"/);
  assert.match(
    source,
    /lg:grid-cols-\[minmax\(0,40fr\)_minmax\(0,60fr\)\]/,
  );
  assert.match(source, /<ProductGallery/);
  assert.match(source, /label="Регистрационное удостоверение"/);
  assert.match(source, /<dt className="sr-only">Модель<\/dt>/);
  assert.doesNotMatch(source, /Модель \/ артикул/);
  assert.doesNotMatch(source, /label="Статус"/);
  assert.match(source, /presentation\.statusLabel/);
  assert.match(source, /aria-label="Ключевая информация о товаре"/);
  assert.match(source, /experience\.badges\.map/);
});

test("product detail has one hierarchy and ordered content sections", async () => {
  const source = await pageSource();
  const sectionMarkers = [
    'title="Описание"',
    'title="Преимущества"',
    'title="Технические характеристики"',
    'title="Комплектация"',
    'title="Документы"',
    'title="Связанные товары"',
  ];

  for (let index = 1; index < sectionMarkers.length; index += 1) {
    assert.ok(
      source.indexOf(sectionMarkers[index - 1]) <
        source.indexOf(sectionMarkers[index]),
      `${sectionMarkers[index - 1]} must precede ${sectionMarkers[index]}`,
    );
  }
  assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
  assert.doesNotMatch(source, /title="Изделие"|>Изделие</);
  assert.doesNotMatch(source, /title="Основная информация"|>Product</);
});

test("product page remains server-rendered while gallery owns the client boundary", async () => {
  const [source, gallerySource] = await Promise.all([
    pageSource(),
    readFile(galleryPath, "utf8"),
  ]);

  assert.match(source, /aria-label="Разделы карточки товара"/);
  for (const anchor of [
    "#description",
    "#advantages",
    "#specifications",
    "#documents",
  ]) {
    assert.match(source, new RegExp(`\\["${anchor.slice(1)}"`, "u"));
  }
  assert.doesNotMatch(source, /["']use client["']/);
  assert.match(gallerySource, /^"use client";/);
  assert.match(gallerySource, /preload/);
  assert.match(gallerySource, /event\.key === "Escape"/);
  assert.match(gallerySource, /event\.key === "ArrowLeft"/);
  assert.match(gallerySource, /event\.key === "ArrowRight"/);
  assert.match(gallerySource, /onTouchStart/);
  assert.match(gallerySource, /onTouchEnd/);
  assert.doesNotMatch(gallerySource, /target="_blank"/);
});

test("product detail experience limits commercial content without mutating Product", async () => {
  const repository = new FilesystemCatalogRepository(resolve(root, "data/storefront"));
  const [product, manufacturers, categories] = await Promise.all([
    repository.getProductBySlug("fs510"),
    repository.getManufacturers(),
    repository.getCategories(),
  ]);
  assert.ok(product);
  const original = structuredClone(product);
  const experience = buildProductDetailExperience({
    product,
    manufacturer: manufacturers.find(({ id }) => id === product.manufacturerId),
    category: categories.find(({ id }) => id === product.categoryId),
  });

  assert.ok(experience.summary);
  assert.ok(experience.summary.length >= 400);
  assert.ok(experience.summary.length <= 700);
  assert.ok(experience.description);
  assert.ok(experience.advantages.length <= 6);
  assert.ok(experience.specifications.length <= 15);
  assert.ok(experience.badges.some(({ label }) => label === "Производитель"));
  assert.ok(experience.badges.some(({ label }) => label === "Страна"));
  assert.deepEqual(product, original);
});

test("manufacturer block has a public profile CTA and a fail-closed placeholder", async () => {
  const source = await readFile(
    resolve(root, "components/catalog/ProductManufacturer.tsx"),
    "utf8",
  );

  assert.match(source, /Все товары производителя/);
  assert.match(source, /manufacturer\.shortDescription/);
  assert.match(source, /formatCountryForPublic\(manufacturer\.country\)/);
  assert.match(source, /manufacturer\.logoUrl/);
  assert.match(source, /product-manufacturer-placeholder/);
});
