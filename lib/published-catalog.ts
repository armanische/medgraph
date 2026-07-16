import publishedCatalog from "../data/public/summary.generated.json" with { type: "json" };
import {
  getDraftCatalogCards,
  getDraftCatalogProduct,
} from "./catalog-drafts.ts";
import type { PublishedCatalog, PublishedProduct } from "../scripts/importers/catalog/publication/types.ts";
import type { DraftResearchStatus } from "../types/catalog-draft.ts";

const data = publishedCatalog as PublishedCatalog;

export interface PublicCatalogCard {
  slug: string;
  title: string;
  manufacturer: string | null;
  model: string | null;
  category: string;
  displayStatus: "published" | DraftResearchStatus;
  documents: number;
  sources: number;
  coverage: number;
  summary: string | null;
}

export function getPublishedCatalog() {
  return data;
}

export function getPublishedProducts() {
  return data.products;
}

export function getPublishedProduct(slug: string): PublishedProduct | null {
  return data.products.find((product) => product.slug === slug) ?? null;
}

export function getPublishedManufacturer(slug: string) {
  return data.manufacturers.find((manufacturer) => manufacturer.slug === slug) ?? null;
}

export function getPublishedManufacturerProducts(slug: string) {
  const manufacturer = getPublishedManufacturer(slug);
  if (!manufacturer) return [];
  const productSlugs = new Set(manufacturer.productSlugs);
  return data.products.filter((product) => productSlugs.has(product.slug));
}

export function getCatalogCardsWithFallback(): PublicCatalogCard[] {
  const published = new Map(
    data.products.map((product) => [product.slug, product] as const),
  );
  const fallback: PublicCatalogCard[] = getDraftCatalogCards()
    .filter((product) => !published.has(product.slug))
    .map((product) => ({
      slug: product.slug,
      title: product.title,
      manufacturer: product.manufacturer ?? product.brand,
      model: product.model,
      category: product.category,
      displayStatus: product.researchStatus,
      documents: product.documentsSummary.total,
      sources: product.sourcesSummary.total,
      coverage: product.readinessScore,
      summary: null,
    }));
  const publicCards: PublicCatalogCard[] = data.products.map((product) => ({
    slug: product.slug,
    title: product.name,
    manufacturer: product.manufacturer,
    model: product.model,
    category: product.category,
    displayStatus: "published",
    documents: product.documents.length,
    sources: product.officialSources.length,
    coverage: product.coverage,
    summary: product.description,
  }));
  return [...publicCards, ...fallback].sort((left, right) =>
    left.title.localeCompare(right.title, "ru-RU"),
  );
}

export function getCatalogProductWithFallback(slug: string) {
  return {
    published: getPublishedProduct(slug),
    draft: getDraftCatalogProduct(slug),
  };
}

export function searchCatalogCards(
  query: string,
  products: PublicCatalogCard[] = getCatalogCardsWithFallback(),
) {
  const normalized = query.trim().toLocaleLowerCase("ru-RU");
  if (!normalized) return products;
  return products.filter((product) =>
    [
      product.title,
      product.manufacturer,
      product.model,
      product.category,
      product.slug,
      product.summary,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ru-RU")
      .includes(normalized),
  );
}
