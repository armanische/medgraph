"use server";

import { revalidatePath } from "next/cache";

import {
  AGILIA_REVIEW,
  AGILIA_REVIEW_PATH,
  APPROVED_REVIEWER,
} from "@/lib/internal-auth/constants";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { createInternalAuthServerClient } from "@/lib/internal-auth/supabase.server";

export interface AgiliaReviewActionState {
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

export async function submitAgiliaHumanReview(
  previousState: AgiliaReviewActionState,
): Promise<AgiliaReviewActionState> {
  void previousState;
  const user = await requireTrustedReviewer();
  if (user.id !== APPROVED_REVIEWER.userId) {
    return { status: "error", message: "Human Review отклонён." };
  }

  const supabase = await createInternalAuthServerClient();
  const { data, error } = await supabase
    .schema("cloud_api")
    .rpc("record_product_publication_review_decision_v1", {
      p_candidate_revision_id: AGILIA_REVIEW.revisionId,
      p_rationale: AGILIA_REVIEW.rationale,
    });

  const result = data as ReviewDecisionResult | null;
  if (
    error
    || !result?.reviewDecisionId
    || result.candidateRevisionId !== AGILIA_REVIEW.revisionId
    || result.productId !== AGILIA_REVIEW.productId
    || result.reviewerId !== APPROVED_REVIEWER.userId
    || result.payloadChecksum !== AGILIA_REVIEW.payloadChecksum
  ) {
    return { status: "error", message: "Human Review не сохранён." };
  }

  revalidatePath(AGILIA_REVIEW_PATH);
  return {
    status: "success",
    message: result.idempotent
      ? "Human Review уже подтверждён этой trusted identity."
      : "Human Review подтверждён.",
    decisionId: result.reviewDecisionId,
    idempotent: result.idempotent === true,
  };
}
