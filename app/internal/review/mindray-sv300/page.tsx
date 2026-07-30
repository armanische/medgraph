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

type ProductRow = {
  id: string;
  model: string | null;
  publication_status: string;
  published: boolean;
  review_state: string;
  current_product_publication_revision_id: string | null;
  current_product_publication_approval_id: string | null;
  active_product_publication_batch_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  catalog_quality_status: string | null;
  catalog_quality_reason: string[] | null;
};

type RevisionRow = {
  id: string;
  product_id: string;
  review_item_id: string;
  revision_number: number;
  candidate_payload_checksum: string;
  payload_checksum: string;
  product_identity_checksum: string;
  candidate_payload: {
    characteristics?: unknown[];
    media?: unknown[];
  };
};

async function readCloud<T>(path: string) {
  const client = createSupabaseServerClient({ access: "service_role" });
  const response = await client.request(path, {
    headers: {
      "Accept-Profile": "cloud",
      "Content-Profile": "cloud",
    },
  });
  return response.json() as Promise<T>;
}

async function loadMindrayReviewEvidence() {
  const productId = encodeURIComponent(MINDRAY_REVIEW.productId);
  const revisionId = encodeURIComponent(MINDRAY_REVIEW.revisionId);
  const [products, revisions, descriptions, decisions, approvals, batches] = await Promise.all([
    readCloud<ProductRow[]>(`/rest/v1/products?id=eq.${productId}&select=id,model,publication_status,published,review_state,current_product_publication_revision_id,current_product_publication_approval_id,active_product_publication_batch_id,seo_title,seo_description,catalog_quality_status,catalog_quality_reason`),
    readCloud<RevisionRow[]>(`/rest/v1/product_publication_revisions?id=eq.${revisionId}&select=id,product_id,review_item_id,revision_number,candidate_payload_checksum,payload_checksum,product_identity_checksum,candidate_payload`),
    readCloud<Array<{ locale: string }>>(`/rest/v1/product_descriptions?product_id=eq.${productId}&select=locale`),
    readCloud<Array<{ id: string }>>(`/rest/v1/review_decisions?product_publication_revision_id=eq.${revisionId}&select=id`),
    readCloud<Array<{ id: string }>>(`/rest/v1/product_publication_approvals?candidate_revision_id=eq.${revisionId}&select=id`),
    readCloud<Array<{ id: string }>>(`/rest/v1/product_publication_batches?product_id=eq.${productId}&select=id`),
  ]);

  const product = products.length === 1 ? products[0] : null;
  const revision = revisions.length === 1 ? revisions[0] : null;
  const canonicalLocales = descriptions.filter((entry) => entry.locale === "ru").length;
  const otherLocales = descriptions.filter((entry) => entry.locale !== "ru").length;
  const structuralReasons = product?.catalog_quality_reason ?? [];
  const candidateCharacteristics = revision?.candidate_payload.characteristics ?? [];
  const candidateMedia = revision?.candidate_payload.media ?? [];

  if (
    !product
    || product.id !== MINDRAY_REVIEW.productId
    || product.model !== "SV300"
    || product.publication_status !== "in_review"
    || product.published
    || product.review_state !== "in_review"
    || product.current_product_publication_revision_id !== MINDRAY_REVIEW.revisionId
    || product.current_product_publication_approval_id !== null
    || product.active_product_publication_batch_id !== null
    || product.seo_title === null
    || product.seo_description === null
    || product.catalog_quality_status !== "READY"
    || structuralReasons.length !== 0
    || !revision
    || revision.id !== MINDRAY_REVIEW.revisionId
    || revision.product_id !== MINDRAY_REVIEW.productId
    || revision.review_item_id !== MINDRAY_REVIEW.reviewItemId
    || revision.revision_number !== MINDRAY_REVIEW.revisionNumber
    || revision.candidate_payload_checksum !== MINDRAY_REVIEW.candidatePayloadChecksum
    || canonicalLocales !== 1
    || otherLocales !== 0
    || candidateCharacteristics.length !== 3
    || candidateMedia.length !== 3
    || decisions.length !== 0
    || approvals.length !== 0
    || batches.length !== 0
  ) {
    throw new Error("Mindray SV300 review evidence is not current and safe.");
  }

  return {
    authenticatedReviewer: APPROVED_REVIEWER,
    revisionId: revision.id,
    reviewItemId: revision.review_item_id,
    revisionNumber: revision.revision_number,
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
