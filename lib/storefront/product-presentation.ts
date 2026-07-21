import { isProductCommerciallyReady } from "./product-quality.ts";
import type { Product } from "./types.ts";

export const PRODUCT_PRESENTATION_FALLBACKS = {
  category: "Данные уточняются",
  country: "Страна не указана",
  manufacturer: "Производитель не указан",
  media: "Изображение отсутствует",
  model: "Модель не указана",
  registration: "Регистрационные данные отсутствуют",
} as const;

const PLACEHOLDER_TEXTS = new Set([
  "",
  "не добавлено",
  "не указана",
  "не указан",
  "описание добавляется",
  "описание добавляется.",
  "описание категории уточняется",
  "описание категории уточняется.",
  "описание производителя уточняется",
  "описание производителя уточняется.",
]);

export type ProductPresentationState = "commercial_ready" | "information_incomplete";

export interface ProductPresentationContext {
  categoryName?: string | null;
  country?: string | null;
  manufacturerName?: string | null;
}

export interface ProductPresentation {
  state: ProductPresentationState;
  canCompare: boolean;
  canRequestQuote: boolean;
  statusLabel: string;
  category: string | null;
  country: string | null;
  manufacturer: string | null;
  model: string | null;
  categoryLabel: string;
  countryLabel: string;
  manufacturerLabel: string;
  modelLabel: string;
  shortDescription: string | null;
  description: string | null;
  mediaFallbackLabel: string;
  sections: {
    advantages: boolean;
    compatibility: boolean;
    description: boolean;
    documents: boolean;
    package: boolean;
    relatedProducts: boolean;
    specifications: boolean;
  };
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function publicOptionalText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = plainText(value).toLocaleLowerCase("ru-RU");
  return PLACEHOLDER_TEXTS.has(normalized) ? null : value.trim();
}

function publicLabel(
  value: string | null | undefined,
  fallback: string,
) {
  return publicOptionalText(value) ?? fallback;
}

export function getProductPresentation(
  product: Product,
  context: ProductPresentationContext = {},
): ProductPresentation {
  const commercialReady = isProductCommerciallyReady(product);
  const shortDescriptionSource = publicOptionalText(product.shortDescription);
  const shortDescription = shortDescriptionSource
    ? plainText(shortDescriptionSource)
    : null;
  const description = publicOptionalText(product.description) ?? shortDescription;
  const category = publicOptionalText(context.categoryName);
  const country = publicOptionalText(context.country);
  const manufacturer = publicOptionalText(context.manufacturerName);
  const model = publicOptionalText(product.model);

  return {
    state: commercialReady ? "commercial_ready" : "information_incomplete",
    canCompare: commercialReady,
    canRequestQuote: commercialReady,
    statusLabel: commercialReady
      ? "Доступно для запроса"
      : "Информация о товаре уточняется",
    category,
    country,
    manufacturer,
    model,
    categoryLabel: publicLabel(
      category,
      PRODUCT_PRESENTATION_FALLBACKS.category,
    ),
    countryLabel:
      country ??
      PRODUCT_PRESENTATION_FALLBACKS.country,
    manufacturerLabel: publicLabel(
      manufacturer,
      PRODUCT_PRESENTATION_FALLBACKS.manufacturer,
    ),
    modelLabel: publicLabel(model, PRODUCT_PRESENTATION_FALLBACKS.model),
    shortDescription,
    description,
    mediaFallbackLabel: PRODUCT_PRESENTATION_FALLBACKS.media,
    sections: {
      advantages: product.keyFeatures.length > 0,
      compatibility: product.compatibility.length > 0,
      description: description !== null || product.applicationAreas.length > 0,
      documents: product.documents.length > 0,
      package: product.documents.some(({ kind }) => kind === "accessories"),
      relatedProducts: product.relatedProductIds.length > 0,
      specifications: product.specifications.length > 0,
    },
  };
}
