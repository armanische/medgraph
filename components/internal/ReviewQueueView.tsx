import type {
  ReviewPriority,
  ReviewQueueItem,
  ReviewQueueProductReport,
  ReviewRiskLevel,
} from "@/lib/internal-review-queue";

function statusLabel(status: ReviewQueueItem["status"]) {
  const labels: Record<ReviewQueueItem["status"], string> = {
    pending_review: "Ожидает проверки",
    needs_more_evidence: "Не хватает подтверждения",
    approved_for_verification: "Готово к Verification",
    rejected: "Отклонено",
    conflict: "Конфликт",
  };
  return labels[status];
}

function priorityLabel(priority: ReviewPriority) {
  const labels: Record<ReviewPriority, string> = {
    critical: "Критический",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[priority];
}

function riskLabel(risk: ReviewRiskLevel) {
  const labels: Record<ReviewRiskLevel, string> = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };
  return labels[risk];
}

function toneForPriority(priority: ReviewPriority) {
  if (priority === "critical" || priority === "high") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toneForRisk(risk: ReviewRiskLevel) {
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

function itemReady(item: ReviewQueueItem) {
  return item.evidenceCandidateIds.length > 0 && item.documentVersionIds.length > 0;
}

function ProductSummary({ product }: { product: ReviewQueueProductReport }) {
  const highPriority = product.reviewItems.filter(
    (item) => item.priority === "high" || item.priority === "critical",
  ).length;
  const ready = product.reviewItems.filter(itemReady).length;
  const missing = product.reviewItems.filter(
    (item) =>
      item.evidenceCandidateIds.length === 0 || item.documentVersionIds.length === 0,
  ).length;

  return (
    <div className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <h2 className="text-xl font-semibold text-slate-950">
          {product.product.productName}
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-500">
          {product.product.productSlug}
        </p>
      </div>
      <Metric label="Факты" value={product.reviewItems.length} />
      <Metric label="Высокий приоритет" value={highPriority} />
      <Metric label="Готово к проверке" value={ready} />
      <Metric label="Не хватает подтверждения" value={missing} />
    </div>
  );
}

function DetailList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {values.length ? (
        <ul className="mt-2 space-y-1.5">
          {values.map((value) => (
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

function ReviewItemCard({ item }: { item: ReviewQueueItem }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-mono text-xs text-slate-500">
            {item.suggestedClaimType}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">
            {item.valuePayload.value}
            {item.valuePayload.unit ? ` ${item.valuePayload.unit}` : ""}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill className="border-slate-200 bg-slate-50 text-slate-700">
            {statusLabel(item.status)}
          </Pill>
          <Pill className={toneForPriority(item.priority)}>
            Приоритет: {priorityLabel(item.priority)}
          </Pill>
          <Pill className={toneForRisk(item.riskLevel)}>
            Риск: {riskLabel(item.riskLevel)}
          </Pill>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <DetailList label="Источники" values={item.sourceUrls} />
        <DetailList label="Документы" values={item.documentVersionIds} />
        <DetailList label="Подтверждения" values={item.evidenceCandidateIds} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Требуется действие
          </div>
          <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Сверить значение с источником и документом. Не публиковать из этой
            очереди.
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Причины
          </div>
          <ul className="mt-2 space-y-1.5">
            {item.reasons.map((reason) => (
              <li key={reason} className="text-sm text-slate-700">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default function ReviewQueueView({
  products,
  warnings,
}: {
  products: ReviewQueueProductReport[];
  warnings: string[];
}) {
  const items = products.flatMap((product) => product.reviewItems);

  if (!items.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-slate-700">
        Нет фактов, ожидающих проверки.
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {warnings.length > 0 ? (
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

      {products.map((product) => (
        <section
          key={product.product.productSlug}
          className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5"
        >
          <ProductSummary product={product} />
          <div className="rounded-lg border border-teal-100 bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">
              Требуется действие:
            </span>{" "}
            {product.recommendedReviewerAction}
          </div>
          <div className="space-y-4">
            {product.reviewItems.map((item) => (
              <ReviewItemCard key={item.reviewItemId} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
