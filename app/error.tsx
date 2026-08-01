"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Route render failure", { digest: error.digest ?? "unavailable" });
  }, [error.digest]);

  return (
    <main className="min-h-[70vh] bg-cm-canvas px-4 py-16">
      <section className="mx-auto max-w-xl cm-card p-8 text-center">
        <div className="cm-label !text-[var(--cm-danger)]">Ошибка интерфейса</div>
        <h1 className="mt-3 text-xl font-extrabold">Не удалось открыть страницу</h1>
        <p className="mt-3 text-xs leading-6 text-cm-slate">
          Данные не изменены. Повторите загрузку или вернитесь к странице позже.
        </p>
        <button type="button" onClick={unstable_retry} className="cm-button-primary mt-6">
          Повторить
        </button>
      </section>
    </main>
  );
}
