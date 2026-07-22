import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { productSchema } from "../../../../lib/storefront/schemas.ts";
import type { Product } from "../../../../lib/storefront/types.ts";
import type { PipelineResult } from "../contracts.ts";

export interface StorefrontIdentity {
  status: "new_product" | "possible_existing_product" | "confirmed_existing_product";
  candidateProductId: string;
  candidateSlug: string;
  existingProductSlug: string | null;
  warnings: string[];
  blockingErrors: string[];
  reviewerRequired: boolean;
}

export interface ExistingProductDiff {
  existingProductSlug: string | null;
  fields: Array<{
    field: string;
    classification: "same" | "added" | "removed" | "changed" | "unresolved" | "incompatible";
    candidateValue: unknown;
    existingValue: unknown;
  }>;
}

export interface StorefrontCandidateProjection {
  status: "not_ready" | "candidate";
  product: Product | null;
  excludedFields: string[];
  schemaValid: boolean;
  schemaIssues: string[];
}

export interface StorefrontAdapterResult {
  identity: StorefrontIdentity;
  candidate: StorefrontCandidateProjection;
  existingProductDiff: ExistingProductDiff;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

/** Storefront is accessed only through this adapter. */
export async function loadExistingStorefrontProducts(repositoryRoot: string): Promise<Product[]> {
  const directory = path.join(repositoryRoot, "data/storefront/products");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();
  return Promise.all(files.map((file) => readJson<Product>(path.join(directory, file))));
}

function buildIdentity(
  result: PipelineResult,
  expectedExistingProductSlug: string | null,
  existingProducts: Product[],
): StorefrontIdentity {
  const candidateSlug = result.normalizedProduct.slug;
  const existing = expectedExistingProductSlug
    ? existingProducts.find(({ slug }) => slug === expectedExistingProductSlug) ?? null
    : existingProducts.find(({ slug }) => slug === candidateSlug) ?? null;
  if (!existing) {
    return {
      status: "new_product",
      candidateProductId: `legacy-${candidateSlug || result.source.sourceId}`,
      candidateSlug,
      existingProductSlug: null,
      warnings: [],
      blockingErrors: [],
      reviewerRequired: true,
    };
  }
  const exactTitle = result.normalizedProduct.name
    ? result.normalizedProduct.name === result.normalizedProduct.name.normalize("NFC") && existing.name.normalize("NFC") === result.normalizedProduct.name
    : false;
  const confirmed = exactTitle && result.source.sourceKind === "existing_storefront_control";
  return {
    status: confirmed ? "confirmed_existing_product" : "possible_existing_product",
    candidateProductId: existing.id,
    candidateSlug,
    existingProductSlug: existing.slug,
    warnings: ["possible_existing_storefront_match"],
    blockingErrors: confirmed ? [] : ["duplicate_existing_product_unresolved"],
    reviewerRequired: true,
  };
}

function classifyDiff(candidate: unknown, existing: unknown): ExistingProductDiff["fields"][number]["classification"] {
  if (candidate == null && existing == null) return "same";
  if (candidate == null) return "removed";
  if (existing == null) return "added";
  if (JSON.stringify(candidate) === JSON.stringify(existing)) return "same";
  return "changed";
}

function buildExistingDiff(result: PipelineResult, identity: StorefrontIdentity, existingProducts: Product[]): ExistingProductDiff {
  const existing = identity.existingProductSlug
    ? existingProducts.find(({ slug }) => slug === identity.existingProductSlug) ?? null
    : null;
  if (!existing) return { existingProductSlug: null, fields: [] };
  const product = result.normalizedProduct;
  const pairs: Array<[string, unknown, unknown]> = [
    ["slug", product.slug, existing.slug],
    ["title", product.name, existing.name],
    ["manufacturer", product.manufacturer.id, existing.manufacturerId],
    ["category", product.category.id, existing.categoryId],
    ["description", product.fullDescription, existing.description],
    ["characteristics", product.specifications.map(({ displayName, normalizedValue }) => ({ displayName, normalizedValue })), existing.specifications],
    ["image", product.images.find(({ roleCandidate }) => roleCandidate === "primary")?.localSourcePath ?? null, existing.media[0]?.url ?? null],
    ["registration", product.registration.publicValue, null],
    ["sourceReferences", null, null],
  ];
  return {
    existingProductSlug: existing.slug,
    fields: pairs.map(([field, candidateValue, existingValue]) => ({
      field,
      classification: classifyDiff(candidateValue, existingValue),
      candidateValue,
      existingValue,
    })),
  };
}

function buildCandidate(result: PipelineResult, identity: StorefrontIdentity): StorefrontCandidateProjection {
  const product = result.normalizedProduct;
  const { name, model, shortDescription, fullDescription } = product;
  const manufacturerId = product.manufacturer.id;
  const categoryId = product.category.id;
  if (!name || !model || !manufacturerId || !categoryId || !shortDescription || !fullDescription) {
    return {
      status: "not_ready",
      product: null,
      excludedFields: ["registration", "availability", "price", "advantages", "compatibility", "relatedProducts", "unverifiedDocuments", "accessories"],
      schemaValid: false,
      schemaIssues: ["Required public product fields are incomplete."],
    };
  }
  const candidate: Product = {
    id: identity.candidateProductId,
    slug: product.slug,
    manufacturerId,
    categoryId,
    name,
    model,
    shortDescription,
    description: fullDescription,
    status: "hidden",
    featured: false,
    applicationAreas: product.applicationAreas.matchedValues.map(({ rawValue }) => rawValue),
    keyFeatures: product.bulletItems,
    specifications: product.specifications.map((item) => ({
      group: "Legacy",
      label: item.displayName,
      value: item.normalizedValue,
      unit: item.unit,
      position: item.sortOrder,
    })),
    media: product.images
      .filter((image) => image.localSourcePath?.startsWith("/") && image.rightsStatus === "confirmed")
      .map((image, index) => ({ type: "image", url: image.localSourcePath!, alt: name, position: index * 10 + 10 })),
    documents: product.documents
      .filter(({ official }) => official)
      .map((document) => ({ title: document.title, kind: "other", publicUrl: document.url, language: document.language ?? "ru", isOfficial: true })),
    compatibility: [],
    relatedProductIds: [],
    createdAt: product.updatedAt,
    updatedAt: product.updatedAt,
  };
  const validation = productSchema.safeParse(candidate);
  return {
    status: result.errors.length || identity.blockingErrors.length ? "not_ready" : "candidate",
    product: candidate,
    excludedFields: ["registration", "availability", "price", "advantages", "compatibility", "relatedProducts", "unverifiedDocuments", "accessories"],
    schemaValid: validation.success,
    schemaIssues: validation.success ? [] : validation.error.issues.map(({ path: issuePath, message }) => `${issuePath.join(".")}: ${message}`),
  };
}

export function createStorefrontAdapterResult(options: {
  result: PipelineResult;
  expectedExistingProductSlug: string | null;
  existingProducts: Product[];
}): StorefrontAdapterResult {
  const identity = buildIdentity(options.result, options.expectedExistingProductSlug, options.existingProducts);
  const candidate = buildCandidate(options.result, identity);
  if (!candidate.schemaValid && candidate.product) {
    candidate.status = "not_ready";
    candidate.schemaIssues = [...candidate.schemaIssues].sort();
  }
  return {
    identity,
    candidate,
    existingProductDiff: buildExistingDiff(options.result, identity, options.existingProducts),
  };
}
