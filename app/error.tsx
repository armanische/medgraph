"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-[70vh] bg-cm-canvas px-4 py-16">
      <section className="mx-auto max-w-xl cm-card p-8 text-center">
        <div className="cm-label !text-[var(--cm-danger)]">Ошибка интерфейса</div>
        <h1 className="mt-3 text-xl font-extrabold">Не удалось открыть страницу</h1>
        <p className="mt-3 text-xs leading-6 text-cm-slate">
          Данные не изменены. Повторите загрузку или вернитесь к странице позже.
        </p>
        <button onClick={reset} className="cm-button-primary mt-6">Повторить</button>
      </section>
    </main>
  );
}
