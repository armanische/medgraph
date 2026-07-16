import { createHash } from "node:crypto";

import type {
  PublishedCategory,
  PublishedKnowledgeEntry,
  PublishedManufacturer,
  PublishedProduct,
} from "./types.ts";

export function stablePublicId(prefix: string, value: string) {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

export function publicSlug(value: string) {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return [...value.normalize("NFKD").toLocaleLowerCase("ru-RU")]
    .map((character) => transliteration[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-");
}

function compareName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, "ru-RU");
}

export function buildManufacturerIndex(
  products: PublishedProduct[],
): PublishedManufacturer[] {
  const grouped = new Map<string, PublishedProduct[]>();
  for (const product of products) {
    grouped.set(product.manufacturer, [
      ...(grouped.get(product.manufacturer) ?? []),
      product,
    ]);
  }
  return [...grouped.entries()]
    .map(([name, entries]) => ({
      id: stablePublicId("published_manufacturer", name),
      slug: publicSlug(name),
      name,
      categories: [...new Set(entries.map((entry) => entry.category))].sort((a, b) =>
        a.localeCompare(b, "ru-RU"),
      ),
      productSlugs: entries.map((entry) => entry.slug).sort(),
      productCount: entries.length,
    }))
    .sort(compareName);
}

export function buildCategoryIndex(products: PublishedProduct[]): PublishedCategory[] {
  const grouped = new Map<string, PublishedProduct[]>();
  for (const product of products) {
    grouped.set(product.category, [...(grouped.get(product.category) ?? []), product]);
  }
  return [...grouped.entries()]
    .map(([name, entries]) => ({
      id: stablePublicId("published_category", name),
      slug: publicSlug(name),
      name,
      productSlugs: entries.map((entry) => entry.slug).sort(),
      productCount: entries.length,
    }))
    .sort(compareName);
}

export function buildKnowledgeIndex(
  products: PublishedProduct[],
): PublishedKnowledgeEntry[] {
  return products.map((product) => ({
    id: stablePublicId("published_knowledge", product.slug),
    slug: product.slug,
    productSlug: product.slug,
    title: product.name,
    summary: product.summary,
    facts: product.facts,
    compatibility: product.compatibility,
    documents: product.documents,
    sources: product.sources,
  }));
}
