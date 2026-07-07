import type { Metadata } from "next";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import {
  getDraftCatalogCategories,
  getDraftCatalogProducts,
} from "@/lib/catalog-drafts";

export const metadata: Metadata = {
  title: "Каталог медицинских изделий | CyberMedica",
  description:
    "Поиск медицинских изделий по названию, РУ, аналогам и совместимости.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const products = getDraftCatalogProducts();
  const categories = getDraftCatalogCategories();

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-8">
          <div className="cm-label">Главная · Каталог</div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.025em]">
            Draft-каталог медицинских изделий
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
            Позиции из seed-каталога проходят независимое исследование:
            источники, документы, candidate facts и review readiness.
          </p>
        </div>
      </header>
      <div className="cm-container py-7">
        <CatalogExplorer
          initialQuery={q}
          products={products}
          categories={categories}
        />
      </div>
    </main>
  );
}
