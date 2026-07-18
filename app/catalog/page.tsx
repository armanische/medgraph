import type { Metadata } from "next";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";
import JsonLd from "@/components/seo/JsonLd";
import {
  categoryService,
  manufacturerService,
  productService,
  searchService,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildCollectionPageStructuredData } from "@/lib/storefront/structured-data";

const catalogDescription =
  "Поиск медицинских изделий по названию, производителю, категории, документам, аналогам и совместимости.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; manufacturer?: string }>;
}): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return buildStorefrontMetadata({
    title: "Каталог медицинских изделий",
    description: catalogDescription,
    canonical: "/catalog",
    noindexFollow: q.trim().length > 0,
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; manufacturer?: string }>;
}) {
  const { q = "", category = "", manufacturer = "" } = await searchParams;
  const [products, categories, manufacturers, initialSearchResults] =
    await Promise.all([
      productService.getActiveProducts(),
      categoryService.getCategories(),
      manufacturerService.getManufacturers(),
      q ? searchService.searchProducts(q) : Promise.resolve([]),
    ]);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <JsonLd
        data={buildCollectionPageStructuredData({
          name: "Каталог медицинских изделий",
          description: catalogDescription,
          path: "/catalog",
        })}
      />
      <header className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]">
        <div className="cm-container cm-page-intro">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
            <div>
              <div className="cm-label">CyberMedica · Каталог</div>
              <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
                Каталог медицинских изделий
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-cm-slate">
                Медицинское оборудование по категориям и производителям:
                описания, технические характеристики и подбор оборудования.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--cm-rule)] bg-white/78 p-3 shadow-[0_12px_34px_rgba(11,19,32,0.055)] backdrop-blur">
              <div className="cm-label !text-cm-teal">Сводка каталога</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-md border border-[var(--cm-rule)] bg-white/70 p-2.5">
                  <div className="font-mono text-lg font-bold">{products.length}</div>
                  <div className="cm-label mt-1 text-[8px]">позиций</div>
                </div>
                <div className="rounded-md border border-[var(--cm-rule)] bg-white/70 p-2.5">
                  <div className="font-mono text-lg font-bold">{categories.length}</div>
                  <div className="cm-label mt-1 text-[8px]">категорий</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="cm-container py-6">
        <CatalogExplorer
          initialQuery={q}
          initialCategory={category}
          initialManufacturer={manufacturer}
          products={products}
          categories={categories}
          manufacturers={manufacturers}
          initialSearchResultIds={initialSearchResults.map(({ id }) => id)}
        />
      </div>
    </main>
  );
}
