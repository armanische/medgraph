import type { CatalogRepository } from "./catalog-repository.ts";
import { PUBLIC_PRODUCT_STATUSES, type Product } from "./types.ts";

export class ProductService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  getProducts() {
    return this.repository.getActiveProducts();
  }

  getActiveProducts() {
    return this.repository.getActiveProducts();
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = await this.repository.getProductBySlug(slug);
    return product && PUBLIC_PRODUCT_STATUSES.has(product.status) ? product : null;
  }

  async getProductsByManufacturer(manufacturerId: string) {
    const products = await this.repository.getProductsByManufacturer(manufacturerId);
    return products.filter(({ status }) => PUBLIC_PRODUCT_STATUSES.has(status));
  }

  async getProductsByCategory(categoryId: string) {
    const products = await this.repository.getProductsByCategory(categoryId);
    return products.filter(({ status }) => PUBLIC_PRODUCT_STATUSES.has(status));
  }

  getFeaturedProducts() {
    return this.repository.getFeaturedProducts();
  }
}
