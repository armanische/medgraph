export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50">

      <div className="max-w-7xl mx-auto px-8 py-32">

        <div className="max-w-4xl">

          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
            AI Knowledge Commerce Platform
          </div>

          <h1 className="mt-8 text-6xl font-black leading-tight tracking-tight text-gray-900">
            Медицинские изделия.
            <br />
            Не просто каталог.
            <br />
            База инженерных знаний.
          </h1>

          <p className="mt-8 max-w-3xl text-xl leading-9 text-gray-600">
            CyberMedica объединяет производителей,
            регистрационные удостоверения,
            характеристики,
            аналоги,
            совместимость,
            тендеры
            и коммерческие предложения
            в одной системе.
          </p>

          <div className="mt-12 flex gap-4">

            <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700">
              Начать поиск
            </button>

            <button className="rounded-xl border border-gray-300 bg-white px-8 py-4 font-semibold hover:bg-gray-50">
              База знаний
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}