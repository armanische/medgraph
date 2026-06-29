const features = [
  {
    title: "99.999%",
    text: "Эффективность фильтрации",
  },
  {
    title: "24 часа",
    text: "Использование",
  },
  {
    title: "CO₂",
    text: "Порт Luer Lock",
  },
  {
    title: "100–2000 мл",
    text: "Дыхательный объем",
  },
  {
    title: "28 мл",
    text: "Мертвое пространство",
  },
  {
    title: "27 г",
    text: "Вес изделия",
  },
];

export default function Features() {
  return (
    <section className="max-w-7xl mx-auto px-8 pb-20">
      <h2 className="text-3xl font-bold mb-10">
        Основные характеристики
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-md transition"
          >
            <div className="text-4xl font-bold text-blue-600">
              {feature.title}
            </div>

            <div className="mt-3 text-gray-600">
              {feature.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}