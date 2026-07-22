"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Catalog route failed", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <div className="cm-container py-16">
        <section className="cm-empty-state py-10" aria-labelledby="catalog-error-title">
          <div className="cm-empty-icon" aria-hidden="true">!</div>
          <h1 id="catalog-error-title" className="mt-4 text-xl font-bold">
            Не удалось загрузить каталог
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
            Источник данных временно недоступен. Повторите загрузку или вернитесь на главную.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={reset} className="cm-button-primary">
              Попробовать снова
            </button>
            <Link href="/" className="cm-button-secondary">
              На главную
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
