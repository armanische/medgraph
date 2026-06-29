import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-3xl px-8 py-24">
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">✅</div>

          <h1 className="mt-6 text-4xl font-bold">
            Запрос принят
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Мы получили заявку. Менеджер свяжется с вами для подготовки коммерческого предложения.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href="/" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
              На главную
            </Link>

            <Link href="/catalog" className="rounded-xl border bg-white px-6 py-3 font-semibold">
              В каталог
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}