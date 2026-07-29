"use server";

import { revalidatePath } from "next/cache";

import {
  APPROVED_REVIEWER,
  HAMILTON_REVIEW,
  HAMILTON_REVIEW_PATH,
} from "@/lib/internal-auth/constants";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { createInternalAuthServerClient } from "@/lib/internal-auth/supabase.server";

export interface HamiltonReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
  idempotent?: boolean;
}

interface ReviewDecisionResult {
  reviewDecisionId?: string;
  candidateRevisionId?: string;
  productId?: string;
  reviewerId?: string;
  payloadChecksum?: string;
  idempotent?: boolean;
}

export const initialHamiltonReviewActionState: HamiltonReviewActionState = {
  status: "idle",
  message: "",
};

export async function submitHamiltonHumanReview(
  previousState: HamiltonReviewActionState,
): Promise<HamiltonReviewActionState> {
  void previousState;
  const user = await requireTrustedReviewer();
  if (user.id !== APPROVED_REVIEWER.userId) {
    return { status: "error", message: "Human Review отклонён." };
  }

  const supabase = await createInternalAuthServerClient();
  const { data, error } = await supabase
    .schema("cloud_api")
    .rpc("record_product_publication_review_decision_v1", {
      p_candidate_revision_id: HAMILTON_REVIEW.revisionId,
      p_rationale: HAMILTON_REVIEW.rationale,
    });

  const result = data as ReviewDecisionResult | null;
  if (
    error
    || !result?.reviewDecisionId
    || result.candidateRevisionId !== HAMILTON_REVIEW.revisionId
    || result.productId !== HAMILTON_REVIEW.productId
    || result.reviewerId !== APPROVED_REVIEWER.userId
    || result.payloadChecksum !== HAMILTON_REVIEW.payloadChecksum
  ) {
    return { status: "error", message: "Human Review не сохранён." };
  }

  revalidatePath(HAMILTON_REVIEW_PATH);
  return {
    status: "success",
    message: result.idempotent
      ? "Human Review уже подтверждён этой trusted identity."
      : "Human Review подтверждён.",
    decisionId: result.reviewDecisionId,
    idempotent: result.idempotent === true,
  };
}
