"use client";

import { useMemo, useState } from "react";

import type {
  ImportCenterAggregateReport,
  ImportCenterManufacturerSummary,
} from "@/lib/internal-import-center";

function Metric({ label, value }: { label: string; value: number | string }) {
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

function readiness(summary: ImportCenterManufacturerSummary) {
  if (summary.errors.length > 0) return "Needs attention";
  if (summary.blockedProducts > 1) return "Blocked review";
  if (summary.documentsFound >= summary.productsDiscovered * 2) return "Ready";
  return "Partial";
}

function readinessClass(status: string) {
  if (status === "Ready") return "border-teal-200 bg-teal-50 text-teal-800";
  if (status === "Blocked review") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "Needs attention") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function SafetyFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`rounded-md border px-2 py-1 font-mono text-[10px] font-semibold ${
          value
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : "border-teal-200 bg-teal-50 text-teal-800"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
}

export default function ImportCenterDashboard({
  aggregate,
  manufacturers,
}: {
  aggregate: ImportCenterAggregateReport;
  manufacturers: ImportCenterManufacturerSummary[];
}) {
  const [selectedManufacturer, setSelectedManufacturer] = useState(
    manufacturers[0]?.manufacturer ?? "",
  );
  const selected = useMemo(
    () =>
      manufacturers.find(
        (manufacturer) => manufacturer.manufacturer === selectedManufacturer,
      ) ?? manufacturers[0],
    [manufacturers, selectedManufacturer],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="products discovered"
          value={aggregate.totals.productsDiscovered}
        />
        <Metric label="official sources" value={aggregate.totals.officialSources} />
        <Metric label="documents found" value={aggregate.totals.documentsFound} />
        <Metric label="downloads" value={aggregate.totals.downloads} />
        <Metric label="artifacts" value={aggregate.totals.artifacts} />
        <Metric label="candidate facts" value={aggregate.totals.candidateFacts} />
        <Metric label="review items" value={aggregate.totals.reviewItems} />
        <Metric
          label="blocked products"
          value={aggregate.totals.blockedProducts}
        />
        <Metric label="warnings" value={aggregate.totals.warnings} />
        <Metric label="errors" value={aggregate.totals.errors} />
      </section>

      <section className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-teal-950">
        <h2 className="text-base font-semibold">Граница безопасности</h2>
        <p className="mt-2 text-sm leading-6">
          Import Center показывает только результаты исследовательского pipeline.
          Он не публикует данные, не создаёт Verified Claims и не пишет в
          Supabase.
        </p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[1120px] border-collapse text-left">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {[
                "Manufacturer",
                "Products",
                "Documents",
                "Downloads",
                "Candidate facts",
                "Review items",
                "Blocked",
                "Errors",
                "Warnings",
                "Readiness",
              ].map((label) => (
                <th key={label} className="px-4 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {manufacturers.map((manufacturer) => {
              const status = readiness(manufacturer);
              return (
                <tr
                  key={manufacturer.manufacturer}
                  className={`border-t border-slate-200 ${
                    selected?.manufacturer === manufacturer.manufacturer
                      ? "bg-teal-50/45"
                      : "bg-white"
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedManufacturer(manufacturer.manufacturer)
                      }
                      className="font-semibold text-slate-950 hover:text-teal-700"
                    >
                      {manufacturer.manufacturer}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.productsDiscovered}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.documentsFound}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.downloads}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.candidateFacts}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.reviewItems}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.blockedProducts}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.errors.length}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {manufacturer.warnings.length}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${readinessClass(status)}`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {selected ? (
        <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Manufacturer Details
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {selected.manufacturer}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="products" value={selected.productsDiscovered} />
              <Metric label="sources" value={selected.officialSources} />
              <Metric label="documents" value={selected.documentsFound} />
              <Metric label="duration ms" value={selected.durationMs} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Blocked products
                </h3>
                <p className="mt-2 font-mono text-3xl font-semibold text-slate-950">
                  {selected.blockedProducts}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-950">Retries</h3>
                <p className="mt-2 font-mono text-3xl font-semibold text-slate-950">
                  {selected.retries.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Warnings</h3>
                {selected.warnings.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-amber-900">
                    {selected.warnings.map((warning) => (
                      <li
                        key={warning}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No warnings.</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Errors</h3>
                {selected.errors.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-rose-900">
                    {selected.errors.map((error) => (
                      <li
                        key={error}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2"
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No errors.</p>
                )}
              </div>
            </div>
          </article>

          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Safety flags
            </div>
            <div className="mt-4 space-y-3">
              <SafetyFlag
                label="publicationCreated"
                value={aggregate.safety.publicationCreated}
              />
              <SafetyFlag
                label="supabaseWrites"
                value={aggregate.safety.supabaseWrites}
              />
              <SafetyFlag
                label="verificationChanged"
                value={aggregate.safety.verificationChanged}
              />
              <SafetyFlag
                label="reviewDecisionsChanged"
                value={aggregate.safety.reviewDecisionsChanged}
              />
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
