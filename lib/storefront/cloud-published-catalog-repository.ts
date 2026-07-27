import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "../supabase/index.ts";
import type { CatalogRepository } from "./catalog-repository.ts";
import { mapCloudPublishedCatalogProjection } from "./cloud-published-mapper.ts";
import {
  CloudPublishedCatalogRepositoryError,
  loadValidatedPublishedCatalogProjection,
} from "./cloud-published-response.ts";
import { filterProductsForSearch } from "./search-service.ts";
import type { StorefrontCatalog } from "./types.ts";

type CatalogLoader = () => Promise<StorefrontCatalog>;

async function requestCloudPublishedCatalog(): Promise<StorefrontCatalog> {
  let client;
  try {
    client = createSupabaseServerClient({ access: "service_role" });
  } catch {
    throw new CloudPublishedCatalogRepositoryError("configuration");
  }

  const projection = await loadValidatedPublishedCatalogProjection(() => client.request(
    "/rest/v1/rpc/cloud_published_storefront_catalog_v1",
    {
      method: "POST",
      headers: {
        "Accept-Profile": "cloud_api",
        "Content-Profile": "cloud_api",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    },
  ));
  return mapCloudPublishedCatalogProjection(projection);
}

/** One transport/validation/mapping pass per React server request. */
export const loadCloudPublishedCatalog = cache(requestCloudPublishedCatalog);

export class CloudPublishedCatalogRepository implements CatalogRepository {
  private readonly loadCatalog: CatalogLoader;

  constructor(loadCatalog: CatalogLoader = loadCloudPublishedCatalog) {
    this.loadCatalog = loadCatalog;
  }

  private load() { return this.loadCatalog(); }
  async getProducts() { return (await this.load()).products; }
  async getActiveProducts() { return this.getProducts(); }
  async getProductBySlug(slug: string) {
    return (await this.getProducts()).find((product) => product.slug === slug) ?? null;
  }
  async getProductsByManufacturer(manufacturerId: string) {
    return (await this.getProducts()).filter((product) => product.manufacturerId === manufacturerId);
  }
  async getProductsByCategory(categoryId: string) {
    return (await this.getProducts()).filter((product) => product.categoryId === categoryId);
  }
  async getFeaturedProducts() { return []; }
  async getManufacturers() { return (await this.load()).manufacturers; }
  async getManufacturerBySlug(slug: string) {
    return (await this.getManufacturers()).find((manufacturer) => manufacturer.slug === slug) ?? null;
  }
  async getCategories() { return (await this.load()).categories; }
  async getCategoryBySlug(slug: string) {
    return (await this.getCategories()).find((category) => category.slug === slug) ?? null;
  }
  async searchProducts(query: string) {
    const catalog = await this.load();
    return filterProductsForSearch(
      catalog.products,
      query,
      catalog.manufacturers,
      catalog.categories,
    );
  }
  async getCatalogSummary() { return (await this.load()).summary; }
}
