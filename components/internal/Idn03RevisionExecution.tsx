"use client";

import { useState } from "react";

const OPERATION_KEY = "idn-03-revision-creation-v1";
const MANIFEST_SHA256 =
  "666b2ec919182fce60c625d2642db1f1b2daba522833e7a583e58e8bca78963f";

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
  revision?: RevisionEvidence;
};

export default function Idn03RevisionExecution() {
  const [state, setState] = useState<OperationState>({ status: "idle", message: "" });
  const finished = state.status === "completed" || state.status === "already_complete";

  async function execute() {
    setState({ status: "pending", message: "Выполняется fail-closed Production preflight…" });
    try {
      const response = await fetch("/internal/operations/idn-03-revision", {
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
        && result.revisions.length === 1
      ) {
        setState({
          status: result.status,
          message: result.status === "completed"
            ? "Одна immutable revision создана и replay-проверена."
            : "Операция уже завершена; duplicate writes не созданы.",
          created: result.created,
          revision: result.revisions[0],
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
        {state.status === "pending" ? "Проверка и создание…" : "Создать exact IDN-03 revision"}
      </button>
      {state.message ? <p className="mt-4" role="status">{state.message}</p> : null}
      {finished && state.revision ? (
        <dl className="mt-6 break-all text-sm">
          <div><dt>Created now</dt><dd>{state.created}</dd></div>
          <div><dt>Product</dt><dd>{state.revision.model}</dd></div>
          <div><dt>Product ID</dt><dd>{state.revision.productId}</dd></div>
          <div><dt>Source UID</dt><dd>{state.revision.sourceUid}</dd></div>
          <div><dt>Revision ID</dt><dd>{state.revision.revisionId}</dd></div>
          <div><dt>Review Item ID</dt><dd>{state.revision.reviewItemId}</dd></div>
          <div><dt>Candidate checksum</dt><dd>{state.revision.candidatePayloadChecksum}</dd></div>
          <div><dt>Payload checksum</dt><dd>{state.revision.payloadChecksum}</dd></div>
          <div><dt>Identity checksum</dt><dd>{state.revision.productIdentityChecksum}</dd></div>
          <div><dt>Characteristics / media</dt><dd>{state.revision.characteristics} / {state.revision.media}</dd></div>
          <div><dt>Warnings</dt><dd>{state.revision.warnings.join(", ")}</dd></div>
        </dl>
      ) : null}
    </section>
  );
}
