import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { manufacturers } from "@/data/manufacturers";
import { getManufacturerProducts } from "@/lib/products";

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return manufacturers.map((manufacturer) => ({
    slug: manufacturer.slug,
  }));
}

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const manufacturer = manufacturers.find((item) => item.slug === slug);

  return manufacturer
    ? {
        title: `${manufacturer.name}: изделия и документы | CyberMedica`,
        description: manufacturer.description,
      }
    : { title: "Производитель не найден | CyberMedica" };
}

export default async function ManufacturerPage({
  params,
}: ManufacturerPageProps) {
  const { slug } = await params;
  const manufacturer = manufacturers.find((item) => item.slug === slug);

  if (!manufacturer) {
    notFound();
  }

  const products = getManufacturerProducts(manufacturer.slug);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="cm-container py-8">
        <Link href="/manufacturers" className="text-xs font-semibold text-cm-teal">
          ← Все производители
        </Link>
        <div className="mt-6 cm-card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--cm-rule)] bg-cm-surface-low px-5 py-3">
            <span className="cm-label">Manufacturer Record</span>
            <span className="rounded-md border border-[var(--cm-verified-border)] bg-cm-verified-soft px-2 py-1 font-mono text-[9px] font-semibold text-cm-verified">
              CyberMedica Verified
            </span>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-cm-teal">{manufacturer.country}</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">{manufacturer.name}</h1>
              <p className="mt-4 max-w-2xl text-[13px] leading-7 text-cm-slate">{manufacturer.description}</p>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {manufacturer.categories.map((category) => (
                  <span key={category} className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] text-cm-teal">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <dl className="divide-y divide-[var(--cm-rule)] border-t border-[var(--cm-rule)] lg:border-t-0">
              <div className="flex justify-between gap-4 py-3"><dt className="cm-label">Страна</dt><dd className="text-xs font-semibold">{manufacturer.country}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="cm-label">Изделий</dt><dd className="font-mono text-xs font-semibold">{products.length}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="cm-label">Статус</dt><dd className="text-xs font-semibold text-cm-verified">Проверено</dd></div>
            </dl>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div>
            <div className="cm-label">База знаний</div>
            <h2 className="mt-2 text-xl font-bold">Изделия производителя</h2>
          </div>
          <Link href="/request" className="text-xs font-semibold text-cm-teal">
            Запросить подбор →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.slug}
                href={`/knowledge/${product.slug}`}
                className="group cm-card flex min-h-56 flex-col p-5 transition hover:border-cm-teal/30"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                  {product.category}
                </div>
                <h3 className="mt-4 text-sm font-bold leading-5">{product.name}</h3>
                <p className="mt-3 text-xs leading-6 text-cm-slate">{product.description}</p>
                <div className="mt-auto border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim group-hover:text-cm-teal">
                  Открыть Knowledge Page →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 cm-card border-dashed p-8">
            <h3 className="text-sm font-bold">Карточки готовятся</h3>
            <p className="mt-2 text-xs text-cm-slate">
              Мы наполняем базу изделиями и документами этого производителя.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
