import Image from "next/image";
import Link from "next/link";

export default function Hero({
  product,
}: {
  product: {
    name: string;
    image: { url: string; alt: string } | null;
  } | null;
}) {
  return (
    <section
      aria-labelledby="homepage-title"
      className="relative overflow-hidden border-b border-[var(--cm-rule)] bg-[linear-gradient(130deg,#ffffff_0%,#f7fbfb_48%,#e4f3f4_100%)]"
    >
      <div
        aria-hidden="true"
        className="absolute left-[-8rem] top-[-12rem] size-[28rem] rounded-full bg-cm-coral/8 blur-3xl"
      />
      <div className="cm-container relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-center lg:gap-16 lg:py-16">
        <div className="max-w-[44rem]">
          <div className="cm-label mb-5 flex items-center gap-2 !text-cm-teal">
            <span className="h-px w-7 bg-cm-coral" aria-hidden="true" />
            Профессиональная витрина оборудования
          </div>
          <h1
            id="homepage-title"
            className="cm-balanced text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-cm-ink sm:text-[3.45rem] lg:text-[4rem]"
          >
            Каталог медицинского оборудования
          </h1>
          <p className="mt-5 max-w-[39rem] text-[15px] leading-7 text-cm-slate sm:text-[17px] sm:leading-8">
            Оборудование ведущих мировых производителей для государственных и
            частных медицинских организаций.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className="cm-button-primary">
              Перейти в каталог
            </Link>
            <Link href="/request" className="cm-button-secondary">
              Запросить коммерческое предложение
            </Link>
          </div>
          <nav aria-label="Быстрые действия" className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <a href="#homepage-search" className="text-xs font-semibold text-cm-teal hover:text-cm-teal-dark">
              Найти модель ↓
            </a>
            <Link href="/manufacturers" className="text-xs font-semibold text-cm-slate hover:text-cm-teal">
              Все производители →
            </Link>
          </nav>
        </div>

        <aside aria-label="Оборудование из каталога" className="relative mx-auto min-h-[18rem] w-full max-w-[34rem] sm:min-h-[23rem] lg:min-h-[25rem]">
          <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(145deg,#dff3f4,#ffffff_54%,#fbe9e7)] shadow-[0_30px_80px_rgba(11,19,32,0.12)]" />
          <div className="absolute inset-3 overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/70 sm:inset-4">
            {product?.image ? (
              <Image
                src={product.image.url}
                alt={product.image.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain p-10 sm:p-14 lg:p-16"
              />
            ) : (
              <div className="cm-technical-surface flex h-full items-center justify-center text-cm-teal">
                <EquipmentIcon />
              </div>
            )}
          </div>
          {product && (
            <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/80 bg-white/92 px-4 py-3 shadow-[0_18px_40px_rgba(11,19,32,0.12)] backdrop-blur sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-[18rem]">
              <div className="cm-label !text-cm-teal">Модель из каталога</div>
              <div className="mt-1.5 text-sm font-bold text-cm-ink">{product.name}</div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function EquipmentIcon() {
  return (
    <svg viewBox="0 0 120 120" className="size-36" fill="none" aria-hidden="true">
      <rect x="24" y="15" width="72" height="80" rx="9" stroke="currentColor" strokeWidth="3" />
      <rect x="34" y="27" width="52" height="30" rx="4" stroke="currentColor" strokeWidth="3" />
      <path d="M40 47h10l6-11 8 17 6-9h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="42" cy="72" r="5" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="72" r="5" stroke="currentColor" strokeWidth="3" />
      <path d="M38 95v10M82 95v10M32 105h12M76 105h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
