"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { searchProducts } from "@/lib/products";

const popularQueries = ["FS510", "Hamilton C3", "Mindray SV300", "Airtraq", "Ambu"];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? searchProducts(value) : [];
  }, [query]);

  function handleSearch() {
    if (results.length > 0) {
      router.push(`/knowledge/${results[0].slug}`);
      return;
    }
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="border-b border-[var(--cm-rule)] bg-white">
      <div className="cm-container py-16 sm:py-20">
        <div className="max-w-2xl">
          <div className="cm-label mb-7 flex items-center gap-2 !text-cm-teal">
            <span className="size-1.5 rounded-full bg-cm-teal" />
            Evidence Platform · Medical Devices
          </div>

          <h1 className="text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[3.15rem]">
            Экспертная база знаний
            <br />
            <span className="text-cm-teal">медицинских изделий</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-cm-slate">
            Каждая опубликованная характеристика верифицирована и ссылается на
            первичный источник. Платформа для врачей, инженеров и специалистов
            по закупкам.
          </p>

          <div className="relative mt-8 max-w-xl">
            <div className="flex overflow-hidden rounded-lg border border-[var(--cm-rule-strong)] bg-white focus-within:border-cm-teal focus-within:ring-3 focus-within:ring-cm-teal/10">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5">
                <span className="sr-only">Поиск медицинского изделия</span>
                <span className="text-cm-dim"><SearchIcon /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="Название, производитель, РУ, КТРУ..."
                  className="min-h-12 min-w-0 flex-1 bg-transparent text-[13px] text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                onClick={handleSearch}
                className="min-h-12 shrink-0 bg-cm-ink px-5 text-xs font-semibold text-white transition hover:bg-cm-teal"
              >
                Найти
              </button>
            </div>

            {query && results.length > 0 && (
              <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 rounded-lg border border-[var(--cm-rule)] bg-white p-2 shadow-[0_12px_40px_rgba(11,19,32,0.12)]">
                {results.map((product) => (
                  <button
                    key={product.slug}
                    onClick={() => router.push(`/knowledge/${product.slug}`)}
                    className="block w-full rounded-md p-3 text-left hover:bg-cm-surface-low"
                  >
                    <span className="block text-[13px] font-semibold">{product.name}</span>
                    <span className="mt-1 block font-mono text-[10px] text-cm-dim">
                      {product.manufacturer} · {product.specifications.ru}
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
                  {["Hamilton", "FS510", "Ambu", "ИВЛ"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="rounded-full border border-cm-teal/20 bg-cm-teal-soft px-3 py-1 font-mono text-[10px] text-cm-teal transition duration-150 hover:border-cm-teal/50 hover:bg-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {popularQueries.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="rounded-full border border-cm-teal/20 bg-cm-teal-soft px-3 py-1 font-mono text-[10px] text-cm-teal transition duration-150 hover:border-cm-teal/40 hover:bg-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-7 gap-y-3 border-t border-[var(--cm-rule)] pt-7">
          {[
            "Врачам и клиницистам",
            "Медицинским инженерам",
            "Специалистам по закупкам",
            "Поставщикам",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-cm-slate">
              <span className="flex size-4 items-center justify-center rounded-full border border-cm-teal/30 bg-cm-teal-soft text-[9px] font-bold text-cm-teal">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
