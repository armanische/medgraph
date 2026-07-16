import type { PublicationReviewItem, PublicationReviewProduct } from "../publication/types.ts";
import type { HumanReviewItemSnapshot, PublicationEligibilitySnapshot } from "./types.ts";

interface PublicationPolicyDecision {
  decision: string;
  nextStatus: string;
  publicationEligibility: PublicationEligibilitySnapshot;
}

export type PublicationFieldKind =
  | "required_identity"
  | "optional_technical"
  | "optional_compatibility"
  | "optional_document";

export function classifyPublicationField(claimType: string): PublicationFieldKind {
  if (/^product\.(?:manufacturer|model|intendedUse)$/iu.test(claimType)) {
    return "required_identity";
  }
  if (/compatibility/iu.test(claimType)) return "optional_compatibility";
  if (/^document\./iu.test(claimType)) return "optional_document";
  return "optional_technical";
}

export function evaluateItemPublicationEligibility(
  snapshot: HumanReviewItemSnapshot,
): PublicationEligibilitySnapshot {
  const reasons: string[] = [];
  if (!snapshot.value.manufacturer?.trim()) reasons.push("manufacturer_missing");
  if (!snapshot.value.model?.trim()) reasons.push("model_missing");
  if (!snapshot.value.category.trim()) reasons.push("category_missing");
  if (!snapshot.value.productTitle.trim()) reasons.push("product_identity_missing");
  if (!snapshot.value.value.trim()) reasons.push("value_missing");
  if (!snapshot.evidence.valid) reasons.push("evidence_invalid");
  if (!snapshot.documentVersions.ids.length) reasons.push("document_version_missing");
  if (!snapshot.documentVersions.artifactValid) reasons.push("artifact_invalid");
  if (!snapshot.sources.official) reasons.push("official_source_missing");
  return {
    eligible: reasons.length === 0,
    status: reasons.length ? "publication_blocked" : "ready_for_publication",
    reasons,
  };
}

export function evaluateProductPublicationPolicy(input: {
  report: PublicationReviewProduct;
  items: PublicationReviewItem[];
  latestDecisions: Map<string, PublicationPolicyDecision>;
  published?: boolean;
}) {
  const reasons: string[] = [];
  const product = input.report.product;
  if (!product.productName.trim()) reasons.push("product_identity_missing");
  if (!product.manufacturer?.trim()) reasons.push("manufacturer_missing");
  if (!product.model?.trim()) reasons.push("model_missing");
  if (!product.category.trim()) reasons.push("category_missing");
  const approved = input.items.filter((item) => {
    const decision = input.latestDecisions.get(item.reviewItemId);
    return decision?.decision === "approve" &&
      decision.nextStatus === "approved" &&
      decision.publicationEligibility.eligible;
  });
  const technical = approved.filter(
    (item) => classifyPublicationField(item.suggestedClaimType) === "optional_technical" ||
      classifyPublicationField(item.suggestedClaimType) === "required_identity",
  );
  if (!technical.length) reasons.push("approved_technical_field_missing");
  if (!approved.some((item) => item.sourceUrls.length > 0)) reasons.push("official_source_missing");
  if (!approved.some((item) => item.documentVersionIds.length > 0)) {
    reasons.push("document_version_missing");
  }
  if ([...input.latestDecisions.values()].some((decision) => decision.nextStatus === "conflicted")) {
    reasons.push("unresolved_conflict");
  }
  return {
    eligible: reasons.length === 0,
    status: input.published
      ? "published" as const
      : reasons.length
        ? "publication_blocked" as const
        : "ready_for_publication" as const,
    reasons,
    approvedItems: approved.length,
    technicalItems: technical.length,
    coverage: input.items.length ? Math.round((approved.length / input.items.length) * 100) : 0,
  };
}
