export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-16 items-center">

        <div>

          <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
            Alba Healthcare
          </span>

          <h1 className="text-6xl font-bold mt-6">
            Тепловлагообменный фильтр FS510
          </h1>

          <p className="text-xl text-gray-600 mt-8">
            Полная техническая информация,
            характеристики, документы,
            аналоги и коммерческое предложение.
          </p>

          <div className="flex gap-4 mt-10">

            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl">
              Получить КП
            </button>

            <button className="border px-8 py-4 rounded-xl">
              Скачать РУ
            </button>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-xl p-16">

          <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">

            Фото FS510

          </div>

        </div>

      </div>
    </section>
  )
}