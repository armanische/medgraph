import "server-only";

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { HumanReviewerItem, HumanReviewerWorkspaceModel } from "./human-types.ts";
import { FileReviewDecisionStore } from "../../scripts/importers/catalog/review/decision-store.ts";
import { loadReviewContext, selectPilotReports } from "../../scripts/importers/catalog/review/loader.ts";
import { evaluateProductPublicationPolicy } from "../../scripts/importers/catalog/review/publication-policy.ts";
import { createReviewItemSnapshot } from "../../scripts/importers/catalog/review/snapshot.ts";
import { replayReviewStatus } from "../../scripts/importers/catalog/review/state-machine.ts";
import type { HumanReviewDecision } from "../../scripts/importers/catalog/review/types.ts";

interface ExtractionReport {
  extractedFactCandidates?: Array<{
    evidenceCandidateId: string | null;
    rawText: string;
    confidence: number;
    locator: { page: number | null; section: string | null; heading: string | null; table: string | null; paragraph: number | null };
  }>;
  extractionProfileSummary?: { profilesUsed?: string[] };
}

type ExtractionLocator = NonNullable<ExtractionReport["extractedFactCandidates"]>[number]["locator"];

async function extractionFor(slug: string): Promise<ExtractionReport | null> {
  if (!/^[a-z0-9-]+$/u.test(slug)) return null;
  try {
    return JSON.parse(
      await readFile(
        join(resolve(process.cwd(), "data/research/extraction/products"), `${slug}.json`),
        "utf8",
      ),
    ) as ExtractionReport;
  } catch {
    return null;
  }
}

function locatorLabel(locator: ExtractionLocator | undefined) {
  if (!locator || typeof locator !== "object") return "Локатор не указан";
  return Object.entries(locator)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ") || "Локатор не указан";
}

export async function loadHumanReviewerWorkspace(): Promise<HumanReviewerWorkspaceModel> {
  const context = await loadReviewContext();
  const reports = selectPilotReports(context);
  const decisions = await new FileReviewDecisionStore().list();
  const byItem = new Map<string, HumanReviewDecision[]>();
  const latest = new Map<string, HumanReviewDecision>();
  for (const decision of decisions) {
    byItem.set(decision.reviewItemId, [...(byItem.get(decision.reviewItemId) ?? []), decision]);
    latest.set(decision.reviewItemId, decision);
  }
  const publishedCatalog = JSON.parse(
    await readFile(resolve(process.cwd(), "data/public/summary.generated.json"), "utf8"),
  ) as { products: Array<{ slug: string }> };
  const publishedSlugs = new Set(
    publishedCatalog.products.map((product) => product.slug),
  );
  const items: HumanReviewerItem[] = [];
  const products: HumanReviewerWorkspaceModel["products"] = [];
  for (const report of reports) {
    const extraction = await extractionFor(report.product.productSlug);
    for (const item of report.reviewItems) {
      const snapshot = createReviewItemSnapshot({
        report,
        item,
        artifacts: context.artifacts,
        integrityViolations: context.integrityViolations,
      });
      const history = byItem.get(item.reviewItemId) ?? [];
      const currentStatus = replayReviewStatus(history);
      const latestDecision = history.at(-1);
      const evidenceId = item.evidenceCandidateIds[0] ?? null;
      const fact = extraction?.extractedFactCandidates?.find(
        (candidate) => candidate.evidenceCandidateId === evidenceId,
      );
      const document = report.sourceDocumentSummary.find((candidate) =>
        item.documentVersionIds.includes(candidate.documentVersionId),
      );
      items.push({
        reviewItemId: item.reviewItemId,
        snapshotHash: snapshot.hash,
        productSlug: report.product.productSlug,
        productTitle: report.product.productName,
        manufacturer: report.product.manufacturer ?? "Не указан",
        category: report.product.category,
        characteristic: item.suggestedClaimType,
        value: item.valuePayload.value,
        unit: item.valuePayload.unit,
        rawText: fact?.rawText ?? item.valuePayload.value,
        evidenceSource: document?.title ?? "Источник не указан",
        officialSourceUrl: item.sourceUrls[0] ?? "",
        documentType: document?.documentType ?? "unknown",
        documentVersion: item.documentVersionIds[0] ?? "missing",
        artifactStatus: snapshot.documentVersions.artifactValid ? "valid" : snapshot.documentVersions.ids.length ? "invalid" : "missing",
        locator: locatorLabel(fact?.locator),
        extractionProfile: extraction?.extractionProfileSummary?.profilesUsed?.join(", ") || "registry",
        confidence: fact?.confidence ?? null,
        warnings: item.reasons ?? [],
        updatedAt: item.updatedAt,
        currentStatus,
        publicationStatus: latestDecision?.publicationEligibility.status ?? "not_ready",
        publicationReasons: latestDecision?.publicationEligibility.reasons ?? ["human_approval_required"],
        priority: item.priority ?? "medium",
        risk: item.riskLevel ?? "medium",
        history: history.map((decision) => ({
          id: decision.id,
          reviewerId: decision.reviewerId,
          decision: decision.decision,
          previousStatus: decision.previousStatus,
          nextStatus: decision.nextStatus,
          comment: decision.comment,
          reviewedAt: decision.reviewedAt,
          snapshotHash: decision.snapshotHash,
          snapshotValue: decision.valueSnapshot.value,
          snapshotUnit: decision.valueSnapshot.unit,
          publicationEligible: decision.publicationEligibility.eligible,
          publicationReasons: decision.publicationEligibility.reasons,
        })),
      });
    }
    const productItems = items.filter((item) => item.productSlug === report.product.productSlug);
    const policy = evaluateProductPublicationPolicy({
      report,
      items: report.reviewItems,
      latestDecisions: latest,
      published: publishedSlugs.has(report.product.productSlug),
    });
    products.push({
      productSlug: report.product.productSlug,
      productTitle: report.product.productName,
      manufacturer: report.product.manufacturer ?? "Не указан",
      category: report.product.category,
      total: productItems.length,
      approved: productItems.filter((item) => item.currentStatus === "approved").length,
      rejected: productItems.filter((item) => item.currentStatus === "rejected").length,
      missing: productItems.filter((item) => item.artifactStatus !== "valid").length,
      conflicts: productItems.filter((item) => item.currentStatus === "conflicted").length,
      coverage: policy.coverage,
      evidenceCompleteness: productItems.length
        ? Math.round((productItems.filter((item) => item.artifactStatus === "valid").length / productItems.length) * 100)
        : 0,
      documents: new Set(report.sourceDocumentSummary.map((document) => document.documentVersionId)).size,
      compatibility: productItems.filter((item) => /compatibility/iu.test(item.characteristic)).length,
      publicationStatus: policy.status,
      publicationReasons: policy.reasons,
    });
  }
  return {
    reviewerIdConfigured: Boolean(process.env.CYBERMEDICA_REVIEWER_ID?.trim()),
    fixtureMode:
      process.env.NODE_ENV !== "production" &&
      process.env.CYBERMEDICA_ENABLE_REVIEW_FIXTURES === "1",
    products,
    items,
    counters: {
      pending: items.filter((item) => item.currentStatus === "pending_review").length,
      inReview: items.filter((item) => item.currentStatus === "in_review").length,
      approved: items.filter((item) => item.currentStatus === "approved").length,
      rejected: items.filter((item) => item.currentStatus === "rejected").length,
      needsChanges: items.filter((item) => item.currentStatus === "needs_changes").length,
      conflicted: items.filter((item) => item.currentStatus === "conflicted").length,
      readyForPublication: products.filter((product) => product.publicationStatus === "ready_for_publication").length,
      published: products.filter((product) => product.publicationStatus === "published").length,
    },
  };
}
