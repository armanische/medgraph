import Link from "next/link";

export default function CTA() {
  return (
    <section
      aria-labelledby="homepage-cta-title"
      className="border-t border-[var(--cm-rule)] bg-cm-ink text-white"
    >
      <div className="cm-container flex flex-col gap-5 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[38rem]">
          <h2 id="homepage-cta-title" className="text-xl font-bold tracking-[-0.02em]">
            Начните подбор оборудования
          </h2>
          <p className="mt-3 text-[13px] leading-6 text-white/65">
            Откройте каталог, найдите нужную модель или изучите оборудование по производителям.
          </p>
        </div>
        <nav aria-label="Следующие действия" className="flex flex-wrap gap-3">
          <Link href="/catalog" className="cm-button-primary shrink-0">
            Открыть каталог
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/25 px-4 text-xs font-semibold text-white transition hover:border-white/45 hover:bg-white/10"
          >
            Начать поиск
          </Link>
          <Link
            href="/manufacturers"
            className="inline-flex min-h-10 items-center justify-center px-2 text-xs font-semibold text-white/70 transition hover:text-white"
          >
            Производители →
          </Link>
        </nav>
      </div>
    </section>
  );
}
