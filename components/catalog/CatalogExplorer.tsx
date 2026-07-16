"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { searchCatalogCards, type PublicCatalogCard } from "@/lib/published-catalog";

interface CatalogExplorerProps {
  initialQuery?: string;
  products: PublicCatalogCard[];
  categories: string[];
}

// Safety invariant for draft data: Verification not performed; candidate facts are never shown as verified.
function statusClass(status: PublicCatalogCard["displayStatus"]) {
  if (status === "published") return "border-cm-verified/25 bg-cm-verified-soft text-cm-verified";
  if (status === "research_ready") return "border-cm-teal/24 bg-cm-teal-soft/70 text-cm-teal";
  if (status === "partially_researched") return "border-[var(--cm-rule)] bg-white text-cm-slate";
  if (status === "blocked") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function statusLabel(status: PublicCatalogCard["displayStatus"]) {
  const labels: Record<PublicCatalogCard["displayStatus"], string> = {
    published: "Опубликовано",
    needs_source: "Нет подтверждённых данных",
    partially_researched: "Проверяется",
    research_ready: "Проверяется",
    blocked: "Проверяется",
  };
  return labels[status];
}

function displayCount(value: number) {
  return value > 0 ? String(value) : "—";
}

function researchSteps(product: PublicCatalogCard) {
  if (product.displayStatus === "published") {
    return [
      "экспертная проверка завершена",
      "официальные источники опубликованы",
      "документы связаны с записью",
      "целостность публикации проверена",
    ];
  }
  return [
    product.sources > 0
      ? "официальные источники найдены"
      : "нужны официальные источники",
    product.documents > 0
      ? "документы есть"
      : "требуются документы",
    product.coverage > 0 ? "характеристики собраны" : "подготовка характеристик",
    "проверяется специалистом",
  ];
}

export default function CatalogExplorer({
  initialQuery = "",
  products,
  categories,
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Все категории");
  const [status, setStatus] = useState("Все статусы");

  const results = useMemo(() => {
    const matches = searchCatalogCards(query, products);
    return matches.filter((product) => {
      const categoryMatches =
        category === "Все категории" || product.category === category;
      const statusMatches =
        status === "Все статусы" || product.displayStatus === status;
      return categoryMatches && statusMatches;
    });
  }, [category, products, query, status]);

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
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="cm-label mb-2">Статус</div>
            <label>
              <span className="sr-only">Статус исследования</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="cm-field min-h-10 py-2 text-xs transition duration-200"
              >
                <option>Все статусы</option>
                <option value="published">Опубликовано</option>
                <option value="needs_source">Нет подтверждённых данных</option>
                <option value="partially_researched">Проверяется</option>
                <option value="research_ready">Проверяется</option>
                <option value="blocked">Проверяется</option>
              </select>
            </label>
          </div>
          <div className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/70 p-3 text-[11px] leading-5 text-cm-slate">
            Используйте статус и категорию, чтобы быстро найти изделия,
            требующие документов или готовые к экспертной проверке.
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
              placeholder="Название, модель, производитель или источник"
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
            Записи обновляются после проверки документов
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
                    {product.category}
                  </span>
                  <span className={`rounded-md border px-2.5 py-1 font-mono text-[9px] font-semibold ${statusClass(product.displayStatus)}`}>
                    {statusLabel(product.displayStatus)}
                  </span>
                </div>
                <h2 className="mt-4 text-[15px] font-bold leading-6 tracking-[-0.01em]">{product.title}</h2>
                <div className="mt-3 grid gap-1.5 text-[12px] leading-5 text-cm-slate">
                  <div>
                    <span className="text-cm-dim">Производитель: </span>
                    <span className="font-medium text-cm-ink">{product.manufacturer ?? "требует подтверждения"}</span>
                  </div>
                  <div>
                    <span className="text-cm-dim">Модель: </span>
                    <span>{product.model ?? "требует проверки"}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                  <Metric label="Документы" value={displayCount(product.documents)} />
                  <Metric label="Источники" value={displayCount(product.sources)} />
                  <Metric label="Покрытие" value={product.coverage > 0 ? `${product.coverage}%` : "—"} />
                </div>
                <div className="mt-4 rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/65 p-3">
                  <div className="text-[11px] font-semibold text-cm-ink">Состояние записи</div>
                  <ul className="mt-2 grid gap-1.5 text-[11px] leading-5 text-cm-slate">
                    {researchSteps(product).map((step) => (
                      <li key={step} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 size-1 rounded-full bg-cm-teal/60" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--cm-rule)] bg-white/80 p-2">
      <div className="cm-label text-[8px]">{label}</div>
      <div className="mt-1 font-mono text-[12px] font-semibold text-cm-ink">
        {value}
      </div>
    </div>
  );
}
