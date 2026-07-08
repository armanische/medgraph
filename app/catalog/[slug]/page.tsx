import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  draftStatusLabel,
  getDraftCatalogProduct,
  getDraftCatalogProducts,
} from "@/lib/catalog-drafts";

export function generateStaticParams() {
  return getDraftCatalogProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getDraftCatalogProduct(slug);
  return {
    title: product
      ? `${product.title} · Draft Research | CyberMedica`
      : "Draft product | CyberMedica",
    description:
      "Draft-карточка CyberMedica с candidate facts, sources и human review metadata.",
  };
}

export default async function DraftCatalogProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getDraftCatalogProduct(slug);
  if (!product) notFound();
  const researchSteps = [
    product.sourcesSummary.official > 0
      ? "Официальные источники найдены"
      : "Поиск официальных источников",
    product.documentsSummary.total > 0
      ? "Документы найдены"
      : "Регистрационные документы не найдены",
    product.candidateClaimsCount > 0
      ? "Характеристики подготовлены"
      : "Подготовка характеристик",
    "Ожидает экспертной проверки",
  ];

  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-8">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">Каталог</Link>
            {" · Draft research"}
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">Draft</Badge>
                <Badge tone={product.researchStatus === "research_ready" ? "good" : "neutral"}>
                  {draftStatusLabel(product.researchStatus)}
                </Badge>
                <Badge tone="neutral">Verification not performed</Badge>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-[-0.035em]">
                {product.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cm-slate">
                {product.warning}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/request?product=${encodeURIComponent(product.title)}`}
                  className="cm-button-primary shadow-[0_10px_28px_rgba(11,123,142,0.18)]"
                >
                  Запросить КП
                </Link>
                <Link href="/catalog" className="cm-button-secondary">
                  Вернуться в каталог
                </Link>
              </div>
            </div>
            <div className="cm-card overflow-hidden bg-white/85 p-4 shadow-[0_18px_50px_rgba(11,19,32,0.08)] backdrop-blur">
              <div className="-mx-4 -mt-4 mb-4 border-b border-[var(--cm-rule)] bg-cm-surface-low px-4 py-3">
                <div className="cm-label !text-cm-teal">Research status</div>
              </div>
              <div className="cm-label">Review readiness</div>
              <div className="mt-3 font-mono text-4xl font-bold text-cm-ink">
                {displayMetric(product.readinessScore)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label="Sources" value={displayMetric(product.sourcesSummary.total)} />
                <Metric label="Official" value={displayMetric(product.sourcesSummary.official)} />
                <Metric label="Documents" value={displayMetric(product.documentsSummary.total)} />
                <Metric label="Claims" value={displayMetric(product.candidateClaimsCount)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container grid gap-6 py-7 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section title="Research summary">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Source quality" value={displayMetric(product.sourceQualityScore)} />
              <Metric label="Conflicts" value={displayMetric(product.conflicts.length)} />
              <Metric label="Review" value="Ожидает" />
            </div>
            <div className="mt-4 rounded-xl border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_24px_rgba(11,19,32,0.04)]">
              <div className="text-xs font-semibold">Исследование продолжается</div>
              <ul className="mt-4 grid gap-3 text-xs text-cm-slate sm:grid-cols-2">
                {researchSteps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-cm-teal/20 bg-cm-teal-soft font-mono text-[9px] font-bold text-cm-teal"
                    >
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            {product.researchWarnings.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                {product.researchWarnings.slice(0, 4).map((warning) => (
                  <div key={warning}>• {warning}</div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Sources">
            <ListEmptyWhen
              empty={product.sourceCandidates.length === 0}
              message="Официальные источники пока не найдены."
            >
              <div className="space-y-3">
                {product.sourceCandidates.map((source) => (
                  <a
                    key={source.sourceUrl}
                    href={source.sourceUrl}
                    className="block rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_22px_rgba(11,19,32,0.035)] transition duration-200 hover:-translate-y-px hover:border-cm-teal/35 hover:shadow-[0_14px_34px_rgba(11,19,32,0.07)]"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{source.sourceTitle}</div>
                      <Badge tone="neutral">{source.sourceType}</Badge>
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-cm-dim">
                      {source.publisher} · confidence {source.confidence}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-cm-slate">{source.reason}</p>
                  </a>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Documents">
            <ListEmptyWhen
              empty={product.documents.length === 0}
              title="Нет документов"
              message="Документы еще не добавлены. Исследование продолжается."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {product.documents.map((document) => (
                  <a
                    key={document.url}
                    href={document.url}
                    className="rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_22px_rgba(11,19,32,0.035)] transition duration-200 hover:-translate-y-px hover:border-cm-teal/35 hover:shadow-[0_14px_34px_rgba(11,19,32,0.07)]"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Badge tone="neutral">{document.documentType}</Badge>
                    <div className="mt-3 text-sm font-semibold">{document.title}</div>
                    <div className="mt-2 font-mono text-[10px] leading-5 text-cm-dim">
                      {document.sha256 ? `sha256:${document.sha256.slice(0, 12)}…` : "Нет данных"}
                    </div>
                  </a>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Facts / Characteristics">
            <ListEmptyWhen
              empty={product.characteristics.length === 0}
              title="Нет характеристик"
              message="Характеристики появятся после проверки документов."
            >
              <div className="overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white">
                {product.characteristics.map((fact) => (
                  <div
                    key={`${fact.category}:${fact.value}:${fact.sourceUrl}`}
                    className="grid gap-2 border-b border-[var(--cm-rule)] p-4 last:border-b-0 md:grid-cols-[12rem_1fr]"
                  >
                    <div>
                      <div className="cm-label">{fact.category}</div>
                      <div className="mt-1 text-sm font-semibold">{fact.label}</div>
                    </div>
                    <div>
                      <div className="text-sm">
                        {fact.value}{fact.unit ? ` ${fact.unit}` : ""}
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-cm-slate">
                        {fact.rawText}
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-cm-dim">
                        {fact.sourceTitle} · {fact.extractionMethod} · confidence {fact.confidence}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Candidate Claims">
            <ListEmptyWhen
              empty={product.candidateClaims.length === 0}
              title="Нет кандидатных утверждений"
              message="Утверждения будут подготовлены после появления подтверждающих источников."
            >
              <div className="space-y-3">
                {product.candidateClaims.map((claim) => (
                  <div key={claim.claimId} className="cm-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{claim.suggestedClaimType}</Badge>
                      <Badge tone="warning">unverified</Badge>
                      <Badge tone="neutral">autoPublish false</Badge>
                    </div>
                    <div className="mt-3 text-sm">
                      {claim.valuePayload.value}
                      {claim.valuePayload.unit ? ` ${claim.valuePayload.unit}` : ""}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-cm-dim">
                      Evidence: {claim.evidenceCandidateIds.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Evidence Candidates">
            <ListEmptyWhen
              empty={product.evidenceCandidates.length === 0}
              title="Нет доказательств"
              message="Доказательства появятся после загрузки официальных документов."
            >
              <div className="space-y-3">
                {product.evidenceCandidates.map((evidence) => (
                  <div key={evidence.evidenceCandidateId} className="rounded-lg border border-[var(--cm-rule)] bg-white p-4">
                    <div className="text-xs leading-6 text-cm-slate">
                      “{evidence.quotedText}”
                    </div>
                    <div className="mt-3 font-mono text-[10px] text-cm-dim">
                      {evidence.sourceTitle} · {evidence.documentVersionId ?? "no document version"}
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Статус">
            <div className="space-y-2 text-xs leading-6 text-cm-slate">
              {researchSteps.map((step) => (
                <div key={step} className="flex gap-2">
                  <span className="text-cm-teal">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Conflicts">
            <ListEmptyWhen
              empty={product.conflicts.length === 0}
              message="Конфликты не выявлены."
            >
              <div className="space-y-3">
                {product.conflicts.map((conflict) => (
                  <div key={conflict.conflictId} className="text-xs leading-6">
                    <div className="font-semibold">{conflict.field}</div>
                    {conflict.values.map((value) => (
                      <div key={`${value.value}:${value.sourceUrl}`}>
                        {value.value} — {value.sourceTitle}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Review queue metadata">
            <div className="space-y-2 text-xs leading-6 text-cm-slate">
              <div>Status: {product.reviewStatus}</div>
              <div>Priority: {product.reviewPriority}</div>
              <div>Reviewer: {product.suggestedReviewerRole}</div>
              <div>Blocking: {product.blockingIssues.join(", ") || "none"}</div>
            </div>
          </Section>
        </aside>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cm-card p-5">
      <h2 className="text-sm font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "good" | "warning" | "neutral";
}) {
  const className =
    tone === "good"
      ? "border-cm-teal/30 bg-cm-teal/10 text-cm-teal"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-[var(--cm-rule)] bg-cm-surface-low text-cm-dim";
  return (
    <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-3">
      <div className="cm-label text-[8px]">{label}</div>
      <div className="mt-1 font-mono text-[13px] font-semibold text-cm-ink">
        {value}
      </div>
    </div>
  );
}

function displayMetric(value: number) {
  return value > 0 ? String(value) : "—";
}

function ListEmptyWhen({
  empty,
  title,
  message,
  children,
}: {
  empty: boolean;
  title?: string;
  message: string;
  children: ReactNode;
}) {
  if (empty) {
    return (
      <div className="cm-empty-state px-5 py-7 text-xs leading-6 text-cm-slate">
        <div className="cm-empty-icon">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
            <path
              d="M7 4h7l3 3v13H7z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M14 4v4h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>
        {title && <div className="mt-4 font-semibold text-cm-ink">{title}</div>}
        <div className="mx-auto mt-2 max-w-sm">{message}</div>
        <Link href="/request" className="cm-button-secondary mt-5 min-h-9 px-3 py-2 text-xs">
          Запросить проверку
        </Link>
      </div>
    );
  }
  return children;
}
