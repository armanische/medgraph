"use server";

export interface AgiliaReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
  idempotent?: boolean;
}

export async function submitAgiliaHumanReview(
  previousState: AgiliaReviewActionState,
): Promise<AgiliaReviewActionState> {
  void previousState;
  return {
    status: "error",
    message: "Agilia SP MC уже опубликован и недоступен для нового Human Review.",
  };
}
