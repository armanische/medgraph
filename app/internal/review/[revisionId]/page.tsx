import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import PublicationReviewAction from "@/components/internal/PublicationReviewAction";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { loadPublicationReviewEvidence } from "@/lib/review/publication-review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publication Review",
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

export default async function PublicationReviewDetailPage({
  params,
}: {
  params: Promise<{ revisionId: string }>;
}) {
  await connection();
  await requireTrustedReviewer();
  const { revisionId } = await params;
  const evidence = await loadPublicationReviewEvidence(revisionId);
  if (!evidence) notFound();

  const { manifest, product } = evidence;
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
          Trusted Production session · read before write
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          {product.title ?? manifest.model}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Generic immutable revision evidence. Unknown, stale or unpublished state returns 404.
        </p>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Model" value={manifest.model} />
          <Fact label="Revision" value={`${manifest.revisionNumber} · current / non-stale`} />
          <Fact label="Revision ID" value={manifest.revisionId} />
          <Fact label="Review Item ID" value={manifest.reviewItemId} />
          <Fact label="Candidate payload checksum" value={manifest.payloadChecksum} />
          <Fact label="Product identity checksum" value={manifest.productIdentityChecksum} />
          <Fact label="SEO" value={product.seoTitle && product.seoDescription ? "present" : "missing"} />
          <Fact label="Characteristics" value={evidence.characteristics} />
          <Fact label="Media" value={evidence.media} />
          <Fact label="Canonical ru" value="1" />
          <Fact label="Product state" value={`${product.publicationStatus} · ${product.reviewState}`} />
          <Fact label="Manufacturer" value={evidence.manufacturer} />
        </dl>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-semibold text-amber-950">Non-blocking warnings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {manifest.warnings.map((warning) => <li key={warning}><code>{warning}</code></li>)}
          </ul>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">Canonical Russian description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{product.shortDescription}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{product.description}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">SEO</h2>
            <p className="mt-3 text-sm text-slate-700"><strong>Title:</strong> {product.seoTitle}</p>
            <p className="mt-3 text-sm text-slate-700"><strong>Description:</strong> {product.seoDescription}</p>
          </div>
        </section>

        <PublicationReviewAction revisionId={manifest.revisionId} />
      </section>
    </main>
  );
}
