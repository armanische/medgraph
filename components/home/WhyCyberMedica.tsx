const items = [
  ["search", "Поиск по каталогу", "Ищите оборудование по названию, модели, производителю или категории."],
  ["filters", "Фильтрация оборудования", "Сужайте каталог по категории, производителю и области применения."],
  ["manufacturers", "Страницы производителей", "Переходите от профиля производителя к доступным моделям оборудования."],
  ["request", "Запрос специалисту", "Отправьте запрос на модель, комплектацию или коммерческое предложение."],
];

export default function WhyCyberMedica() {
  return (
    <section
      aria-labelledby="platform-benefits-title"
      className="cm-section border-t border-[var(--cm-rule)] bg-white"
    >
      <div className="cm-container">
      <div className="cm-label !text-cm-teal">Профессиональный каталог</div>
      <h2
        id="platform-benefits-title"
        className="cm-section-title"
      >
        Возможности каталога
      </h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map(([icon, title, text]) => (
          <div key={title} className="cm-card flex gap-4 p-5">
            <BenefitIcon name={icon} />
            <div>
              <h3 className="text-[13px] font-bold tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 max-w-[30rem] text-xs leading-6 text-cm-slate">{text}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

function BenefitIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    search: "M10.5 5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm4 9.5L20 20",
    filters: "M5 7h14M8 12h8M10 17h4",
    manufacturers: "M5 20V8l7-4 7 4v12M9 20v-5h6v5",
    request: "M5 6h14v10H9l-4 3V6Zm4 4h6M9 13h4",
  };

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cm-teal/15 bg-cm-teal-soft text-cm-teal">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path d={paths[name]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
