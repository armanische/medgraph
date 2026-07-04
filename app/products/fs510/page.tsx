import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { ProvenanceChain } from "@/components/product-page/ProvenanceChain";
import { formatDate } from "@/lib/date";
import { getPublicProductPage } from "@/lib/public-product-page";

export const metadata: Metadata = {
  title: "FS510 — проверенная карточка изделия | CyberMedica",
  description:
    "Регистрационные сведения, ключевые характеристики и доказательства по фильтру FS510.",
};

function Checkmark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="m7 12 3.2 3.2L17.5 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PageState({
  eyebrow,
  title,
  message,
}: {
  eyebrow: string;
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F4F7F8] px-5 py-16 text-[#163247] sm:px-8">
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#163247]/10 bg-white p-8 shadow-[0_20px_60px_rgba(22,50,71,0.07)] sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0B7182]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#5D707C]">
          {message}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B7182] px-5 py-3 font-semibold text-white transition hover:bg-[#075B69]"
          >
            Перейти в каталог
          </Link>
          <Link
            href="/request?product=fs510"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#163247]/15 bg-white px-5 py-3 font-semibold transition hover:border-[#0B7182]/50 hover:text-[#0B7182]"
          >
            Связаться с нами
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function Fs510ProductPage() {
  // Resolve environment and projection data at request time, not during build.
  await connection();
  const result = await getPublicProductPage("fs510");

  if (result.status === "not-found") {
    return (
      <PageState
        eyebrow="Карточка не опубликована"
        title="FS510 пока недоступен"
        message="В публичной проекции Supabase нет активной карточки FS510. Проверьте fixture и статус Publication."
      />
    );
  }

  if (result.status === "error") {
    return (
      <PageState
        eyebrow="Ошибка загрузки"
        title="Не удалось получить данные FS510"
        message={result.message}
      />
    );
  }

  const { product } = result;
  const verifiedDate = formatDate(product.publication.verifiedAt);
  const publishedDate = formatDate(product.publication.publishedAt);

  return (
    <main className="min-h-screen bg-[#F4F7F8] text-[#163247]">
      <div className="border-b border-[#163247]/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs sm:px-8">
          <div className="flex items-center gap-2 font-semibold text-[#0B7182]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DDF2EC]">
              <Checkmark className="h-4 w-4" />
            </span>
            CyberMedica Verified
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#667985]">
            <span>
              Проверено:{" "}
              <time dateTime={product.publication.verifiedAt}>
                {verifiedDate}
              </time>
            </span>
            <span>
              Опубликовано:{" "}
              <time dateTime={product.publication.publishedAt}>
                {publishedDate}
              </time>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <nav
          aria-label="Хлебные крошки"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#6E7F89]"
        >
          <Link href="/" className="transition hover:text-[#0B7182]">
            Главная
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalog" className="transition hover:text-[#0B7182]">
            Каталог
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#163247]">FS510</span>
        </nav>

        <section className="relative overflow-hidden rounded-[2rem] border border-[#163247]/8 bg-white shadow-[0_28px_80px_rgba(22,50,71,0.08)]">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#BEE9E2]/35 blur-3xl"
          />
          <div className="relative grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#E4F3F0_0%,#F7FAFA_70%)] p-9 sm:min-h-[460px] sm:p-14">
              <div
                aria-hidden="true"
                className="absolute inset-x-10 bottom-8 h-16 rounded-[100%] bg-[#163247]/10 blur-2xl"
              />
              <Image
                src={product.heroImage.src}
                alt={product.heroImage.alt}
                width={760}
                height={760}
                priority
                className="relative max-h-[420px] w-full object-contain mix-blend-multiply drop-shadow-[0_22px_25px_rgba(22,50,71,0.14)]"
              />
              <div className="absolute left-5 top-5 rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-[#0B7182] shadow-sm backdrop-blur sm:left-7 sm:top-7">
                Фото изделия
              </div>
            </div>

            <div className="p-7 sm:p-10 lg:p-12 xl:p-14">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF2EC] px-3 py-1.5 text-xs font-semibold text-[#0B7182]">
                  <Checkmark className="h-4 w-4" />
                  {product.publication.status}
                </span>
                <span className="rounded-full border border-[#163247]/10 bg-white px-3 py-1.5 text-xs font-medium text-[#5D707C]">
                  {product.category}
                </span>
              </div>

              <p className="mt-7 font-mono text-sm font-semibold tracking-[0.12em] text-[#0B7182]">
                FS510 · HMEF
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-[#5D707C] sm:text-lg">
                {product.description}
              </p>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#163247]/8 bg-[#163247]/8 sm:grid-cols-3">
                <div className="bg-[#FAFCFC] p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#71818B]">
                    Производитель
                  </dt>
                  <dd className="mt-2 font-semibold">{product.manufacturer}</dd>
                </div>
                <div className="bg-[#FAFCFC] p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#71818B]">
                    Регистрационное удостоверение
                  </dt>
                  <dd className="mt-2 font-mono text-sm font-semibold">
                    {product.registration.number}
                  </dd>
                </div>
                <div className="bg-[#FAFCFC] p-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#71818B]">
                    Статус РУ
                  </dt>
                  <dd className="mt-2 font-semibold text-[#0B7182]">
                    {product.registration.status}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/request?product=fs510"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B7182] px-6 py-3 font-semibold text-white shadow-[0_10px_25px_rgba(11,113,130,0.2)] transition hover:bg-[#075B69]"
                >
                  Запросить КП
                </Link>
                <a
                  href="#evidence"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#163247]/12 bg-white px-5 py-3 font-semibold transition hover:border-[#0B7182]/40 hover:text-[#0B7182]"
                >
                  Смотреть доказательства
                </a>
              </div>
            </div>
          </div>
        </section>

        <nav
          aria-label="Разделы карточки"
          className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-[#163247]/8 bg-white p-2 text-sm font-semibold shadow-sm"
        >
          {[
            ["#overview", "Ключевое"],
            ["#claims", "Проверенные Claims"],
            ["#evidence", "Источники"],
            ["#history", "История"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="min-h-10 shrink-0 rounded-xl px-4 py-2.5 text-[#5D707C] transition hover:bg-[#EAF5F3] hover:text-[#0B7182]"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="overview" className="scroll-mt-24 pt-10">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl bg-[#163247] p-7 text-white sm:p-9">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8DD8D0]">
                Для быстрого решения
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Ключевое за 30 секунд
              </h2>
              <ul className="mt-7 space-y-5">
                {product.keySummary.map((item, index) => (
                  <li key={item} className="flex gap-4 leading-7 text-white/85">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B7182] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#163247]/8 bg-white p-7 sm:p-9">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B7182]">
                    Product snapshot
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    Ключевые характеристики
                  </h2>
                </div>
                <span className="rounded-full bg-[#EEF3F4] px-3 py-1.5 text-xs font-semibold text-[#5D707C]">
                  {product.characteristics.length} параметра
                </span>
              </div>
              <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                {product.characteristics.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[#163247]/8 bg-[#F8FAFA] p-5"
                  >
                    <dt className="text-sm leading-5 text-[#667985]">
                      {item.label}
                    </dt>
                    <dd className="mt-3 font-mono text-lg font-semibold">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="claims" className="scroll-mt-24 pt-14">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B7182]">
              Published claim projection
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Что именно проверено — и в каких границах
            </h2>
            <p className="mt-4 leading-7 text-[#5D707C]">
              Каждый опубликованный факт показан вместе со Scope и ограничениями.
              Это не общая рекомендация и не обещание применимости за пределами
              указанного контекста.
            </p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {product.claims.map((claim) => {
              const source = product.sources.find(
                (item) => item.id === claim.sourceId,
              );

              return (
                <article
                  key={claim.code}
                  className="overflow-hidden rounded-3xl border border-[#163247]/8 bg-white shadow-[0_14px_40px_rgba(22,50,71,0.04)]"
                >
                  <div className="border-b border-[#163247]/8 p-6 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0B7182]">
                          {claim.code}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold">
                          {claim.displayName}
                        </h3>
                      </div>
                      <span className="rounded-xl bg-[#DDF2EC] px-3 py-2 font-mono text-sm font-bold text-[#0B7182]">
                        {claim.formattedValue}
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-[#5D707C]">
                      {claim.scope.summary}
                    </p>
                  </div>

                  <div className="grid gap-px bg-[#163247]/8 sm:grid-cols-2">
                    <div className="bg-[#F9FBFB] p-6">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B7182]">
                        Scope · применимо к
                      </h4>
                      <ul className="mt-4 space-y-3">
                        {claim.scope.appliesTo.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2.5 text-sm leading-5"
                          >
                            <Checkmark className="mt-0.5 h-4 w-4 shrink-0 text-[#0B7182]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#FFFDFC] p-6">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A25D35]">
                        Ограничения
                      </h4>
                      <ul className="mt-4 space-y-3">
                        {claim.limitations.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2.5 text-sm leading-5 text-[#5D5550]"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C77A4D]"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#163247]/8 px-6 py-4 text-xs text-[#667985] sm:px-7">
                    <span>
                      Publication:{" "}
                      <span className="font-mono text-[#163247]">
                        {claim.publicationKey}
                      </span>
                    </span>
                    {source ? (
                      <a
                        href={`#source-${source.id}`}
                        className="font-semibold text-[#0B7182] hover:underline"
                      >
                        Перейти к доказательству ↓
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="evidence" className="scroll-mt-24 pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B7182]">
                Data provenance
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                От источника до публикации
              </h2>
              <p className="mt-4 leading-7 text-[#5D707C]">
                Цепочка показывает происхождение каждого опубликованного Claim.
                Документ можно открыть напрямую, а Evidence — сверить по локатору.
              </p>
            </div>
            <span className="rounded-full bg-[#DDF2EC] px-3 py-1.5 text-xs font-semibold text-[#0B7182]">
              {product.sources.length} доказательных цепочки
            </span>
          </div>

          <div className="mt-7 space-y-6">
            {product.sources.map((source) => (
              <article
                id={`source-${source.id}`}
                key={source.id}
                className="scroll-mt-24 rounded-3xl border border-[#163247]/8 bg-[#EDF4F3] p-4 sm:p-6"
              >
                <ProvenanceChain source={source} />

                <div className="mt-4 grid gap-4 rounded-2xl border border-[#163247]/8 bg-white p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#DDF2EC] px-2.5 py-1 text-[11px] font-semibold text-[#0B7182]">
                        {source.verification.status}
                      </span>
                      <span className="font-mono text-[11px] text-[#71818B]">
                        {source.publication.publicKey}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">
                      {source.document.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#667985]">
                      {source.source.name} · {source.document.type} ·{" "}
                      {source.documentVersion.label}
                    </p>
                    <blockquote className="mt-4 border-l-2 border-[#0B7182] pl-4 text-sm leading-6 text-[#435A68]">
                      «{source.evidence.excerpt}»
                    </blockquote>
                    <p className="mt-3 text-xs text-[#71818B]">
                      Локатор: {source.evidence.locator}
                    </p>
                  </div>
                  <a
                    href={source.document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-[#0B7182]/25 bg-white px-5 py-3 text-sm font-semibold text-[#0B7182] transition hover:bg-[#EAF5F3]"
                  >
                    Открыть документ ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="history" className="scroll-mt-24 pt-14">
          <div className="grid gap-8 rounded-[2rem] border border-[#163247]/8 bg-white p-7 sm:p-9 lg:grid-cols-[0.72fr_1.28fr] lg:p-11">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B7182]">
                Audit trail
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                История публикаций
              </h2>
              <p className="mt-4 leading-7 text-[#5D707C]">
                Здесь отображаются только события, переданные публичной
                проекцией. Portal не читает журнал Factory напрямую.
              </p>
            </div>

            <ol className="relative ml-3 border-l border-[#0B7182]/25">
              {product.publicationHistory.map((item) => (
                <li
                  key={`${item.publicationKey}-${item.effectiveAt}`}
                  className="relative pb-8 pl-7 last:pb-0"
                >
                  <span className="absolute -left-2 top-1 flex h-4 w-4 items-center justify-center rounded-full border-4 border-white bg-[#0B7182] ring-1 ring-[#0B7182]/20" />
                  <div className="flex flex-wrap items-center gap-2">
                    <time
                      dateTime={item.effectiveAt}
                      className="text-sm font-semibold text-[#0B7182]"
                    >
                      {formatDate(item.effectiveAt)}
                    </time>
                    <span className="rounded-full bg-[#EEF3F4] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#667985]">
                      {item.event}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5D707C]">
                    {item.description}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-[#71818B]">
                    {item.publicationKey}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#0B7182] p-7 text-white sm:p-10">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A8E1DB]">
                Коммерческое предложение
              </p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Нужны цена, срок поставки или подтверждение характеристик?
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Укажите организацию и количество — подготовим ответ для вашей
                закупочной задачи.
              </p>
            </div>
            <Link
              href="/request?product=fs510"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-[#0B7182] transition hover:bg-[#EAF5F3]"
            >
              Запросить КП
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
