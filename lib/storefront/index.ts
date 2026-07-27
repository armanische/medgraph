import "server-only";

import { CategoryService } from "./category-service.ts";
import { createCatalogRepositoryForSource } from "./catalog-repository-factory.server.ts";
import { CompareService } from "./compare-service.ts";
import { getStorefrontDataSource } from "./data-source.ts";
import { ManufacturerService } from "./manufacturer-service.ts";
import { ProductService } from "./product-service.ts";
import { SearchService } from "./search-service.ts";
import { PUBLIC_PRODUCT_STATUSES } from "./types.ts";

export type { CatalogRepository } from "./catalog-repository.ts";
export { CategoryService } from "./category-service.ts";
export { CompareService } from "./compare-service.ts";
export {
  getStorefrontDataSource,
  isCloudPublishedCatalog,
  isCloudPreviewCatalog,
  type StorefrontDataSource,
} from "./data-source.ts";
export { ManufacturerService } from "./manufacturer-service.ts";
export { ProductService } from "./product-service.ts";
export { SearchService } from "./search-service.ts";
export {
  buildStorefrontSitemap,
  buildStorefrontSitemapFromCatalog,
  STOREFRONT_SITE_URL,
} from "./storefront-sitemap.ts";
export * from "./schemas.ts";
export * from "./types.ts";
export * from "./product-quality.ts";
export type {
  ComparisonSpecificationCell,
  ComparisonTableRow,
  ProductComparison,
} from "./compare-service.ts";

export const storefrontDataSource = getStorefrontDataSource();
export const catalogRepository = await createCatalogRepositoryForSource(storefrontDataSource);
const visibleProductStatuses = storefrontDataSource === "cloud_preview"
  ? new Set([...PUBLIC_PRODUCT_STATUSES, "preview_draft"] as const)
  : PUBLIC_PRODUCT_STATUSES;
export const productService = new ProductService(catalogRepository, visibleProductStatuses);
export const compareService = new CompareService(productService);
export const manufacturerService = new ManufacturerService(catalogRepository);
export const categoryService = new CategoryService(catalogRepository);
export const searchService = new SearchService(catalogRepository);
