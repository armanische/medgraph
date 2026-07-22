import type { ImportProvenance, NormalizedProduct, PipelineError, PipelineResult, PipelineWarning } from "../contracts.ts";

/** Review-specific models are intentionally owned by this adapter. */
export interface PublicationCandidate {
  status: "not_ready" | "candidate";
  product: unknown | null;
  excludedFields: string[];
  schemaValid: boolean;
  schemaIssues: string[];
}

export interface ReviewState {
  productId: string;
  sourceId: string;
  status: "extracted" | "normalized" | "needs_review" | "blocked";
  identityDecision: null;
  manufacturerDecision: null;
  categoryDecision: null;
  applicationAreaDecision: null;
  registrationDecision: null;
  imageDecision: null;
  descriptionDecision: null;
  characteristicDecisions: [];
  blockingErrors: PipelineError[];
  warnings: PipelineWarning[];
  reviewer: null;
  reviewedAt: null;
  notes: string[];
}

interface ReviewIdentity {
  status: "new_product" | "possible_existing_product" | "confirmed_existing_product";
  candidateProductId: string;
  candidateSlug: string;
  existingProductSlug: string | null;
  warnings: string[];
  blockingErrors: string[];
  reviewerRequired: boolean;
}

interface ExistingProductDiff {
  existingProductSlug: string | null;
  fields: Array<{
    field: string;
    classification: "same" | "added" | "removed" | "changed" | "unresolved" | "incompatible";
    candidateValue: unknown;
    existingValue: unknown;
  }>;
}

export interface ReviewNormalizedProduct extends NormalizedProduct {
  identity: ReviewIdentity;
  characteristics: NormalizedProduct["specifications"];
}

export interface ReviewPackage {
  source: PipelineResult["source"];
  extracted: PipelineResult["extracted"];
  normalizedProduct: ReviewNormalizedProduct;
  publicationCandidate: PublicationCandidate;
  provenance: ImportProvenance[];
  warnings: PipelineWarning[];
  blockingErrors: PipelineError[];
  review: ReviewState;
  existingProductDiff: ExistingProductDiff;
  migrationReport: string;
}

function buildReport(reviewPackage: Omit<ReviewPackage, "migrationReport">): string {
  const { normalizedProduct: product, source, blockingErrors, warnings, existingProductDiff } = reviewPackage;
  return `# Legacy import review — ${product.name ?? source.legacySlug}\n\n` +
    `## Product identity\n\n- Status: \`${product.identity.status}\`\n- Candidate slug: \`${product.slug}\`\n- Existing match: ${existingProductDiff.existingProductSlug ?? "none"}\n\n` +
    `## Source\n\n- Source ID: \`${source.sourceId}\`\n- Locator: \`${source.sourceUrl ?? source.sourcePath}\`\n- Checksum: \`${source.sourceChecksum}\`\n\n` +
    `## Legacy and normalized values\n\n- Title: ${source.legacyTitle ?? "missing"} → ${product.name ?? "missing"}\n- Manufacturer: ${source.rawManufacturer ?? "missing"} → ${product.manufacturer.id ?? "unresolved"}\n- Category: ${source.rawCategory ?? "missing"} → ${product.category.id ?? "unresolved"}\n- Application areas: ${source.rawApplicationAreas.join(", ") || "none"} → ${product.applicationAreas.applicationAreaIds.join(", ") || "none"}\n\n` +
    `## Resolver results\n\n- Manufacturer: ${product.manufacturer.rationale}\n- Category: ${product.category.rationale}\n- RU: \`${product.registration.status}\`\n\n` +
    `## Content summary\n\n- Description: ${product.fullDescription ? "candidate retained" : "missing"}\n- Characteristics: ${product.specifications.length}\n- Images: ${product.images.length}\n- Documents: ${product.documents.length}\n- Accessories: ${product.accessories.length}\n\n` +
    `## Provenance\n\n${reviewPackage.provenance.length} field-level records; normalization never acts as the sole factual source.\n\n` +
    `## Blocking errors (${blockingErrors.length})\n\n${blockingErrors.map((item) => `- \`${item.code}\`: ${item.message}`).join("\n") || "None"}\n\n` +
    `## Warnings (${warnings.length})\n\n${warnings.map((item) => `- \`${item.code}\`: ${item.message}`).join("\n") || "None"}\n\n` +
    `## Required reviewer decisions\n\n- Identity\n- Manufacturer\n- Category\n- Application areas\n- Registration\n- Image rights\n- Description and characteristics\n\n` +
    `## Publication readiness\n\n${blockingErrors.length ? "Not ready. Blocking errors must be resolved through explicit review." : "Candidate generated, but explicit review approval is still required."}\n\n` +
    `## Difference from existing Storefront product\n\n${existingProductDiff.fields.map(({ field, classification }) => `- ${field}: \`${classification}\``).join("\n") || "No existing product match."}\n`;
}

export function createReviewPackage(options: {
  result: PipelineResult;
  identity: ReviewIdentity;
  publicationCandidate: PublicationCandidate;
  existingProductDiff: ExistingProductDiff;
  notes: string[];
}): ReviewPackage {
  const normalizedProduct: ReviewNormalizedProduct = {
    ...options.result.normalizedProduct,
    identity: options.identity,
    characteristics: options.result.normalizedProduct.specifications,
  };
  const review: ReviewState = {
    productId: options.identity.candidateProductId,
    sourceId: options.result.source.sourceId,
    status: options.result.errors.length ? "blocked" : "needs_review",
    identityDecision: null,
    manufacturerDecision: null,
    categoryDecision: null,
    applicationAreaDecision: null,
    registrationDecision: null,
    imageDecision: null,
    descriptionDecision: null,
    characteristicDecisions: [],
    blockingErrors: options.result.errors,
    warnings: options.result.warnings,
    reviewer: null,
    reviewedAt: null,
    notes: [...options.notes],
  };
  const partial = {
    source: options.result.source,
    extracted: options.result.extracted,
    normalizedProduct,
    publicationCandidate: options.publicationCandidate,
    provenance: options.result.provenance,
    warnings: options.result.warnings,
    blockingErrors: options.result.errors,
    review,
    existingProductDiff: options.existingProductDiff,
  };
  return { ...partial, migrationReport: buildReport(partial) };
}
