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
  return [...new Set(candidates.map(compactAdvantage).filter(Boolean))]
    .slice(0, 6) as string[];
}

function compactAdvantage(value: string) {
  const normalized = plainText(value).replace(/[.;]+$/gu, "");
  const separator = normalized.indexOf(":");
  const headline = separator >= 2 && separator <= 72
    ? normalized.slice(0, separator)
    : normalized.split(/[.!?]/u)[0] ?? normalized;
  return conciseText(headline, 72);
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

function sentenceList(values: readonly string[]) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0] ?? "";
  return `${values.slice(0, -1).join(", ")} и ${values.at(-1)}`;
}

function productSummary({
  product,
  manufacturer,
  category,
  advantages,
  specifications,
}: {
  product: Product;
  manufacturer?: Manufacturer;
  category?: Category;
  advantages: readonly string[];
  specifications: readonly ProductSpecification[];
}) {
  const categoryName = category?.name ?? "Медицинское оборудование";
  const manufacturerName = manufacturer?.name ? ` производителя ${manufacturer.name}` : "";
  const sentences = [
    `${product.name} — медицинское изделие категории «${categoryName}»${manufacturerName}.`,
    product.applicationAreas.length > 0
      ? `Изделие предназначено для таких областей, как ${sentenceList(product.applicationAreas.slice(0, 3))}.`
      : "Назначение изделия раскрывается через его основные функции и технические параметры.",
    advantages.length > 0
      ? `Ключевые особенности модели: ${sentenceList(advantages.slice(0, 4).map((item) => item.toLocaleLowerCase("ru-RU")))}.`
      : "Основные возможности собраны в карточке без смешивания с внутренними данными каталога.",
    specifications.length > 0
      ? `В технической части отдельно раскрываются ${sentenceList(specifications.slice(0, 3).map(({ label }) => label.toLocaleLowerCase("ru-RU")))}.`
      : "Технические сведения показаны ниже в структурированном виде по мере их наличия.",
    "Полное описание сохранено отдельным разделом, чтобы можно было быстро понять назначение изделия, а затем перейти к деталям, документам и данным производителя.",
  ];
  const summary = sentences.reduce((current, sentence) => {
    const candidate = current ? `${current} ${sentence}` : sentence;
    return candidate.length <= 640 || current.length < 400 ? candidate : current;
  }, "");
  return conciseText(summary, 700);
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
  const primaryApplicationArea = product.applicationAreas[0] ?? null;
  const publicCountry = formatCountryForPublic(manufacturer?.country);
  const badges: ProductDetailBadge[] = [];

  if (manufacturer?.name) badges.push({ label: "Производитель", value: manufacturer.name });
  if (publicCountry) badges.push({ label: "Страна", value: publicCountry });
  if (primaryApplicationArea) {
    badges.push({ label: "Применение", value: primaryApplicationArea });
  }
  if (category?.name) {
    badges.push({ label: "Категория", value: category.name });
  }

  return {
    summary: productSummary({
      product,
      manufacturer,
      category,
      advantages: derivedAdvantages(product),
      specifications: technicalSpecifications,
    }),
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
