import { evaluateItemPublicationEligibility } from "./publication-policy.ts";
import { createReviewItemSnapshot } from "./snapshot.ts";
import type {
  PublicationArtifact,
  PublicationBuildInput,
  PublicationReviewDecision,
  PublicationReviewProduct,
} from "../publication/types.ts";

export function reviewFixturesEnabled(input?: {
  env?: Readonly<Record<string, string | undefined>>;
  nodeEnv?: string;
}) {
  const env = input?.env ?? process.env;
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV;
  return nodeEnv !== "production" && env.CYBERMEDICA_ENABLE_REVIEW_FIXTURES === "1";
}

export function createReviewFixturePublicationInput(): PublicationBuildInput {
  const sourceUrl = "https://fixtures.cybermedica.invalid/official-review-fixture.pdf";
  const report: PublicationReviewProduct = {
    product: {
      productSlug: "review-fixture-monitor-100",
      manufacturer: "CyberMedica Fixture Manufacturer",
      productName: "Review Fixture Monitor 100",
      model: "RFM-100",
      category: "Мониторы пациента",
    },
    reviewItems: [
      {
        reviewItemId: "fixture_review_item_intended_use",
        productSlug: "review-fixture-monitor-100",
        productTitle: "Review Fixture Monitor 100",
        suggestedClaimType: "product.intendedUse",
        valuePayload: { value: "Synthetic monitoring fixture", unit: null },
        evidenceCandidateIds: ["fixture_evidence_intended_use"],
        documentVersionIds: ["fixture_document_version_1"],
        sourceUrls: [sourceUrl],
        status: "pending_review",
        updatedAt: "2026-07-16T00:00:00.000Z",
      },
      {
        reviewItemId: "fixture_review_item_weight",
        productSlug: "review-fixture-monitor-100",
        productTitle: "Review Fixture Monitor 100",
        suggestedClaimType: "product.weight",
        valuePayload: { value: "4.2", unit: "kg" },
        evidenceCandidateIds: ["fixture_evidence_weight"],
        documentVersionIds: ["fixture_document_version_1"],
        sourceUrls: [sourceUrl],
        status: "pending_review",
        updatedAt: "2026-07-16T00:00:00.000Z",
      },
    ],
    sourceDocumentSummary: [
      {
        documentVersionId: "fixture_document_version_1",
        documentType: "technical_specification",
        title: "Synthetic official fixture specification",
        sourceUrl,
        sha256: "f".repeat(64),
      },
    ],
  };
  const artifact: PublicationArtifact = {
    sha256: "f".repeat(64),
    referencedDocumentVersions: ["fixture_document_version_1"],
    referencedReviewItems: report.reviewItems.map((item) => item.reviewItemId),
    orphan: false,
    invalidPdf: false,
    htmlMasquerading: false,
    zeroByte: false,
    shaMatchesPath: true,
  };
  const decisions: PublicationReviewDecision[] = report.reviewItems.map((item, index) => {
    const snapshot = createReviewItemSnapshot({
      report,
      item,
      artifacts: [artifact],
      integrityViolations: [],
    });
    return {
      id: `fixture_decision_${index + 1}`,
      reviewItemId: item.reviewItemId,
      productSlug: report.product.productSlug,
      decision: "approve",
      nextStatus: "approved",
      reviewedAt: "2026-07-16T00:00:00.000Z",
      snapshotHash: snapshot.hash,
      publicationEligibility: evaluateItemPublicationEligibility(snapshot),
    };
  });
  return {
    reviewProducts: [report],
    decisions,
    artifacts: [artifact],
    integrityViolations: [],
    generatedAt: "review-fixture-v1",
  };
}
