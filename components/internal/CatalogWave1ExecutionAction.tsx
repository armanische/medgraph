"use client";

import { useActionState } from "react";

import {
  executeCatalogWave1Action,
  type CatalogWave1ActionState,
} from "@/app/internal/operations/catalog-publication-wave/execute/actions";

const initialState: CatalogWave1ActionState = { status: "idle", message: "" };

export default function CatalogWave1ExecutionAction() {
  const [state, action, pending] = useActionState(executeCatalogWave1Action, initialState);
  const finished = state.status === "completed" || state.status === "already_completed";
  return (
    <section>
      <form action={action}>
        <button disabled={pending || finished} type="submit">
          {pending ? "Executing approved Wave 1…" : "Execute approved Wave 1"}
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
