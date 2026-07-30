"use server";

import { revalidatePath } from "next/cache";

import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import {
  buildReviewRationale,
  loadPublicationReviewEvidence,
} from "@/lib/review/publication-review";
import { createInternalAuthServerClient } from "@/lib/internal-auth/supabase.server";

export type PublicationReviewActionState = {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
};

type ReviewDecisionResult = {
  reviewDecisionId?: string;
  candidateRevisionId?: string;
  productId?: string;
  reviewerId?: string;
  idempotent?: boolean;
};

export async function submitPublicationHumanReview(
  _previousState: PublicationReviewActionState,
  formData: FormData,
): Promise<PublicationReviewActionState> {
  const user = await requireTrustedReviewer();
  const revisionId = formData.get("revisionId");
  if (typeof revisionId !== "string" || revisionId.length === 0) {
    return { status: "error", message: "Revision не указана." };
  }

  const evidence = await loadPublicationReviewEvidence(revisionId);
  if (!evidence) {
    return { status: "error", message: "Revision больше не прошла fail-closed проверку." };
  }

  const supabase = await createInternalAuthServerClient();
  const { data, error } = await supabase
    .schema("cloud_api")
    .rpc("record_product_publication_review_decision_v1", {
      p_candidate_revision_id: evidence.manifest.revisionId,
      p_rationale: buildReviewRationale(evidence),
    });
  const result = data as ReviewDecisionResult | null;

  if (
    error
    || !result?.reviewDecisionId
    || result.candidateRevisionId !== evidence.manifest.revisionId
    || result.productId !== evidence.manifest.productId
    || result.reviewerId !== user.id
  ) {
    return { status: "error", message: "Human Review не сохранён." };
  }

  revalidatePath("/internal/review");
  revalidatePath(`/internal/review/${evidence.manifest.revisionId}`);
  return {
    status: "success",
    message: result.idempotent ? "Human Review уже подтверждён." : "Human Review подтверждён.",
    decisionId: result.reviewDecisionId,
  };
}
