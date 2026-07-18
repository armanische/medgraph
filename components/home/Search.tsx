"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { SearchService } from "@/lib/storefront/search-service";
import type {
  Category,
  Manufacturer,
  Product,
} from "@/lib/storefront/types";

const chipClassName =
  "inline-flex min-h-8 items-center rounded-md border border-cm-teal/18 bg-white px-3 font-mono text-[10px] font-semibold text-cm-teal transition duration-200 hover:border-cm-teal/35 hover:bg-cm-teal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal";

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
  const popularQueries = useMemo(
    () => products.map((product) => product.model).filter(Boolean).slice(0, 5),
    [products],
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
      className="cm-section border-b border-[var(--cm-rule)] bg-white"
    >
      <div className="cm-container">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(28rem,1.3fr)] lg:items-center">
          <div>
            <div className="cm-label !text-cm-teal">Быстрый поиск</div>
            <h2
              id="homepage-search-title"
              className="cm-section-title"
            >
              Найдите оборудование по названию или модели
            </h2>
            <p className="mt-2 max-w-lg text-[13px] leading-6 text-cm-slate">
              Поиск работает по товарам, производителям, категориям и ключевым
              особенностям каталога.
            </p>
          </div>

          <div className="relative">
            <form
              role="search"
              aria-label="Поиск по каталогу медицинского оборудования"
              onSubmit={handleSearch}
              className="flex overflow-hidden rounded-xl border border-[var(--cm-rule-strong)] bg-white shadow-[0_14px_40px_rgba(11,19,32,0.065)] transition duration-200 focus-within:border-cm-teal/70 focus-within:ring-3 focus-within:ring-cm-teal/10"
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
                  placeholder="Например, FS510 или Ambu"
                  autoComplete="off"
                  aria-controls="homepage-search-results"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                type="submit"
                className="min-h-14 shrink-0 bg-cm-ink px-5 text-[13px] font-semibold text-white transition duration-200 hover:bg-cm-teal active:bg-cm-teal-dark sm:px-7"
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
                {results.map((product) => (
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
                        {manufacturersById.get(product.manufacturerId)?.name ??
                          product.manufacturerId}{" "}
                        ·{" "}
                        {categoriesById.get(product.categoryId)?.name ??
                          product.categoryId}
                      </span>
                    </span>
                  </button>
                ))}
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

            {popularQueries.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] text-cm-dim">Популярное:</span>
                {popularQueries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className={chipClassName}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
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
