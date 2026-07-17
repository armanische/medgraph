import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ReviewQueueView from "@/components/internal/ReviewQueueView";
import { internalReviewEnabled, internalRouteMetadata } from "@/lib/internal-access";
import { loadHumanReviewerWorkspace } from "@/lib/review/human-workspace";
import type { HumanReviewerWorkspaceModel } from "@/lib/review/human-types";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return internalRouteMetadata(internalReviewEnabled(), "Очередь проверки");
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

function missingReviewData(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export default async function InternalReviewQueuePage() {
  await connection();

  if (!internalReviewEnabled()) {
    notFound();
  }

  let model: HumanReviewerWorkspaceModel;
  try {
    model = await loadHumanReviewerWorkspace({ scope: "all" });
  } catch (error) {
    if (missingReviewData(error)) {
      return (
        <CalmState title="Очередь проверки ещё не сформирована.">
          <p>Сначала сформируйте внутренний отчёт.</p>
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 font-mono text-sm">
            npm run build:review-queue
          </p>
        </CalmState>
      );
    }
    return (
      <CalmState title="Отчёт очереди проверки нельзя прочитать.">
        <p>
          Данные имеют неожиданный формат. Проверьте canonical Human Review
          inputs и сформируйте очередь заново.
        </p>
      </CalmState>
    );
  }

  const highPriority = model.items.filter(
    (item) => item.priority === "critical" || item.priority === "high",
  ).length;
  const evidenceReady = model.items.filter(
    (item) => item.artifactStatus === "valid",
  ).length;

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
            Только просмотр canonical Human Review items, источников и
            документов перед ручной проверкой.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-800">
            Env-флаг не является аутентификацией. При включении в Preview
            обязательна Vercel Deployment Protection или эквивалентная внешняя
            граница доступа.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-teal-200 bg-teal-50 p-5 text-teal-950">
          <h2 className="text-base font-semibold">Граница безопасности</h2>
          <p className="mt-2 text-sm leading-6">
            Эта страница полностью read-only. Единственная точка записи решений
            — защищённый Reviewer Workspace по адресу /internal/reviewer.
          </p>
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Всего фактов" value={model.items.length} />
          <Metric label="Ожидает проверки" value={model.counters.pending} />
          <Metric label="Высокий приоритет" value={highPriority} />
          <Metric label="Valid artifact" value={evidenceReady} />
          <Metric label="Продукты" value={model.products.length} />
        </section>

        <ReviewQueueView model={model} />
      </section>
    </main>
  );
}
