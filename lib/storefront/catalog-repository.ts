import type {
  CatalogSummary,
  Category,
  Manufacturer,
  Product,
} from "./types.ts";

/**
 * Storage-agnostic read contract for the storefront catalog.
 * Implementations may use the filesystem, Supabase, or a CMS.
 */
export interface CatalogRepository {
  getProducts(): Promise<readonly Product[]>;
  getActiveProducts(): Promise<readonly Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByManufacturer(manufacturerId: string): Promise<readonly Product[]>;
  getProductsByCategory(categoryId: string): Promise<readonly Product[]>;
  getFeaturedProducts(): Promise<readonly Product[]>;
  getManufacturers(): Promise<readonly Manufacturer[]>;
  getManufacturerBySlug(slug: string): Promise<Manufacturer | null>;
  getCategories(): Promise<readonly Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  searchProducts(query: string): Promise<readonly Product[]>;
  getCatalogSummary(): Promise<CatalogSummary>;
}
