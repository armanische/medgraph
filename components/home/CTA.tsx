import Link from "next/link";

export default function CTA() {
  return (
    <section
      aria-labelledby="homepage-cta-title"
      className="cm-section bg-cm-canvas"
    >
      <div className="cm-container">
        <div className="cm-card grid gap-5 bg-[linear-gradient(135deg,#ffffff_0%,#f4fafb_100%)] p-5 sm:p-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-center lg:gap-8 lg:p-8">
          <div className="max-w-[38rem]">
            <h2
              id="homepage-cta-title"
              className="text-2xl font-extrabold leading-[1.2] tracking-[-0.025em] sm:text-[26px] lg:text-[30px]"
            >
              Не нашли нужную модель?
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-cm-slate">
              Перейдите в полный каталог или отправьте запрос — специалист поможет
              уточнить модель, комплектацию или возможный аналог.
            </p>
          </div>
          <nav
            aria-label="Следующие действия"
            className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end lg:gap-3"
          >
            <Link href="/catalog" className="cm-button-primary !min-h-[48px] w-full sm:w-auto">
              Перейти в каталог
            </Link>
            <Link href="/request" className="cm-button-secondary !min-h-[48px] w-full sm:w-auto">
              Запросить КП
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
