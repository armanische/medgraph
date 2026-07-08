import { manufacturers } from "@/data/manufacturers";
import { products } from "@/data/products";
import {
  getDraftCatalogProducts,
  getDraftCatalogGeneratedAt,
} from "@/lib/catalog-drafts";

export function getPlatformStats() {
  const draftProducts = getDraftCatalogProducts();
  const categories = new Set(
    draftProducts.map((product) => product.category).filter(Boolean),
  );

  return {
    devices: draftProducts.length,
    manufacturers: manufacturers.length,
    categories: categories.size,
    publishedRecords: products.length,
    researchItems: draftProducts.length,
    lastDataUpdate: getDraftCatalogGeneratedAt(),
  };
}
