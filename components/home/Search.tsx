"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { searchProducts } from "@/lib/products";

const popularQueries = [
  "FS510",
  "Hamilton C3",
  "Mindray SV300",
  "Airtraq",
  "Ambu",
];

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return [];

    return searchProducts(value);
  }, [query]);

  function handleSearch() {
    if (results.length > 0) {
      router.push(`/knowledge/${results[0].slug}`);
      return;
    }

    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Найдите любое
          <span className="text-blue-600"> медицинское изделие</span>
        </h1>

        <p className="mt-8 text-2xl text-gray-600">
          Поиск по медицинскому оборудованию, расходным материалам, КТРУ,
          регистрационным удостоверениям и аналогам.
        </p>

        <div className="relative mt-14">
          <div className="flex rounded-2xl border border-gray-300 bg-white p-2 shadow-sm">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Например: FS510, Hamilton C1, Ambu aScope..."
              className="h-16 flex-1 px-6 text-xl outline-none"
            />

            <button
              onClick={handleSearch}
              className="rounded-xl bg-blue-600 px-8 font-semibold text-white hover:bg-blue-700"
            >
              Найти
            </button>
          </div>

          {query && results.length > 0 && (
            <div className="absolute left-0 right-0 top-24 z-30 rounded-3xl border bg-white p-4 text-left shadow-2xl">
              {results.map((product) => (
                <button
                  key={product.slug}
                  onClick={() => router.push(`/knowledge/${product.slug}`)}
                  className="block w-full rounded-2xl p-4 text-left hover:bg-gray-50"
                >
                  <div className="font-bold">{product.name}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {product.manufacturer} · {product.specifications.ru}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="absolute left-0 right-0 top-24 z-30 rounded-3xl border bg-white p-6 text-left shadow-2xl">
              <div className="font-bold">Ничего не найдено</div>
              <div className="mt-2 text-gray-500">
                Оставьте запрос — подберем изделие или аналог.
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {popularQueries.map((item) => (
            <button
              key={item}
              onClick={() => setQuery(item)}
              className="rounded-full bg-gray-100 px-5 py-2 hover:bg-blue-50 hover:text-blue-600"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
