import type {
  ComparisonResult,
  ComparisonRow,
  ComparisonValue,
  ComparisonValueStatus,
} from "@/lib/compare/types";

function statusLabel(status: ComparisonValueStatus) {
  const labels: Record<ComparisonValueStatus, string> = {
    published: "Опубликовано",
    publication_ready: "Проверяется",
    verified: "Опубликовано",
    not_available: "Нет подтверждённых данных",
  };
  return labels[status];
}

function statusTone(status: ComparisonValueStatus) {
  if (status === "published" || status === "verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "publication_ready") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function differenceLabel(row: ComparisonRow) {
  const labels: Record<ComparisonRow["differenceType"], string> = {
    same: "Совпадает",
    different: "Отличается",
    missing: "Нет подтверждения",
    unit_mismatch: "Разные единицы",
    status_mismatch: "Разный статус",
  };
  return labels[row.differenceType];
}

function formatValue(value: ComparisonValue) {
  if (value.value === null) return "Нет подтверждённых данных";
  return `${String(value.value)}${value.unit ? ` ${value.unit}` : ""}`;
}

function ValueCell({ value }: { value: ComparisonValue }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-cm-ink">{formatValue(value)}</div>
      <span
        className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${statusTone(value.status)}`}
      >
        {statusLabel(value.status)}
      </span>
    </div>
  );
}

function EvidenceCell({ row }: { row: ComparisonRow }) {
  const sources = [row.left.source, row.right.source]
    .filter((source): source is NonNullable<ComparisonValue["source"]> =>
      Boolean(source),
    )
    .map((source) => source.title);
  const documents = [row.left.documentVersion, row.right.documentVersion]
    .filter(
      (
        document,
      ): document is NonNullable<ComparisonValue["documentVersion"]> =>
        Boolean(document),
    )
    .map((document) => document.title);
  const updated = [row.left.lastUpdated, row.right.lastUpdated].filter(
    (date): date is string => Boolean(date),
  );

  return (
    <>
      <td className="min-w-56 border-l border-[var(--cm-rule)] px-4 py-4 align-top text-xs text-cm-slate">
        {sources.length ? [...new Set(sources)].join(" · ") : "Нет источника"}
      </td>
      <td className="min-w-56 border-l border-[var(--cm-rule)] px-4 py-4 align-top text-xs text-cm-slate">
        {documents.length ? [...new Set(documents)].join(" · ") : "Нет документа"}
      </td>
      <td className="min-w-36 border-l border-[var(--cm-rule)] px-4 py-4 align-top font-mono text-xs text-cm-dim">
        {updated.length ? [...new Set(updated)].join(" · ") : "Нет даты"}
      </td>
    </>
  );
}

export default function ComparisonTable({ result }: { result: ComparisonResult }) {
  const right = result.products.right;

  if (!right) {
    return (
      <section className="cm-empty-state text-cm-slate">
        Выберите второе изделие для сравнения.
      </section>
    );
  }

  if (!result.rows.length) {
    return (
      <section className="cm-empty-state text-cm-slate">
        Для выбранных изделий пока нет подтверждённых данных.
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cm-rule)] bg-white shadow-[var(--cm-shadow-card)]">
      <table className="min-w-[1040px] border-collapse text-left">
        <thead className="bg-cm-surface-low text-xs text-cm-slate">
          <tr>
            <th className="sticky left-0 z-10 min-w-56 bg-cm-surface-low px-4 py-3 font-semibold">
              Характеристика
            </th>
            <th className="min-w-52 px-4 py-3 font-semibold">
              {result.products.left.title}
            </th>
            <th className="min-w-52 px-4 py-3 font-semibold">{right.title}</th>
            <th className="min-w-40 px-4 py-3 font-semibold">Статус</th>
            <th className="min-w-56 px-4 py-3 font-semibold">Источник</th>
            <th className="min-w-56 px-4 py-3 font-semibold">Документ</th>
            <th className="min-w-36 px-4 py-3 font-semibold">
              Последнее обновление
            </th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => (
            <tr
              key={row.characteristicKey}
              className={
                row.hasDifference
                  ? "border-t border-[var(--cm-rule)] bg-amber-50/35"
                  : "border-t border-[var(--cm-rule)]"
              }
            >
              <th className="sticky left-0 z-10 bg-white px-4 py-4 align-top">
                <div className="text-sm font-semibold text-cm-ink">{row.label}</div>
                <div className="mt-1 text-xs text-cm-dim">{row.group}</div>
              </th>
              <td className="px-4 py-4 align-top">
                <ValueCell value={row.left} />
              </td>
              <td className="border-l border-[var(--cm-rule)] px-4 py-4 align-top">
                <ValueCell value={row.right} />
              </td>
              <td className="border-l border-[var(--cm-rule)] px-4 py-4 align-top">
                <span
                  className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${
                    row.hasDifference
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {differenceLabel(row)}
                </span>
                {row.notes.length ? (
                  <p className="mt-2 text-xs leading-5 text-cm-slate">
                    {row.notes.join(" ")}
                  </p>
                ) : null}
              </td>
              <EvidenceCell row={row} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
