import type { CatalogRepository } from "./catalog-repository.ts";
import { PUBLIC_PRODUCT_STATUSES, type Product } from "./types.ts";

export class ProductService {
  private readonly repository: CatalogRepository;
  private readonly visibleStatuses: ReadonlySet<Product["status"]>;

  constructor(
    repository: CatalogRepository,
    visibleStatuses: ReadonlySet<Product["status"]> = PUBLIC_PRODUCT_STATUSES,
  ) {
    this.repository = repository;
    this.visibleStatuses = visibleStatuses;
  }

  getProducts() {
    return this.repository.getActiveProducts();
  }

  getActiveProducts() {
    return this.repository.getActiveProducts();
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = await this.repository.getProductBySlug(slug);
    return product && this.visibleStatuses.has(product.status) ? product : null;
  }

  async getProductsByManufacturer(manufacturerId: string) {
    const products = await this.repository.getProductsByManufacturer(manufacturerId);
    return products.filter(({ status }) => this.visibleStatuses.has(status));
  }

  async getProductsByCategory(categoryId: string) {
    const products = await this.repository.getProductsByCategory(categoryId);
    return products.filter(({ status }) => this.visibleStatuses.has(status));
  }

  async getRelatedProducts(product: Pick<Product, "relatedProductIds">) {
    if (product.relatedProductIds.length === 0) return [];

    const products = await this.repository.getActiveProducts();
    const productsById = new Map(products.map((item) => [item.id, item]));
    return product.relatedProductIds.flatMap((id) => {
      const relatedProduct = productsById.get(id);
      return relatedProduct ? [relatedProduct] : [];
    });
  }

  getFeaturedProducts() {
    return this.repository.getFeaturedProducts();
  }
}
