import {
  buildCategoryIndex,
  buildKnowledgeIndex,
  buildManufacturerIndex,
  publicSlug,
  stablePublicId,
} from "./publication-summary.ts";
import type {
  PublicationArtifact,
  PublicationBlockReason,
  PublicationBlockedItem,
  PublicationBuildInput,
  PublicationBuildResult,
  PublicationReviewDecision,
  PublicationReviewItem,
  PublicationReviewProduct,
  PublishedDocument,
  PublishedProduct,
} from "./types.ts";
import { evaluateProductPublicationPolicy } from "../review/publication-policy.ts";
import { createReviewItemSnapshot } from "../review/snapshot.ts";

function isExternalHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isUsableArtifact(artifact: PublicationArtifact) {
  return (
    artifact.shaMatchesPath &&
    !artifact.orphan &&
    !artifact.invalidPdf &&
    !artifact.htmlMasquerading &&
    !artifact.zeroByte
  );
}

function hasIntegrityViolation(
  input: PublicationBuildInput,
  productSlug: string,
  item: PublicationReviewItem,
) {
  const entityIds = new Set([
    item.reviewItemId,
    ...item.evidenceCandidateIds,
    ...item.documentVersionIds,
  ]);
  return input.integrityViolations.some(
    (violation) =>
      violation.productSlug === productSlug ||
      (violation.entityId ? entityIds.has(violation.entityId) : false) ||
      (violation.missingEvidenceId
        ? entityIds.has(violation.missingEvidenceId)
        : false) ||
      (violation.documentVersionId
        ? entityIds.has(violation.documentVersionId)
        : false),
  );
}

function eligibilityReason(input: {
  build: PublicationBuildInput;
  report: PublicationReviewProduct;
  item: PublicationReviewItem;
  decision?: PublicationReviewDecision;
  artifactByVersion: Map<string, PublicationArtifact[]>;
}): PublicationBlockReason | null {
  const { build, report, item, decision, artifactByVersion } = input;
  if (decision?.decision === "reject" || decision?.nextStatus === "rejected") return "rejected";
  if (!decision || decision.decision !== "approve" || decision.nextStatus !== "approved") {
    return decision?.nextStatus === "conflicted" ? "verification_conflict" : "not_ready";
  }
  const snapshot = createReviewItemSnapshot({
    report,
    item,
    artifacts: build.artifacts,
    integrityViolations: build.integrityViolations,
  });
  if (decision.snapshotHash !== snapshot.hash) return "stale_approval";
  if (build.verificationConflictReviewItemIds?.includes(item.reviewItemId)) {
    return "verification_conflict";
  }
  if (!item.evidenceCandidateIds.length) return "missing_evidence";
  if (!item.documentVersionIds.length) return "missing_document_version";
  const knownVersions = new Set(
    report.sourceDocumentSummary.map((document) => document.documentVersionId),
  );
  if (item.documentVersionIds.some((versionId) => !knownVersions.has(versionId))) {
    return "missing_document_version";
  }
  const versionSourceUrls = new Set(
    report.sourceDocumentSummary
      .filter((document) => item.documentVersionIds.includes(document.documentVersionId))
      .map((document) => document.sourceUrl),
  );
  if (item.sourceUrls.some((url) => !versionSourceUrls.has(url))) {
    return "missing_source";
  }
  if (
    item.documentVersionIds.some(
      (versionId) =>
        !(artifactByVersion.get(versionId) ?? []).some(isUsableArtifact),
    )
  ) {
    return "missing_artifact";
  }
  if (!item.sourceUrls.length || item.sourceUrls.some((url) => !isExternalHttpUrl(url))) {
    return "missing_source";
  }
  if (hasIntegrityViolation(build, report.product.productSlug, item)) {
    return "integrity_violation";
  }
  if (!decision.publicationEligibility.eligible) return "not_ready";
  return null;
}

function publicationTimestamp(
  items: PublicationReviewItem[],
  decisions: Map<string, PublicationReviewDecision>,
) {
  const values = items
    .flatMap((item) => [decisions.get(item.reviewItemId)?.reviewedAt, item.updatedAt])
    .filter((value): value is string => Boolean(value))
    .filter((value) => !Number.isNaN(Date.parse(value)))
    .sort();
  return values.at(-1) ?? "review-ready";
}

function buildProduct(input: {
  report: PublicationReviewProduct;
  eligibleItems: PublicationReviewItem[];
  decisions: Map<string, PublicationReviewDecision>;
}): PublishedProduct | null {
  const { report, eligibleItems, decisions } = input;
  const manufacturer = report.product.manufacturer?.trim() ?? "";
  const category = report.product.category.trim();
  const slug = publicSlug(report.product.productSlug);
  if (!manufacturer || !category || !slug || !report.product.productName.trim()) return null;

  const versionIds = new Set(eligibleItems.flatMap((item) => item.documentVersionIds));
  const documents: PublishedDocument[] = report.sourceDocumentSummary
    .filter((document) => versionIds.has(document.documentVersionId))
    .map((document) => ({
      title: document.title,
      type: document.documentType,
      url: document.sourceUrl,
      sha256: document.sha256,
    }))
    .sort((left, right) => left.url.localeCompare(right.url));
  const sources = documents.map((document) => ({
    title: document.title,
    url: document.url,
  }));
  const facts = eligibleItems
    .map((item) => ({
      type: item.suggestedClaimType,
      value: item.valuePayload.value,
      unit: item.valuePayload.unit,
    }))
    .sort((left, right) =>
      `${left.type}:${left.value}`.localeCompare(`${right.type}:${right.value}`),
    );
  const compatibility = [
    ...new Set(
      eligibleItems
        .filter((item) => /compatibility/iu.test(item.suggestedClaimType))
        .map((item) => item.valuePayload.value),
    ),
  ].sort();
  const name = report.product.productName.trim();

  return {
    id: stablePublicId("published_product", slug),
    slug,
    manufacturer,
    manufacturerSlug: publicSlug(manufacturer),
    model: report.product.model,
    name,
    category,
    categorySlug: publicSlug(category),
    summary: `${name} — ${category.toLocaleLowerCase("ru-RU")}; данные опубликованы после проверки официальных источников.`,
    facts,
    compatibility,
    documents,
    sources,
    publishedAt: publicationTimestamp(eligibleItems, decisions),
    verificationLevel: "reviewed",
    coverage: Math.round((eligibleItems.length / report.reviewItems.length) * 100),
    status: "published",
  };
}

export function buildPublishedCatalog(input: PublicationBuildInput): PublicationBuildResult {
  const decisions = new Map(input.decisions.map((decision) => [decision.reviewItemId, decision]));
  const artifactByVersion = new Map<string, PublicationArtifact[]>();
  for (const artifact of input.artifacts) {
    for (const versionId of artifact.referencedDocumentVersions) {
      artifactByVersion.set(versionId, [
        ...(artifactByVersion.get(versionId) ?? []),
        artifact,
      ]);
    }
  }

  const products: PublishedProduct[] = [];
  const approvedDecisionIdsByProduct = new Map<string, string[]>();
  const blockedItems: PublicationBlockedItem[] = [];
  let publishedItems = 0;

  for (const report of [...input.reviewProducts].sort((left, right) =>
    left.product.productSlug.localeCompare(right.product.productSlug),
  )) {
    const eligibleItems: PublicationReviewItem[] = [];
    for (const item of report.reviewItems) {
      const reason = eligibilityReason({
        build: input,
        report,
        item,
        decision: decisions.get(item.reviewItemId),
        artifactByVersion,
      });
      if (reason) {
        blockedItems.push({ productSlug: report.product.productSlug, reason });
      } else {
        eligibleItems.push(item);
      }
    }
    if (!eligibleItems.length) continue;
    const productPolicy = evaluateProductPublicationPolicy({
      report,
      items: report.reviewItems,
      latestDecisions: decisions,
    });
    if (!productPolicy.eligible) {
      for (let index = 0; index < eligibleItems.length; index += 1) {
        blockedItems.push({
          productSlug: report.product.productSlug,
          reason: "required_field_missing",
        });
      }
      continue;
    }
    const product = buildProduct({ report, eligibleItems, decisions });
    if (!product) {
      blockedItems.push({
        productSlug: report.product.productSlug,
        reason: "invalid_product_identity",
      });
      continue;
    }
    publishedItems += eligibleItems.length;
    products.push(product);
    approvedDecisionIdsByProduct.set(
      product.slug,
      eligibleItems
        .map((item) => decisions.get(item.reviewItemId)?.id)
        .filter((id): id is string => Boolean(id))
        .sort(),
    );
  }

  products.sort((left, right) => left.slug.localeCompare(right.slug));
  const manufacturers = buildManufacturerIndex(products);
  const categories = buildCategoryIndex(products);
  const knowledge = buildKnowledgeIndex(products);
  const blockedByReason: Partial<Record<PublicationBlockReason, number>> = {};
  for (const item of blockedItems) {
    blockedByReason[item.reason] = (blockedByReason[item.reason] ?? 0) + 1;
  }

  return {
    catalog: {
      schemaVersion: "published-catalog-v1",
      generatedAt: input.generatedAt ?? "publication-pipeline-v1",
      products,
      manufacturers,
      categories,
      knowledge,
      kpi: {
        publishedProducts: products.length,
        publishedItems,
        blocked: blockedItems.filter((item) => item.reason !== "rejected").length,
        rejected: blockedItems.filter((item) => item.reason === "rejected").length,
        manufacturers: manufacturers.length,
        categories: categories.length,
        knowledgeEntries: knowledge.length,
      },
      blockedByReason,
    },
    blockedItems,
    internalManifest: {
      schemaVersion: "publication-approval-manifest-v1",
      generatedAt: input.generatedAt ?? "publication-pipeline-v1",
      products: products.map((product) => ({
        productSlug: product.slug,
        approvedDecisionIds: approvedDecisionIdsByProduct.get(product.slug) ?? [],
      })),
    },
  };
}
