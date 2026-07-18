import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/seo/JsonLd";
import {
  catalogRepository,
  manufacturerService,
  productService,
} from "@/lib/storefront";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildManufacturerStructuredData } from "@/lib/storefront/structured-data";

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const manufacturers = await manufacturerService.getManufacturers();
  return manufacturers.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const manufacturer = await manufacturerService.getManufacturerBySlug(slug);
  if (!manufacturer) notFound();

  return buildStorefrontMetadata({
    title: `${manufacturer.name} — медицинское оборудование`,
    description: manufacturer.shortDescription,
    canonical: `/manufacturers/${manufacturer.slug}`,
    image: manufacturer.logoUrl
      ? { url: manufacturer.logoUrl, alt: `${manufacturer.name} — логотип` }
      : undefined,
  });
}

export default async function ManufacturerPage({ params }: ManufacturerPageProps) {
  const { slug } = await params;
  const manufacturer = await manufacturerService.getManufacturerBySlug(slug);
  if (!manufacturer) notFound();

  const [products, allCategories] = await Promise.all([
    productService.getProductsByManufacturer(manufacturer.id),
    catalogRepository.getCategories(),
  ]);
  const categoriesById = new Map(
    allCategories
      .filter(({ status }) => status === "active")
      .map((category) => [category.id, category]),
  );
  const manufacturerCategories = [
    ...new Set(
      products.flatMap((product) => {
        const category = categoriesById.get(product.categoryId);
        return category ? [category.name] : [];
      }),
    ),
  ];

  return (
    <main className="min-h-screen bg-cm-canvas">
      <JsonLd data={buildManufacturerStructuredData(manufacturer)} />
      <section className="cm-container py-6">
        <Link href="/manufacturers" className="text-xs font-semibold text-cm-teal">
          ← Все производители
        </Link>
        <div className="mt-4 cm-card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--cm-rule)] bg-cm-surface-low px-5 py-3">
            <span className="cm-label">Карточка производителя</span>
            <ManufacturerLogo
              logoUrl={manufacturer.logoUrl}
              name={manufacturer.name}
            />
          </div>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-cm-teal">
                {manufacturer.country}
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">
                {manufacturer.name}
              </h1>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
                {manufacturer.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {manufacturerCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] text-cm-teal"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <dl className="divide-y divide-[var(--cm-rule)] border-t border-[var(--cm-rule)] lg:border-t-0">
              <div className="flex justify-between gap-4 py-3">
                <dt className="cm-label">Страна</dt>
                <dd className="text-xs font-semibold">{manufacturer.country}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="cm-label">Изделий</dt>
                <dd className="font-mono text-xs font-semibold">{products.length}</dd>
              </div>
              {manufacturer.websiteUrl && (
                <div className="flex justify-between gap-4 py-3">
                  <dt className="cm-label">Сайт</dt>
                  <dd className="text-right text-xs font-semibold">
                    <a
                      href={manufacturer.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cm-teal hover:underline"
                    >
                      Официальный сайт ↗
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-7 flex items-end justify-between gap-6">
          <div>
            <div className="cm-label">Каталог</div>
            <h2 className="mt-2 text-xl font-bold">Изделия производителя</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/catalog" className="text-xs font-semibold text-cm-slate hover:text-cm-teal">
              Весь каталог
            </Link>
            <Link href="/request" className="text-xs font-semibold text-cm-teal">
              Запросить КП →
            </Link>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.slug}
                className="group cm-card flex min-h-48 flex-col p-4"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                  {categoriesById.get(product.categoryId)?.name ??
                    "Медицинское оборудование"}
                </div>
                <h3 className="mt-3 text-sm font-bold leading-5">
                  <Link
                    href={`/catalog/${product.slug}`}
                    className="hover:text-cm-teal"
                  >
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-2 text-xs leading-5 text-cm-slate">
                  {product.shortDescription}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cm-rule)] pt-3 text-xs font-semibold">
                  <Link
                    href={`/catalog/${product.slug}`}
                    className="text-cm-teal"
                  >
                    Открыть карточку →
                  </Link>
                  <Link
                    href="/compare"
                    aria-label={`Открыть сравнение для ${product.name}`}
                    className="text-cm-slate hover:text-cm-teal"
                  >
                    Сравнить
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cm-empty-state mt-5">
            <div className="cm-empty-icon">⌁</div>
            <h3 className="mt-4 text-sm font-bold">Товары пока не добавлены</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Откройте общий каталог или воспользуйтесь поиском, чтобы найти
              оборудование других производителей.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/catalog" className="cm-button-primary">
                Открыть каталог
              </Link>
              <Link href="/search" className="cm-button-secondary">
                Начать поиск
              </Link>
              <Link href="/manufacturers" className="cm-button-secondary">
                Все производители
              </Link>
            </div>
          </div>
        )}
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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[var(--cm-rule)] bg-white font-mono text-xs font-bold text-cm-teal">
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
