"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SearchService } from "@/lib/storefront/search-service";
import type {
  Category,
  Manufacturer,
  Product,
} from "@/lib/storefront/types";

interface HomepageStats {
  productCount: number;
  manufacturerCount: number;
  categoryCount: number;
}
const chipClassName =
  "inline-flex min-h-8 items-center rounded-md border border-cm-teal/18 bg-white/76 px-3.5 font-mono text-[10px] font-semibold text-cm-teal transition duration-200 hover:border-cm-teal/35 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal";
const audienceCardClassName =
  "flex h-full min-h-11 items-center gap-2 rounded-md border border-[var(--cm-rule)] bg-white/64 px-3 py-2 text-xs font-medium leading-5 text-cm-slate transition duration-200 hover:border-cm-teal/22 hover:bg-white/88";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Search({
  products,
  manufacturers,
  categories,
  stats,
}: {
  products: readonly Product[];
  manufacturers: readonly Manufacturer[];
  categories: readonly Category[];
  stats: HomepageStats;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly Product[]>([]);
  const productSearchService = useMemo(
    () => SearchService.forProducts(products, manufacturers, categories),
    [categories, manufacturers, products],
  );
  const manufacturersById = useMemo(
    () => new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer])),
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

  function handleSearch() {
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_52%,#eef7f8_100%)]">
      <div
        aria-hidden="true"
        className="absolute right-[-12rem] top-[-10rem] size-[30rem] rounded-full bg-cm-teal/7 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-14rem] left-[40%] size-[24rem] rounded-full bg-cm-verified/7 blur-3xl"
      />
      <div className="cm-container relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(21rem,0.88fr)] lg:items-center lg:py-22 xl:gap-12">
        <div className="max-w-[47rem]">
          <div className="cm-label mb-4 flex items-center gap-2 !text-cm-teal">
            <span className="size-1.5 rounded-full bg-cm-teal" />
            Medical Equipment Catalog
          </div>

          <h1 className="cm-balanced max-w-[45rem] text-[2.55rem] font-extrabold leading-[1.015] tracking-[-0.03em] text-cm-ink sm:text-[3.35rem] md:text-[3.85rem] lg:text-[3.35rem] xl:text-[3.55rem]">
            Каталог медицинского оборудования
            <br />
            <span className="font-bold text-cm-teal lg:whitespace-nowrap">для клиник и закупок</span>
          </h1>
          <p className="mt-5 max-w-[36.5rem] text-base leading-7 text-cm-slate sm:text-[17px] sm:leading-8">
            Производители, технические характеристики и подбор оборудования
            для клиницистов, инженеров и закупочных команд.
          </p>

          <div className="relative mt-7 max-w-[38rem]">
            <div className="flex overflow-hidden rounded-xl border border-[var(--cm-rule-strong)] bg-white shadow-[0_14px_40px_rgba(11,19,32,0.065)] transition duration-200 hover:border-cm-teal/25 focus-within:border-cm-teal/70 focus-within:shadow-[0_16px_44px_rgba(11,123,142,0.10)] focus-within:ring-3 focus-within:ring-cm-teal/10">
              <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 sm:min-h-16 sm:px-5">
                <span className="sr-only">Поиск медицинского изделия</span>
                <span className="text-cm-dim"><SearchIcon /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="Введите изделие, производителя, РУ или КТРУ"
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] leading-none text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                onClick={handleSearch}
                className="min-h-14 shrink-0 bg-cm-ink px-5 text-sm font-semibold text-white transition duration-200 hover:bg-cm-teal active:bg-cm-teal-dark sm:min-h-16 sm:px-7"
              >
                Найти
              </button>
            </div>

            {query && results.length > 0 && (
              <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-[var(--cm-rule)] bg-white p-2 shadow-[0_12px_40px_rgba(11,19,32,0.12)]">
                {results.map((product) => (
                  <button
                    key={product.slug}
                    onClick={() => router.push(`/catalog/${product.slug}`)}
                    className="flex w-full items-center gap-3 rounded-md p-3 text-left transition duration-200 hover:bg-cm-surface-low"
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
              <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[0_12px_40px_rgba(11,19,32,0.12)]">
                <div className="text-[13px] font-semibold">Ничего не найдено</div>
                <div className="mt-1 text-xs text-cm-slate">
                  Попробуйте один из запросов или продолжите поиск в каталоге.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {popularQueries.slice(0, 4).map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className={chipClassName}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {popularQueries.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className={chipClassName}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-10 grid auto-rows-fr gap-3 border-t border-[var(--cm-rule)] pt-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Врачам и клиницистам",
              "Медицинским инженерам",
              "Специалистам по закупкам",
              "Поставщикам",
            ].map((item) => (
              <div
                key={item}
                className={audienceCardClassName}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-cm-teal/24 bg-cm-teal-soft text-[8px] font-bold leading-none text-cm-teal">
                  ✓
                </span>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block lg:pl-2">
          <div className="relative overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white/62 p-4 shadow-[0_12px_38px_rgba(11,19,32,0.045)] backdrop-blur">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-cm-teal/25"
            />
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-cm-teal/20 via-transparent to-transparent"
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="cm-label !text-cm-teal">Подбор оборудования</div>
                <h2 className="mt-2 text-[17px] font-bold tracking-[-0.018em]">
                  Каталог и характеристики
                </h2>
              </div>
              <div className="rounded-md border border-cm-verified/18 bg-cm-verified-soft/80 px-3 py-2 font-mono text-[10px] font-semibold text-cm-verified">
                По запросу
              </div>
            </div>

            <div className="relative mt-5 grid gap-2.5">
              {[
                ["Товары", String(stats.productCount), "доступны для подбора"],
                ["Производители", String(stats.manufacturerCount), "активные бренды"],
                ["Категории", String(stats.categoryCount), "направления оборудования"],
              ].map(([label, value, note], index) => (
                <div
                  key={label}
                  className={
                    index === 0
                      ? "rounded-md border border-cm-teal/18 bg-white/76 p-3.5 shadow-[0_7px_20px_rgba(11,19,32,0.035)] backdrop-blur transition duration-200 hover:border-cm-teal/26 hover:bg-white"
                      : "rounded-md border border-[var(--cm-rule)] bg-white/46 p-3.5 backdrop-blur transition duration-200 hover:border-cm-teal/14 hover:bg-white/64"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="cm-label text-[8px]">{label}</div>
                      <div className={index === 0 ? "mt-2 text-sm font-bold" : "mt-2 text-[13px] font-semibold text-cm-ink/90"}>
                        {value}
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-cm-slate">{note}</div>
                    </div>
                    <span className={index === 0 ? "mt-1 size-2 rounded-full bg-cm-teal/70" : "mt-1 size-2 rounded-full bg-cm-dim/35"} />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-4 rounded-md border border-white/8 bg-cm-ink/95 p-3.5 text-white shadow-[0_12px_28px_rgba(11,19,32,0.11)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">
                Коммерческое предложение
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                Выберите оборудование и отправьте запрос специалисту CyberMedica.
              </p>
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
