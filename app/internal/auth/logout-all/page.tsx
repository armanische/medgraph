import type { Metadata } from "next";
import { connection } from "next/server";

import { logoutAllCorporateSessions } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Завершение корпоративных сеансов",
  robots: { index: false, follow: false },
};

export default async function CorporateLogoutAllPage() {
  await connection();
  return (
    <main className="min-h-[70vh] bg-slate-50">
      <section className="mx-auto max-w-lg px-6 py-16 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Corporate session containment
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Завершить все корпоративные сеансы
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Действие отзовёт все refresh-сессии текущей корпоративной identity и очистит
            Auth cookies этого браузера. Product и publication records не изменяются.
          </p>
          <form action={logoutAllCorporateSessions} className="mt-6">
            <button
              className="min-h-11 w-full rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              type="submit"
            >
              Завершить все сеансы
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
