"use client";

import { useMemo, useState } from "react";

import {
  calculateReviewerStats,
  createReviewerDecisionDraft,
  filterReviewerFacts,
} from "@/lib/review/workspace";
import type {
  ReviewerCandidateFact,
  ReviewerDecisionDraft,
  ReviewerDraftDecisionValue,
  ReviewerFilter,
  ReviewerProductQueueItem,
  ReviewerQueueStatus,
  ReviewerWorkspaceModel,
} from "@/lib/review/types";

const filters: Array<{ id: ReviewerFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "pending", label: "Pending" },
  { id: "high", label: "High" },
  { id: "conflict", label: "Conflict" },
  { id: "needs_evidence", label: "Needs evidence" },
];

const draftOptions: Array<{
  id: ReviewerDraftDecisionValue;
  label: string;
}> = [
  { id: "approve", label: "Approve" },
  { id: "reject", label: "Reject" },
  { id: "need_more_evidence", label: "Need more evidence" },
  { id: "conflict", label: "Conflict" },
];

function statusLabel(status: ReviewerQueueStatus) {
  const labels: Record<ReviewerQueueStatus, string> = {
    pending: "Pending",
    ready: "Ready",
    needs_evidence: "Needs evidence",
    conflict: "Conflict",
  };
  return labels[status];
}

function statusClass(status: ReviewerQueueStatus) {
  if (status === "ready") return "border-teal-200 bg-teal-50 text-teal-800";
  if (status === "conflict") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "needs_evidence") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function priorityLabel(priority: ReviewerProductQueueItem["priority"]) {
  const labels = {
    critical: "Critical",
    high: "High priority",
    medium: "Medium",
    low: "Low",
  } as const;
  return labels[priority];
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-slate-950">
        {value}
      </div>
    </div>
  );
}

function ProductButton({
  product,
  selected,
  onSelect,
}: {
  product: ReviewerProductQueueItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border p-4 text-left transition duration-200 ${
        selected
          ? "border-teal-300 bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            {product.productTitle}
          </div>
          <div className="mt-1 text-xs text-slate-500">{product.manufacturer}</div>
        </div>
        <Pill className={statusClass(product.status)}>
          {statusLabel(product.status)}
        </Pill>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div>{product.factsCount} фактов</div>
        <div>{priorityLabel(product.priority)}</div>
        <div>Ready: {product.readyCount}</div>
        <div>Pending: {product.pendingCount}</div>
      </div>
    </button>
  );
}

function FactCard({
  fact,
  selected,
  draft,
  onSelect,
}: {
  fact: ReviewerCandidateFact;
  selected: boolean;
  draft: ReviewerDecisionDraft | undefined;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border bg-white p-5 text-left shadow-sm transition duration-200 ${
        selected ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-mono text-xs text-slate-500">
            {fact.characteristic}
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-950">
            {fact.value}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill className={statusClass(fact.status)}>{statusLabel(fact.status)}</Pill>
          <Pill className="border-slate-200 bg-slate-50 text-slate-700">
            {priorityLabel(fact.priority)}
          </Pill>
          {draft ? (
            <Pill className="border-violet-200 bg-violet-50 text-violet-800">
              Draft: {draft.decision}
            </Pill>
          ) : null}
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <dt className="font-medium uppercase tracking-wide text-slate-500">
            Источник
          </dt>
          <dd className="mt-1 text-slate-800">{fact.source}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide text-slate-500">
            Document Version
          </dt>
          <dd className="mt-1 break-all font-mono text-slate-700">
            {fact.documentVersion}
          </dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide text-slate-500">
            Последнее обновление
          </dt>
          <dd className="mt-1 font-mono text-slate-700">{fact.lastUpdated}</dd>
        </div>
      </dl>
      <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
        {fact.evidence}
      </div>
    </button>
  );
}

function DocumentPreview({ fact }: { fact: ReviewerCandidateFact }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Document Preview
      </div>
      <h2 className="mt-2 text-lg font-semibold text-slate-950">
        {fact.documentPreview.documentTitle}
      </h2>
      <dl className="mt-5 space-y-4 text-sm">
        {[
          ["version", fact.documentPreview.documentVersion],
          ["hash", fact.documentPreview.documentHash],
          ["page", fact.documentPreview.page],
          ["locator", fact.documentPreview.locator],
          ["source url", fact.documentPreview.sourceUrl],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-800">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DraftPanel({
  fact,
  draft,
  onDraft,
}: {
  fact: ReviewerCandidateFact;
  draft: ReviewerDecisionDraft | undefined;
  onDraft: (draft: ReviewerDecisionDraft) => void;
}) {
  const [notes, setNotes] = useState("");

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Decision Draft
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Выбор сохраняется только в локальном draft-состоянии этой страницы.
      </p>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Заметка reviewer-а"
        className="mt-4 min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      <div className="mt-3 grid gap-2">
        {draftOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              onDraft(
                createReviewerDecisionDraft({
                  factId: fact.factId,
                  decision: option.id,
                  notes,
                }),
              )
            }
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-teal-300 hover:bg-white"
          >
            {option.label}
          </button>
        ))}
      </div>
      {draft ? (
        <div className="mt-4 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950">
          <div className="font-semibold">Draft selected: {draft.decision}</div>
          <div className="mt-1">{draft.createdAt}</div>
          {draft.notes ? <p className="mt-2">{draft.notes}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function HistoryPanel({
  fact,
  draft,
}: {
  fact: ReviewerCandidateFact;
  draft: ReviewerDecisionDraft | undefined;
}) {
  const events = draft
    ? [
        ...fact.history,
        {
          eventId: draft.draftId,
          type: "decision_draft" as const,
          label: "Decision draft",
          actor: draft.reviewer,
          timestamp: draft.createdAt,
          notes: draft.notes || draft.decision,
        },
      ]
    : fact.history;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        History
      </div>
      <ol className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={event.eventId} className="border-l-2 border-slate-200 pl-3">
            <div className="text-sm font-semibold text-slate-950">
              {event.label}
            </div>
            <div className="mt-1 font-mono text-[11px] text-slate-500">
              {event.actor} · {event.timestamp}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{event.notes}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ReviewerWorkspace({
  model,
}: {
  model: ReviewerWorkspaceModel;
}) {
  const [selectedProductSlug, setSelectedProductSlug] = useState(
    model.products[0]?.productSlug ?? "",
  );
  const [filter, setFilter] = useState<ReviewerFilter>("all");
  const [bulkView, setBulkView] = useState(true);
  const [selectedFactId, setSelectedFactId] = useState(model.facts[0]?.factId ?? "");
  const [drafts, setDrafts] = useState<ReviewerDecisionDraft[]>([]);

  const productFacts = useMemo(
    () => model.facts.filter((fact) => fact.productSlug === selectedProductSlug),
    [model.facts, selectedProductSlug],
  );
  const filteredFacts = useMemo(
    () => filterReviewerFacts(productFacts, filter),
    [filter, productFacts],
  );
  const visibleFacts = bulkView ? filteredFacts : filteredFacts.slice(0, 1);
  const selectedFact =
    model.facts.find((fact) => fact.factId === selectedFactId) ??
    visibleFacts[0] ??
    model.facts[0];
  const draftByFact = new Map(drafts.map((draft) => [draft.factId, draft]));
  const stats = calculateReviewerStats(model.facts, drafts);

  function selectProduct(productSlug: string) {
    setSelectedProductSlug(productSlug);
    const firstFact = model.facts.find((fact) => fact.productSlug === productSlug);
    if (firstFact) setSelectedFactId(firstFact.factId);
  }

  function upsertDraft(draft: ReviewerDecisionDraft) {
    setDrafts((current) => [
      ...current.filter((item) => item.factId !== draft.factId),
      draft,
    ]);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Pending" value={stats.pending} />
        <Metric label="High priority" value={stats.highPriority} />
        <Metric label="Ready" value={stats.ready} />
        <Metric label="Rejected draft" value={stats.rejectedDraft} />
        <Metric label="Average review time" value={stats.averageReviewTime} />
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-sm leading-6 text-teal-950">
        <div className="font-semibold">Safety boundary</div>
        <ul className="mt-2 grid gap-1">
          {model.safetyBoundaries.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_21rem]">
        <aside className="space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Очередь изделий
            </div>
            <div className="mt-3 space-y-3">
              {model.products.map((product) => (
                <ProductButton
                  key={product.productSlug}
                  product={product}
                  selected={product.productSlug === selectedProductSlug}
                  onSelect={() => selectProduct(product.productSlug)}
                />
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Candidate Facts
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Показано: {visibleFacts.length} из {productFacts.length}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                      filter === item.id
                        ? "border-teal-300 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setBulkView((value) => !value)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-white"
                >
                  {bulkView ? "Bulk view on" : "Bulk view off"}
                </button>
              </div>
            </div>
          </div>

          {visibleFacts.length ? (
            <div className="space-y-3">
              {visibleFacts.map((fact) => (
                <FactCard
                  key={fact.factId}
                  fact={fact}
                  selected={fact.factId === selectedFact?.factId}
                  draft={draftByFact.get(fact.factId)}
                  onSelect={() => setSelectedFactId(fact.factId)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
              Для выбранного фильтра нет фактов.
            </div>
          )}
        </main>

        {selectedFact ? (
          <aside className="space-y-4">
            <DocumentPreview fact={selectedFact} />
            <DraftPanel
              fact={selectedFact}
              draft={draftByFact.get(selectedFact.factId)}
              onDraft={upsertDraft}
            />
            <HistoryPanel
              fact={selectedFact}
              draft={draftByFact.get(selectedFact.factId)}
            />
          </aside>
        ) : null}
      </section>
    </div>
  );
}
