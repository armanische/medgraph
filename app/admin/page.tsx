import type { Metadata } from "next";
import { notFound } from "next/navigation";

import AdminForm from "./AdminForm";
import SavedProducts from "./SavedProducts";

export const metadata: Metadata = {
  title: "Внутренний редактор",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CYBERMEDICA_ENABLE_ADMIN !== "1"
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="mx-auto max-w-5xl px-8 py-16">
        <h1 className="text-5xl font-bold">CyberMedica CMS</h1>

        <p className="mt-4 text-xl text-gray-600">
          Прототип редактора. Сейчас сохраняет локальные черновики; публикация
          будет подключена через PostgreSQL / Supabase.
        </p>

        <AdminForm />

        <SavedProducts />
      </section>
    </main>
  );
}
