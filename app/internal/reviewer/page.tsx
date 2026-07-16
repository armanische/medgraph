import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import ReviewerWorkspace from "@/components/internal/ReviewerWorkspace";
import { internalRouteMetadata } from "@/lib/internal-access";
import { createReviewerWorkspaceModel } from "@/lib/review/workspace";

function internalReviewEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CYBERMEDICA_ENABLE_INTERNAL_REVIEW === "1"
  );
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return internalRouteMetadata(internalReviewEnabled(), "Reviewer Workspace");
}

export default async function InternalReviewerPage() {
  await connection();

  if (!internalReviewEnabled()) {
    notFound();
  }

  const model = createReviewerWorkspaceModel();

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-[96rem] px-6 py-10 sm:px-8 lg:py-14">
        <div className="mb-8">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Внутренний экран
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Reviewer Workspace
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Профессиональный центр проверки: очередь изделий, факты,
            документы, draft decisions и история без публикации данных.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-800">
            Env-флаг не является аутентификацией. При включении в Preview
            обязательна Vercel Deployment Protection или эквивалентная внешняя
            граница доступа.
          </p>
        </div>

        <ReviewerWorkspace model={model} />
      </section>
    </main>
  );
}
