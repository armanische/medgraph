import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  catalogRepository,
  manufacturerService,
  productService,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";

export const metadata: Metadata = buildStorefrontMetadata({
  title: "Производители медицинских изделий",
  description:
    "Производители медицинского оборудования, представленные в каталоге CyberMedica.",
  canonical: "/manufacturers",
});

export default async function ManufacturersPage() {
  const [manufacturers, products, allCategories] = await Promise.all([
    manufacturerService.getManufacturers(),
    productService.getActiveProducts(),
    catalogRepository.getCategories(),
  ]);
  const categories = allCategories.filter(({ status }) => status === "active");
  const categoriesById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const directory = manufacturers.map((manufacturer) => {
    const manufacturerProducts = products.filter(
      (product) => product.manufacturerId === manufacturer.id,
    );
    const manufacturerCategories = [
      ...new Set(
        manufacturerProducts.flatMap((product) => {
          const category = categoriesById.get(product.categoryId);
          return category ? [category.name] : [];
        }),
      ),
    ];
    return {
      manufacturer,
      productCount: manufacturerProducts.length,
      categories: manufacturerCategories,
    };
  });

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]">
        <div className="cm-container py-8">
          <div className="cm-label">Каталог производителей</div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.025em]">
            Производители
          </h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
            Медицинское оборудование, категории и производители собраны в одном
            каталоге.
          </p>
          <div className="mt-6 grid gap-2 overflow-hidden rounded-2xl border border-[var(--cm-rule)] bg-[var(--cm-rule)] shadow-[0_14px_44px_rgba(11,19,32,0.06)] sm:grid-cols-3">
            {[
              ["Производителей", manufacturers.length],
              ["Изделий", products.length],
              ["Категорий", categories.length],
            ].map(([label, value]) => (
              <div key={label} className="bg-white p-5">
                <div className="font-mono text-2xl font-bold text-cm-ink">
                  {value}
                </div>
                <div className="mt-1 cm-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="cm-container py-7">
        <div className="grid gap-3 md:grid-cols-2">
          {directory.map(({ manufacturer, productCount, categories: names }) => (
            <Link
              key={manufacturer.slug}
              href={`/manufacturers/${manufacturer.slug}`}
              className="group cm-card relative overflow-hidden p-5"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cm-teal/70 to-cm-verified/60 opacity-0 transition duration-200 group-hover:opacity-100"
              />
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-[10px] text-cm-teal">
                  {manufacturer.country}
                </div>
                <div className="rounded border border-[var(--cm-rule)] bg-cm-surface-low px-2.5 py-1 font-mono text-[9px] text-cm-dim">
                  Изделий в каталоге: {productCount}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ManufacturerLogo
                  logoUrl={manufacturer.logoUrl}
                  name={manufacturer.name}
                />
                <h2 className="text-lg font-bold">{manufacturer.name}</h2>
              </div>
              <p className="mt-3 text-xs leading-6 text-cm-slate">
                {manufacturer.shortDescription}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {names.map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] font-medium text-cm-teal transition duration-200 group-hover:border-cm-teal/30"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="mt-5 border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim transition duration-200 group-hover:text-cm-teal">
                Открыть производителя →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ManufacturerLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  if (!logoUrl) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[var(--cm-rule)] bg-cm-surface-low font-mono text-xs font-bold text-cm-teal">
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-[var(--cm-rule)] bg-white">
      <Image src={logoUrl} alt={`${name} — логотип`} fill sizes="40px" className="object-contain" />
    </span>
  );
}
