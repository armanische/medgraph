const items = [
  ["01", "Каталог оборудования", "Характеристики, инструкции и совместимость объединены в одной карточке товара."],
  ["02", "Производители", "Оборудование сгруппировано по брендам, категориям и направлениям применения."],
  ["03", "Технические характеристики", "Параметры организованы для удобного выбора и сравнения оборудования."],
  ["04", "Коммерческое предложение", "Выберите оборудование и отправьте запрос специалисту CyberMedica."],
];

export default function WhyCyberMedica() {
  return (
    <section
      aria-labelledby="platform-benefits-title"
      className="cm-section border-t border-[var(--cm-rule)] bg-white"
    >
      <div className="cm-container">
      <div className="cm-label">Принципы платформы</div>
      <h2
        id="platform-benefits-title"
        className="cm-section-title"
      >
        Почему CyberMedica
      </h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map(([number, title, text]) => (
          <div key={title} className="cm-card flex gap-3 p-4">
            <span className="font-mono text-sm font-bold text-cm-teal">{number}</span>
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
