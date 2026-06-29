export default function RequestQuote() {
  return (
    <section className="max-w-4xl mx-auto px-8 py-24">

      <div className="bg-blue-600 rounded-3xl p-12 text-white">

        <h2 className="text-4xl font-bold">
          Получить коммерческое предложение
        </h2>

        <p className="mt-4 text-blue-100">
          Заполните форму, и мы подготовим коммерческое предложение.
        </p>

        <form className="grid gap-5 mt-10">

          <input
            placeholder="Название организации"
            className="rounded-xl px-5 py-4 text-black"
          />

          <input
            placeholder="Ваше имя"
            className="rounded-xl px-5 py-4 text-black"
          />

          <input
            placeholder="Телефон"
            className="rounded-xl px-5 py-4 text-black"
          />

          <input
            placeholder="Email"
            className="rounded-xl px-5 py-4 text-black"
          />

          <textarea
            placeholder="Комментарий"
            rows={5}
            className="rounded-xl px-5 py-4 text-black"
          />

          <button
            className="bg-white text-blue-700 rounded-xl py-4 font-bold hover:bg-gray-100 transition"
          >
            Получить КП
          </button>

        </form>

      </div>

    </section>
  );
}