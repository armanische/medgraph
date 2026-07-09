import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ReviewQueueView from "@/components/internal/ReviewQueueView";
import { loadInternalReviewQueue } from "@/lib/internal-review-queue";

export const metadata: Metadata = {
  title: "Очередь проверки",
  robots: {
    index: false,
    follow: false,
  },
};

function internalReviewEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CYBERMEDICA_ENABLE_INTERNAL_REVIEW === "1"
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function CalmState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
          <div className="mt-3 text-slate-700">{children}</div>
        </div>
      </section>
    </main>
  );
}

export default async function InternalReviewQueuePage() {
  await connection();

  if (!internalReviewEnabled()) {
    notFound();
  }

  const queue = await loadInternalReviewQueue();

  if (queue.status === "missing") {
    return (
      <CalmState title="Очередь проверки ещё не сформирована.">
        <p>Сначала сформируйте внутренний отчёт.</p>
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 font-mono text-sm">
          npm run build:review-queue
        </p>
      </CalmState>
    );
  }

  if (queue.status === "invalid") {
    return (
      <CalmState title="Отчёт очереди проверки нельзя прочитать.">
        <p>
          JSON-файл повреждён или имеет неожиданный формат. Проверьте generated
          report и сформируйте очередь заново.
        </p>
      </CalmState>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="mb-8">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Внутренний экран
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Очередь проверки
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Только просмотр кандидатных фактов, источников и документов перед
            ручной проверкой.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-teal-200 bg-teal-50 p-5 text-teal-950">
          <h2 className="text-base font-semibold">Граница безопасности</h2>
          <p className="mt-2 text-sm leading-6">
            Эта страница показывает только кандидатные факты. Решение reviewer-а
            не публикует данные автоматически. Публикация выполняется отдельным
            процессом.
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Всего фактов" value={queue.aggregate.totalItems} />
          <Metric label="Ожидает проверки" value={queue.aggregate.pendingReview} />
          <Metric label="Высокий приоритет" value={queue.aggregate.highPriority} />
          <Metric
            label="Готово к проверке"
            value={queue.aggregate.readyForHumanReview}
          />
          <Metric
            label="Продукты"
            value={queue.aggregate.productsWithReviewItems}
          />
        </section>

        <ReviewQueueView
          products={queue.products}
          warnings={queue.aggregate.warnings}
        />
      </section>
    </main>
  );
}
