import type { Metadata } from "next";

import ComparisonTable from "@/components/compare/ComparisonTable";
import { compareProducts } from "@/lib/compare/engine";
import { getHamiltonPilotComparisonProducts } from "@/lib/compare/mock-data";

export const metadata: Metadata = {
  title: "Сравнение медицинских изделий",
  description:
    "Экспертное сравнение медицинских изделий по подтверждённым характеристикам, источникам, документам и статусу проверки.",
  alternates: {
    canonical: "/compare",
  },
};

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cm-rule)] bg-white px-4 py-3">
      <div className="cm-label">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-cm-ink">
        {value}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const products = getHamiltonPilotComparisonProducts();

  if (!products.left) {
    return (
      <main className="min-h-screen bg-cm-canvas">
        <section className="cm-container py-14">
          <div className="cm-empty-state text-cm-slate">
            Для сравнения пока нет подготовленных данных.
          </div>
        </section>
      </main>
    );
  }

  const result = compareProducts({
    left: products.left,
    right: products.right,
  });

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <div className="cm-label">CyberMedica · Сравнение</div>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
                Экспертное сравнение изделий
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
                Пилотное сравнение Hamilton T1 и Hamilton C1 по подготовленным
                знаниям: значение, статус, источник, документ и версия документа
                остаются видимыми для каждой характеристики.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-4">
              <div className="cm-label">Граница данных</div>
              <p className="mt-2 text-sm leading-6 text-cm-slate">
                Кандидатные факты не используются напрямую. При отсутствии
                подтверждения таблица показывает пустое состояние, а не
                догадку.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="cm-container space-y-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            label="характеристик"
            value={result.summary.totalCharacteristics}
          />
          <Metric
            label="сравнимых"
            value={result.summary.comparableCharacteristics}
          />
          <Metric label="различий" value={result.summary.differences} />
          <Metric label="нет данных" value={result.summary.missingValues} />
          <Metric
            label="разные единицы"
            value={result.summary.unitMismatches}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {[result.products.left, result.products.right].map((product) =>
            product ? (
              <article
                key={product.slug}
                className="rounded-lg border border-[var(--cm-rule)] bg-white p-5"
              >
                <div className="cm-label">{product.manufacturer}</div>
                <h2 className="mt-2 text-xl font-semibold text-cm-ink">
                  {product.title}
                </h2>
                <p className="mt-2 text-sm text-cm-slate">
                  {product.category} · {product.model}
                </p>
              </article>
            ) : (
              <article
                key="empty-product"
                className="rounded-lg border border-dashed border-[var(--cm-rule-strong)] bg-white p-5 text-cm-slate"
              >
                Выберите второе изделие для сравнения.
              </article>
            ),
          )}
        </div>

        <ComparisonTable result={result} />
      </section>
    </main>
  );
}
