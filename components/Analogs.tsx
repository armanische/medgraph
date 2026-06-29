const analogs = [
  {
    model: "FS500",
    brand: "Alba Healthcare",
    note: "Электростатический фильтр",
  },
  {
    model: "Hygrobac S",
    brand: "Medtronic",
    note: "Высокая эффективность фильтрации",
  },
  {
    model: "BB100",
    brand: "Intersurgical",
    note: "Аналогичный класс изделия",
  },
];

export default function Analogs() {
  return (
    <section
      id="analogs"
      className="max-w-7xl mx-auto px-8 py-20"
    >
      <h2 className="text-3xl font-bold mb-8">
        Возможные аналоги
      </h2>

      <div className="overflow-hidden rounded-2xl border bg-white">

        <div className="grid grid-cols-3 bg-gray-100 font-semibold px-6 py-4">
          <div>Модель</div>
          <div>Производитель</div>
          <div>Комментарий</div>
        </div>

        {analogs.map((item) => (
          <div
            key={item.model}
            className="grid grid-cols-3 px-6 py-4 border-t"
          >
            <div>{item.model}</div>
            <div>{item.brand}</div>
            <div>{item.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}