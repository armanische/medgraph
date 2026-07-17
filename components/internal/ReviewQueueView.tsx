import type {
  HumanReviewerHistoryEntry,
  HumanReviewerItem,
  HumanReviewerProduct,
  HumanReviewerWorkspaceModel,
} from "@/lib/review/human-types";
import type {
  HumanReviewDecisionValue,
  HumanReviewStatus,
} from "@/scripts/importers/catalog/review/types";

const statusLabels: Record<HumanReviewStatus, string> = {
  pending_review: "Ожидает проверки",
  in_review: "На проверке",
  approved: "Одобрено",
  rejected: "Отклонено",
  needs_changes: "Нужны изменения",
  conflicted: "Конфликт",
  archived: "Архив",
};

const decisionLabels: Record<HumanReviewDecisionValue, string> = {
  start_review: "Проверка начата",
  approve: "Одобрено reviewer-ом",
  reject: "Отклонено reviewer-ом",
  request_changes: "Запрошены изменения",
  mark_conflict: "Отмечен конфликт",
  reopen: "Возвращено на проверку",
  archive: "Архивировано",
};

function priorityLabel(priority: HumanReviewerItem["priority"]) {
  const labels: Record<HumanReviewerItem["priority"], string> = {
    critical: "Критический",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[priority];
}

function riskLabel(risk: HumanReviewerItem["risk"]) {
  const labels: Record<HumanReviewerItem["risk"], string> = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[risk];
}

function toneForPriority(priority: HumanReviewerItem["priority"]) {
  if (priority === "critical" || priority === "high") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toneForRisk(risk: HumanReviewerItem["risk"]) {
  if (risk === "high") return "border-rose-200 bg-rose-50 text-rose-800";
  if (risk === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
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
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function ProductSummary({
  product,
  items,
}: {
  product: HumanReviewerProduct;
  items: HumanReviewerItem[];
}) {
  const highPriority = items.filter(
    (item) => item.priority === "high" || item.priority === "critical",
  ).length;
  return (
    <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <h2 className="text-xl font-semibold text-slate-950">
          {product.productTitle}
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-500">
          {product.productSlug}
        </p>
      </div>
      <Metric label="Факты" value={product.total} />
      <Metric label="Высокий приоритет" value={highPriority} />
      <Metric label="Одобрено" value={product.approved} />
      <Metric label="Missing artifact" value={product.missing} />
    </div>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  const visible = values.filter(Boolean);
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {visible.length ? (
        <ul className="mt-2 space-y-1.5">
          {visible.map((value) => (
            <li
              key={value}
              className="break-all rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Не хватает подтверждения
        </p>
      )}
    </div>
  );
}

function DecisionStatus({
  decision,
}: {
  decision: HumanReviewerHistoryEntry | null;
}) {
  if (!decision) {
    return (
      <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Решение ещё не сохранено в canonical Human Review.
      </p>
    );
  }
  return (
    <div className="mt-2 rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-950">
      <div className="font-medium">{decisionLabels[decision.decision]}</div>
      <div className="mt-1 text-teal-900">
        {decision.reviewerId} · {decision.reviewedAt}
      </div>
      {decision.comment ? <p className="mt-2">{decision.comment}</p> : null}
    </div>
  );
}

function DecisionSummary({ model }: { model: HumanReviewerWorkspaceModel }) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
      <Metric label="Ожидают" value={model.counters.pending} />
      <Metric label="На проверке" value={model.counters.inReview} />
      <Metric label="Одобрено" value={model.counters.approved} />
      <Metric label="Отклонено" value={model.counters.rejected} />
      <Metric label="Нужны изменения" value={model.counters.needsChanges} />
      <Metric label="Конфликт" value={model.counters.conflicted} />
    </section>
  );
}

function ReviewItemCard({ item }: { item: HumanReviewerItem }) {
  const latestDecision = item.history.at(-1) ?? null;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-mono text-xs text-slate-500">
            {item.characteristic}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            {item.value}
            {item.unit ? ` ${item.unit}` : ""}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill className="border-slate-200 bg-slate-50 text-slate-700">
            {statusLabels[item.currentStatus]}
          </Pill>
          <Pill className={toneForPriority(item.priority)}>
            Приоритет: {priorityLabel(item.priority)}
          </Pill>
          <Pill className={toneForRisk(item.risk)}>
            Риск: {riskLabel(item.risk)}
          </Pill>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <DetailList label="Источники" values={[item.officialSourceUrl]} />
        <DetailList label="Документы" values={[item.documentVersion]} />
        <DetailList label="Подтверждения" values={[item.evidenceSource]} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Raw text
          </div>
          <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {item.rawText}
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Решение reviewer-а
          </div>
          <DecisionStatus decision={latestDecision} />
        </div>
      </div>

      {item.warnings.length ? (
        <div className="mt-5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Предупреждения
          </div>
          <ul className="mt-2 space-y-1.5">
            {item.warnings.map((warning) => (
              <li key={warning} className="text-sm text-slate-700">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export default function ReviewQueueView({
  model,
}: {
  model: HumanReviewerWorkspaceModel;
}) {
  if (!model.items.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-slate-700">
        Нет фактов, ожидающих проверки.
      </section>
    );
  }

  const warnings = [
    ...new Set(model.items.flatMap((item) => item.warnings)),
  ];

  return (
    <div className="space-y-8">
      <DecisionSummary model={model} />

      {warnings.length ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-950">
            Предупреждения
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            {warnings.slice(0, 12).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.products.map((product) => {
        const items = model.items.filter(
          (item) => item.productSlug === product.productSlug,
        );
        return (
          <section
            key={product.productSlug}
            className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <ProductSummary product={product} items={items} />
            <div className="rounded-lg border border-teal-100 bg-white p-4 text-sm text-slate-700">
              Canonical status: {product.approved}/{product.total} approved ·
              evidence {product.evidenceCompleteness}%.
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <ReviewItemCard key={item.reviewItemId} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
