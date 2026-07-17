import type { CatalogRepository } from "./catalog-repository.ts";
import type { Manufacturer } from "./types.ts";

export class ManufacturerService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  async getManufacturers(): Promise<readonly Manufacturer[]> {
    const manufacturers = await this.repository.getManufacturers();
    return manufacturers.filter(({ status }) => status === "active");
  }

  async getManufacturerBySlug(slug: string): Promise<Manufacturer | null> {
    const manufacturer = await this.repository.getManufacturerBySlug(slug);
    return manufacturer?.status === "active" ? manufacturer : null;
  }
}
