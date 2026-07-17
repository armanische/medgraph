import type { CatalogRepository } from "./catalog-repository.ts";
import type { Category } from "./types.ts";

export class CategoryService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  async getCategories(): Promise<readonly Category[]> {
    const categories = await this.repository.getCategories();
    return categories.filter(({ status }) => status === "active");
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const category = await this.repository.getCategoryBySlug(slug);
    return category?.status === "active" ? category : null;
  }
}
