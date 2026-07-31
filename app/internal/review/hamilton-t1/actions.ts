"use server";

export interface HamiltonReviewActionState {
  status: "idle" | "success" | "error";
  message: string;
  decisionId?: string;
  idempotent?: boolean;
}

export async function submitHamiltonHumanReview(
  previousState: HamiltonReviewActionState,
): Promise<HamiltonReviewActionState> {
  void previousState;
  return {
    status: "error",
    message: "Hamilton-T1 уже опубликован и недоступен для нового Human Review.",
  };
}
