"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { SearchService } from "@/lib/storefront/search-service";
import { getProductPresentation } from "@/lib/storefront/product-presentation";
import type {
  Category,
  Manufacturer,
  Product,
} from "@/lib/storefront/types";

const chipClassName =
  "inline-flex min-h-8 items-center rounded-full border border-cm-teal/18 bg-white px-3 text-[11px] font-semibold text-cm-slate transition duration-200 hover:border-cm-teal/35 hover:bg-cm-teal-soft hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal";

const popularQueries = [
  ["Аппараты ИВЛ", "ИВЛ"],
  ["УЗИ", "УЗИ"],
  ["Мониторы пациента", "монитор пациента"],
  ["Эндоскопия", "эндоскопия"],
] as const;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Search({
  products,
  manufacturers,
  categories,
}: {
  products: readonly Product[];
  manufacturers: readonly Manufacturer[];
  categories: readonly Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Product[]>([]);
  const productSearchService = useMemo(
    () => SearchService.forProducts(products, manufacturers, categories),
    [categories, manufacturers, products],
  );
  const manufacturersById = useMemo(
    () =>
      new Map(
        manufacturers.map((manufacturer) => [manufacturer.id, manufacturer]),
      ),
    [manufacturers],
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  useEffect(() => {
    let active = true;
    void productSearchService.searchProducts(query).then((matches) => {
      if (active) setResults(matches);
    });
    return () => {
      active = false;
    };
  }, [productSearchService, query]);

  function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section
      id="homepage-search"
      aria-labelledby="homepage-search-title"
      className="border-b border-[var(--cm-rule)] bg-cm-ink py-9 text-white sm:py-11"
    >
      <div className="cm-container">
        <div className="grid gap-6 lg:grid-cols-[minmax(22rem,0.72fr)_minmax(28rem,1.28fr)] lg:items-center">
          <div className="max-w-[25rem]">
            <div className="cm-label !text-cm-coral">Поиск по каталогу</div>
            <h2
              id="homepage-search-title"
              className="mt-2 text-[1.45rem] font-extrabold leading-tight tracking-[-0.025em] text-white xl:text-2xl"
            >
              Быстро найдите нужную модель
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-white/58">
              По названию, производителю, модели или категории оборудования.
            </p>
          </div>

          <div className="relative">
            <form
              role="search"
              aria-label="Поиск по каталогу медицинского оборудования"
              onSubmit={handleSearch}
              className="flex overflow-hidden rounded-xl border border-white/12 bg-white shadow-[0_18px_44px_rgba(0,0,0,0.2)] transition duration-200 focus-within:border-cm-teal/70 focus-within:ring-3 focus-within:ring-cm-teal/20"
            >
              <label
                htmlFor="homepage-search-input"
                className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 sm:px-5"
              >
                <span className="text-cm-dim">
                  <SearchIcon />
                </span>
                <span className="sr-only">Название, модель или производитель</span>
                <input
                  id="homepage-search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Введите производителя, модель или категорию оборудования..."
                  autoComplete="off"
                  aria-controls="homepage-search-results"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                type="submit"
                className="min-h-14 shrink-0 bg-cm-teal px-5 text-[13px] font-semibold text-white transition duration-200 hover:bg-cm-teal-dark active:bg-cm-ink sm:px-8"
              >
                Найти
              </button>
            </form>

            {query && results.length > 0 && (
              <div
                id="homepage-search-results"
                role="listbox"
                aria-label="Найденные товары"
                className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-[var(--cm-rule)] bg-white p-2 shadow-[0_12px_40px_rgba(11,19,32,0.12)]"
              >
                {results.map((product) => {
                  const presentation = getProductPresentation(product, {
                    categoryName: categoriesById.get(product.categoryId)?.name,
                    manufacturerName: manufacturersById.get(product.manufacturerId)?.name,
                  });
                  return (
                  <button
                    key={product.slug}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onClick={() => router.push(`/catalog/${product.slug}`)}
                    className="flex w-full items-center gap-3 rounded-md p-3 text-left transition duration-200 hover:bg-cm-surface-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-cm-teal"
                  >
                    <SearchResultImage product={product} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">
                        {product.name}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] text-cm-dim">
                        {presentation.manufacturerLabel}{" "}
                        ·{" "}
                        {presentation.categoryLabel}
                      </span>
                    </span>
                  </button>
                  );
                })}
              </div>
            )}

            {query && results.length === 0 && (
              <div
                id="homepage-search-results"
                role="status"
                className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_12px_40px_rgba(11,19,32,0.12)]"
              >
                <div className="text-[13px] font-semibold">Ничего не найдено</div>
                <div className="mt-1 text-xs text-cm-slate">
                  Попробуйте другой запрос или откройте полный поиск.
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] text-white/42">
                Популярные запросы:
              </span>
              {popularQueries.map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setQuery(value)}
                  className={chipClassName}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchResultImage({ product }: { product: Product }) {
  const image = product.media.find(({ type }) => type === "image");
  if (!image) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[var(--cm-rule)] bg-cm-surface-low text-cm-dim">
        ▧
      </span>
    );
  }

  return (
    <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-[var(--cm-rule)] bg-white">
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes="40px"
        className="object-contain"
      />
    </span>
  );
}
