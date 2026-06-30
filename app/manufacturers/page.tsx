const manufacturers = [
  {
    name: "Alba Healthcare",
    country: "США",
    categories: ["Анестезиология", "Реанимация"],
    products: ["FS510", "FS500"],
  },
  {
    name: "Ambu",
    country: "Дания",
    categories: ["Эндоскопия", "Анестезиология"],
    products: ["aScope", "AuraOnce"],
  },
  {
    name: "Hamilton Medical",
    country: "Швейцария",
    categories: ["ИВЛ", "Реанимация"],
    products: ["Hamilton C1", "Hamilton C3", "Hamilton T1"],
  },
  {
    name: "Mindray",
    country: "Китай",
    categories: ["ИВЛ", "Мониторы", "УЗИ"],
    products: ["SV300", "SV600", "BeneVision"],
  },
];

export default function ManufacturersPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-8 py-16">
        <h1 className="text-5xl font-bold">
          Производители
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-gray-600">
          База производителей медицинского оборудования и расходных материалов.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {manufacturers.map((manufacturer) => (
            <div
              key={manufacturer.name}
              className="rounded-3xl border bg-white p-8 shadow-sm"
            >
              <div className="text-sm font-semibold text-blue-600">
                {manufacturer.country}
              </div>

              <h2 className="mt-4 text-3xl font-bold">
                {manufacturer.name}
              </h2>

              <div className="mt-6 flex flex-wrap gap-2">
                {manufacturer.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-500">
                  Изделия:
                </div>

                <div className="mt-2 text-gray-700">
                  {manufacturer.products.join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}