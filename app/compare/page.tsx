import type { Metadata } from "next";

import ComparisonTable from "@/components/compare/ComparisonTable";
import { catalogRepository, compareService } from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Сравнение медицинского оборудования",
  description:
    "Сравнение медицинского оборудования по описанию, техническим характеристикам, документам и совместимости.",
  canonical: "/compare",
});

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cm-rule)] bg-white px-4 py-3">
      <div className="cm-label">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-cm-ink">
        {value}
      </div>
    </div>
  );
}

export default async function ComparePage() {
  const comparableProducts = await compareService.getComparableProducts();
  const result = await compareService.compareProducts(
    comparableProducts.slice(0, 2).map(({ slug }) => slug),
  );
  const [manufacturers, categories] = await Promise.all([
    catalogRepository.getManufacturers(),
    catalogRepository.getCategories(),
  ]);
  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]),
  );
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );

  if (!result.products.length) {
    return (
      <main className="min-h-screen bg-cm-canvas">
        <section className="cm-container py-14">
          <div className="cm-empty-state text-cm-slate">
            Для сравнения пока нет доступных товаров.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-10">
          <div className="cm-label">CyberMedica · Сравнение</div>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.03em]">
            Сравнение медицинского оборудования
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cm-slate">
            Сопоставьте описание, технические характеристики, документы и
            совместимость товаров из каталога.
          </p>
        </div>
      </header>

      <section className="cm-container space-y-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="товаров" value={result.summary.products} />
          <Metric label="характеристик" value={result.summary.specifications} />
          <Metric label="различий" value={result.summary.differences} />
          <Metric label="нет данных" value={result.summary.missingValues} />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {result.products.map((product) => (
            <article
              key={product.id}
              className="rounded-lg border border-[var(--cm-rule)] bg-white p-5"
            >
              <div className="cm-label">
                {manufacturersById.get(product.manufacturerId)?.name ?? ""}
              </div>
              <h2 className="mt-2 text-xl font-semibold text-cm-ink">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-cm-slate">
                {categoriesById.get(product.categoryId)?.name ?? ""} · {product.model}
              </p>
            </article>
          ))}
        </div>

        <ComparisonTable
          result={result}
          manufacturers={manufacturersById}
          categories={categoriesById}
        />
      </section>
    </main>
  );
}
