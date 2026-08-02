"use client";

import { useState } from "react";

const OPERATION_KEY = "group-c-batch-3-publication-v1";
const MANIFEST_SHA256 =
  "f0889e6738b984d18445c8fe2af42bbbf1dd6de68a373c3f66d3d37aa020fb3f";

type OperationState = {
  status: "idle" | "pending" | "completed" | "already_complete" | "blocked";
  message: string;
  published?: number;
  approvals?: { revisionId: string; approvalId: string }[];
  publications?: {
    productId: string;
    revisionId: string;
    publicationBatchId: string;
    publicationVersion: number;
    slug: string;
  }[];
};

export default function GroupCBatch3PublicationExecution() {
  const [state, setState] = useState<OperationState>({ status: "idle", message: "" });
  const finished = state.status === "completed" || state.status === "already_complete";

  async function execute() {
    setState({ status: "pending", message: "Выполняется fail-closed Production preflight…" });
    try {
      const response = await fetch("/internal/operations/group-c-batch-3-publication", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationKey: OPERATION_KEY, manifestSha256: MANIFEST_SHA256 }),
      });
      const result = await response.json() as {
        status?: unknown;
        code?: unknown;
        approvals?: OperationState["approvals"];
        publications?: OperationState["publications"];
        totals?: { published?: unknown };
      };
      if (
        response.ok
        && (result.status === "completed" || result.status === "already_complete")
        && result.approvals?.length === 7
        && result.publications?.length === 7
        && result.totals?.published === 70
      ) {
        setState({
          status: result.status,
          message: result.status === "completed"
            ? "Approval 7/7 и Publication 7/7 завершены и replay-проверены."
            : "Операция уже завершена; duplicate lifecycle writes не созданы.",
          published: 70,
          approvals: result.approvals,
          publications: result.publications,
        });
        return;
      }
      setState({
        status: "blocked",
        message: `Операция остановлена fail-closed: ${String(result.code ?? "unknown")}.`,
      });
    } catch {
      setState({ status: "blocked", message: "Операция остановлена fail-closed." });
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
      <button
        className="rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50"
        disabled={state.status === "pending" || finished}
        onClick={execute}
        type="button"
      >
        {state.status === "pending" ? "Проверка и публикация…" : "Опубликовать exact 7 Products"}
      </button>
      {state.message ? <p className="mt-4" role="status">{state.message}</p> : null}
      {finished ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <div><dt>Published Products</dt><dd>{state.published}</dd></div>
          <div><dt>Approvals</dt><dd>{state.approvals?.length}</dd></div>
          <div><dt>Publication Batches</dt><dd>{state.publications?.length}</dd></div>
        </dl>
      ) : null}
    </section>
  );
}
