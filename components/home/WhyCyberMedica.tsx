const items = [
  {
    title: "Не просто каталог",
    text: "Мы собираем характеристики, РУ, инструкции, аналоги и совместимость в одной Knowledge Page.",
  },
  {
    title: "Быстрый подбор аналогов",
    text: "Помогаем понять, чем можно заменить изделие и какие параметры критичны.",
  },
  {
    title: "Инженерная логика",
    text: "Страницы строятся вокруг вопросов врача, инженера и закупщика, а не вокруг красивого описания.",
  },
  {
    title: "Коммерческое предложение",
    text: "После изучения изделия можно сразу запросить КП без лишней переписки.",
  },
];

export default function WhyCyberMedica() {
  return (
    <section className="mx-auto max-w-7xl px-8 py-24">
      <h2 className="text-4xl font-bold tracking-tight">
        Почему CyberMedica
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <h3 className="text-2xl font-bold">
              {item.title}
            </h3>

            <p className="mt-4 text-gray-600 leading-7">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}