import "server-only";

import type { CatalogRepository } from "./catalog-repository.ts";
import type { StorefrontDataSource } from "./data-source.ts";

/** Loads exactly one server repository implementation for the selected source. */
export async function createCatalogRepositoryForSource(
  source: StorefrontDataSource,
): Promise<CatalogRepository> {
  switch (source) {
    case "cloud_published": {
      const { CloudPublishedCatalogRepository } = await import(
        "./cloud-published-catalog-repository.ts"
      );
      return new CloudPublishedCatalogRepository();
    }
    case "cloud_preview": {
      const { CloudPreviewCatalogRepository } = await import(
        "./cloud-preview-catalog-repository.ts"
      );
      return new CloudPreviewCatalogRepository();
    }
    case "static": {
      const { FilesystemCatalogRepository } = await import(
        "./filesystem-catalog-repository.ts"
      );
      return new FilesystemCatalogRepository();
    }
  }

  throw new Error("Unsupported Storefront data source.");
}
