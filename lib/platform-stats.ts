import { manufacturers } from "@/data/manufacturers";
import { products } from "@/data/products";
import {
  getDraftCatalogProducts,
  getDraftCatalogGeneratedAt,
} from "@/lib/catalog-drafts";
import { getCatalogCardsWithFallback, getPublishedCatalog } from "@/lib/published-catalog";

export function getPlatformStats() {
  const draftProducts = getDraftCatalogProducts();
  const catalogProducts = getCatalogCardsWithFallback();
  const published = getPublishedCatalog();
  const categories = new Set(
    catalogProducts.map((product) => product.category).filter(Boolean),
  );

  return {
    devices: catalogProducts.length,
    manufacturers: new Set([
      ...manufacturers.map((manufacturer) => manufacturer.slug),
      ...published.manufacturers.map((manufacturer) => manufacturer.slug),
    ]).size,
    categories: categories.size,
    publishedRecords: published.products.length || products.length,
    researchItems: draftProducts.length,
    lastDataUpdate: getDraftCatalogGeneratedAt(),
  };
}
