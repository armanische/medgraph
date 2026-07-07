"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  draftStatusLabel,
  searchDraftCatalogCards,
} from "@/lib/catalog-drafts";
import type {
  DraftCatalogCard,
  DraftResearchStatus,
} from "@/types/catalog-draft";

interface CatalogExplorerProps {
  initialQuery?: string;
  products: DraftCatalogCard[];
  categories: string[];
}

function statusClass(status: DraftResearchStatus) {
  if (status === "research_ready") return "border-cm-teal/30 bg-cm-teal/10 text-cm-teal";
  if (status === "partially_researched") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "blocked") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
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
    const matches = searchDraftCatalogCards(query, products);
    return matches.filter((product) => {
      const categoryMatches =
        category === "Все категории" || product.category === category;
      const statusMatches =
        status === "Все статусы" || product.researchStatus === status;
      return categoryMatches && statusMatches;
    });
  }, [category, products, query, status]);

  return (
    <div className="grid gap-7 lg:grid-cols-[14rem_1fr]">
      <aside>
        <div className="sticky top-20 cm-card space-y-5 p-4">
          <div>
            <div className="cm-label mb-3">Категория</div>
            <label>
              <span className="sr-only">Категория</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="cm-field min-h-10 py-2 text-xs"
              >
                <option>Все категории</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="border-t border-[var(--cm-rule)] pt-4">
            <div className="cm-label mb-3">Research status</div>
            <label>
              <span className="sr-only">Research status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="cm-field min-h-10 py-2 text-xs"
              >
                <option>Все статусы</option>
                <option value="needs_source">Needs source</option>
                <option value="partially_researched">Partially researched</option>
                <option value="research_ready">Research ready</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">
            Карточки созданы автоматически и не прошли Verification. Данные
            являются кандидатными и требуют проверки.
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex overflow-hidden rounded-lg border border-[var(--cm-rule-strong)] bg-white focus-within:border-cm-teal focus-within:ring-3 focus-within:ring-cm-teal/10">
          <label className="flex min-w-0 flex-1 items-center">
            <span className="sr-only">Поиск по draft-каталогу</span>
            <span aria-hidden="true" className="pl-4 text-cm-dim">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Название, модель, производитель или источник"
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
            Draft · Candidate · Human review required
          </div>
        </div>

        {results.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {results.map((product) => (
              <Link
                key={product.slug}
                href={`/catalog/${product.slug}`}
                className="group cm-card flex min-h-72 flex-col p-5 transition hover:border-cm-teal/30 hover:shadow-[0_2px_8px_rgba(11,19,32,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded border border-[var(--cm-rule)] bg-cm-surface-low px-2 py-1 font-mono text-[9px] text-cm-dim">
                    DRAFT
                  </span>
                  <span className={`rounded-md border px-2 py-1 font-mono text-[9px] font-semibold ${statusClass(product.researchStatus)}`}>
                    {draftStatusLabel(product.researchStatus)}
                  </span>
                </div>
                <h2 className="mt-5 text-[14px] font-bold leading-5">{product.title}</h2>
                <div className="mt-3 font-mono text-[10px] leading-5 text-cm-dim">
                  {product.manufacturer ?? product.brand ?? "Производитель не подтверждён"}<br />
                  {product.model ?? "Модель требует проверки"}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                  <Metric label="Readiness" value={`${product.readinessScore}`} />
                  <Metric label="Sources" value={`${product.sourcesSummary.total}`} />
                  <Metric label="Documents" value={`${product.documentsSummary.total}`} />
                  <Metric label="Claims" value={`${product.candidateClaimsCount}`} />
                </div>
                {product.missingCriticalFields.length > 0 && (
                  <p className="mt-4 line-clamp-2 text-[11px] leading-5 text-cm-slate">
                    Missing: {product.missingCriticalFields.slice(0, 4).join(", ")}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-[var(--cm-rule)] pt-4">
                  <span className="font-mono text-[9px] text-cm-dim">{product.category}</span>
                  <span className="text-xs font-semibold text-cm-dim group-hover:text-cm-teal">Открыть →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 cm-card border-dashed px-6 py-16 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-cm-surface-low text-cm-dim">⌕</div>
            <h2 className="mt-4 text-sm font-bold">Draft-позиция не найдена</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-cm-slate">
              Измените запрос или фильтр. Новые позиции появляются только как
              draft/candidate до ручной проверки.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-2">
      <div className="cm-label text-[8px]">{label}</div>
      <div className="mt-1 font-mono text-[12px] font-semibold text-cm-ink">
        {value}
      </div>
    </div>
  );
}
