"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { productCategories, products } from "@/data/products";
import { searchProducts } from "@/lib/products";

interface CatalogExplorerProps {
  initialQuery?: string;
}

export default function CatalogExplorer({ initialQuery = "" }: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Все категории");

  const results = useMemo(() => {
    const matches = searchProducts(query);
    return category === "Все категории"
      ? matches
      : matches.filter((product) => product.category === category);
  }, [category, query]);

  return (
    <div className="grid gap-7 lg:grid-cols-[12.25rem_1fr]">
      <aside>
        <div className="sticky top-20 cm-card p-4">
          <div className="cm-label mb-3">Категория</div>
          <label>
            <span className="sr-only">Категория</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="cm-field min-h-10 py-2 text-xs"
            >
              <option>Все категории</option>
              {productCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="mt-5 border-t border-[var(--cm-rule)] pt-4">
            <div className="cm-label mb-3">Статус РУ</div>
            <div className="flex items-center gap-2 text-xs text-cm-ink">
              <span className="size-2 rounded-full bg-cm-verified" />
              Активное РУ
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex overflow-hidden rounded-lg border border-[var(--cm-rule-strong)] bg-white focus-within:border-cm-teal focus-within:ring-3 focus-within:ring-cm-teal/10">
          <label className="flex min-w-0 flex-1 items-center">
            <span className="sr-only">Поиск по каталогу</span>
            <span aria-hidden="true" className="pl-4 text-cm-dim">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, РУ, аналог, совместимость или КТРУ"
              className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-[13px] placeholder:text-cm-dim"
            />
          </label>
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
              className="px-4 text-cm-dim hover:text-cm-ink"
            >
              ×
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="font-mono text-[10px] text-cm-slate">
            Найдено: <strong className="text-cm-ink">{results.length}</strong> из {products.length}
          </div>
          <div className="hidden font-mono text-[9px] text-cm-dim sm:block">
            Данные проходят редакционную проверку
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {results.map((product) => (
                <Link
                  key={product.slug}
                  href={`/knowledge/${product.slug}`}
                  className="group cm-card flex min-h-64 flex-col p-5 transition hover:border-cm-teal/30 hover:shadow-[0_2px_8px_rgba(11,19,32,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded border border-[var(--cm-rule)] bg-cm-surface-low px-2 py-1 font-mono text-[9px] text-cm-dim">
                      {product.slug.toUpperCase()}
                    </span>
                    <span className="rounded-md border border-[var(--cm-verified-border)] bg-cm-verified-soft px-2 py-1 font-mono text-[9px] font-semibold text-cm-verified">
                      РУ · подтверждено
                    </span>
                  </div>
                  <h2 className="mt-5 text-[14px] font-bold leading-5">{product.name}</h2>
                  <div className="mt-3 font-mono text-[10px] leading-5 text-cm-dim">
                    {product.manufacturer}<br />
                    {product.identifiers.registration}
                  </div>
                  <p className="mt-4 line-clamp-3 text-xs leading-5 text-cm-slate">
                    {product.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--cm-rule)] pt-4">
                    <span className="font-mono text-[9px] text-cm-dim">{product.category}</span>
                    <span className="text-xs font-semibold text-cm-dim group-hover:text-cm-teal">Открыть →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 cm-card flex gap-3 p-4">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-cm-teal" />
              <div>
                <div className="text-xs font-semibold">База пополняется и проверяется специалистами</div>
                <p className="mt-1 text-[11px] leading-5 text-cm-slate">
                  Новые позиции добавляются только после проверки регистрационных данных.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-4 cm-card border-dashed px-6 py-16 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-cm-surface-low text-cm-dim">⌕</div>
            <h2 className="mt-4 text-sm font-bold">Изделие пока не найдено</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Оставьте запрос — специалист проверит аналоги, совместимость и документы.
            </p>
            <Link href={`/request?query=${encodeURIComponent(query)}`} className="cm-button-primary mt-5">
              Отправить запрос
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
