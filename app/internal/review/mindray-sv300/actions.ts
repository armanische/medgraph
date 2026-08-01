"use server";

export interface MindrayReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
  idempotent?: boolean;
}

export async function submitMindrayHumanReview(
  previousState: MindrayReviewActionState,
): Promise<MindrayReviewActionState> {
  void previousState;
  return {
    status: "error",
    message: "Mindray SV300 уже опубликован и недоступен для нового Human Review.",
  };
}
