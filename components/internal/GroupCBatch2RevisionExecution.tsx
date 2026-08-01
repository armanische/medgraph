"use client";

import { useState } from "react";

const OPERATION_KEY = "group-c-batch-2-revision-creation-v1";
const MANIFEST_SHA256 =
  "54cd498122a1cc205f8c071e85d73922a81053fc2913dbeb519fe6126befd3cd";

type RevisionEvidence = {
  productId: string;
  sourceUid: string;
  model: string;
  revisionId: string;
  reviewItemId: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  characteristics: number;
  media: number;
  warnings: string[];
};

type OperationState = {
  status: "idle" | "pending" | "completed" | "already_complete" | "blocked";
  message: string;
  created?: number;
  revisions?: RevisionEvidence[];
};

export default function GroupCBatch2RevisionExecution() {
  const [state, setState] = useState<OperationState>({ status: "idle", message: "" });
  const finished = state.status === "completed" || state.status === "already_complete";

  async function execute() {
    setState({ status: "pending", message: "Выполняется fail-closed Production preflight…" });
    try {
      const response = await fetch("/internal/operations/group-c-batch-2-revisions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationKey: OPERATION_KEY, manifestSha256: MANIFEST_SHA256 }),
      });
      const result = await response.json() as {
        status?: unknown;
        code?: unknown;
        created?: unknown;
        revisions?: RevisionEvidence[];
      };
      if (
        response.ok
        && (result.status === "completed" || result.status === "already_complete")
        && typeof result.created === "number"
        && Array.isArray(result.revisions)
      ) {
        setState({
          status: result.status,
          message: result.status === "completed"
            ? "Тринадцать immutable revisions созданы и replay-проверены."
            : "Операция уже завершена; duplicate writes не созданы.",
          created: result.created,
          revisions: result.revisions,
        });
        return;
      }
      setState({ status: "blocked", message: `Операция остановлена fail-closed: ${String(result.code ?? "unknown")}.` });
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
        {state.status === "pending" ? "Проверка и создание…" : "Создать exact 13 revisions"}
      </button>
      {state.message ? <p className="mt-4" role="status">{state.message}</p> : null}
      {finished ? (
        <>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <div><dt>Created now</dt><dd>{state.created}</dd></div>
            <div><dt>Durable revisions</dt><dd>{state.revisions?.length}</dd></div>
          </dl>
          <ol className="mt-6 space-y-4">
            {state.revisions?.map((revision) => (
              <li className="rounded-lg border border-slate-200 p-4" key={revision.productId}>
                <div className="font-semibold">{revision.model}</div>
                <dl className="mt-2 break-all text-sm">
                  <div><dt>Product ID</dt><dd>{revision.productId}</dd></div>
                  <div><dt>Source UID</dt><dd>{revision.sourceUid}</dd></div>
                  <div><dt>Revision ID</dt><dd>{revision.revisionId}</dd></div>
                  <div><dt>Review Item ID</dt><dd>{revision.reviewItemId}</dd></div>
                  <div><dt>Candidate checksum</dt><dd>{revision.candidatePayloadChecksum}</dd></div>
                  <div><dt>Payload checksum</dt><dd>{revision.payloadChecksum}</dd></div>
                  <div><dt>Identity checksum</dt><dd>{revision.productIdentityChecksum}</dd></div>
                  <div><dt>Characteristics / media</dt><dd>{revision.characteristics} / {revision.media}</dd></div>
                  <div><dt>Warnings</dt><dd>{revision.warnings.join(", ")}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
