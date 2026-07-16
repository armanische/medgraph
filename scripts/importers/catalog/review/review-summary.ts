import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { FileReviewDecisionStore } from "./decision-store.ts";
import { loadReviewContext, type ReviewContext } from "./loader.ts";
import { evaluateProductPublicationPolicy } from "./publication-policy.ts";
import { createReviewItemSnapshot } from "./snapshot.ts";
import { replayReviewStatus, transitionReviewStatus } from "./state-machine.ts";
import type {
  HumanReviewDecision,
  HumanReviewStatus,
  HumanReviewSummary,
  ReviewAuditIssue,
  ReviewAuditResult,
} from "./types.ts";

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

function latestByItem(decisions: HumanReviewDecision[]) {
  const map = new Map<string, HumanReviewDecision>();
  for (const decision of decisions) map.set(decision.reviewItemId, decision);
  return map;
}

async function publishedSlugs(publicRoot: string) {
  try {
    const catalog = JSON.parse(
      await readFile(join(publicRoot, "summary.generated.json"), "utf8"),
    ) as { products?: Array<{ slug: string }> };
    return new Set((catalog.products ?? []).map((product) => product.slug));
  } catch {
    return new Set<string>();
  }
}

export async function buildHumanReviewSummary(input?: {
  context?: ReviewContext;
  decisions?: HumanReviewDecision[];
  publicRoot?: string;
}): Promise<HumanReviewSummary> {
  const context = input?.context ?? (await loadReviewContext());
  const decisions = input?.decisions ?? (await new FileReviewDecisionStore().list());
  const published = await publishedSlugs(
    input?.publicRoot ?? join(process.cwd(), "data/public"),
  );
  const byItem = new Map<string, HumanReviewDecision[]>();
  for (const decision of decisions) {
    byItem.set(decision.reviewItemId, [...(byItem.get(decision.reviewItemId) ?? []), decision]);
  }
  const statuses: Record<HumanReviewStatus, number> = {
    pending_review: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    needs_changes: 0,
    conflicted: 0,
    archived: 0,
  };
  const countsByManufacturer: Record<string, number> = {};
  const countsByCategory: Record<string, number> = {};
  const countsByReviewer: Record<string, number> = {};
  const latest = latestByItem(decisions);
  let totalItems = 0;
  let publicationReady = 0;
  for (const report of context.reports) {
    totalItems += report.reviewItems.length;
    for (const item of report.reviewItems) {
      const status = replayReviewStatus(byItem.get(item.reviewItemId) ?? []);
      statuses[status] += 1;
      increment(countsByManufacturer, report.product.manufacturer ?? "Unknown");
      increment(countsByCategory, report.product.category || "Unknown");
    }
    const policy = evaluateProductPublicationPolicy({
      report,
      items: report.reviewItems,
      latestDecisions: latest,
      published: published.has(report.product.productSlug),
    });
    if (policy.status === "ready_for_publication") publicationReady += 1;
  }
  for (const decision of decisions) increment(countsByReviewer, decision.reviewerId);
  return {
    schemaVersion: "human-review-summary-v1",
    generatedAt: "human-review-summary-v1",
    totalItems,
    pending: statuses.pending_review,
    inReview: statuses.in_review,
    approved: statuses.approved,
    rejected: statuses.rejected,
    needsChanges: statuses.needs_changes,
    conflicted: statuses.conflicted,
    archived: statuses.archived,
    publicationReady,
    published: published.size,
    countsByManufacturer,
    countsByCategory,
    countsByReviewer,
    recentDecisions: [...decisions]
      .sort((left, right) => `${right.reviewedAt}:${right.id}`.localeCompare(`${left.reviewedAt}:${left.id}`))
      .slice(0, 20)
      .map((decision) => ({
        id: decision.id,
        reviewItemId: decision.reviewItemId,
        reviewerId: decision.reviewerId,
        decision: decision.decision,
        reviewedAt: decision.reviewedAt,
      })),
  };
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.part`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

export async function writeHumanReviewSummary(input?: {
  store?: FileReviewDecisionStore;
  context?: ReviewContext;
  summaryPath?: string;
  publicRoot?: string;
}) {
  const store = input?.store ?? new FileReviewDecisionStore();
  const decisions = await store.list();
  const summary = await buildHumanReviewSummary({
    context: input?.context,
    decisions,
    publicRoot: input?.publicRoot,
  });
  await store.rebuildIndexes(decisions);
  await writeJsonAtomic(
    input?.summaryPath ?? join(store.root, "summary.generated.json"),
    summary,
  );
  return summary;
}

export async function auditHumanReview(input?: {
  context?: ReviewContext;
  decisions?: HumanReviewDecision[];
  publicRoot?: string;
}): Promise<ReviewAuditResult> {
  const context = input?.context ?? (await loadReviewContext());
  const decisions = input?.decisions ?? (await new FileReviewDecisionStore().list());
  const published = await publishedSlugs(
    input?.publicRoot ?? join(process.cwd(), "data/public"),
  );
  const issues: ReviewAuditIssue[] = [];
  const known = new Map(
    context.reports.flatMap((report) =>
      report.reviewItems.map((item) => [item.reviewItemId, { report, item }] as const),
    ),
  );
  const ids = new Set<string>();
  const idempotency = new Set<string>();
  const byItem = new Map<string, HumanReviewDecision[]>();
  let orphanDecisions = 0;
  let duplicateIdempotencyKeys = 0;
  let staleSnapshots = 0;
  let invalidTransitions = 0;
  for (const decision of decisions) {
    if (ids.has(decision.id)) issues.push({ code: "duplicate_decision", message: "Duplicate decision ID.", decisionId: decision.id });
    ids.add(decision.id);
    if (idempotency.has(decision.idempotencyKey)) {
      duplicateIdempotencyKeys += 1;
      issues.push({ code: "duplicate_idempotency_key", message: "Duplicate idempotency key.", decisionId: decision.id });
    }
    idempotency.add(decision.idempotencyKey);
    if (!decision.reviewerId) issues.push({ code: "missing_reviewer", message: "Reviewer is missing.", decisionId: decision.id });
    if (Number.isNaN(Date.parse(decision.reviewedAt))) issues.push({ code: "missing_timestamp", message: "Timestamp is invalid.", decisionId: decision.id });
    const found = known.get(decision.reviewItemId);
    if (!found) {
      orphanDecisions += 1;
      issues.push({ code: "orphan_decision", message: "Review item does not exist.", decisionId: decision.id });
    } else {
      const snapshot = createReviewItemSnapshot({
        ...found,
        artifacts: context.artifacts,
        integrityViolations: context.integrityViolations,
      });
      if (snapshot.hash !== decision.snapshotHash) {
        staleSnapshots += 1;
        issues.push({ code: "stale_snapshot", message: "Decision snapshot differs from current item.", decisionId: decision.id });
      }
    }
    byItem.set(decision.reviewItemId, [...(byItem.get(decision.reviewItemId) ?? []), decision]);
  }
  for (const history of byItem.values()) {
    let status: HumanReviewStatus = "pending_review";
    for (const decision of history) {
      try {
        if (decision.previousStatus !== status) throw new Error("previous");
        const expected = transitionReviewStatus({
          previous: status,
          decision: decision.decision,
          publicationStatus: published.has(decision.productSlug) ? "published" : "not_ready",
        });
        if (expected !== decision.nextStatus) throw new Error("next");
        status = expected;
      } catch {
        invalidTransitions += 1;
        issues.push({ code: "invalid_transition", message: "Decision transition is invalid.", decisionId: decision.id });
      }
    }
  }
  const latest = latestByItem(decisions);
  for (const report of context.reports) {
    const policy = evaluateProductPublicationPolicy({
      report,
      items: report.reviewItems,
      latestDecisions: latest,
      published: published.has(report.product.productSlug),
    });
    if (published.has(report.product.productSlug) && !policy.eligible) {
      issues.push({ code: "publication_status_mismatch", message: `${report.product.productSlug} is published but not eligible.` });
    }
  }
  return {
    valid: issues.length === 0,
    issues,
    decisions: decisions.length,
    orphanDecisions,
    duplicateIdempotencyKeys,
    staleSnapshots,
    invalidTransitions,
  };
}
