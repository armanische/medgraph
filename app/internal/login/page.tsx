import type { Metadata } from "next";
import { connection } from "next/server";

import { requestInternalMagicLink } from "./actions";
import { resolveInternalReviewDestination } from "@/lib/internal-auth/policy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Внутренний вход",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function InternalLoginPage({ searchParams }: LoginPageProps) {
  await connection();
  const parameters = await searchParams;
  const sent = parameters.status === "sent";
  const denied = typeof parameters.error === "string";
  const destination = resolveInternalReviewDestination(
    typeof parameters.next === "string" ? parameters.next : null,
  );

  return (
    <main className="min-h-[70vh] bg-slate-50">
      <section className="mx-auto max-w-lg px-6 py-16 sm:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">
            Internal · Production
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Безопасный вход
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Введите подтверждённый рабочий email. Ссылка одноразовая и создаёт
            server-side PKCE session без передачи access или refresh token в URL.
          </p>

          {sent ? (
            <p className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
              Если доступ разрешён, одноразовая ссылка отправлена на указанный адрес.
            </p>
          ) : null}
          {denied ? (
            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Вход не завершён. Запросите новую одноразовую ссылку.
            </p>
          ) : null}

          <form action={requestInternalMagicLink} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={destination} />
            <label className="block text-sm font-medium text-slate-800" htmlFor="internal-email">
              Email
            </label>
            <input
              autoComplete="email"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              id="internal-email"
              inputMode="email"
              name="email"
              required
              type="email"
            />
            <button
              className="min-h-11 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              type="submit"
            >
              Получить ссылку для входа
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
