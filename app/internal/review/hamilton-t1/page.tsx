import type { Metadata } from "next";
import { connection } from "next/server";

import HamiltonReviewConfirmation from "@/components/internal/HamiltonReviewConfirmation";
import { APPROVED_REVIEWER, HAMILTON_REVIEW } from "@/lib/internal-auth/constants";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hamilton-T1 Human Review",
  robots: { index: false, follow: false },
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-950">{value}</dd>
    </div>
  );
}

export default async function HamiltonReviewPage() {
  await connection();
  const user = await requireTrustedReviewer();

  return (
    <main className="min-h-[70vh] bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
          Trusted Production session · read before write
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Hamilton-T1
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Одноцелевая проверка immutable publication revision. Активная запись
          дополнительно fail-closed проверяется существующим database RPC.
        </p>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Authenticated email" value={user.email} />
          <Fact label="Approved identity" value={user.id} />
          <Fact label="Production profile role" value={APPROVED_REVIEWER.role} />
          <Fact label="Revision" value={`${HAMILTON_REVIEW.revisionNumber} · current / non-stale`} />
          <Fact label="Revision ID" value={HAMILTON_REVIEW.revisionId} />
          <Fact label="Review Item ID" value={HAMILTON_REVIEW.reviewItemId} />
          <Fact label="SEO" value="present" />
          <Fact label="Characteristics" value="3" />
          <Fact label="Media" value="3" />
          <Fact label="Canonical ru" value="1" />
          <Fact label="Approved claim occurrences" value="5" />
          <Fact label="Old claim occurrences" value="0" />
        </dl>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-semibold text-amber-950">Non-blocking warnings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            <li><code>missing_documents</code></li>
            <li><code>missing_registration</code></li>
          </ul>
        </section>

        <HamiltonReviewConfirmation />
      </section>
    </main>
  );
}
