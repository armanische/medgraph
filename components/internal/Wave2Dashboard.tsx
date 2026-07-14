"use client";

import { useMemo, useState } from "react";

import type {
  Wave2DashboardData,
  Wave2DashboardStatus,
  Wave2ManufacturerDashboardSummary,
} from "@/lib/wave2-dashboard";

const FILTERS: Array<"Все" | Wave2DashboardStatus> = [
  "Все",
  "Completed",
  "In Progress",
  "Blocked",
  "Not Started",
];

function Metric({ label, value }: { label: string; value: number }) {
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

function statusClass(status: Wave2DashboardStatus) {
  if (status === "Completed") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }
  if (status === "In Progress") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  if (status === "Blocked") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ProgressBar({
  value,
  label,
  compact = false,
}: {
  value: number;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "min-w-36" : "w-full"}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-mono font-semibold text-slate-950">{value}%</span>
      </div>
      <div
        className={`${compact ? "h-2" : "h-3"} overflow-hidden rounded-full bg-slate-200`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-950">
        {value}
      </span>
    </div>
  );
}

function ManufacturerDetails({
  manufacturer,
}: {
  manufacturer: Wave2ManufacturerDashboardSummary;
}) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Manufacturer Details
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {manufacturer.manufacturer}
          </h2>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass(manufacturer.status)}`}
        >
          {manufacturer.status}
        </span>
      </div>

      <div className="mt-5">
        <ProgressBar value={manufacturer.progress} label="Progress" />
      </div>

      <div className="mt-5 border-y border-slate-200 py-1">
        <DetailMetric
          label="Products discovered"
          value={manufacturer.productsDiscovered}
        />
        <DetailMetric label="Official sources" value={manufacturer.officialSources} />
        <DetailMetric label="Documents" value={manufacturer.documents} />
        <DetailMetric label="Downloads" value={manufacturer.downloads} />
        <DetailMetric label="Artifacts" value={manufacturer.artifacts} />
        <DetailMetric label="Candidate facts" value={manufacturer.candidateFacts} />
        <DetailMetric label="Review queue" value={manufacturer.reviewItems} />
        <DetailMetric label="Blocked products" value={manufacturer.blockedProducts} />
        <DetailMetric label="Errors" value={manufacturer.errors.length} />
        <DetailMetric label="Warnings" value={manufacturer.warnings.length} />
      </div>

      {manufacturer.executionReport ? (
        <a
          href={manufacturer.executionReport}
          className="mt-5 inline-flex rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100"
        >
          Execution report
        </a>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          Execution report is not available.
        </p>
      )}

      {manufacturer.errors.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Errors</h3>
          <ul className="mt-2 space-y-2">
            {manufacturer.errors.map((error) => (
              <li
                key={error}
                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
              >
                {error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {manufacturer.warnings.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-slate-950">Warnings</h3>
          <ul className="mt-2 space-y-2">
            {manufacturer.warnings.map((warning) => (
              <li
                key={warning}
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

export default function Wave2Dashboard({ data }: { data: Wave2DashboardData }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Все");
  const [selectedManufacturer, setSelectedManufacturer] = useState(
    data.manufacturers[0]?.manufacturer ?? "",
  );

  const filteredManufacturers = useMemo(
    () =>
      filter === "Все"
        ? data.manufacturers
        : data.manufacturers.filter(
            (manufacturer) => manufacturer.status === filter,
          ),
    [data.manufacturers, filter],
  );
  const selected =
    data.manufacturers.find(
      (manufacturer) => manufacturer.manufacturer === selectedManufacturer,
    ) ?? data.manufacturers[0];

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Overall Progress
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Wave 2</h2>
            <p className="mt-2 text-sm text-slate-600">
              {data.completedManufacturers} of {data.plannedManufacturers}{" "}
              planned manufacturers completed
            </p>
          </div>
          <div className="w-full lg:max-w-xl">
            <ProgressBar value={data.overallProgress} label="Wave 2" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Metric
          label="Manufacturers completed"
          value={data.completedManufacturers}
        />
        <Metric
          label="Manufacturers remaining"
          value={data.remainingManufacturers}
        />
        <Metric label="Products discovered" value={data.totals.productsDiscovered} />
        <Metric label="Official sources" value={data.totals.officialSources} />
        <Metric label="Documents" value={data.totals.documents} />
        <Metric label="Downloads" value={data.totals.downloads} />
        <Metric label="Artifacts" value={data.totals.artifacts} />
        <Metric label="Candidate facts" value={data.totals.candidateFacts} />
        <Metric label="Review items" value={data.totals.reviewItems} />
        <Metric label="Errors" value={data.totals.errors} />
        <Metric label="Warnings" value={data.totals.warnings} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Status filters">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                filter === option
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-[1220px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {[
                    "Manufacturer",
                    "Status",
                    "Products",
                    "Documents",
                    "Artifacts",
                    "Candidate Facts",
                    "Review Items",
                    "Ready",
                    "Blocked",
                    "Errors",
                    "Warnings",
                    "Progress",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredManufacturers.map((manufacturer) => (
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
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusClass(manufacturer.status)}`}
                      >
                        {manufacturer.status}
                      </span>
                    </td>
                    {[
                      manufacturer.productsDiscovered,
                      manufacturer.documents,
                      manufacturer.artifacts,
                      manufacturer.candidateFacts,
                      manufacturer.reviewItems,
                      manufacturer.ready,
                      manufacturer.blockedProducts,
                      manufacturer.errors.length,
                      manufacturer.warnings.length,
                    ].map((value, index) => (
                      <td key={index} className="px-4 py-3 font-mono text-sm">
                        {value}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <ProgressBar
                        value={manufacturer.progress}
                        label={manufacturer.manufacturer}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredManufacturers.length === 0 ? (
              <p className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No manufacturers match this status.
              </p>
            ) : null}
          </div>

          {selected ? <ManufacturerDetails manufacturer={selected} /> : null}
        </div>
      </section>
    </div>
  );
}
