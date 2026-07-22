"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SearchService } from "@/lib/storefront/search-service";
import { getProductPresentation } from "@/lib/storefront/product-presentation";
import type {
  Category,
  Manufacturer,
  Product,
} from "@/lib/storefront/types";
import {
  CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID,
  CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID,
} from "@/lib/storefront/types";

type CatalogSort = "name-asc" | "name-desc" | "updated-desc";

const DEFAULT_CATEGORY = "Все категории";
const DEFAULT_MANUFACTURER = "Все производители";
const DEFAULT_APPLICATION_AREA = "Все области применения";
const DEFAULT_SORT: CatalogSort = "name-asc";

function isCatalogSort(value: string): value is CatalogSort {
  return value === "name-asc" || value === "name-desc" || value === "updated-desc";
}

interface CatalogExplorerProps {
  initialQuery?: string;
  initialCategory?: string;
  initialManufacturer?: string;
  initialApplicationArea?: string;
  initialSort?: string;
  products: readonly Product[];
  categories: readonly Category[];
  manufacturers: readonly Manufacturer[];
  initialSearchResultIds?: readonly string[];
  compareEnabled?: boolean;
}

export default function CatalogExplorer({
  initialQuery = "",
  initialCategory = "",
  initialManufacturer = "",
  initialApplicationArea = "",
  initialSort = DEFAULT_SORT,
  products,
  categories,
  manufacturers,
  initialSearchResultIds = [],
  compareEnabled = true,
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    () =>
      categories.find(
        (item) => item.id === initialCategory || item.slug === initialCategory,
      )?.id ?? (initialCategory === CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID
        ? CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID
        : DEFAULT_CATEGORY),
  );
  const [manufacturer, setManufacturer] = useState(
    () =>
      manufacturers.find(
        (item) =>
          item.id === initialManufacturer || item.slug === initialManufacturer,
      )?.id ?? (initialManufacturer === CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID
        ? CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID
        : DEFAULT_MANUFACTURER),
  );
  const [applicationArea, setApplicationArea] = useState(
    initialApplicationArea || DEFAULT_APPLICATION_AREA,
  );
  const [sort, setSort] = useState<CatalogSort>(
    isCatalogSort(initialSort) ? initialSort : DEFAULT_SORT,
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
  const applicationAreas = useMemo(
    () => [...new Set(products.flatMap((product) => product.applicationAreas))]
      .sort((left, right) => left.localeCompare(right, "ru-RU")),
    [products],
  );
  const hasUnassignedCategory = products.some(
    (product) => product.categoryId === CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID,
  );
  const hasUnassignedManufacturer = products.some(
    (product) => product.manufacturerId === CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID,
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = categoriesById.get(category)?.slug ?? category;
    const manufacturerParam = manufacturersById.get(manufacturer)?.slug ?? manufacturer;

    setOptionalParam(params, "q", query.trim());
    setOptionalParam(
      params,
      "category",
      categoryParam === DEFAULT_CATEGORY ? "" : categoryParam,
    );
    setOptionalParam(
      params,
      "manufacturer",
      manufacturerParam === DEFAULT_MANUFACTURER ? "" : manufacturerParam,
    );
    setOptionalParam(
      params,
      "applicationArea",
      applicationArea === DEFAULT_APPLICATION_AREA ? "" : applicationArea,
    );
    setOptionalParam(params, "sort", sort === DEFAULT_SORT ? "" : sort);

    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `/catalog?${queryString}` : "/catalog");
  }, [applicationArea, categoriesById, category, manufacturer, manufacturersById, query, sort]);

  const results = useMemo(() => {
    const filtered = products.filter((product) => {
      const searchMatches = !query.trim() || searchResultIds.has(product.id);
      const categoryMatches =
        category === DEFAULT_CATEGORY || product.categoryId === category;
      const manufacturerMatches =
        manufacturer === DEFAULT_MANUFACTURER ||
        product.manufacturerId === manufacturer;
      const applicationAreaMatches = applicationArea === DEFAULT_APPLICATION_AREA
        || product.applicationAreas.includes(applicationArea);
      return searchMatches && categoryMatches && manufacturerMatches && applicationAreaMatches;
    });
    return filtered.sort((left, right) => {
      if (sort === "updated-desc") return right.updatedAt.localeCompare(left.updatedAt);
      const order = left.name.localeCompare(right.name, "ru-RU");
      return sort === "name-desc" ? -order : order;
    });
  }, [applicationArea, category, manufacturer, products, query, searchResultIds, sort]);

  function resetCatalogView() {
    setQuery("");
    setCategory(DEFAULT_CATEGORY);
    setManufacturer(DEFAULT_MANUFACTURER);
    setApplicationArea(DEFAULT_APPLICATION_AREA);
    setSort(DEFAULT_SORT);
  }

  if (products.length === 0) {
    return <CatalogEmptyState />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <aside>
        <div className="cm-card grid gap-2.5 overflow-hidden p-2.5 shadow-[0_8px_28px_rgba(11,19,32,0.035)] sm:grid-cols-3 lg:sticky lg:top-20 lg:block lg:space-y-3">
          <div className="-mx-2.5 -mt-2.5 border-b border-[var(--cm-rule)] bg-white px-2.5 py-2 sm:col-span-3 lg:block">
            <div className="cm-label !text-[9px] !text-cm-teal">Фильтры</div>
          </div>
          <div>
            <div className="cm-label mb-1.5 !text-[8px]">Категория</div>
            <label>
              <span className="sr-only">Категория</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="cm-field cm-field-compact transition duration-200"
              >
                <option>{DEFAULT_CATEGORY}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
                {hasUnassignedCategory && (
                  <option value={CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID}>Данные уточняются</option>
                )}
              </select>
            </label>
          </div>
          <div>
            <div className="cm-label mb-1.5 !text-[8px]">Производитель</div>
            <label>
              <span className="sr-only">Производитель</span>
              <select
                value={manufacturer}
                onChange={(event) => setManufacturer(event.target.value)}
                className="cm-field cm-field-compact transition duration-200"
              >
                <option>{DEFAULT_MANUFACTURER}</option>
                {manufacturers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
                {hasUnassignedManufacturer && (
                  <option value={CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID}>Производитель не указан</option>
                )}
              </select>
            </label>
          </div>
          <div>
            <div className="cm-label mb-1.5 !text-[8px]">Область применения</div>
            <label>
              <span className="sr-only">Область применения</span>
              <select
                value={applicationArea}
                onChange={(event) => setApplicationArea(event.target.value)}
                className="cm-field cm-field-compact transition duration-200"
              >
                <option>{DEFAULT_APPLICATION_AREA}</option>
                {applicationAreas.map((area) => <option key={area}>{area}</option>)}
              </select>
            </label>
          </div>
          <div className="hidden rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/70 p-2.5 text-[10px] leading-4 text-cm-slate lg:block">
            Используйте категорию, производителя и область применения, чтобы найти
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-[10px] text-cm-slate" aria-live="polite">
            Найдено: <strong className="text-cm-ink">{results.length}</strong> из {products.length}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-cm-dim">
            <span>Сортировка</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSort)}
              className="cm-field min-h-9 py-1.5 text-xs text-cm-ink"
            >
              <option value="name-asc">По названию А–Я</option>
              <option value="name-desc">По названию Я–А</option>
              <option value="updated-desc">Сначала обновлённые</option>
            </select>
          </label>
        </div>

        {results.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
            {results.map((product) => {
              const manufacturerEntry = manufacturersById.get(product.manufacturerId);
              const presentation = getProductPresentation(product, {
                categoryName: categoriesById.get(product.categoryId)?.name,
                country: manufacturerEntry?.country,
                manufacturerName: manufacturerEntry?.name,
              });
              return (
              <article
                key={product.slug}
                className="group cm-card flex min-h-full flex-col overflow-hidden"
              >
                <ProductImage product={product} />
                <div className="flex flex-1 flex-col p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low px-2 py-1 font-mono text-[9px] font-semibold text-cm-dim">
                      {presentation.categoryLabel}
                    </span>
                    <span className="font-mono text-[9px] text-cm-dim">
                      {presentation.modelLabel}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-[15px] font-bold leading-5 tracking-[-0.015em]">
                    <Link href={`/catalog/${product.slug}`} className="hover:text-cm-teal">
                      {product.name}
                    </Link>
                  </h2>
                  <div className="mt-1.5 text-xs text-cm-slate">
                    {manufacturerEntry ? (
                      <Link
                        href={`/manufacturers/${manufacturerEntry.slug}`}
                        className="inline-flex items-center rounded-md bg-cm-teal-soft px-2 py-1 font-bold text-cm-teal transition hover:bg-cm-teal/12 hover:underline"
                      >
                        {manufacturerEntry.name}
                      </Link>
                    ) : (
                      presentation.manufacturerLabel
                    )}
                  </div>
                  {presentation.shortDescription && (
                    <p className="mt-2.5 line-clamp-2 text-[11px] leading-[1.125rem] text-cm-slate">
                      {presentation.shortDescription}
                    </p>
                  )}
                  {product.applicationAreas.length > 0 && (
                    <ul
                      className="mt-2.5 flex flex-wrap gap-1.5"
                      aria-label={`Области применения: ${product.name}`}
                    >
                      {product.applicationAreas.slice(0, 2).map((area) => (
                        <li
                          key={area}
                          className="rounded-full border border-[var(--cm-rule)] bg-cm-surface-low/70 px-2 py-1 text-[9px] leading-3 text-cm-slate"
                        >
                          {area}
                        </li>
                      ))}
                      {product.applicationAreas.length > 2 && (
                        <li className="px-1 py-1 text-[9px] leading-3 text-cm-dim">
                          +{product.applicationAreas.length - 2}
                        </li>
                      )}
                    </ul>
                  )}
                  {product.specifications.length > 0 && (
                    <dl className="mt-2.5 grid gap-1 border-t border-[var(--cm-rule)] pt-2.5 text-[10px]">
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
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] font-semibold">
                    <Link href={`/catalog/${product.slug}`} className="text-cm-teal">
                      Открыть карточку →
                    </Link>
                    {compareEnabled && presentation.canCompare ? (
                      <Link
                        href="/compare"
                        aria-label={`Открыть сравнение для ${product.name}`}
                        className="text-cm-slate hover:text-cm-teal"
                      >
                        Сравнить
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
              );
            })}
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

function setOptionalParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

function CatalogEmptyState() {
  return (
    <section className="cm-empty-state py-10" aria-labelledby="catalog-empty-title">
      <div className="cm-empty-icon" aria-hidden="true">⌕</div>
      <h2 id="catalog-empty-title" className="mt-4 text-base font-bold">
        Каталог пока пуст
      </h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
        Товары временно недоступны. Вернитесь позже или перейдите на главную страницу.
      </p>
      <Link href="/" className="cm-button-secondary mt-5">
        На главную
      </Link>
    </section>
  );
}

function ProductImage({ product }: { product: Product }) {
  const image = product.media.find(({ type }) => type === "image");
  if (!image) {
    const presentation = getProductPresentation(product);
    return (
      <Link
        href={`/catalog/${product.slug}`}
        aria-label={`Открыть карточку ${product.name}`}
        className="grid aspect-[16/6.5] w-full place-items-center border-b border-[var(--cm-rule)] bg-cm-surface-low text-[11px] text-cm-dim transition hover:bg-cm-teal-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cm-teal"
      >
        {presentation.mediaFallbackLabel}
      </Link>
    );
  }

  return (
    <Link
      href={`/catalog/${product.slug}`}
      aria-label={`Открыть карточку ${product.name}`}
      className="relative block aspect-[16/6.5] w-full overflow-hidden border-b border-[var(--cm-rule)] bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cm-teal"
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1535px) 33vw, 25vw"
        className="object-contain p-2.5 transition duration-300 group-hover:scale-[1.02]"
      />
    </Link>
  );
}
