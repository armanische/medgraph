"use client";

import { useActionState } from "react";

import {
  executeCatalogWave2Action,
  type CatalogWave2ActionState,
} from "@/app/internal/operations/catalog-publication-wave-2/execute/actions";

const initialState: CatalogWave2ActionState = { status: "idle", message: "" };

export default function CatalogWave2ExecutionAction() {
  const [state, action, pending] = useActionState(executeCatalogWave2Action, initialState);
  const finished = state.status === "completed" || state.status === "already_completed";
  return (
    <section>
      <form action={action}>
        <button disabled={pending || finished} type="submit">
          {pending ? "Executing approved Wave 2…" : "Execute approved Wave 2"}
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
