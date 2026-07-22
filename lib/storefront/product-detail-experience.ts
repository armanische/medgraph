import type {
  Category,
  Manufacturer,
  Product,
  ProductDocument,
  ProductMedia,
  ProductRegistration,
  ProductSpecification,
} from "./types.ts";
import { formatCountryForPublic } from "./country-presentation.ts";

export interface ProductDetailBadge {
  label: string;
  value: string;
}

export interface ProductDetailExperience {
  summary: string | null;
  description: string | null;
  advantages: readonly string[];
  specifications: readonly ProductSpecification[];
  media: readonly ProductMedia[];
  manufacturer: Manufacturer | null;
  country: string | null;
  category: Category | null;
  applicationAreas: readonly string[];
  documents: readonly ProductDocument[];
  registrations: readonly ProductRegistration[];
  badges: readonly ProductDetailBadge[];
  optionalContent: {
    video: ProductMedia | null;
    officialManufacturerWebsite: string | null;
    accessories: readonly ProductDocument[];
    consumables: readonly ProductDocument[];
  };
}

const TECHNICAL_METADATA_LABELS = new Set([
  "артикул",
  "категория",
  "модель",
  "производитель",
  "регистрационное удостоверение",
  "страна производства",
  "тип товара",
]);

const PATIENT_LABELS = new Set([
  "возрастная категория пациентов",
  "группа пациентов",
  "категория пациентов",
  "пациенты",
]);

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function conciseText(value: string | null | undefined, maxLength = 720) {
  if (!value) return null;
  const normalized = plainText(value);
  if (!normalized) return null;
  if (normalized.length <= maxLength) return normalized;
  const shortened = normalized.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > maxLength * 0.75 ? lastSpace : maxLength).trim()}…`;
}

function summaryText(value: string | null | undefined) {
  const normalized = value ? plainText(value) : "";
  if (!normalized) return null;

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
  const summary = sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");

  return conciseText(summary, 480);
}

function sourceListItems(value: string | null | undefined) {
  if (!value) return [];
  return [...value.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/giu)]
    .map((match) => plainText(match[1] ?? ""))
    .filter((item) => item.length >= 6 && item.length <= 220);
}

function derivedAdvantages(product: Product) {
  const candidates = product.keyFeatures.length > 0
    ? product.keyFeatures
    : sourceListItems(product.description);
  return [...new Set(candidates.map((item) => conciseText(item, 150)).filter(Boolean))]
    .slice(0, 6) as string[];
}

function derivedSpecifications(product: Product) {
  if (product.specifications.some(isTechnicalProductSpecification)) {
    return product.specifications
      .filter(isTechnicalProductSpecification)
      .sort((left, right) => left.position - right.position)
      .slice(0, 15);
  }

  const advantageCount = derivedAdvantages(product).length;
  return sourceListItems(product.description)
    .slice(advantageCount)
    .map((item, position): ProductSpecification | null => {
      const separator = item.indexOf(":");
      if (separator < 2 || separator > 80) return null;
      const label = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      if (!value || value.length > 240) return null;
      return { group: "Основные параметры", label, value, unit: null, position };
    })
    .filter((item): item is ProductSpecification => item !== null)
    .slice(0, 15);
}

function normalizeLabel(label: string) {
  return label.trim().toLocaleLowerCase("ru-RU").replace(/\s+/gu, " ");
}

function findSpecificationValue(
  specifications: readonly ProductSpecification[],
  labels: ReadonlySet<string>,
) {
  const specification = specifications.find(({ label }) =>
    labels.has(normalizeLabel(label)),
  );
  if (!specification) return null;
  return `${specification.value}${specification.unit ? ` ${specification.unit}` : ""}`;
}

export function isTechnicalProductSpecification(
  specification: ProductSpecification,
) {
  return !TECHNICAL_METADATA_LABELS.has(normalizeLabel(specification.label));
}

export function buildProductDetailExperience({
  product,
  manufacturer,
  category,
}: {
  product: Product;
  manufacturer?: Manufacturer;
  category?: Category;
}): ProductDetailExperience {
  const technicalSpecifications = derivedSpecifications(product);
  const patientCategory = findSpecificationValue(
    product.specifications,
    PATIENT_LABELS,
  );
  const primaryApplicationArea = product.applicationAreas[0] ?? null;
  const publicCountry = formatCountryForPublic(manufacturer?.country);
  const badges: ProductDetailBadge[] = [];

  if (manufacturer?.name) badges.push({ label: "Производитель", value: manufacturer.name });
  if (publicCountry) badges.push({ label: "Страна", value: publicCountry });
  if (primaryApplicationArea) {
    badges.push({ label: "Применение", value: primaryApplicationArea });
  }
  if (patientCategory) badges.push({ label: "Пациенты", value: patientCategory });
  if (category?.name) {
    badges.push({ label: "Категория", value: category.name });
  }

  return {
    summary: summaryText(product.shortDescription || product.description),
    description: product.description || product.shortDescription || null,
    advantages: derivedAdvantages(product),
    specifications: technicalSpecifications,
    media: [...product.media].sort((left, right) => left.position - right.position),
    manufacturer: manufacturer ?? null,
    country: publicCountry,
    category: category ?? null,
    applicationAreas: product.applicationAreas,
    documents: product.documents,
    registrations: product.registrationRecords ?? [],
    badges,
    optionalContent: {
      video: product.media.find(({ type }) => type === "video") ?? null,
      officialManufacturerWebsite: manufacturer?.websiteUrl ?? null,
      accessories: product.documents.filter(({ kind }) => kind === "accessories"),
      consumables: product.documents.filter(({ kind }) => kind === "compatibility"),
    },
  };
}
