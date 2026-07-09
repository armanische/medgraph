import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-cm-canvas px-4 py-16">
      <section className="mx-auto max-w-xl cm-card p-8 text-center">
        <div className="cm-label">Страница недоступна</div>
        <h1 className="mt-3 text-xl font-extrabold">Страница не найдена</h1>
        <p className="mt-3 text-xs leading-6 text-cm-slate">
          Адрес мог измениться или запись ещё не опубликована.
        </p>
        <Link href="/catalog" className="cm-button-primary mt-6">Перейти в каталог</Link>
      </section>
    </main>
  );
}
