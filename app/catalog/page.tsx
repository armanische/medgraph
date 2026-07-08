import type { Metadata } from "next";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import {
  getDraftCatalogCards,
  getDraftCatalogCategories,
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
  const products = getDraftCatalogCards();
  const categories = getDraftCatalogCategories(products);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]">
        <div className="cm-container py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <div className="cm-label">Главная · Каталог</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">
                Draft-каталог медицинских изделий
              </h1>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
                Позиции из seed-каталога проходят независимое исследование:
                источники, документы, candidate facts и review readiness.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--cm-rule)] bg-white/85 p-4 shadow-[0_16px_40px_rgba(11,19,32,0.07)] backdrop-blur">
              <div className="cm-label !text-cm-teal">Research pipeline</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-cm-surface-low p-3">
                  <div className="font-mono text-xl font-bold">{products.length}</div>
                  <div className="cm-label mt-1 text-[8px]">позиций</div>
                </div>
                <div className="rounded-lg bg-cm-surface-low p-3">
                  <div className="font-mono text-xl font-bold">{categories.length}</div>
                  <div className="cm-label mt-1 text-[8px]">категорий</div>
                </div>
              </div>
            </div>
          </div>
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
