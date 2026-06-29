const categories = [
  {
    title: "Анестезиология и реанимация",
    description: "Контуры, фильтры, маски, трубки, аспирация, ИВЛ.",
    count: "30+ групп",
  },
  {
    title: "Гибкая эндоскопия",
    description: "Эндоскопы, расходники, принадлежности и совместимость.",
    count: "20+ групп",
  },
  {
    title: "Неонатология",
    description: "Оборудование и расходные материалы для новорожденных.",
    count: "15+ групп",
  },
  {
    title: "Операционный блок",
    description: "Светильники, столы, коагуляторы, аспираторы.",
    count: "25+ групп",
  },
];

export default function Categories() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-8">
        <h2 className="text-4xl font-bold tracking-tight">
          Категории
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <div
              key={category.title}
              className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="text-sm font-semibold text-blue-600">
                {category.count}
              </div>

              <h3 className="mt-4 text-2xl font-bold">
                {category.title}
              </h3>

              <p className="mt-4 text-gray-600">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}