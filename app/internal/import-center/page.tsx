import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ImportCenterDashboard from "@/components/internal/ImportCenterDashboard";
import { loadInternalImportCenter } from "@/lib/internal-import-center";

export const metadata: Metadata = {
  title: "Import Center",
  robots: {
    index: false,
    follow: false,
  },
};

function importCenterEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CYBERMEDICA_ENABLE_IMPORT_CENTER === "1"
  );
}

function CalmState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <div className="mt-3 text-slate-700">{children}</div>
        </div>
      </section>
    </main>
  );
}

export default async function InternalImportCenterPage() {
  await connection();

  if (!importCenterEnabled()) {
    notFound();
  }

  const report = await loadInternalImportCenter();

  if (report.status === "missing") {
    return (
      <CalmState title="Отчёт Wave 2 ещё не сформирован.">
        <p>Сначала сформируйте generated reports для Wave 2.</p>
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 font-mono text-sm">
          npm run wave2:execute -- all
        </p>
      </CalmState>
    );
  }

  if (report.status === "invalid") {
    return (
      <CalmState title="Отчёт Wave 2 нельзя прочитать.">
        <p>
          JSON-файл повреждён или имеет неожиданный формат. Сформируйте отчёт
          заново и повторите загрузку.
        </p>
      </CalmState>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-[96rem] px-6 py-10 sm:px-8 lg:py-14">
        <div className="mb-8">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Внутренний экран
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Import Center
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Read-only dashboard по generated reports Wave 2: discovery,
            documents, downloads, artifacts, candidate facts и review handoff.
          </p>
        </div>

        <ImportCenterDashboard
          aggregate={report.aggregate}
          manufacturers={report.manufacturers}
        />
      </section>
    </main>
  );
}
