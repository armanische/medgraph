const items = [
  ["01", "Не просто каталог", "Характеристики, РУ, инструкции и совместимость объединены в одной записи."],
  ["02", "Проверяемое происхождение", "Публичные факты связаны с документом, доказательством и решением о публикации."],
  ["03", "Инженерная логика", "Информация организована вокруг профессионального решения, а не рекламного описания."],
  ["04", "Коммерческое предложение", "Запрос КП отделён от проверки данных и не влияет на их статус."],
];

export default function WhyCyberMedica() {
  return (
    <section className="cm-container py-14">
      <div className="cm-label">Принципы платформы</div>
      <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">Почему CyberMedica</h2>
      <div className="mt-6 grid gap-2 md:grid-cols-2">
        {items.map(([number, title, text]) => (
          <div key={title} className="cm-card flex gap-4 p-5">
            <span className="font-mono text-sm font-bold text-cm-teal">{number}</span>
            <div>
              <h3 className="text-[13px] font-bold">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-cm-slate">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
