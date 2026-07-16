import { products } from "../../data/products.ts";
import { comparisonProducts } from "../compare/mock-data.ts";
import { getPublishedProducts } from "../published-catalog.ts";

export type SearchKnowledgeStatus = "verified" | "publication_ready" | "published";
export type SearchSourceKind = "published_product" | "comparison_mock" | "candidate_claim";

export interface SearchIndexDocument {
  id: string;
  slug: string;
  title: string;
  manufacturer: string;
  model: string | null;
  category: string;
  registrationNumber: string | null;
  sku: string | null;
  aliases: string[];
  synonyms: string[];
  status: SearchKnowledgeStatus;
  lastUpdated: string;
  href: string;
  sourceKind: SearchSourceKind;
}

export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  manufacturer: string;
  category: string;
  model: string | null;
  status: SearchKnowledgeStatus;
  lastUpdated: string;
  href: string;
  score: number;
  matchedFields: string[];
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  total: number;
  results: SearchResult[];
  suggestions: string[];
}

const popularSuggestions = [
  "Hamilton T1",
  "Hamilton C1",
  "FS510",
  "ФСЗ 2009/04992",
  "ИВЛ Hamilton",
  "тепловлагообменный фильтр",
];

const synonymMap: Record<string, string[]> = {
  ивл: ["вентиляция", "вентилятор", "аппарат ивл"],
  hmef: ["тепловлагообменный фильтр", "бактериально-вирусный фильтр"],
  ру: ["регистрационное удостоверение", "регистрационный номер"],
  hamilton: ["хамильтон"],
  fs510: ["фильтр fs510"],
};

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearchQuery(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const tokens = normalized.split(" ").filter(Boolean);
  const expanded = tokens.flatMap((token) => [token, ...(synonymMap[token] ?? [])]);
  return [...new Set(expanded.map(normalizeSearchText).filter(Boolean))];
}

function exactFieldScore(
  query: string,
  document: SearchIndexDocument,
): { score: number; fields: string[] } {
  const fields: Array<[string, string | null, number]> = [
    ["model", document.model, 10000],
    ["registrationNumber", document.registrationNumber, 9000],
    ["manufacturer", document.manufacturer, 7000],
    ["title", document.title, 5500],
    ["category", document.category, 4000],
    ["sku", document.sku, 3500],
  ];
  let score = 0;
  const matchedFields: string[] = [];
  for (const [field, value, weight] of fields) {
    if (value && normalizeSearchText(value) === query) {
      score += weight;
      matchedFields.push(field);
    }
  }
  return { score, fields: matchedFields };
}

function tokenFieldScore(tokens: string[], document: SearchIndexDocument) {
  const weightedFields: Array<[string, string[], number]> = [
    ["model", [document.model ?? ""], 900],
    ["registrationNumber", [document.registrationNumber ?? ""], 820],
    ["manufacturer", [document.manufacturer], 700],
    ["title", [document.title], 580],
    ["category", [document.category], 420],
    ["sku", [document.sku ?? ""], 360],
    ["aliases", document.aliases, 250],
    ["synonyms", document.synonyms, 180],
  ];
  let score = 0;
  const matchedFields = new Set<string>();
  for (const token of tokens) {
    for (const [field, values, weight] of weightedFields) {
      const normalizedValues = values.map(normalizeSearchText).filter(Boolean);
      if (
        normalizedValues.some(
          (value) => value === token || value.includes(token) || token.includes(value),
        )
      ) {
        score += weight;
        matchedFields.add(field);
      }
    }
  }
  return { score, fields: [...matchedFields] };
}

function productDocuments(): SearchIndexDocument[] {
  const published = getPublishedProducts();
  const publishedSlugs = new Set(published.map((product) => product.slug));
  const publicDocuments: SearchIndexDocument[] = published.map((product) => ({
    id: `published:${product.slug}`,
    slug: product.slug,
    title: product.name,
    manufacturer: product.manufacturer,
    model: product.model,
    category: product.category,
    registrationNumber: null,
    sku: null,
    aliases: [
      product.slug,
      ...product.facts.map((fact) => fact.value),
      ...product.compatibility,
    ],
    synonyms: product.facts.map((fact) => fact.type),
    status: "published",
    lastUpdated: product.publishedAt,
    href: `/catalog/${product.slug}`,
    sourceKind: "published_product",
  }));
  const fallbackDocuments: SearchIndexDocument[] = products
    .filter((product) => !publishedSlugs.has(product.slug))
    .map((product) => ({
    id: `published:${product.slug}`,
    slug: product.slug,
    title: product.name,
    manufacturer: product.manufacturer,
    model: product.slug.toLocaleUpperCase("ru-RU"),
    category: product.category,
    registrationNumber: product.identifiers.registration,
    sku: product.slug.toLocaleUpperCase("ru-RU"),
    aliases: [
      product.slug,
      ...product.searchTerms,
      ...product.analogs,
      ...product.compatibility,
    ],
    synonyms: ["hmef", "фильтр", "дыхательный контур"],
    status: "published",
    lastUpdated: "2026-07-09",
    href: `/knowledge/${product.slug}`,
    sourceKind: "published_product",
  }));
  return [...publicDocuments, ...fallbackDocuments];
}

function comparisonDocuments(): SearchIndexDocument[] {
  return comparisonProducts.map((product) => ({
    id: `comparison:${product.slug}`,
    slug: product.slug,
    title: product.title,
    manufacturer: product.manufacturer,
    model: product.model,
    category: product.category,
    registrationNumber: null,
    sku: null,
    aliases: [product.title, product.model, product.slug],
    synonyms: ["ивл", "аппарат ивл", "вентилятор"],
    status: "publication_ready",
    lastUpdated: "2026-07-09",
    href: "/compare",
    sourceKind: "comparison_mock",
  }));
}

export function buildSearchIndex() {
  return [...productDocuments(), ...comparisonDocuments()].filter(
    (document) => document.sourceKind !== "candidate_claim",
  );
}

export function searchMedicalDevices(
  query: string,
  index: SearchIndexDocument[] = buildSearchIndex(),
): SearchResponse {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchQuery(query);

  if (!normalizedQuery) {
    return {
      query,
      normalizedQuery,
      total: 0,
      results: [],
      suggestions: popularSuggestions,
    };
  }

  const results = index
    .filter((document) => document.sourceKind !== "candidate_claim")
    .map((document) => {
      const exact = exactFieldScore(normalizedQuery, document);
      const token = tokenFieldScore(tokens, document);
      const score = exact.score + token.score;
      return {
        id: document.id,
        slug: document.slug,
        title: document.title,
        manufacturer: document.manufacturer,
        category: document.category,
        model: document.model,
        status: document.status,
        lastUpdated: document.lastUpdated,
        href: document.href,
        score,
        matchedFields: [...new Set([...exact.fields, ...token.fields])],
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.title.localeCompare(right.title, "ru-RU");
    });

  return {
    query,
    normalizedQuery,
    total: results.length,
    results,
    suggestions: popularSuggestions,
  };
}

export function getPopularSearchQueries() {
  return popularSuggestions;
}
