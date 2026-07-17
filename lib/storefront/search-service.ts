import type { CatalogRepository } from "./catalog-repository.ts";

export class SearchService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  searchProducts(query: string) {
    return this.repository.searchProducts(query);
  }
}
