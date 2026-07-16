"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  submitReviewAction,
  type ReviewActionState,
} from "@/app/internal/reviewer/actions";
import type {
  HumanReviewerItem,
  HumanReviewerWorkspaceModel,
} from "@/lib/review/human-types";
import type {
  HumanReviewDecisionValue,
  HumanReviewStatus,
  PublicationReadinessStatus,
} from "@/scripts/importers/catalog/review/types";

const initialActionState: ReviewActionState = { ok: false, message: "" };

const statusLabels: Record<HumanReviewStatus, string> = {
  pending_review: "Ожидает проверки",
  in_review: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
  needs_changes: "Нужны изменения",
  conflicted: "Конфликт",
  archived: "Архив",
};

const publicationLabels: Record<PublicationReadinessStatus, string> = {
  not_ready: "Не готово",
  ready_for_publication: "Готово к публикации",
  published: "Опубликовано",
  publication_blocked: "Публикация заблокирована",
};

const actionLabels: Record<HumanReviewDecisionValue, string> = {
  start_review: "Начать проверку",
  approve: "Одобрить",
  reject: "Отклонить",
  request_changes: "Запросить изменения",
  mark_conflict: "Отметить конфликт",
  reopen: "Вернуть на проверку",
  archive: "Архивировать",
};

function actionsFor(item: HumanReviewerItem): HumanReviewDecisionValue[] {
  if (item.currentStatus === "pending_review") return ["start_review"];
  if (item.currentStatus === "in_review") {
    return ["approve", "reject", "request_changes", "mark_conflict"];
  }
  if (item.currentStatus === "needs_changes" || item.currentStatus === "conflicted") {
    return ["reopen"];
  }
  if (item.currentStatus === "approved") {
    return item.publicationStatus === "published"
      ? ["mark_conflict", "archive"]
      : ["mark_conflict"];
  }
  return [];
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function DecisionForm({ item }: { item: HumanReviewerItem }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitReviewAction, initialActionState);
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok, state.decisionId]);
  const idempotencyPrefix = `${item.reviewItemId}-${item.currentStatus}-${item.snapshotHash.slice(0, 12)}`;
  return (
    <form action={action} className="rounded-xl border border-slate-200 bg-white p-5">
      <input type="hidden" name="reviewItemId" value={item.reviewItemId} />
      <input type="hidden" name="snapshotHash" value={item.snapshotHash} />
      <input type="hidden" name="expectedStatus" value={item.currentStatus} />
      <input type="hidden" name="publicationStatus" value={item.publicationStatus} />
      <input type="hidden" name="idempotencyKey" value={idempotencyPrefix} />
      <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">Решение эксперта</div>
      <textarea
        name="comment"
        maxLength={2000}
        placeholder="Комментарий обязателен для отклонения, изменений, конфликта, возврата и архива"
        className="mt-3 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="mt-3 grid gap-2">
        {actionsFor(item).map((decision) => (
          <button
            key={decision}
            name="decision"
            value={decision}
            disabled={pending}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold hover:border-teal-300 disabled:opacity-50"
          >
            {actionLabels[decision]}
          </button>
        ))}
      </div>
      {state.message ? (
        <p aria-live="polite" className={`mt-3 text-sm ${state.ok ? "text-teal-700" : "text-rose-700"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default function ReviewerWorkspace({ model }: { model: HumanReviewerWorkspaceModel }) {
  const [selectedProduct, setSelectedProduct] = useState(model.products[0]?.productSlug ?? "");
  const [selectedItem, setSelectedItem] = useState(model.items[0]?.reviewItemId ?? "");
  const [manufacturer, setManufacturer] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [priority, setPriority] = useState("all");
  const [documentType, setDocumentType] = useState("all");
  const [evidence, setEvidence] = useState("all");
  const [readiness, setReadiness] = useState("all");
  const [reviewed, setReviewed] = useState("all");
  const [conflicts, setConflicts] = useState("all");
  const [sort, setSort] = useState("highest_priority");
  const filtered = useMemo(() => {
    const rank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    return model.items
      .filter((item) => !selectedProduct || item.productSlug === selectedProduct)
      .filter((item) => manufacturer === "all" || item.manufacturer === manufacturer)
      .filter((item) => category === "all" || item.category === category)
      .filter((item) => status === "all" || item.currentStatus === status)
      .filter((item) => risk === "all" || item.risk === risk)
      .filter((item) => priority === "all" || item.priority === priority)
      .filter((item) => documentType === "all" || item.documentType === documentType)
      .filter((item) => evidence === "all" || (evidence === "valid") === (item.artifactStatus === "valid"))
      .filter((item) => readiness === "all" || item.publicationStatus === readiness)
      .filter((item) => reviewed === "all" || (reviewed === "reviewed") === (item.history.length > 0))
      .filter((item) => conflicts === "all" || (conflicts === "with_conflicts") === (item.currentStatus === "conflicted"))
      .sort((left, right) => {
        if (sort === "oldest_pending") return left.updatedAt.localeCompare(right.updatedAt);
        if (sort === "manufacturer") return left.manufacturer.localeCompare(right.manufacturer, "ru-RU");
        if (sort === "product") return left.productTitle.localeCompare(right.productTitle, "ru-RU");
        if (sort === "characteristic") return left.characteristic.localeCompare(right.characteristic, "ru-RU");
        if (sort === "best_evidence") return Number(right.artifactStatus === "valid") - Number(left.artifactStatus === "valid");
        if (sort === "lowest_evidence") return Number(left.artifactStatus === "valid") - Number(right.artifactStatus === "valid");
        if (sort === "highest_risk") return rank[right.risk] - rank[left.risk];
        return rank[right.priority] - rank[left.priority];
      });
  }, [category, conflicts, documentType, evidence, manufacturer, model.items, priority, readiness, reviewed, risk, selectedProduct, sort, status]);
  const item = model.items.find((candidate) => candidate.reviewItemId === selectedItem) ?? filtered[0];
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "ru-RU"));

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Metric label="Ожидают" value={model.counters.pending} />
        <Metric label="На проверке" value={model.counters.inReview} />
        <Metric label="Одобрено" value={model.counters.approved} />
        <Metric label="Отклонено" value={model.counters.rejected} />
        <Metric label="Изменения" value={model.counters.needsChanges} />
        <Metric label="Конфликты" value={model.counters.conflicted} />
        <Metric label="Готовы" value={model.counters.readyForPublication} />
        <Metric label="Опубликовано" value={model.counters.published} />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        {model.products.map((product) => (
          <button key={product.productSlug} onClick={() => { setSelectedProduct(product.productSlug); setSelectedItem(model.items.find((candidate) => candidate.productSlug === product.productSlug)?.reviewItemId ?? ""); }} className={`rounded-xl border p-4 text-left ${selectedProduct === product.productSlug ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-white"}`}>
            <div className="text-sm font-bold">{product.productTitle}</div>
            <div className="mt-1 text-xs text-slate-500">{product.manufacturer}</div>
            <div className="mt-3 text-xs">{product.approved}/{product.total} одобрено · evidence {product.evidenceCompleteness}%</div>
            <div className="mt-2 text-xs font-semibold text-teal-700">{publicationLabels[product.publicationStatus]}</div>
            {product.publicationReasons.length ? <div className="mt-1 text-[10px] text-slate-500">Причины: {product.publicationReasons.join(", ")}</div> : null}
          </button>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Select label="Производитель" value={manufacturer} onChange={setManufacturer} options={unique(model.items.map((entry) => entry.manufacturer))} />
          <Select label="Категория" value={category} onChange={setCategory} options={unique(model.items.map((entry) => entry.category))} />
          <Select label="Статус" value={status} onChange={setStatus} options={Object.keys(statusLabels)} labels={statusLabels} />
          <Select label="Риск" value={risk} onChange={setRisk} options={["critical", "high", "medium", "low"].filter((entry) => entry !== "critical")} />
          <Select label="Приоритет" value={priority} onChange={setPriority} options={["critical", "high", "medium", "low"]} />
          <Select label="Документ" value={documentType} onChange={setDocumentType} options={unique(model.items.map((entry) => entry.documentType))} />
          <Select label="Evidence" value={evidence} onChange={setEvidence} options={["valid", "invalid"]} />
          <Select label="Готовность" value={readiness} onChange={setReadiness} options={Object.keys(publicationLabels)} labels={publicationLabels} />
          <Select label="Проверено" value={reviewed} onChange={setReviewed} options={["reviewed", "unreviewed"]} />
          <Select label="Конфликты" value={conflicts} onChange={setConflicts} options={["with_conflicts", "without_conflicts"]} />
          <Select label="Сортировка" value={sort} onChange={setSort} options={["highest_priority", "highest_risk", "oldest_pending", "manufacturer", "product", "characteristic", "best_evidence", "lowest_evidence"]} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-3">
          {filtered.map((entry) => (
            <button key={entry.reviewItemId} onClick={() => setSelectedItem(entry.reviewItemId)} className={`w-full rounded-xl border bg-white p-4 text-left ${item?.reviewItemId === entry.reviewItemId ? "border-teal-400 ring-2 ring-teal-100" : "border-slate-200"}`}>
              <div className="flex justify-between gap-4"><div><div className="font-mono text-xs text-slate-500">{entry.characteristic}</div><div className="mt-2 font-semibold">{entry.value}{entry.unit ? ` ${entry.unit}` : ""}</div></div><div className="text-xs font-semibold text-teal-700">{statusLabels[entry.currentStatus]}</div></div>
              <div className="mt-3 text-xs text-slate-600">{entry.rawText}</div>
            </button>
          ))}
        </div>
        {item ? (
          <aside className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
              <div className="text-xs font-semibold uppercase text-teal-700">Evidence</div>
              <dl className="mt-4 space-y-3">
                <Row label="Источник" value={item.evidenceSource} />
                <Row label="URL" value={item.officialSourceUrl} />
                <Row label="Тип документа" value={item.documentType} />
                <Row label="Версия" value={item.documentVersion} />
                <Row label="Artifact" value={item.artifactStatus} />
                <Row label="Локатор" value={item.locator} />
                <Row label="Профиль" value={item.extractionProfile} />
                <Row label="Confidence" value={item.confidence === null ? "не указана" : String(item.confidence)} />
                <Row label="Публикация" value={publicationLabels[item.publicationStatus]} />
                <Row label="Предупреждения" value={item.warnings.length ? item.warnings.join(", ") : "нет"} />
              </dl>
            </section>
            <DecisionForm item={item} />
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase text-teal-700">История решений</div>
              <ol className="mt-4 space-y-3 text-sm">
                {item.history.length ? item.history.map((event) => (
                  <li key={event.id} className="border-l-2 border-slate-200 pl-3">
                    <div className="font-semibold">{actionLabels[event.decision]} · {statusLabels[event.nextStatus]}</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-500">{event.reviewerId} · {event.reviewedAt}</div>
                    <div className="mt-1 text-slate-600">{event.comment || "Без комментария"}</div>
                    <div className="mt-2 text-xs text-slate-600">Snapshot value: {event.snapshotValue}{event.snapshotUnit ? ` ${event.snapshotUnit}` : ""}</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-500">Snapshot SHA-256: {event.snapshotHash}</div>
                    <div className="mt-1 text-xs text-slate-600">Eligibility: {event.publicationEligible ? "разрешено" : `заблокировано (${event.publicationReasons.join(", ") || "review status"})`}</div>
                  </li>
                )) : <li className="text-slate-500">Решений ещё нет.</li>}
              </ol>
            </section>
          </aside>
        ) : null}
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <label className="text-xs font-semibold text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs"><option value="all">Все</option>{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select></label>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 break-all text-xs text-slate-800">{value}</dd></div>;
}
