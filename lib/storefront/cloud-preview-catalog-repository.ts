import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "../supabase/index.ts";
import type { CatalogRepository } from "./catalog-repository.ts";
import {
  mapCloudPreviewSnapshot,
  type CloudPreviewCatalogSnapshot,
} from "./cloud-preview-mapper.ts";
import { filterProductsForSearch } from "./search-service.ts";

type SnapshotLoader = () => Promise<CloudPreviewCatalogSnapshot>;

async function requestCloudPreviewSnapshot(): Promise<CloudPreviewCatalogSnapshot> {
  const response = await createSupabaseServerClient({ access: "service_role" }).request(
    "/rest/v1/rpc/cloud_storefront_preview_catalog",
    {
      method: "POST",
      headers: {
        "Accept-Profile": "cloud_api",
        "Content-Profile": "cloud_api",
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );
  return response.json() as Promise<CloudPreviewCatalogSnapshot>;
}

export const loadCloudPreviewSnapshot = cache(requestCloudPreviewSnapshot);

export class CloudPreviewCatalogRepository implements CatalogRepository {
  private readonly loadSnapshot: SnapshotLoader;

  constructor(loadSnapshot: SnapshotLoader = loadCloudPreviewSnapshot) {
    this.loadSnapshot = loadSnapshot;
  }

  private async load() {
    return mapCloudPreviewSnapshot(await this.loadSnapshot());
  }

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
    const [products, manufacturers, categories] = await Promise.all([
      this.getProducts(), this.getManufacturers(), this.getCategories(),
    ]);
    return filterProductsForSearch(products, query, manufacturers, categories);
  }
  async getCatalogSummary() { return (await this.load()).summary; }
}
