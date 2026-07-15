import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import Wave2Dashboard from "@/components/internal/Wave2Dashboard";
import { loadWave2Dashboard } from "@/lib/wave2-dashboard";

export const metadata: Metadata = {
  title: "Wave 2 Orchestration Progress",
  robots: {
    index: false,
    follow: false,
  },
};

function dashboardEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CYBERMEDICA_ENABLE_WAVE2_DASHBOARD === "1"
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

export default async function InternalWave2Page() {
  await connection();

  if (!dashboardEnabled()) notFound();

  const result = await loadWave2Dashboard();

  if (result.status === "missing") {
    return (
      <CalmState title="Wave 2 summary is not available.">
        <p>
          The dashboard remains read-only and will appear when the existing Wave
          2 summary is present.
        </p>
      </CalmState>
    );
  }

  if (result.status === "invalid") {
    return (
      <CalmState title="Wave 2 summary could not be read.">
        <p>The existing aggregate summary has an unexpected JSON format.</p>
      </CalmState>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-[108rem] px-6 py-10 sm:px-8 lg:py-14">
        <div className="mb-8">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Internal · Read only
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Wave 2 Orchestration Progress
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Progress across planned manufacturers, calculated only from the
            existing Wave 2 generated summaries. This screen cannot run or
            change the import pipeline.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-800">
            Completion reflects orchestration stages, not evidence completeness,
            verification, or publication readiness.
          </p>
        </div>

        <Wave2Dashboard data={result.data} />
      </section>
    </main>
  );
}
