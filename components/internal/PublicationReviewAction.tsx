"use client";

import { useActionState } from "react";

import {
  submitPublicationHumanReview,
  type PublicationReviewActionState,
} from "@/app/internal/review/actions";

const initialState: PublicationReviewActionState = { status: "idle", message: "" };

export default function PublicationReviewAction({ revisionId }: { revisionId: string }) {
  const [state, action, pending] = useActionState(submitPublicationHumanReview, initialState);
  return (
    <section className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-5">
      <h2 className="text-lg font-semibold text-teal-950">Human Review</h2>
      <p className="mt-2 text-sm leading-6 text-teal-900">
        Кнопка создаёт только Decision для exact revision. Approval и Publication отсутствуют.
      </p>
      <form action={action} className="mt-4">
        <input name="revisionId" type="hidden" value={revisionId} />
        <button
          className="min-h-11 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || state.status === "success"}
          type="submit"
        >
          {pending ? "Подтверждение…" : "Подтвердить Human Review"}
        </button>
      </form>
      {state.message ? (
        <p className={`mt-4 text-sm ${state.status === "success" ? "text-teal-950" : "text-red-800"}`} role="status">
          {state.message}{state.decisionId ? ` Decision ID: ${state.decisionId}.` : ""}
        </p>
      ) : null}
    </section>
  );
}
