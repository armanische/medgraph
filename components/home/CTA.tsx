import Link from "next/link";

export default function CTA() {
  return (
    <section
      aria-labelledby="homepage-cta-title"
      className="relative overflow-hidden border-t border-[var(--cm-rule)] bg-cm-ink text-white"
    >
      <div aria-hidden="true" className="absolute -right-16 -top-24 size-72 rounded-full bg-cm-teal/20 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-[-7rem] left-[20%] size-56 rounded-full bg-cm-coral/14 blur-3xl" />
      <div className="cm-container relative flex flex-col gap-6 py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[38rem]">
          <div className="cm-label !text-cm-coral">Помощь специалиста</div>
          <h2 id="homepage-cta-title" className="mt-2 text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
            Не нашли нужную модель?
          </h2>
          <p className="mt-3 text-[14px] leading-7 text-white/65">
            Оставьте запрос, и мы поможем подобрать оборудование или аналог.
          </p>
        </div>
        <nav aria-label="Следующие действия" className="flex flex-wrap items-center gap-3">
          <Link
            href="/request"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cm-coral px-5 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-cm-coral-dark hover:shadow-[0_14px_34px_rgba(216,75,67,0.24)]"
          >
            Запросить коммерческое предложение
          </Link>
          <Link
            href="/catalog"
            className="inline-flex min-h-12 items-center justify-center px-3 text-xs font-semibold text-white/65 transition hover:text-white"
          >
            Вернуться в каталог →
          </Link>
        </nav>
      </div>
    </section>
  );
}
