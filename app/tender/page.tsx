import type { Metadata } from "next";

import TenderComplianceTable from "@/components/tender/TenderComplianceTable";
import { getHamiltonT1TenderCompliance } from "@/lib/tender/mock-data";

export const metadata: Metadata = {
  title: "Проверка соответствия ТЗ",
  description:
    "Детерминированная проверка соответствия медицинского изделия требованиям технического задания с источниками и документами.",
  alternates: {
    canonical: "/tender",
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

export default function TenderPage() {
  const result = getHamiltonT1TenderCompliance();

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <div className="cm-label">CyberMedica · ТЗ</div>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
                Проверка соответствия техническому заданию
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
                Пилотная проверка Hamilton T1 по требованиям ТЗ для аппарата
                ИВЛ. Каждая строка показывает требование, значение изделия,
                результат и доказательство.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-4">
              <div className="cm-label">Граница данных</div>
              <p className="mt-2 text-sm leading-6 text-cm-slate">
                Движок не использует ИИ, кандидатные факты или выводы по
                аналогии. Без доказательства результат считается неподтверждённым.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="cm-container space-y-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="требований" value={result.summary.totalRequirements} />
          <Metric label="соответствует" value={result.summary.matches} />
          <Metric label="не соответствует" value={result.summary.doesNotMatch} />
          <Metric label="частично" value={result.summary.partiallyMatches} />
          <Metric label="нет данных" value={result.summary.notVerified} />
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-[var(--cm-rule)] bg-white p-5">
            <div className="cm-label">Техническое задание</div>
            <h2 className="mt-2 text-xl font-semibold text-cm-ink">
              {result.tenderTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-cm-slate">
              Автономная работа, экран, поддержка NIV и масса изделия.
            </p>
          </article>
          <article className="rounded-lg border border-[var(--cm-rule)] bg-white p-5">
            <div className="cm-label">{result.product.manufacturer}</div>
            <h2 className="mt-2 text-xl font-semibold text-cm-ink">
              {result.product.title}
            </h2>
            <p className="mt-2 text-sm text-cm-slate">
              {result.product.category}
            </p>
          </article>
        </div>

        <TenderComplianceTable result={result} />
      </section>
    </main>
  );
}
