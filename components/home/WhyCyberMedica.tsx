const items = [
  [
    "01",
    "Подбор под задачу",
    "Поиск по каталогу и навигация по категории и производителю помогают сузить выбор оборудования.",
  ],
  [
    "02",
    "Помощь с поиском аналогов",
    "Если нужная модель не найдена, отправьте запрос и опишите требования.",
  ],
  [
    "03",
    "Доступные характеристики и документы",
    "Карточка показывает имеющиеся публичные характеристики, регистрационные сведения и файлы.",
  ],
  [
    "04",
    "Сопровождение запроса",
    "Специалист помогает уточнить модель, комплектацию и исходные требования к запросу.",
  ],
] as const;

export default function WhyCyberMedica() {
  return (
    <section
      aria-labelledby="platform-benefits-title"
      className="cm-section bg-cm-canvas"
    >
      <div className="cm-container">
        <h2
          id="platform-benefits-title"
          className="cm-section-title"
        >
          Как CyberMedica помогает с выбором
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([number, title, text]) => (
            <div
              key={title}
              className="cm-card min-h-[8.25rem] p-4 sm:p-5 lg:min-h-36"
            >
              <div className="font-mono text-[10px] font-semibold text-cm-teal">
                {number}
              </div>
              <h3 className="mt-3 text-[15px] font-bold leading-5 tracking-[-0.01em]">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-cm-slate">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
