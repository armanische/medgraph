"use server";

import { revalidatePath } from "next/cache";

import { internalReviewEnabled } from "@/lib/internal-access";
import { submitHumanReviewDecision } from "@/scripts/importers/catalog/review/review-service";
import { writeHumanReviewSummary } from "@/scripts/importers/catalog/review/review-summary";
import type {
  HumanReviewDecisionValue,
  HumanReviewStatus,
} from "@/scripts/importers/catalog/review/types";

export interface ReviewActionState {
  ok: boolean;
  message: string;
  decisionId?: string;
}

const allowedDecisions = new Set<HumanReviewDecisionValue>([
  "start_review",
  "approve",
  "reject",
  "request_changes",
  "mark_conflict",
  "reopen",
  "archive",
]);
const allowedStatuses = new Set<HumanReviewStatus>([
  "pending_review",
  "in_review",
  "approved",
  "rejected",
  "needs_changes",
  "conflicted",
  "archived",
]);
const recentWrites = new Map<string, number>();

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitReviewAction(
  _previous: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  try {
    if (!internalReviewEnabled()) throw new Error("Reviewer Workspace is disabled.");
    const reviewerId = process.env.CYBERMEDICA_REVIEWER_ID?.trim();
    if (process.env.NODE_ENV === "production" && !reviewerId) {
      throw new Error("Reviewer identity is not configured.");
    }
    const key = reviewerId || "development-reviewer";
    const now = Date.now();
    if (now - (recentWrites.get(key) ?? 0) < 350) {
      throw new Error("Слишком частые действия. Обновите страницу и повторите.");
    }
    recentWrites.set(key, now);
    const decision = field(formData, "decision") as HumanReviewDecisionValue;
    const expectedStatus = field(formData, "expectedStatus") as HumanReviewStatus;
    if (!allowedDecisions.has(decision) || !allowedStatuses.has(expectedStatus)) {
      throw new Error("Недопустимое действие или статус.");
    }
    const result = await submitHumanReviewDecision({
      reviewItemId: field(formData, "reviewItemId"),
      decision,
      comment: field(formData, "comment"),
      expectedSnapshotHash: field(formData, "snapshotHash"),
      expectedStatus,
      idempotencyKey: field(formData, "idempotencyKey"),
      reviewerId: reviewerId || undefined,
      publicationStatus: field(formData, "publicationStatus") === "published"
        ? "published"
        : "not_ready",
    });
    await writeHumanReviewSummary();
    revalidatePath("/internal/reviewer");
    return {
      ok: true,
      message: result.created ? "Решение сохранено." : "Это решение уже было сохранено.",
      decisionId: result.decision.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Не удалось сохранить решение.",
    };
  }
}
