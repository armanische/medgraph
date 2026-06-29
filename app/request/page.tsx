export default function RequestPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-3xl px-8 py-20">
        <div className="rounded-3xl border bg-white p-10 shadow-sm">
          <div className="text-sm font-semibold text-blue-600">
            Коммерческое предложение
          </div>

          <h1 className="mt-4 text-4xl font-bold">
            Запросить КП
          </h1>

          <p className="mt-4 text-gray-600">
            Заполните форму. Мы подберем изделие, аналоги, документы и подготовим предложение.
          </p>

          <form className="mt-10 space-y-5" action="/api/request" method="post">
            <input name="company" placeholder="Название организации" className="w-full rounded-xl border px-5 py-4 outline-none focus:border-blue-600" />
            <input name="name" placeholder="Ваше имя" className="w-full rounded-xl border px-5 py-4 outline-none focus:border-blue-600" />
            <input name="phone" placeholder="Телефон" className="w-full rounded-xl border px-5 py-4 outline-none focus:border-blue-600" />
            <input name="email" placeholder="Email" className="w-full rounded-xl border px-5 py-4 outline-none focus:border-blue-600" />
            <textarea name="message" placeholder="Что нужно подобрать?" rows={6} className="w-full rounded-xl border px-5 py-4 outline-none focus:border-blue-600" />

            <button className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white hover:bg-blue-700">
              Отправить запрос
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}