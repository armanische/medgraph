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
  products: readonly Product[];
  categories: readonly Category[];
  manufacturers: readonly Manufacturer[];
  initialSearchResultIds?: readonly string[];
}

export default function CatalogExplorer({
  initialQuery = "",
  products,
  categories,
  manufacturers,
  initialSearchResultIds = [],
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Все категории");
  const [manufacturer, setManufacturer] = useState("Все производители");
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

  return (
    <div className="grid gap-7 lg:grid-cols-[14rem_1fr]">
      <aside>
        <div className="sticky top-20 cm-card space-y-4 overflow-hidden p-4 shadow-[0_8px_28px_rgba(11,19,32,0.035)]">
          <div className="-mx-4 -mt-4 border-b border-[var(--cm-rule)] bg-white px-4 py-3">
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
          <div className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/70 p-3 text-[11px] leading-5 text-cm-slate">
            Используйте категорию и производителя, чтобы быстро найти
            нужное медицинское оборудование.
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex overflow-hidden rounded-xl border border-[var(--cm-rule-strong)] bg-white shadow-[0_12px_34px_rgba(11,19,32,0.055)] transition duration-200 hover:border-cm-teal/24 focus-within:border-cm-teal/70 focus-within:ring-3 focus-within:ring-cm-teal/10">
          <label className="flex min-w-0 flex-1 items-center">
            <span className="sr-only">Поиск по каталогу</span>
            <span aria-hidden="true" className="pl-4 text-cm-dim">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, модель, производитель или категория"
              className="min-h-13 min-w-0 flex-1 bg-transparent px-3 text-[13px] placeholder:text-cm-dim"
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
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {results.map((product) => (
              <Link
                key={product.slug}
                href={`/catalog/${product.slug}`}
                className="group cm-card flex min-h-64 flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md border border-[var(--cm-rule)] bg-white px-2.5 py-1 font-mono text-[9px] font-semibold text-cm-dim">
                    {categoriesById.get(product.categoryId)?.name ??
                      product.categoryId}
                  </span>
                  <ProductImage product={product} />
                </div>
                <h2 className="mt-4 text-[15px] font-bold leading-6 tracking-[-0.01em]">{product.name}</h2>
                <div className="mt-3 grid gap-1.5 text-[12px] leading-5 text-cm-slate">
                  <div>
                    <span className="text-cm-dim">Производитель: </span>
                    <span className="font-medium text-cm-ink">
                      {manufacturersById.get(product.manufacturerId)?.name ??
                        product.manufacturerId}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/65 p-3">
                  <p className="text-[11px] leading-5 text-cm-slate">
                    {product.shortDescription}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-[var(--cm-rule)] pt-4">
                  <span className="text-[11px] text-cm-dim">Карточка изделия</span>
                  <span className="text-xs font-semibold text-cm-dim transition duration-200 group-hover:text-cm-teal">Открыть →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="cm-empty-state mt-4">
            <div className="cm-empty-icon">⌕</div>
            <h2 className="mt-4 text-sm font-bold">Ничего не найдено</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Проверьте написание, очистите фильтры или попробуйте искать по
              производителю, модели либо категории изделия.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Hamilton", "FS510", "Ambu", "ИВЛ"].map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="rounded-full border border-cm-teal/20 bg-cm-teal-soft px-3 py-1.5 font-mono text-[10px] text-cm-teal transition duration-200 hover:border-cm-teal/50 hover:bg-white"
                >
                  {item}
                </button>
              ))}
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
    <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-[var(--cm-rule)] bg-white">
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes="40px"
        className="object-cover"
      />
    </span>
  );
}
