import catalogProducts from "../data/catalog-products.generated.json" with { type: "json" };
import type {
  CatalogProductsFile,
  DraftCatalogCard,
  DraftResearchStatus,
} from "@/types/catalog-draft";

const data = catalogProducts as unknown as CatalogProductsFile;

export function getDraftCatalogProducts() {
  return data.products;
}

export function getDraftCatalogGeneratedAt() {
  return data.generatedAt;
}

export function getDraftCatalogCards(): DraftCatalogCard[] {
  return data.products.map((product) => ({
    slug: product.slug,
    title: product.title,
    titleFromCatalog: product.titleFromCatalog,
    brand: product.brand,
    manufacturer: product.manufacturer,
    model: product.model,
    category: product.category,
    researchStatus: product.researchStatus,
    readinessScore: product.readinessScore,
    sourcesSummary: product.sourcesSummary,
    documentsSummary: product.documentsSummary,
    candidateClaimsCount: product.candidateClaimsCount,
    missingCriticalFields: product.missingCriticalFields,
  }));
}

export function getDraftCatalogProduct(slug: string) {
  return data.products.find((product) => product.slug === slug) ?? null;
}

export function getDraftCatalogCategories(
  products: Pick<DraftCatalogCard, "category">[] = data.products,
) {
  return Array.from(
    new Set(products.map((product) => product.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "ru-RU"));
}

export function searchDraftCatalogCards(
  query: string,
  products: DraftCatalogCard[] = getDraftCatalogCards(),
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
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ru-RU")
      .includes(normalized),
  );
}

export function draftStatusLabel(status: DraftResearchStatus) {
  const labels: Record<DraftResearchStatus, string> = {
    needs_source: "Needs source",
    partially_researched: "Partially researched",
    research_ready: "Research ready",
    blocked: "Blocked",
  };
  return labels[status];
}
