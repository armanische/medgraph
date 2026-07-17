import type { Metadata } from "next";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import {
  categoryService,
  manufacturerService,
  productService,
  searchService,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Каталог медицинских изделий",
  description:
    "Поиск медицинских изделий по названию, производителю, категории, документам, аналогам и совместимости.",
  canonical: "/catalog",
});

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [products, categories, manufacturers, initialSearchResults] =
    await Promise.all([
      productService.getActiveProducts(),
      categoryService.getCategories(),
      manufacturerService.getManufacturers(),
      q ? searchService.searchProducts(q) : Promise.resolve([]),
    ]);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]">
        <div className="cm-container py-10">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
            <div>
              <div className="cm-label">CyberMedica · Каталог</div>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
                Каталог медицинских изделий
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
                Медицинское оборудование по категориям и производителям:
                описания, технические характеристики и подбор оборудования.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--cm-rule)] bg-white/78 p-4 shadow-[0_12px_34px_rgba(11,19,32,0.055)] backdrop-blur">
              <div className="cm-label !text-cm-teal">Сводка каталога</div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-md border border-[var(--cm-rule)] bg-white/70 p-3">
                  <div className="font-mono text-xl font-bold">{products.length}</div>
                  <div className="cm-label mt-1 text-[8px]">позиций</div>
                </div>
                <div className="rounded-md border border-[var(--cm-rule)] bg-white/70 p-3">
                  <div className="font-mono text-xl font-bold">{categories.length}</div>
                  <div className="cm-label mt-1 text-[8px]">категорий</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="cm-container py-8">
        <CatalogExplorer
          initialQuery={q}
          products={products}
          categories={categories}
          manufacturers={manufacturers}
          initialSearchResultIds={initialSearchResults.map(({ id }) => id)}
        />
      </div>
    </main>
  );
}
