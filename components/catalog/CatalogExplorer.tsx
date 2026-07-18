"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SearchService } from "@/lib/storefront/search-service";
import type {
  Category,
  Manufacturer,
  Product,
} from "@/lib/storefront/types";

interface CatalogExplorerProps {
  initialQuery?: string;
  initialCategory?: string;
  initialManufacturer?: string;
  products: readonly Product[];
  categories: readonly Category[];
  manufacturers: readonly Manufacturer[];
  initialSearchResultIds?: readonly string[];
}

export default function CatalogExplorer({
  initialQuery = "",
  initialCategory = "",
  initialManufacturer = "",
  products,
  categories,
  manufacturers,
  initialSearchResultIds = [],
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    () =>
      categories.find(
        (item) => item.id === initialCategory || item.slug === initialCategory,
      )?.id ?? "Все категории",
  );
  const [manufacturer, setManufacturer] = useState(
    () =>
      manufacturers.find(
        (item) =>
          item.id === initialManufacturer || item.slug === initialManufacturer,
      )?.id ?? "Все производители",
  );
  const [searchResultIds, setSearchResultIds] = useState(
    () => new Set(initialSearchResultIds),
  );
  const productSearchService = useMemo(
    () => SearchService.forProducts(products, manufacturers, categories),
    [categories, manufacturers, products],
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((item) => [item.id, item])),
    [categories],
  );
  const manufacturersById = useMemo(
    () => new Map(manufacturers.map((item) => [item.id, item])),
    [manufacturers],
  );

  useEffect(() => {
    let active = true;
    void productSearchService.searchProducts(query).then((matches) => {
      if (active) setSearchResultIds(new Set(matches.map(({ id }) => id)));
    });
    return () => {
      active = false;
    };
  }, [productSearchService, query]);

  const results = useMemo(() => {
    return products.filter((product) => {
      const searchMatches = !query.trim() || searchResultIds.has(product.id);
      const categoryMatches =
        category === "Все категории" || product.categoryId === category;
      const manufacturerMatches =
        manufacturer === "Все производители" ||
        product.manufacturerId === manufacturer;
      return searchMatches && categoryMatches && manufacturerMatches;
    });
  }, [category, manufacturer, products, query, searchResultIds]);

  function resetCatalogView() {
    setQuery("");
    setCategory("Все категории");
    setManufacturer("Все производители");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[13.5rem_1fr]">
      <aside>
        <div className="cm-card grid gap-3 overflow-hidden p-3 shadow-[0_8px_28px_rgba(11,19,32,0.035)] sm:grid-cols-2 lg:sticky lg:top-20 lg:block lg:space-y-4">
          <div className="-mx-3 -mt-3 border-b border-[var(--cm-rule)] bg-white px-3 py-3 sm:col-span-2 lg:block">
            <div className="cm-label !text-cm-teal">Фильтры</div>
          </div>
          <div>
            <div className="cm-label mb-2">Категория</div>
            <label>
              <span className="sr-only">Категория</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="cm-field min-h-10 py-2 text-xs transition duration-200"
              >
                <option>Все категории</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="cm-label mb-2">Производитель</div>
            <label>
              <span className="sr-only">Производитель</span>
              <select
                value={manufacturer}
                onChange={(event) => setManufacturer(event.target.value)}
                className="cm-field min-h-10 py-2 text-xs transition duration-200"
              >
                <option>Все производители</option>
                {manufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="hidden rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/70 p-3 text-[11px] leading-5 text-cm-slate lg:block">
            Используйте категорию и производителя, чтобы быстро найти
            нужное медицинское оборудование.
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex overflow-hidden rounded-xl border border-[var(--cm-rule-strong)] bg-white shadow-[0_8px_26px_rgba(11,19,32,0.045)] transition duration-200 hover:border-cm-teal/24 focus-within:border-cm-teal/70 focus-within:ring-3 focus-within:ring-cm-teal/10">
          <label className="flex min-w-0 flex-1 items-center">
            <span className="sr-only">Поиск по каталогу</span>
            <span aria-hidden="true" className="pl-4 text-cm-dim">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, модель, производитель или категория"
              className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-[13px] placeholder:text-cm-dim"
            />
          </label>
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="px-4 text-cm-dim transition duration-200 hover:text-cm-ink"
            >
              ×
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="font-mono text-[10px] text-cm-slate">
            Найдено: <strong className="text-cm-ink">{results.length}</strong> из {products.length}
          </div>
          <div className="hidden text-[11px] text-cm-dim sm:block">
            Каталог медицинского оборудования
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {results.map((product) => (
              <article
                key={product.slug}
                className="group cm-card flex min-h-full flex-col overflow-hidden"
              >
                <ProductImage product={product} />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low px-2 py-1 font-mono text-[9px] font-semibold text-cm-dim">
                      {categoriesById.get(product.categoryId)?.name ??
                        product.categoryId}
                    </span>
                    <span className="font-mono text-[9px] text-cm-dim">
                      {product.model}
                    </span>
                  </div>
                  <h2 className="mt-3 text-base font-bold leading-6 tracking-[-0.015em]">
                    <Link href={`/catalog/${product.slug}`} className="hover:text-cm-teal">
                      {product.name}
                    </Link>
                  </h2>
                  <div className="mt-2 text-xs text-cm-slate">
                    {manufacturersById.get(product.manufacturerId) ? (
                      <Link
                        href={`/manufacturers/${manufacturersById.get(product.manufacturerId)?.slug}`}
                        className="font-semibold text-cm-teal hover:underline"
                      >
                        {manufacturersById.get(product.manufacturerId)?.name}
                      </Link>
                    ) : (
                      product.manufacturerId
                    )}
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-cm-slate">
                    {product.shortDescription}
                  </p>
                  {product.specifications.length > 0 && (
                    <dl className="mt-3 grid gap-1.5 border-t border-[var(--cm-rule)] pt-3 text-[11px]">
                      {product.specifications.slice(0, 2).map((specification) => (
                        <div key={`${specification.label}:${specification.position}`} className="flex justify-between gap-3">
                          <dt className="text-cm-dim">{specification.label}</dt>
                          <dd className="text-right font-semibold text-cm-ink">
                            {specification.value}{specification.unit ? ` ${specification.unit}` : ""}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs font-semibold">
                    <Link href={`/catalog/${product.slug}`} className="text-cm-teal">
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cm-empty-state mt-4 py-5">
            <div className="cm-empty-icon">⌕</div>
            <h2 className="mt-4 text-sm font-bold">Ничего не найдено</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Проверьте написание, очистите фильтры или попробуйте искать по
              производителю, модели либо категории изделия.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={resetCatalogView}
                className="cm-button-primary"
              >
                Сбросить фильтры
              </button>
              <Link href="/search" className="cm-button-secondary">
                Начать новый поиск
              </Link>
              <Link href="/manufacturers" className="cm-button-secondary">
                Производители
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductImage({ product }: { product: Product }) {
  const image = product.media.find(({ type }) => type === "image");
  if (!image) return null;

  return (
    <span className="relative block aspect-[16/9] w-full overflow-hidden border-b border-[var(--cm-rule)] bg-white">
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 32vw"
        className="object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
      />
    </span>
  );
}
