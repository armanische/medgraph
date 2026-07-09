import type { Metadata } from "next";

import SearchExperience from "@/components/search/SearchExperience";
import { searchMedicalDevices } from "@/lib/search";

export const metadata: Metadata = {
  title: "Поиск медицинских изделий",
  description:
    "Профессиональный deterministic-поиск по медицинским изделиям: производитель, модель, категория, регистрационный номер, артикул и синонимы.",
  alternates: {
    canonical: "/search",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const response = searchMedicalDevices(q);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-10">
          <div className="cm-label">CyberMedica · Search</div>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
            Поиск медицинских изделий
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
            Детерминированный поиск по производителю, модели, категории,
            регистрационному номеру, артикулу, синонимам и сокращениям. Без
            AI-интерпретации и без обхода Verification.
          </p>
        </div>
      </header>

      <section className="cm-container py-8">
        <SearchExperience initialQuery={q} response={response} />
      </section>
    </main>
  );
}
