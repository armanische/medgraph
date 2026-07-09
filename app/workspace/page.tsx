import type { Metadata } from "next";

import WorkspaceDashboard from "@/components/workspace/WorkspaceDashboard";
import { createWorkspaceSession } from "@/lib/workspace/mock-data";

export const metadata: Metadata = {
  title: "Рабочее пространство закупки",
  description:
    "Единое рабочее пространство CyberMedica для поиска изделия, сравнения, совместимости и проверки требований ТЗ.",
  alternates: {
    canonical: "/workspace",
  },
};

export default function WorkspacePage() {
  const session = createWorkspaceSession();

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <div className="cm-label">CyberMedica · Рабочее пространство</div>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
                Рабочее пространство закупки
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
                Без чат-бота и без генерации: страница объединяет поиск,
                сравнение, совместимость и проверку ТЗ на основе существующих
                deterministic-движков.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-4">
              <div className="cm-label">Безопасный режим</div>
              <p className="mt-2 text-sm leading-6 text-cm-slate">
                LLM не подключён. Выводы и рекомендации формируются только по
                готовым результатам Search, Compare, Compatibility и Tender.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="cm-container py-8">
        <WorkspaceDashboard session={session} />
      </section>
    </main>
  );
}
