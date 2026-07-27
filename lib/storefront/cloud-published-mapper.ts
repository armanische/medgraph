import type { PublishedCatalogProjection } from "../published-catalog/contracts.ts";
import {
  PRODUCT_DOCUMENT_KINDS,
  type Category,
  type Manufacturer,
  type Product,
  type ProductDocumentKind,
  type ProductMedia,
  type StorefrontCatalog,
} from "./types.ts";

function plainText(value: string | null): string {
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

function documentKind(value: string): ProductDocumentKind {
  return (PRODUCT_DOCUMENT_KINDS as readonly string[]).includes(value)
    ? value as ProductDocumentKind
    : "other";
}

function mediaType(format: string | null, url: string): ProductMedia["type"] {
  return /video|mp4|webm|mov/iu.test(`${format ?? ""} ${url}`) ? "video" : "image";
}

export function mapCloudPublishedCatalogProjection(
  projection: PublishedCatalogProjection,
): StorefrontCatalog {
  const manufacturers: Manufacturer[] = projection.manufacturers.map((row) => ({
    id: row.slug,
    slug: row.slug,
    name: row.name,
    country: row.countryCode ?? "",
    shortDescription: plainText(row.description),
    description: row.description ?? "",
    logoUrl: null,
    websiteUrl: row.website,
    status: "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  const categories: Category[] = projection.categories.map((row) => ({
    id: row.slug,
    slug: row.slug,
    name: row.name,
    shortDescription: plainText(row.description),
    description: row.description ?? "",
    parentId: null,
    imageUrl: null,
    position: row.position,
    status: "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  const manufacturerSlugs = new Map(
    projection.manufacturers.map((row) => [row.id, row.slug]),
  );
  const categorySlugs = new Map(
    projection.categories.map((row) => [row.id, row.slug]),
  );
  const products: Product[] = projection.products.map((row) => ({
    id: row.slug,
    slug: row.slug,
    manufacturerId: manufacturerSlugs.get(row.manufacturerId)!,
    categoryId: categorySlugs.get(row.categoryId)!,
    name: row.title,
    model: row.model,
    shortDescription: plainText(row.shortDescription),
    description: row.description ?? row.shortDescription ?? "",
    status: "active",
    featured: false,
    applicationAreas: row.applicationAreas.map(({ name }) => name),
    keyFeatures: [...row.keyFeatures]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(({ text }) => text),
    specifications: [...row.characteristicGroups]
      .sort((left, right) => left.sortOrder - right.sortOrder || left.key.localeCompare(right.key))
      .flatMap((group) => [...group.items]
        .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label))
        .map((item) => ({
          group: group.title,
          label: item.label,
          value: item.value,
          unit: item.unit,
          position: 0,
        })))
      .map((specification, position) => ({ ...specification, position })),
    media: [...row.media]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((media, position) => ({
        type: mediaType(media.format, media.url),
        url: media.url,
        alt: `${row.title}, изображение ${position + 1}`,
        position,
      })),
    documents: row.documents.map((document) => ({
      title: document.title,
      kind: documentKind(document.kind),
      publicUrl: document.publicUrl,
      language: document.language,
      isOfficial: document.isOfficial,
    })),
    registrationRecords: row.registrations.map((registration) => ({
      number: registration.registrationNumber,
      status: registration.status,
      sourceUrl: null,
    })),
    compatibility: [],
    relatedProductIds: [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return {
    products,
    manufacturers,
    categories,
    summary: {
      schemaVersion: 1,
      generatedAt: projection.generatedAt,
      productCount: projection.summary.productCount,
      activeProductCount: products.length,
      manufacturerCount: projection.summary.manufacturerCount,
      categoryCount: projection.summary.categoryCount,
    },
  };
}
