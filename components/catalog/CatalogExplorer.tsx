"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { productCategories, products } from "@/data/products";
import { searchProducts } from "@/lib/products";

interface CatalogExplorerProps {
  initialQuery?: string;
}

export default function CatalogExplorer({
  initialQuery = "",
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("Все категории");

  const results = useMemo(() => {
    const matches = searchProducts(query);

    return category === "Все категории"
      ? matches
      : matches.filter((product) => product.category === category);
  }, [category, query]);

  return (
    <>
      <div className="mt-10 grid gap-4 rounded-3xl border bg-white p-5 shadow-sm md:grid-cols-[1fr_280px]">
        <label>
          <span className="sr-only">Поиск по каталогу</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название, РУ, аналог, совместимость или КТРУ"
            className="h-14 w-full rounded-xl border px-5 outline-none focus:border-blue-600"
          />
        </label>
        <label>
          <span className="sr-only">Категория</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-14 w-full rounded-xl border bg-white px-5 outline-none focus:border-blue-600"
          >
            <option>Все категории</option>
            {productCategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Найдено: {results.length} из {products.length}
      </div>

      {results.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((product) => (
            <Link
              key={product.slug}
              href={`/knowledge/${product.slug}`}
              className="group rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="text-sm font-semibold text-blue-600">
                {product.category}
              </div>
              <h2 className="mt-4 text-2xl font-bold">{product.name}</h2>
              <div className="mt-2 text-sm text-gray-500">
                {product.manufacturer} · {product.identifiers.registration}
              </div>
              <p className="mt-4 line-clamp-3 text-gray-600">
                {product.description}
              </p>
              <div className="mt-8 font-semibold text-blue-600">
                Открыть страницу знания →
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed bg-white p-10 text-center">
          <h2 className="text-2xl font-bold">Изделие пока не найдено</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Оставьте запрос — специалист проверит аналоги, совместимость и
            документы.
          </p>
          <Link
            href={`/request?query=${encodeURIComponent(query)}`}
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Отправить запрос
          </Link>
        </div>
      )}
    </>
  );
}
