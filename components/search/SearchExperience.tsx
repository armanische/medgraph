"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { SearchResponse, SearchResult } from "@/lib/search";

function statusLabel(status: SearchResult["status"]) {
  const labels: Record<SearchResult["status"], string> = {
    published: "Опубликовано",
    publication_ready: "Проверяется",
    verified: "Опубликовано",
  };
  return labels[status];
}

function ResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="cm-card block p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.015em] text-cm-ink">
            {result.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-cm-slate">
            {result.manufacturer} · {result.category}
          </p>
          {result.model ? (
            <p className="mt-1 font-mono text-xs text-cm-dim">{result.model}</p>
          ) : null}
        </div>
        <div className="rounded-md border border-cm-teal/20 bg-cm-teal-soft px-2.5 py-1 font-mono text-[10px] font-semibold text-cm-teal">
          {statusLabel(result.status)}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-cm-dim">
        <span>Обновлено: {result.lastUpdated}</span>
        {result.matchedFields.length ? (
          <span>Совпадение: {result.matchedFields.join(", ")}</span>
        ) : null}
      </div>
    </Link>
  );
}

export default function SearchExperience({
  initialQuery,
  response,
}: {
  initialQuery: string;
  response: SearchResponse;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("cybermedica.recentSearches");
      return raw ? JSON.parse(raw).slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  const suggestions = useMemo(
    () => [...new Set([...recentQueries, ...response.suggestions])].slice(0, 8),
    [recentQueries, response.suggestions],
  );

  function submit(nextQuery = query) {
    const value = nextQuery.trim();
    if (value) {
      const nextRecent = [value, ...recentQueries.filter((item) => item !== value)]
        .slice(0, 5);
      setRecentQueries(nextRecent);
      try {
        window.localStorage.setItem(
          "cybermedica.recentSearches",
          JSON.stringify(nextRecent),
        );
      } catch {
        // Local suggestions are optional and must not block search.
      }
    }
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-[var(--cm-rule)] bg-white p-4 shadow-[var(--cm-shadow-card)]">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Поиск медицинского изделия</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              type="search"
              placeholder="Производитель, модель, РУ, артикул или категория"
              className="cm-field min-h-12"
            />
          </label>
          <button
            type="button"
            onClick={() => submit()}
            className="cm-button-primary min-h-12 px-6"
          >
            Найти
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuery(suggestion);
                submit(suggestion);
              }}
              className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low px-3 py-1.5 font-mono text-[11px] font-semibold text-cm-slate transition duration-200 hover:border-cm-teal/30 hover:bg-white hover:text-cm-teal"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>

      {response.normalizedQuery ? (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-cm-slate">
            Найдено изделий:{" "}
            <span className="font-mono font-semibold text-cm-ink">
              {response.total}
            </span>
          </div>
          <div className="cm-label">Точное ранжирование</div>
        </div>
      ) : null}

      {!response.normalizedQuery ? (
        <section className="cm-empty-state text-cm-slate">
          Введите производителя, модель, регистрационный номер, артикул или
          категорию.
        </section>
      ) : response.results.length ? (
        <div className="grid gap-3">
          {response.results.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </div>
      ) : (
        <section className="cm-empty-state text-cm-slate">
          <div className="font-semibold text-cm-ink">Ничего не найдено.</div>
          <p className="mt-2">
            Попробуйте модель, производителя или регистрационный номер без лишних
            слов.
          </p>
        </section>
      )}
    </div>
  );
}
