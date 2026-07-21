import {
  CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID,
  CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID,
  PRODUCT_DOCUMENT_KINDS,
  type CatalogSummary,
  type Category,
  type Manufacturer,
  type Product,
  type ProductDocument,
  type ProductDocumentKind,
  type ProductMedia,
  type ProductRegistration,
  type ProductSpecification,
} from "./types.ts";

export interface CloudReferenceRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  countryCode?: string | null;
  website?: string | null;
  position?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloudPreviewProductRow {
  id: string;
  slug: string;
  title: string;
  model: string | null;
  shortDescription: string | null;
  description: string | null;
  manufacturerId: string | null;
  categoryId: string | null;
  publicationStatus: string;
  published: boolean;
  reviewState: string;
  updatedAt: string;
  createdAt: string;
  applicationAreas: Array<{ id: string; name: string }>;
  characteristics: Array<{ name: string; value: string; unit: string | null }>;
  media: Array<{ url: string; role: string; format: string | null }>;
  documents: Array<{
    title: string;
    kind: string;
    publicUrl: string;
    language: string;
    isOfficial: boolean;
  }>;
  registrations: Array<{
    registrationNumber: string | null;
    status: string;
    sourceUrl: string | null;
  }>;
}

export interface CloudPreviewCatalogSnapshot {
  generatedAt: string;
  products: CloudPreviewProductRow[];
  manufacturers: CloudReferenceRow[];
  categories: CloudReferenceRow[];
  applicationAreas: CloudReferenceRow[];
}

function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function storefrontPlainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/giu, " ")
    .replace(/<\/p>|<\/li>|<\/h[1-6]>/giu, " ")
    .replace(/<[^>]+>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeDocumentKind(value: string): ProductDocumentKind {
  return (PRODUCT_DOCUMENT_KINDS as readonly string[]).includes(value)
    ? (value as ProductDocumentKind)
    : "other";
}

function mediaType(format: string | null, url: string): ProductMedia["type"] {
  return /video|mp4|webm|mov/iu.test(`${format ?? ""} ${url}`) ? "video" : "image";
}

function mapManufacturer(row: CloudReferenceRow): Manufacturer {
  const description = row.description?.trim() || "Описание производителя уточняется.";
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    country: row.countryCode?.trim() || "Страна не указана",
    shortDescription: storefrontPlainText(description),
    description,
    logoUrl: null,
    websiteUrl: safeHttpsUrl(row.website),
    status: "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCategory(row: CloudReferenceRow, index: number): Category {
  const description = row.description?.trim() || "Описание категории уточняется.";
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    shortDescription: storefrontPlainText(description),
    description,
    parentId: null,
    imageUrl: null,
    position: row.position ?? index,
    status: "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSpecifications(rows: CloudPreviewProductRow["characteristics"]): ProductSpecification[] {
  return rows
    .filter((row) => row.name.trim() && row.value.trim())
    .map((row, position) => ({
      group: "Характеристики",
      label: row.name.trim(),
      value: row.value.trim(),
      unit: row.unit?.trim() || null,
      position,
    }));
}

function mapMedia(row: CloudPreviewProductRow): ProductMedia[] {
  return row.media.flatMap((media, position) => {
    const url = safeHttpsUrl(media.url);
    if (!url) return [];
    return [{
      type: mediaType(media.format, url),
      url,
      alt: `${row.title}, изображение ${position + 1}`,
      position,
    } satisfies ProductMedia];
  });
}

function mapDocuments(rows: CloudPreviewProductRow["documents"]): ProductDocument[] {
  return rows.flatMap((document) => {
    const publicUrl = safeHttpsUrl(document.publicUrl);
    if (!publicUrl || !document.title.trim()) return [];
    return [{
      title: document.title.trim(),
      kind: normalizeDocumentKind(document.kind),
      publicUrl,
      language: document.language.trim() || "Язык не указан",
      isOfficial: document.isOfficial,
    }];
  });
}

function mapRegistrations(rows: CloudPreviewProductRow["registrations"]): ProductRegistration[] {
  return rows.map((registration) => ({
    number: registration.registrationNumber?.trim() || null,
    status: registration.status.trim() || "no_data",
    sourceUrl: safeHttpsUrl(registration.sourceUrl),
  }));
}

export function mapCloudPreviewSnapshot(snapshot: CloudPreviewCatalogSnapshot) {
  const manufacturers = snapshot.manufacturers.map(mapManufacturer);
  const categories = snapshot.categories.map(mapCategory);
  const manufacturerSlugs = new Map(snapshot.manufacturers.map((row) => [row.id, row.slug]));
  const categorySlugs = new Map(snapshot.categories.map((row) => [row.id, row.slug]));
  const products: Product[] = snapshot.products.map((row) => {
    const manufacturerId = row.manufacturerId
      ? manufacturerSlugs.get(row.manufacturerId) ?? CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID
      : CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID;
    const categoryId = row.categoryId
      ? categorySlugs.get(row.categoryId) ?? CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID
      : CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID;
    const model = row.model?.trim() || "Не указан";
    const catalogQualityStatus = manufacturerId !== CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID &&
        categoryId !== CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID && model !== "Не указан"
      ? "READY" as const
      : "REQUIRES_EDITOR_REVIEW" as const;
    return {
    id: row.slug,
    slug: row.slug,
    manufacturerId,
    categoryId,
    name: row.title.trim(),
    model,
    shortDescription: storefrontPlainText(row.shortDescription || row.description) || "Описание добавляется.",
    description: row.description?.trim() || row.shortDescription?.trim() || "Описание добавляется.",
    status: "preview_draft",
    catalogQualityStatus,
    featured: false,
    applicationAreas: row.applicationAreas.map(({ name }) => name).filter(Boolean),
    keyFeatures: [],
    specifications: mapSpecifications(row.characteristics),
    media: mapMedia(row),
    documents: mapDocuments(row.documents),
    registrationRecords: mapRegistrations(row.registrations),
    compatibility: [],
    relatedProductIds: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  });
  const summary: CatalogSummary = {
    schemaVersion: 1,
    generatedAt: snapshot.generatedAt,
    productCount: products.length,
    activeProductCount: products.length,
    manufacturerCount: manufacturers.length,
    categoryCount: categories.length,
  };
  return { products, manufacturers, categories, summary };
}
