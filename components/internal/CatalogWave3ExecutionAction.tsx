"use client";

import { useActionState } from "react";

import {
  executeCatalogWave3Action,
  type CatalogWave3ActionState,
} from "@/app/internal/operations/catalog-publication-wave-3/execute/actions";

const initialState: CatalogWave3ActionState = { status: "idle", message: "" };

export default function CatalogWave3ExecutionAction() {
  const [state, action, pending] = useActionState(executeCatalogWave3Action, initialState);
  const finished = state.status === "completed" || state.status === "already_completed";
  return (
    <section>
      <form action={action}>
        <button disabled={pending || finished} type="submit">
          {pending ? "Executing approved Wave 3…" : "Execute approved Wave 3"}
        </button>
      </form>
      {state.message ? <p role="status">{state.message}</p> : null}
      {finished ? (
        <dl>
          <dt>Published Products</dt><dd>{state.published}</dd>
          <dt>Approvals</dt><dd>{state.approvals}</dd>
          <dt>Publication Batches</dt><dd>{state.publicationBatches}</dd>
          <dt>Remaining reviewed unpublished</dt><dd>{state.remainingReviewedUnpublished}</dd>
        </dl>
      ) : null}
    </section>
  );
}
