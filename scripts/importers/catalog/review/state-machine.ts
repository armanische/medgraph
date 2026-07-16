import type {
  HumanReviewDecisionValue,
  HumanReviewStatus,
  PublicationReadinessStatus,
} from "./types.ts";

export class InvalidReviewTransitionError extends Error {
  constructor(previous: HumanReviewStatus, decision: HumanReviewDecisionValue) {
    super(`Review transition ${previous} --${decision}--> ? is not allowed.`);
    this.name = "InvalidReviewTransitionError";
  }
}

const transitions: Partial<
  Record<HumanReviewStatus, Partial<Record<HumanReviewDecisionValue, HumanReviewStatus>>>
> = {
  pending_review: { start_review: "in_review" },
  in_review: {
    approve: "approved",
    reject: "rejected",
    request_changes: "needs_changes",
    mark_conflict: "conflicted",
  },
  needs_changes: { reopen: "in_review" },
  conflicted: { reopen: "in_review" },
  approved: { mark_conflict: "conflicted" },
};

export function transitionReviewStatus(input: {
  previous: HumanReviewStatus;
  decision: HumanReviewDecisionValue;
  publicationStatus?: PublicationReadinessStatus;
}) {
  if (
    input.decision === "archive" &&
    input.previous === "approved" &&
    input.publicationStatus === "published"
  ) {
    return "archived" as const;
  }
  const next = transitions[input.previous]?.[input.decision];
  if (!next) throw new InvalidReviewTransitionError(input.previous, input.decision);
  return next;
}

export function replayReviewStatus(
  decisions: Array<Pick<
    import("./types.ts").HumanReviewDecision,
    "decision" | "previousStatus" | "nextStatus"
  >>,
) {
  let status: HumanReviewStatus = "pending_review";
  for (const decision of decisions) {
    if (decision.previousStatus !== status) {
      throw new InvalidReviewTransitionError(status, decision.decision);
    }
    if (decision.nextStatus !== "archived") {
      const expected = transitionReviewStatus({ previous: status, decision: decision.decision });
      if (expected !== decision.nextStatus) {
        throw new InvalidReviewTransitionError(status, decision.decision);
      }
    }
    status = decision.nextStatus;
  }
  return status;
}
