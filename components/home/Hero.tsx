import Link from "next/link";

export default function Hero({
  productCount,
  manufacturerCount,
  categoryCount,
}: {
  productCount: number;
  manufacturerCount: number;
  categoryCount: number;
}) {
  return (
    <section
      aria-labelledby="homepage-title"
      className="relative overflow-hidden border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_52%,#eaf6f7_100%)]"
    >
      <div
        aria-hidden="true"
        className="absolute right-[-12rem] top-[-10rem] size-[30rem] rounded-full bg-cm-teal/7 blur-3xl"
      />
      <div className="cm-container relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-center lg:py-24">
        <div className="max-w-[48rem]">
          <div className="cm-label mb-4 flex items-center gap-2 !text-cm-teal">
            <span className="size-1.5 rounded-full bg-cm-teal" aria-hidden="true" />
            Каталог медицинского оборудования
          </div>
          <h1
            id="homepage-title"
            className="cm-balanced text-[2.55rem] font-extrabold leading-[1.02] tracking-[-0.035em] text-cm-ink sm:text-[3.45rem] lg:text-[3.7rem]"
          >
            Найдите оборудование для клиники и закупки
          </h1>
          <p className="mt-5 max-w-[40rem] text-base leading-8 text-cm-slate sm:text-[17px]">
            Товары, производители, технические характеристики и документы — в
            одном понятном каталоге для выбора медицинского оборудования.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className="cm-button-primary">
              Открыть каталог
            </Link>
            <Link href="/manufacturers" className="cm-button-secondary">
              Производители
            </Link>
          </div>
          <nav aria-label="Быстрые действия" className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <a href="#homepage-search" className="text-xs font-semibold text-cm-teal hover:text-cm-teal-dark">
              Начать поиск ↓
            </a>
            <Link href="/compare" className="text-xs font-semibold text-cm-slate hover:text-cm-teal">
              Сравнить оборудование →
            </Link>
          </nav>
        </div>

        <aside
          aria-label="Сводка каталога"
          className="cm-card hidden overflow-hidden bg-white/80 shadow-[0_18px_46px_rgba(11,19,32,0.06)] backdrop-blur sm:block"
        >
          <div className="border-b border-[var(--cm-rule)] px-5 py-4">
            <div className="cm-label !text-cm-teal">В каталоге сейчас</div>
          </div>
          <dl className="divide-y divide-[var(--cm-rule)]">
            {[
              ["Товаров", productCount],
              ["Производителей", manufacturerCount],
              ["Категорий", categoryCount],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-5 px-5 py-4">
                <dt className="text-sm text-cm-slate">{label}</dt>
                <dd className="font-mono text-xl font-bold text-cm-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-[var(--cm-rule)] bg-cm-surface-low/55 px-5 py-4">
            <Link href="/search" className="text-xs font-semibold text-cm-teal">
              Перейти к расширенному поиску →
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
