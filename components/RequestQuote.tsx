export default function RequestQuote() {
  return (
    <section className="max-w-4xl mx-auto py-20 px-8">

      <div className="bg-blue-600 rounded-3xl p-12 text-white">

        <h2 className="text-4xl font-bold">
          Получить коммерческое предложение
        </h2>

        <p className="mt-4 text-blue-100">
          Ответим в течение 30 минут
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-8">

          <input
            className="bg-white rounded-xl p-4 text-black"
            placeholder="Компания"
          />

          <input
            className="bg-white rounded-xl p-4 text-black"
            placeholder="E-mail"
          />

          <input
            className="bg-white rounded-xl p-4 text-black md:col-span-2"
            placeholder="Телефон"
          />

          <textarea
            className="bg-white rounded-xl p-4 text-black md:col-span-2 h-40"
            placeholder="Комментарий"
          />

        </div>

        <button className="mt-8 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl">
          Получить КП
        </button>

      </div>

    </section>
  );
}