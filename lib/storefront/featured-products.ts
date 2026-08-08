import type { Product } from "./types.ts";
import { PUBLIC_PRODUCT_STATUSES } from "./types.ts";

export const FEATURED_PRODUCTS = [
  { productId: "e66a1165-030b-4aa4-a400-959f1ac70fe3", slug: "767632362-330695211247-apparat-ivl-hamilton-t1" },
  { productId: "00e3f62b-797b-40ff-bf9f-9d1750828ca4", slug: "767632362-401374530532-apparat-ivl-mindray-sv300" },
  { productId: "b7f07e3e-5cdd-4988-b2a4-423bed321f46", slug: "767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia" },
  { productId: "224ee705-5dea-429f-ab10-1ef9153e94fc", slug: "767632362-725867191732-defibrillyator-monitor-mnogofunktsionaln" },
  { productId: "cb139c6c-5cbc-4dc0-aa80-3114856d3dd1", slug: "767632362-358648454622-uzi-apparat-ge-versana-premier-black" },
  { productId: "79b6082c-b63e-4c8e-9769-36383747b57b", slug: "767632362-571191341342-rentgenohirurgicheskii-apparat-tipa-s-du" },
  { productId: "ae1e448d-f266-4d5d-9d42-e2c22a2d54c8", slug: "767632362-601909099101-gemodializnii-apparat-iskusstvennaya-poc" },
  { productId: "48f7d071-c8e4-4bc9-96c4-fc12672ca183", slug: "767632362-446510199362-videoendoskopicheskaya-sistema-pentax-ep" },
] as const;

export const ENDOMARKET_STAGE_FEATURED_MODELS = [
  "EG-500",
  "EC-500T",
  "EB-500",
  "BR-1231",
  "ENDO CLEAN-1000",
  "ENDO CLEAN-2000",
  "EC-5BD",
  "iLivTouch",
  "VIO 3",
  "ARC 350",
] as const;

/**
 * Resolves the Product Owner-approved homepage selection against the already
 * validated public catalog. Missing or non-public entries are omitted and are
 * never replaced with draft or arbitrary products.
 */
export function selectPublishedFeaturedProducts(
  products: readonly Product[],
): Product[] {
  const publicProductsBySlug = new Map(
    products
      .filter((product) => PUBLIC_PRODUCT_STATUSES.has(product.status))
      .map((product) => [product.slug, product]),
  );

  return FEATURED_PRODUCTS.flatMap(({ slug }) => {
    const product = publicProductsBySlug.get(slug);
    return product ? [product] : [];
  });
}

/**
 * Resolves the Product Owner-approved EndoMarket Stage order. A candidate is
 * eligible only when its local, cleaned image exists; no fallback or arbitrary
 * replacement is introduced. The canonical published selector above remains
 * unchanged and continues to fail closed for Production.
 */
export function selectEndoMarketStageFeaturedProducts(
  products: readonly Product[],
  desiredCount = 8,
): Product[] {
  const eligibleByModel = new Map(
    products
      .filter((product) =>
        product.commercialPresentation?.source === "endomarket" &&
        product.media.some(({ type, url }) =>
          type === "image" && url.startsWith("/media/endomarket-wave1/"),
        ),
      )
      .map((product) => [product.model, product]),
  );

  return ENDOMARKET_STAGE_FEATURED_MODELS.flatMap((model) => {
    const product = eligibleByModel.get(model);
    return product ? [product] : [];
  }).slice(0, desiredCount);
}
