import {
  CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID,
  CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID,
  type Product,
} from "./types.ts";

export function isProductCommerciallyReady(product: Product): boolean {
  if (product.catalogQualityStatus === "REQUIRES_EDITOR_REVIEW") return false;
  return product.manufacturerId !== CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID &&
    product.categoryId !== CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID &&
    Boolean(product.model.trim()) &&
    product.model !== "Не указан";
}
