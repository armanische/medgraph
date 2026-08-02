import type { Product } from "./types.ts";
import { PUBLIC_PRODUCT_STATUSES } from "./types.ts";

export const FEATURED_PRODUCT_IDS = [
  "e66a1165-030b-4aa4-a400-959f1ac70fe3",
  "00e3f62b-797b-40ff-bf9f-9d1750828ca4",
  "b7f07e3e-5cdd-4988-b2a4-423bed321f46",
  "224ee705-5dea-429f-ab10-1ef9153e94fc",
  "cb139c6c-5cbc-4dc0-aa80-3114856d3dd1",
  "79b6082c-b63e-4c8e-9769-36383747b57b",
  "ae1e448d-f266-4d5d-9d42-e2c22a2d54c8",
  "48f7d071-c8e4-4bc9-96c4-fc12672ca183",
] as const;

/**
 * Resolves the Product Owner-approved homepage selection against the already
 * validated public catalog. Missing or non-public entries are omitted and are
 * never replaced with draft or arbitrary products.
 */
export function selectPublishedFeaturedProducts(
  products: readonly Product[],
): Product[] {
  const publicProductsById = new Map(
    products
      .filter((product) => PUBLIC_PRODUCT_STATUSES.has(product.status))
      .map((product) => [product.id, product]),
  );

  return FEATURED_PRODUCT_IDS.flatMap((productId) => {
    const product = publicProductsById.get(productId);
    return product ? [product] : [];
  });
}
