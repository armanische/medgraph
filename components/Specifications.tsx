const specs = [
  ["Производитель", "Alba Healthcare"],
  ["Модель", "FS510"],
  ["Тип фильтрации", "Электростатический"],
  ["Дыхательный объём", "100–2000 мл"],
  ["Эффективность фильтрации", "≥99,999%"],
  ["Внутренний объём", "28 мл"],
  ["Мёртвое пространство", "< 28 мл"],
  ["Вес", "27 г"],
  ["Материал", "Полипропилен / Поликарбонат"],
  ["CO₂-порт", "Luer Lock"],
  ["Срок использования", "24 часа"],
  ["Срок годности", "5 лет"],
];
export default function Specifications() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-16">
      <h2 className="text-3xl font-bold mb-8">
        Технические характеристики
      </h2>

      <div className="overflow-hidden rounded-2xl border bg-white">
        {specs.map(([name, value], index) => (
          <div
            key={name}
            className={`grid grid-cols-2 px-6 py-4 ${
              index % 2 === 0 ? "bg-gray-50" : ""
            }`}
          >
            <div className="font-medium text-gray-600">{name}</div>
            <div>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}