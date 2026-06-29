const categories = [
  {
    title: "Анестезиология",
    count: "1 240 изделий",
    icon: "💉",
  },
  {
    title: "Реанимация",
    count: "2 180 изделий",
    icon: "❤️",
  },
  {
    title: "Неонатология",
    count: "640 изделий",
    icon: "👶",
  },
  {
    title: "Эндоскопия",
    count: "980 изделий",
    icon: "🔬",
  },
  {
    title: "Хирургия",
    count: "3 420 изделий",
    icon: "🩺",
  },
  {
    title: "УЗИ",
    count: "540 изделий",
    icon: "📡",
  },
];

export default function Categories() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-24">

      <div className="flex justify-between items-end mb-10">

        <div>

          <h2 className="text-4xl font-bold">
            Категории
          </h2>

          <p className="text-gray-500 mt-3">
            Более 30 направлений медицинских изделий
          </p>

        </div>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        {categories.map((c) => (
          <div
            key={c.title}
            className="rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-xl transition cursor-pointer"
          >

            <div className="text-5xl">
              {c.icon}
            </div>

            <h3 className="text-2xl font-bold mt-6">
              {c.title}
            </h3>

            <p className="text-gray-500 mt-2">
              {c.count}
            </p>

          </div>
        ))}

      </div>

    </section>
  );
}