import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { loadPublicationReviewQueue } from "@/lib/review/publication-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publication Review Queue",
  robots: { index: false, follow: false },
};

export default async function PublicationReviewQueuePage() {
  await connection();
  await requireTrustedReviewer();
  const entries = await loadPublicationReviewQueue();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
          Trusted Production session · read before write
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Publication Review Queue
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Только текущие immutable revisions в состоянии <code>in_review</code>.
          Каждый элемент повторно проверяется через утверждённый cloud_api read contract.
        </p>

        <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-5 text-sm text-teal-950">
          Очередь: {entries.length}. Warnings не блокируют этот этап: {" "}
          <code>missing_registration</code>, <code>missing_documents</code>.
        </div>

        {entries.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-slate-700">
            Нет текущих revisions, прошедших fail-closed проверку.
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {entries.map(({ manifest, product, manufacturer, characteristics, media }) => (
              <Link
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-400 hover:shadow-sm"
                href={`/internal/review/${manifest.revisionId}`}
                key={manifest.revisionId}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {product.title ?? manifest.model}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {manufacturer} · {manifest.model}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                    current / non-stale
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-slate-500">Revision</dt><dd className="font-medium text-slate-900">{manifest.revisionNumber}</dd></div>
                  <div><dt className="text-slate-500">Warnings</dt><dd className="font-medium text-slate-900">{manifest.warnings.length}</dd></div>
                  <div><dt className="text-slate-500">Evidence</dt><dd className="font-medium text-slate-900">{characteristics} characteristics · {media} media</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
