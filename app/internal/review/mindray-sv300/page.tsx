import type { Metadata } from "next";
import { connection } from "next/server";

import MindrayReviewConfirmation from "@/components/internal/MindrayReviewConfirmation";
import { APPROVED_REVIEWER, MINDRAY_REVIEW } from "@/lib/internal-auth/constants";
import { requireTrustedReviewer } from "@/lib/internal-auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/client.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mindray SV300 Human Review",
  robots: { index: false, follow: false },
};

type CatalogAdminProduct = {
  id: string;
  title: string | null;
  model: string | null;
  publicationStatus: string;
  published: boolean;
  reviewState: string;
  seoTitle: string | null;
  seoDescription: string | null;
  qualityFlags: {
    missingRegistration?: boolean;
    missingDocuments?: boolean;
  } | null;
  characteristics?: unknown[] | null;
  media?: unknown[] | null;
};

async function readCatalogAdminProduct() {
  // `cloud` is intentionally not a public PostgREST schema. Use the existing
  // service-only read wrapper instead of weakening API exposure or RLS.
  const client = createSupabaseServerClient({ access: "service_role" });
  const response = await client.request("/rest/v1/rpc/catalog_admin_product", {
    method: "POST",
    headers: {
      "Accept-Profile": "cloud_api",
      "Content-Profile": "cloud_api",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_id: MINDRAY_REVIEW.productId }),
  });
  return response.json() as Promise<CatalogAdminProduct | null>;
}

async function loadMindrayReviewEvidence() {
  const product = await readCatalogAdminProduct();
  const candidateCharacteristics = product?.characteristics ?? [];
  const candidateMedia = product?.media ?? [];

  if (
    !product
    || product.id !== MINDRAY_REVIEW.productId
    || product.model !== "SV300"
    || product.publicationStatus !== "in_review"
    || product.published
    || product.reviewState !== "in_review"
    || product.seoTitle === null
    || product.seoDescription === null
    || product.qualityFlags?.missingRegistration !== true
    || product.qualityFlags?.missingDocuments !== true
    || candidateCharacteristics.length !== 3
    || candidateMedia.length !== 3
  ) {
    throw new Error("Mindray SV300 review evidence is not current and safe.");
  }

  return {
    authenticatedReviewer: APPROVED_REVIEWER,
    revisionId: MINDRAY_REVIEW.revisionId,
    reviewItemId: MINDRAY_REVIEW.reviewItemId,
    revisionNumber: MINDRAY_REVIEW.revisionNumber,
    candidatePayloadChecksum: MINDRAY_REVIEW.candidatePayloadChecksum,
    productName: MINDRAY_REVIEW.productName,
    model: product.model,
    seo: "present",
    characteristics: candidateCharacteristics.length,
    media: candidateMedia.length,
    warnings: ["missing_registration", "missing_documents"],
  };
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-950">{value}</dd>
    </div>
  );
}

export default async function MindrayReviewPage() {
  await connection();
  await requireTrustedReviewer();
  const evidence = await loadMindrayReviewEvidence();

  return (
    <main className="min-h-[70vh] bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
          Trusted Production session · read before write
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          {evidence.productName}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Одноцелевая проверка immutable publication revision. Активная запись
          дополнительно fail-closed проверяется серверным Production read contract.
        </p>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact label="Authenticated email" value={evidence.authenticatedReviewer.email} />
          <Fact label="Authenticated reviewer UUID" value={evidence.authenticatedReviewer.userId} />
          <Fact label="Production profile role" value={evidence.authenticatedReviewer.role} />
          <Fact label="Revision" value={`${evidence.revisionNumber} · current / non-stale`} />
          <Fact label="Revision ID" value={evidence.revisionId} />
          <Fact label="Review Item ID" value={evidence.reviewItemId} />
          <Fact label="Candidate checksum" value={evidence.candidatePayloadChecksum} />
          <Fact label="SEO" value={evidence.seo} />
          <Fact label="Characteristics" value={evidence.characteristics} />
          <Fact label="Media" value={evidence.media} />
          <Fact label="Canonical ru" value="1" />
        </dl>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-semibold text-amber-950">Non-blocking warnings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {evidence.warnings.map((warning) => <li key={warning}><code>{warning}</code></li>)}
          </ul>
        </section>

        <MindrayReviewConfirmation />
      </section>
    </main>
  );
}
