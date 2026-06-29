export default function CTA() {
  return (
    <section className="bg-blue-600 py-24 text-white">
      <div className="mx-auto max-w-7xl px-8 text-center">
        <h2 className="text-5xl font-bold tracking-tight">
          Не нашли нужное изделие?
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-xl text-blue-100">
          Отправьте запрос — подберем изделие, аналоги, документы и подготовим
          коммерческое предложение.
        </p>

        <button className="mt-10 rounded-2xl bg-white px-8 py-4 font-bold text-blue-700 transition hover:bg-gray-100">
          Запросить КП
        </button>
      </div>
    </section>
  );
}