import catalogProducts from "@/data/catalog-products.generated.json";
import type {
  CatalogProductsFile,
  DraftCatalogProduct,
} from "@/scripts/importers/catalog/types";

const data = catalogProducts as CatalogProductsFile;

export function getDraftCatalogProducts() {
  return data.products;
}

export function getDraftCatalogProduct(slug: string) {
  return data.products.find((product) => product.slug === slug) ?? null;
}

export function getDraftCatalogCategories() {
  return Array.from(
    new Set(data.products.map((product) => product.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "ru-RU"));
}

export function searchDraftCatalogProducts(
  query: string,
  products: DraftCatalogProduct[] = data.products,
) {
  const normalized = query.trim().toLocaleLowerCase("ru-RU");
  if (!normalized) return products;
  return products.filter((product) =>
    [
      product.title,
      product.titleFromCatalog,
      product.brand,
      product.manufacturer,
      product.model,
      product.category,
      product.slug,
      ...product.sourceCandidates.map((source) => source.sourceTitle),
      ...product.documents.map((document) => document.title),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ru-RU")
      .includes(normalized),
  );
}

export function draftStatusLabel(status: DraftCatalogProduct["researchStatus"]) {
  const labels: Record<DraftCatalogProduct["researchStatus"], string> = {
    needs_source: "Needs source",
    partially_researched: "Partially researched",
    research_ready: "Research ready",
    blocked: "Blocked",
  };
  return labels[status];
}
