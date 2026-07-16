import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { manufacturers } from "@/data/manufacturers";
import {
  getPublishedCatalog,
  getPublishedManufacturer,
  getPublishedManufacturerProducts,
} from "@/lib/published-catalog";
import { getManufacturerProducts } from "@/lib/products";

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [
    ...new Set([
      ...manufacturers.map((manufacturer) => manufacturer.slug),
      ...getPublishedCatalog().manufacturers.map((manufacturer) => manufacturer.slug),
    ]),
  ].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const manufacturer = manufacturers.find((item) => item.slug === slug);
  const published = getPublishedManufacturer(slug);

  return manufacturer || published
    ? {
        title: `${published?.name ?? manufacturer?.name}: изделия и документы`,
        description:
          manufacturer?.description ?? "Опубликованные изделия и документы производителя.",
        alternates: {
          canonical: `/manufacturers/${slug}`,
        },
      }
    : { title: "Производитель не найден" };
}

export default async function ManufacturerPage({
  params,
}: ManufacturerPageProps) {
  const { slug } = await params;
  const fallbackManufacturer = manufacturers.find((item) => item.slug === slug);
  const publishedManufacturer = getPublishedManufacturer(slug);

  if (!fallbackManufacturer && !publishedManufacturer) {
    notFound();
  }

  const manufacturer = {
    slug,
    name: publishedManufacturer?.name ?? fallbackManufacturer?.name ?? slug,
    country: fallbackManufacturer?.country ?? "Не указана",
    description:
      fallbackManufacturer?.description ?? "Опубликованные изделия и документы производителя.",
    categories: publishedManufacturer?.categories ?? fallbackManufacturer?.categories ?? [],
  };
  const publishedProducts = getPublishedManufacturerProducts(slug);
  const fallbackProducts = publishedManufacturer ? [] : getManufacturerProducts(slug);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="cm-container py-8">
        <Link href="/manufacturers" className="text-xs font-semibold text-cm-teal">
          ← Все производители
        </Link>
        <div className="mt-6 cm-card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--cm-rule)] bg-cm-surface-low px-5 py-3">
            <span className="cm-label">Карточка производителя</span>
            <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-semibold ${publishedManufacturer ? "border-[var(--cm-verified-border)] bg-cm-verified-soft text-cm-verified" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {publishedManufacturer ? "Опубликовано" : "Карточки готовятся"}
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
              <div className="flex justify-between gap-4 py-3"><dt className="cm-label">Изделий</dt><dd className="font-mono text-xs font-semibold">{publishedProducts.length || fallbackProducts.length}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="cm-label">Статус</dt><dd className="text-xs font-semibold text-cm-verified">{publishedManufacturer ? "Опубликовано" : "Ожидает публикации"}</dd></div>
            </dl>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div>
            <div className="cm-label">База знаний</div>
            <h2 className="mt-2 text-xl font-bold">Изделия производителя</h2>
          </div>
          <Link href="/request" className="text-xs font-semibold text-cm-teal">
            Запросить КП →
          </Link>
        </div>

        {publishedProducts.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {publishedProducts.map((product) => (
              <Link
                key={product.slug}
                href={`/catalog/${product.slug}`}
                className="group cm-card flex min-h-56 flex-col p-5"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                  {product.category}
                </div>
                <h3 className="mt-4 text-sm font-bold leading-5">{product.name}</h3>
                <p className="mt-3 text-xs leading-6 text-cm-slate">{product.description}</p>
                <div className="mt-auto border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim group-hover:text-cm-teal">
                  Открыть карточку →
                </div>
              </Link>
            ))}
          </div>
        ) : fallbackProducts.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {fallbackProducts.map((product) => (
              <Link key={product.slug} href={`/knowledge/${product.slug}`} className="group cm-card flex min-h-56 flex-col p-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">{product.category}</div>
                <h3 className="mt-4 text-sm font-bold leading-5">{product.name}</h3>
                <p className="mt-3 text-xs leading-6 text-cm-slate">{product.description}</p>
                <div className="mt-auto border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim group-hover:text-cm-teal">Открыть fallback-карточку →</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="cm-empty-state mt-5">
            <div className="cm-empty-icon">⌁</div>
            <h3 className="mt-4 text-sm font-bold">Карточки готовятся</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Мы наполняем базу изделиями и документами этого производителя.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
