import Link from "next/link";

export default function ManufacturerNotFound() {
  return (
    <main className="min-h-[70vh] bg-cm-canvas px-4 py-16">
      <section
        aria-labelledby="manufacturer-not-found-title"
        className="mx-auto max-w-xl cm-card p-8 text-center"
      >
        <div className="cm-label">Производители</div>
        <h1
          id="manufacturer-not-found-title"
          className="mt-3 text-xl font-extrabold"
        >
          Производитель не найден
        </h1>
        <p className="mt-3 text-xs leading-6 text-cm-slate">
          Страница могла быть скрыта или адрес изменился. Откройте актуальный
          список производителей либо перейдите в каталог.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/manufacturers" className="cm-button-primary">
            Все производители
          </Link>
          <Link href="/catalog" className="cm-button-secondary">
            Открыть каталог
          </Link>
        </div>
      </section>
    </main>
  );
}
