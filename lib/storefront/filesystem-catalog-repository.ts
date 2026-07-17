import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { CatalogRepository } from "./catalog-repository.ts";
import { filterProductsForSearch } from "./search-service.ts";
import { validateStorefrontCatalog } from "./schemas.ts";
import {
  PUBLIC_PRODUCT_STATUSES,
  type CatalogSummary,
  type Category,
  type Manufacturer,
  type Product,
  type StorefrontCatalog,
} from "./types.ts";

export const DEFAULT_STOREFRONT_CATALOG_ROOT = resolve(
  process.cwd(),
  "data/storefront",
);

function byName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, "ru-RU");
}

function byCategoryPosition(left: Category, right: Category) {
  return left.position - right.position || byName(left, right);
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read storefront JSON "${path}": ${reason}`);
  }
}

async function readJsonDirectory(path: string): Promise<unknown[]> {
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read storefront directory "${path}": ${reason}`);
  }

  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

  return Promise.all(jsonFiles.map((fileName) => readJson(join(path, fileName))));
}

/**
 * Filesystem implementation for the Git-backed catalog.
 * This module imports node:fs and must only be consumed from server code.
 */
export class FilesystemCatalogRepository implements CatalogRepository {
  private catalogPromise: Promise<StorefrontCatalog> | null = null;
  private readonly rootDirectory: string;

  constructor(rootDirectory = DEFAULT_STOREFRONT_CATALOG_ROOT) {
    this.rootDirectory = rootDirectory;
  }

  private loadCatalog() {
    this.catalogPromise ??= Promise.all([
      readJsonDirectory(join(this.rootDirectory, "products")),
      readJsonDirectory(join(this.rootDirectory, "manufacturers")),
      readJsonDirectory(join(this.rootDirectory, "categories")),
      readJson(join(this.rootDirectory, "catalog-summary.json")),
    ]).then(([products, manufacturers, categories, summary]) =>
      validateStorefrontCatalog({ products, manufacturers, categories, summary }),
    );
    return this.catalogPromise;
  }

  async getProducts(): Promise<readonly Product[]> {
    const catalog = await this.loadCatalog();
    return [...catalog.products].sort(byName);
  }

  async getActiveProducts(): Promise<readonly Product[]> {
    const products = await this.getProducts();
    return products.filter(({ status }) => PUBLIC_PRODUCT_STATUSES.has(status));
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find((product) => product.slug === slug) ?? null;
  }

  async getProductsByManufacturer(manufacturerId: string): Promise<readonly Product[]> {
    const products = await this.getProducts();
    return products.filter((product) => product.manufacturerId === manufacturerId);
  }

  async getProductsByCategory(categoryId: string): Promise<readonly Product[]> {
    const products = await this.getProducts();
    return products.filter((product) => product.categoryId === categoryId);
  }

  async getFeaturedProducts(): Promise<readonly Product[]> {
    const products = await this.getActiveProducts();
    return products.filter((product) => product.featured);
  }

  async getManufacturers(): Promise<readonly Manufacturer[]> {
    const catalog = await this.loadCatalog();
    return [...catalog.manufacturers].sort(byName);
  }

  async getManufacturerBySlug(slug: string): Promise<Manufacturer | null> {
    const manufacturers = await this.getManufacturers();
    return manufacturers.find((manufacturer) => manufacturer.slug === slug) ?? null;
  }

  async getCategories(): Promise<readonly Category[]> {
    const catalog = await this.loadCatalog();
    return [...catalog.categories].sort(byCategoryPosition);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((category) => category.slug === slug) ?? null;
  }

  async searchProducts(query: string): Promise<readonly Product[]> {
    const [products, manufacturers, categories] = await Promise.all([
      this.getActiveProducts(),
      this.getManufacturers(),
      this.getCategories(),
    ]);
    return filterProductsForSearch(products, query, manufacturers, categories);
  }

  async getCatalogSummary(): Promise<CatalogSummary> {
    const catalog = await this.loadCatalog();
    return catalog.summary;
  }
}
