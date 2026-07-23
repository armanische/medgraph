import Link from "next/link";

import Search from "@/components/home/Search";

export default function Hero() {
  return (
    <section
      aria-labelledby="homepage-title"
      className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]"
    >
      <div className="cm-container py-10 sm:py-14 lg:py-16">
        <div className="max-w-[56rem]">
          <h1
            id="homepage-title"
            className="cm-balanced max-w-[52rem] text-[2.125rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-cm-ink sm:text-[2.5rem] lg:text-5xl"
          >
            Медицинское оборудование для клиник и медицинских организаций
          </h1>
          <p className="mt-4 max-w-[44rem] text-[15px] leading-6 text-cm-slate sm:text-base sm:leading-7">
            Найдите оборудование по названию, модели, производителю или категории
            и перейдите к карточке с доступными характеристиками и документами.
          </p>

          <Search />

          <div className="mt-4">
            <Link href="/catalog" className="cm-button-secondary !min-h-[44px] w-full sm:w-auto">
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
