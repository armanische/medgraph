import { buildPublishedCatalog, latestPublicationDecisions } from "./publication-builder.ts";
import { publicSlug } from "./publication-summary.ts";
import type {
  FirstPublicationCandidateReport,
  PublicationBlockReason,
  PublicationBuildInput,
} from "./types.ts";
import { FIRST_PUBLICATION_PRODUCT_SLUGS } from "../review/loader.ts";

export function buildFirstPublicationCandidateReport(
  input: PublicationBuildInput,
): FirstPublicationCandidateReport {
  const scopedInput = {
    ...input,
    selectedProductSlugs: [...FIRST_PUBLICATION_PRODUCT_SLUGS],
  };
  const result = buildPublishedCatalog(scopedInput);
  const decisions = latestPublicationDecisions(input.decisions);
  const reports = new Map(
    input.reviewProducts.map((report) => [report.product.productSlug, report]),
  );
  const published = new Set(result.catalog.products.map((product) => product.slug));
  const candidates = FIRST_PUBLICATION_PRODUCT_SLUGS.map((productSlug) => {
    const report = reports.get(productSlug);
    const items = report?.reviewItems ?? [];
    const latest = items.map((item) => decisions.get(item.reviewItemId));
    const blockingReasons: Partial<Record<PublicationBlockReason, number>> = {};
    for (const blocked of result.blockedItems.filter(
      (item) => item.productSlug === productSlug,
    )) {
      blockingReasons[blocked.reason] = (blockingReasons[blocked.reason] ?? 0) + 1;
    }
    const approvedItems = latest.filter(
      (decision) => decision?.decision === "approve" && decision.nextStatus === "approved",
    ).length;
    const rejectedItems = latest.filter(
      (decision) => decision?.decision === "reject" || decision?.nextStatus === "rejected",
    ).length;
    return {
      productSlug,
      productName: report?.product.productName ?? productSlug,
      manufacturer: report?.product.manufacturer ?? "Unknown",
      available: Boolean(report),
      totalItems: items.length,
      approvedItems,
      rejectedItems,
      pendingItems: items.length - approvedItems - rejectedItems,
      publicationEligible: published.has(publicSlug(productSlug)),
      blockingReasons,
      reviewerPath: "/internal/reviewer" as const,
    };
  });
  return {
    schemaVersion: "first-publication-candidates-v1",
    candidates,
    eligibleProducts: candidates.filter((candidate) => candidate.publicationEligible).length,
    approvedItems: candidates.reduce((sum, candidate) => sum + candidate.approvedItems, 0),
    automaticApprovalsCreated: 0,
  };
}
