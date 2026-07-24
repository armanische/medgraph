import Link from "next/link";

import ProductCard from "@/components/storefront/ProductCard";
import type { Category, Manufacturer, Product } from "@/lib/storefront/types";

export default function Equipment({
  products,
  manufacturers,
  categories,
}: {
  products: readonly Product[] | null;
  manufacturers: readonly Manufacturer[];
  categories: readonly Category[];
}) {
  if (!products || products.length < 4) return null;

  const manufacturersById = new Map(
    manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]),
  );
  const categoryNamesById = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <section
      aria-labelledby="homepage-equipment-title"
      className="cm-section border-b border-[var(--cm-rule)] bg-white"
    >
      <div className="cm-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <h2
              id="homepage-equipment-title"
              className="text-2xl font-extrabold leading-[1.2] tracking-[-0.025em] sm:text-[26px] lg:text-[30px]"
            >
              Оборудование в каталоге
            </h2>
            <p className="mt-2 max-w-[42rem] text-sm leading-6 text-cm-slate">
              Изучите реальные модели медицинского оборудования, представленные в CyberMedica.
            </p>
          </div>
          <Link href="/catalog" className="cm-button-secondary !min-h-[44px] w-full sm:w-auto">
            Перейти в каталог
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              manufacturer={manufacturersById.get(product.manufacturerId)}
              categoryName={categoryNamesById.get(product.categoryId)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
