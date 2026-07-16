import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getDraftCatalogProduct,
  getDraftCatalogProducts,
} from "@/lib/catalog-drafts";
import { getPublishedProduct, getPublishedProducts } from "@/lib/published-catalog";
import type { PublishedProduct } from "@/scripts/importers/catalog/publication/types";
import type { DraftResearchStatus } from "@/types/catalog-draft";

export function generateStaticParams() {
  return [
    ...new Set([
      ...getPublishedProducts().map((product) => product.slug),
      ...getDraftCatalogProducts().map((product) => product.slug),
    ]),
  ].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const published = getPublishedProduct(slug);
  const product = getDraftCatalogProduct(slug);
  return {
    title: published
      ? `${published.name} — опубликованная карточка`
      : product
        ? `${product.title} — карточка медицинского изделия`
      : "Карточка медицинского изделия",
    description:
      published?.description ??
      "Карточка медицинского изделия CyberMedica с источниками, документами и статусом проверки.",
    alternates: published || product
      ? {
          canonical: `/catalog/${published?.slug ?? product?.slug}`,
        }
      : undefined,
  };
}

export default async function DraftCatalogProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const published = getPublishedProduct(slug);
  if (published) return <PublishedProductPage product={published} />;
  const product = getDraftCatalogProduct(slug);
  if (!product) notFound();
  const researchSteps = [
    product.sourcesSummary.official > 0
      ? "Официальные источники найдены"
      : "Поиск официальных источников",
    product.documentsSummary.total > 0
      ? "Документы найдены"
      : "Требуются регистрационные документы",
    product.candidateClaimsCount > 0
      ? "Характеристики собраны"
      : "Подготовка характеристик",
    "Проверяется специалистом",
  ];

  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-10">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">Каталог</Link>
            {" · карточка изделия"}
          </div>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={product.researchStatus === "research_ready" ? "good" : "neutral"}>
                  {researchStatusLabel(product.researchStatus)}
                </Badge>
                <Badge tone="neutral">Проверяется</Badge>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-[-0.03em]">
                {product.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cm-slate">
                Запись проходит независимую проверку CyberMedica: источники,
                документы и характеристики будут опубликованы только после
                экспертного подтверждения.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/request?product=${encodeURIComponent(product.title)}`}
                  className="cm-button-primary shadow-[0_12px_30px_rgba(11,19,32,0.16)]"
                >
                  Запросить КП
                </Link>
                <Link href="/catalog" className="cm-button-secondary">
                  Вернуться в каталог
                </Link>
              </div>
            </div>
            <div className="cm-card overflow-hidden bg-white/82 p-4 shadow-[0_14px_40px_rgba(11,19,32,0.06)] backdrop-blur">
              <div className="-mx-4 -mt-4 mb-4 border-b border-[var(--cm-rule)] bg-white px-4 py-3">
                <div className="cm-label !text-cm-teal">Готовность записи</div>
              </div>
              <div className="cm-label">Проверка</div>
              <div className="mt-3 font-mono text-4xl font-bold text-cm-ink">
                {displayMetric(product.readinessScore)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <Metric label="Источники" value={displayMetric(product.sourcesSummary.total)} />
                <Metric label="Официальные" value={displayMetric(product.sourcesSummary.official)} />
                <Metric label="Документы" value={displayMetric(product.documentsSummary.total)} />
                <Metric label="Характеристики" value={displayMetric(product.candidateClaimsCount)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <Section title="Сводка проверки">
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Качество источников" value={displayMetric(product.sourceQualityScore)} />
              <Metric label="Расхождения" value={displayMetric(product.conflicts.length)} />
              <Metric label="Статус" value="Ожидает" />
            </div>
            <div className="mt-4 rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_24px_rgba(11,19,32,0.035)]">
              <div className="text-xs font-semibold">Проверка продолжается</div>
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
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                {product.researchWarnings.slice(0, 4).map((warning) => (
                  <div key={warning}>• {warning}</div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Источники">
            <ListEmptyWhen
              empty={product.sourceCandidates.length === 0}
              message="Официальные источники пока не найдены."
            >
              <div className="space-y-3">
                {product.sourceCandidates.map((source) => (
                  <a
                    key={source.sourceUrl}
                    href={source.sourceUrl}
                    className="block rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_22px_rgba(11,19,32,0.03)] transition duration-200 hover:-translate-y-px hover:border-cm-teal/30 hover:shadow-[0_14px_34px_rgba(11,19,32,0.06)]"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{source.sourceTitle}</div>
                      <Badge tone="neutral">Источник</Badge>
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-cm-dim">
                      {source.publisher}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-cm-slate">{source.reason}</p>
                  </a>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Документы">
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
                    className="rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_8px_22px_rgba(11,19,32,0.03)] transition duration-200 hover:-translate-y-px hover:border-cm-teal/30 hover:shadow-[0_14px_34px_rgba(11,19,32,0.06)]"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Badge tone="neutral">{document.documentType}</Badge>
                    <div className="mt-3 text-sm font-semibold">{document.title}</div>
                    <div className="mt-2 font-mono text-[10px] leading-5 text-cm-dim">
                      {document.sha256 ? "Файл сохранён для проверки" : "Файл ожидается"}
                    </div>
                  </a>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Характеристики">
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
                        {fact.sourceTitle}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Факты на проверке">
            <ListEmptyWhen
              empty={product.candidateClaims.length === 0}
              title="Нет фактов на проверке"
              message="Факты будут подготовлены после появления подтверждающих источников."
            >
              <div className="space-y-3">
                {product.candidateClaims.map((claim) => (
                  <div key={claim.claimId} className="cm-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">Факт</Badge>
                      <Badge tone="warning">на проверке</Badge>
                      <Badge tone="neutral">не опубликовано</Badge>
                    </div>
                    <div className="mt-3 text-sm">
                      {claim.valuePayload.value}
                      {claim.valuePayload.unit ? ` ${claim.valuePayload.unit}` : ""}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-cm-dim">
                      Оснований: {claim.evidenceCandidateIds.length}
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Основания">
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
                      {evidence.sourceTitle} · документ ожидает проверки
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

          <Section title="Расхождения">
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

          <Section title="Проверка специалистом">
            <div className="space-y-2 text-xs leading-6 text-cm-slate">
              <div>Состояние: проверяется</div>
              <div>Приоритет: {priorityLabel(product.reviewPriority)}</div>
              <div>Роль: медицинский эксперт данных</div>
              <div>Блокирующие вопросы: {product.blockingIssues.length || "нет"}</div>
            </div>
          </Section>
        </aside>
      </div>
    </main>
  );
}

function PublishedProductPage({ product }: { product: PublishedProduct }) {
  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-10">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">Каталог</Link>
            {" · опубликованная карточка"}
          </div>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div>
              <Badge tone="good">Опубликовано</Badge>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-[-0.03em]">
                {product.name}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cm-slate">
                {product.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/request?product=${encodeURIComponent(product.name)}`}
                  className="cm-button-primary"
                >
                  Запросить КП
                </Link>
                <Link href="/catalog" className="cm-button-secondary">Вернуться в каталог</Link>
              </div>
            </div>
            <div className="cm-card p-4">
              <div className="cm-label !text-cm-teal">Публикация</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric label="Покрытие" value={`${product.coverage}%`} />
                <Metric label="Характеристики" value={String(product.specifications.length)} />
                <Metric label="Документы" value={String(product.documents.length)} />
                <Metric label="Источники" value={String(product.officialSources.length)} />
              </div>
              <div className="mt-4 text-[11px] leading-5 text-cm-slate">
                Уровень: проверено рецензентом
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <Section title="Характеристики">
            <ListEmptyWhen empty={product.specifications.length === 0} message="Опубликованных характеристик нет.">
              <div className="overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white">
                {product.specifications.map((specification, index) => (
                  <div key={`${specification.type}:${specification.value}:${index}`} className="grid gap-2 border-b border-[var(--cm-rule)] p-4 last:border-0 md:grid-cols-[14rem_1fr]">
                    <div className="cm-label">{specification.type}</div>
                    <div className="text-sm font-semibold">
                      {specification.value}{specification.unit ? ` ${specification.unit}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Документы">
            <div className="grid gap-3 md:grid-cols-2">
              {product.documents.map((document) => (
                <a key={document.url} href={document.url} target="_blank" rel="noreferrer" className="cm-card p-4">
                  <Badge tone="neutral">{document.type}</Badge>
                  <div className="mt-3 text-sm font-semibold">{document.title}</div>
                </a>
              ))}
            </div>
          </Section>

          <Section title="Документально подтверждённая совместимость">
            <ListEmptyWhen empty={product.compatibility.length === 0} message="Опубликованных данных о совместимости нет.">
              <ul className="grid gap-2 text-sm text-cm-slate">
                {product.compatibility.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </ListEmptyWhen>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Изделие">
            <dl className="space-y-3 text-xs">
              <div><dt className="cm-label">Производитель</dt><dd className="mt-1 font-semibold">{product.manufacturer}</dd></div>
              <div><dt className="cm-label">Модель</dt><dd className="mt-1 font-semibold">{product.model ?? "Не указана"}</dd></div>
              <div><dt className="cm-label">Категория</dt><dd className="mt-1 font-semibold">{product.category}</dd></div>
              <div><dt className="cm-label">Статус</dt><dd className="mt-1 font-semibold text-cm-verified">Опубликовано</dd></div>
            </dl>
          </Section>
          <Section title="Источники">
            <div className="space-y-3">
              {product.officialSources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-cm-teal">
                  {source.title} ↗
                </a>
              ))}
            </div>
          </Section>
          <Section title="Обновление">
            <time dateTime={product.updatedAt} className="text-xs text-cm-slate">
              {product.updatedAt}
            </time>
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
    <section className="cm-card p-5 shadow-[0_8px_30px_rgba(11,19,32,0.035)]">
      <h2 className="text-sm font-bold tracking-[-0.01em]">{title}</h2>
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
      ? "border-cm-teal/24 bg-cm-teal-soft/70 text-cm-teal"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-[var(--cm-rule)] bg-white/80 text-cm-slate";
  return (
    <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/75 p-3">
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

function researchStatusLabel(status: DraftResearchStatus) {
  const labels: Record<DraftResearchStatus, string> = {
    needs_source: "Нет подтверждённых данных",
    partially_researched: "Проверяется",
    research_ready: "Проверяется",
    blocked: "Проверяется",
  };
  return labels[status];
}

function priorityLabel(priority: "high" | "medium" | "low") {
  const labels = {
    high: "высокий",
    medium: "средний",
    low: "низкий",
  } as const;
  return labels[priority];
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
