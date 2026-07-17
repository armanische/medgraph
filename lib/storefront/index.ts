import "server-only";

import { CategoryService } from "./category-service.ts";
import { CompareService } from "./compare-service.ts";
import { FilesystemCatalogRepository } from "./filesystem-catalog-repository.ts";
import { ManufacturerService } from "./manufacturer-service.ts";
import { ProductService } from "./product-service.ts";
import { SearchService } from "./search-service.ts";

export type { CatalogRepository } from "./catalog-repository.ts";
export { CategoryService } from "./category-service.ts";
export { CompareService } from "./compare-service.ts";
export { FilesystemCatalogRepository } from "./filesystem-catalog-repository.ts";
export { ManufacturerService } from "./manufacturer-service.ts";
export { ProductService } from "./product-service.ts";
export { SearchService } from "./search-service.ts";
export {
  buildStorefrontSitemap,
  STOREFRONT_SITE_URL,
} from "./storefront-sitemap.ts";
export * from "./schemas.ts";
export * from "./types.ts";
export type {
  ComparisonSpecificationCell,
  ComparisonTableRow,
  ProductComparison,
} from "./compare-service.ts";

export const catalogRepository = new FilesystemCatalogRepository();
export const productService = new ProductService(catalogRepository);
export const compareService = new CompareService(productService);
export const manufacturerService = new ManufacturerService(catalogRepository);
export const categoryService = new CategoryService(catalogRepository);
export const searchService = new SearchService(catalogRepository);
