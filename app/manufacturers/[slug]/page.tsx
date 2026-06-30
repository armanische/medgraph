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
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-8 py-16">
        <Link href="/manufacturers" className="font-semibold text-blue-600">
          ← Все производители
        </Link>
        <div className="mt-8 rounded-3xl bg-slate-950 p-10 text-white md:p-14">
          <div className="text-sm font-bold uppercase tracking-widest text-blue-300">
            {manufacturer.country}
          </div>
          <h1 className="mt-4 text-5xl font-bold">{manufacturer.name}</h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
            {manufacturer.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {manufacturer.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-6">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-blue-600">
              База знаний
            </div>
            <h2 className="mt-3 text-3xl font-bold">Изделия производителя</h2>
          </div>
          <Link href="/request" className="font-semibold text-blue-600">
            Запросить подбор →
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.slug}
                href={`/knowledge/${product.slug}`}
                className="rounded-3xl border bg-white p-8 shadow-sm transition hover:shadow-lg"
              >
                <div className="text-sm font-semibold text-blue-600">
                  {product.category}
                </div>
                <h3 className="mt-4 text-2xl font-bold">{product.name}</h3>
                <p className="mt-4 text-gray-600">{product.description}</p>
                <div className="mt-8 font-semibold text-blue-600">
                  Открыть Knowledge Page →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed bg-white p-10">
            <h3 className="text-xl font-bold">Карточки готовятся</h3>
            <p className="mt-3 text-gray-600">
              Мы наполняем базу изделиями и документами этого производителя.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
