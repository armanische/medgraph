"use client";

import { useActionState } from "react";

import {
  executeGroupBSixPublicationAction,
  type GroupBSixPublicationActionState,
} from "@/app/internal/operations/group-b-six-publication/execute/actions";

const initialState: GroupBSixPublicationActionState = { status: "idle", message: "" };

export default function GroupBSixPublicationExecutionAction() {
  const [state, action, pending] = useActionState(
    executeGroupBSixPublicationAction,
    initialState,
  );
  const finished = state.status === "completed" || state.status === "already_completed";
  return (
    <section>
      <form action={action}>
        <button disabled={pending || finished} type="submit">
          {pending ? "Executing approved Group B six…" : "Execute approved Group B six"}
        </button>
      </form>
      {state.message ? <p role="status">{state.message}</p> : null}
      {finished ? (
        <dl>
          <dt>Published Products</dt><dd>{state.published}</dd>
          <dt>Approvals</dt><dd>{state.approvals}</dd>
          <dt>Publication Batches</dt><dd>{state.publicationBatches}</dd>
          <dt>Remaining reviewed unpublished</dt>
          <dd>{state.remainingReviewedUnpublished}</dd>
        </dl>
      ) : null}
    </section>
  );
}
