import { createDecisionId, FileReviewDecisionStore } from "./decision-store.ts";
import { findReviewItem, loadReviewContext, type ReviewContext } from "./loader.ts";
import { evaluateItemPublicationEligibility } from "./publication-policy.ts";
import { createReviewItemSnapshot } from "./snapshot.ts";
import { replayReviewStatus, transitionReviewStatus } from "./state-machine.ts";
import type {
  HumanReviewDecision,
  HumanReviewDecisionValue,
  PublicationReadinessStatus,
  ReviewDecisionStore,
} from "./types.ts";

function requiredComment(decision: HumanReviewDecisionValue) {
  return ["reject", "request_changes", "mark_conflict", "reopen", "archive"].includes(decision);
}

export function resolveReviewerId(input?: {
  env?: Readonly<Record<string, string | undefined>>;
  nodeEnv?: string;
}) {
  const env = input?.env ?? process.env;
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV;
  const configured = env.CYBERMEDICA_REVIEWER_ID?.trim();
  if (configured && /^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,99}$/u.test(configured)) return configured;
  if (nodeEnv !== "production") return "development-reviewer";
  throw new Error("CYBERMEDICA_REVIEWER_ID is required in production.");
}

export async function submitHumanReviewDecision(input: {
  reviewItemId: string;
  decision: HumanReviewDecisionValue;
  comment?: string;
  expectedSnapshotHash: string;
  expectedStatus: import("./types.ts").HumanReviewStatus;
  idempotencyKey: string;
  reviewedAt?: string;
  reviewerId?: string;
  publicationStatus?: PublicationReadinessStatus;
  context?: ReviewContext;
  store?: ReviewDecisionStore & { rebuildIndexes?(decisions?: HumanReviewDecision[]): Promise<void> };
}) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/u.test(input.reviewItemId)) {
    throw new Error("Invalid reviewItemId.");
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{7,199}$/u.test(input.idempotencyKey)) {
    throw new Error("Invalid idempotency key.");
  }
  if (!/^[a-f0-9]{64}$/u.test(input.expectedSnapshotHash)) {
    throw new Error("Invalid snapshot hash.");
  }
  const comment = input.comment?.trim() ?? "";
  if (comment.length > 2000) throw new Error("Comment is too long.");
  if (requiredComment(input.decision) && !comment) {
    throw new Error(`Comment is required for ${input.decision}.`);
  }
  const context = input.context ?? (await loadReviewContext());
  const found = findReviewItem(context, input.reviewItemId);
  if (!found) throw new Error("Review item was not found.");
  const snapshot = createReviewItemSnapshot({
    ...found,
    artifacts: context.artifacts,
    integrityViolations: context.integrityViolations,
  });
  if (snapshot.hash !== input.expectedSnapshotHash) {
    throw new Error("Stale review item snapshot. Reload the workspace and try again.");
  }
  const reviewerId = input.reviewerId ?? resolveReviewerId();
  const store = input.store ?? new FileReviewDecisionStore();
  const execute = async () => {
    const all = await store.list();
    const existing = all.find((decision) => decision.idempotencyKey === input.idempotencyKey);
    if (existing) {
      if (existing.reviewItemId !== input.reviewItemId || existing.reviewerId !== reviewerId) {
        throw new Error("Duplicate idempotency key.");
      }
      return { decision: existing, created: false };
    }
    const itemHistory = all.filter((decision) => decision.reviewItemId === input.reviewItemId);
    const currentStatus = replayReviewStatus(itemHistory);
    if (currentStatus !== input.expectedStatus) {
      throw new Error("Stale review status. Reload the workspace and try again.");
    }
    const nextStatus = transitionReviewStatus({
      previous: currentStatus,
      decision: input.decision,
      publicationStatus: input.publicationStatus,
    });
    const id = createDecisionId({
      reviewItemId: input.reviewItemId,
      reviewerId,
      idempotencyKey: input.idempotencyKey,
    });
    const eligibility =
      input.decision === "approve"
        ? evaluateItemPublicationEligibility(snapshot)
        : {
            eligible: false,
            status: "not_ready" as const,
            reasons: [`review_status_${nextStatus}`],
          };
    const decision: HumanReviewDecision = {
      id,
      idempotencyKey: input.idempotencyKey,
      reviewItemId: input.reviewItemId,
      productSlug: found.report.product.productSlug,
      reviewerId,
      decision: input.decision,
      previousStatus: currentStatus,
      nextStatus,
      comment,
      reviewedAt: input.reviewedAt ?? new Date().toISOString(),
      snapshotHash: snapshot.hash,
      evidenceSnapshot: snapshot.evidence,
      valueSnapshot: snapshot.value,
      sourceSnapshot: snapshot.sources,
      documentVersionSnapshot: snapshot.documentVersions,
      conflictReason: input.decision === "mark_conflict" ? comment : null,
      publicationEligibility: eligibility,
      schemaVersion: "human-review-decision-v1",
    };
    const result = await store.append(decision);
    if (store.rebuildIndexes) await store.rebuildIndexes();
    return result;
  };
  const lockable = store as typeof store & {
    withItemLock?<T>(reviewItemId: string, operation: () => Promise<T>): Promise<T>;
  };
  return lockable.withItemLock
    ? lockable.withItemLock(input.reviewItemId, execute)
    : execute();
}
