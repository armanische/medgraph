import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { internalRouteMetadata } from "@/lib/internal-access";

import AdminForm from "./AdminForm";
import SavedProducts from "./SavedProducts";

function adminEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CYBERMEDICA_ENABLE_ADMIN === "1"
  );
}

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return internalRouteMetadata(adminEnabled(), "Внутренний редактор");
}

export default async function AdminPage() {
  await connection();

  if (!adminEnabled()) notFound();

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto max-w-5xl px-8 py-16">
        <h1 className="text-5xl font-bold">CyberMedica CMS</h1>

        <p className="mt-4 text-xl text-gray-600">
          Прототип редактора. Сейчас сохраняет локальные черновики; публикация
          будет подключена через PostgreSQL / Supabase.
        </p>

        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Env-флаг не является аутентификацией. В Preview этот экран можно
          включать только за Vercel Deployment Protection или эквивалентной
          внешней границей доступа.
        </p>

        <AdminForm />

        <SavedProducts />
      </section>
    </main>
  );
}
