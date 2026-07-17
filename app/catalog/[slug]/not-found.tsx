import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="min-h-[70vh] bg-cm-canvas px-4 py-16">
      <section
        aria-labelledby="product-not-found-title"
        className="mx-auto max-w-xl cm-card p-8 text-center"
      >
        <div className="cm-label">Каталог</div>
        <h1 id="product-not-found-title" className="mt-3 text-xl font-extrabold">
          Товар не найден
        </h1>
        <p className="mt-3 text-xs leading-6 text-cm-slate">
          Карточка могла быть скрыта или адрес изменился. Найдите оборудование
          через каталог или поиск.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/catalog" className="cm-button-primary">
            Вернуться в каталог
          </Link>
          <Link href="/search" className="cm-button-secondary">
            Начать поиск
          </Link>
        </div>
      </section>
    </main>
  );
}
