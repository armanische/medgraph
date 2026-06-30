"use client";

import { useEffect, useState } from "react";

interface CmsProduct {
  name: string;
  slug: string;
  manufacturer: string;
  category: string;
  description: string;
}

export default function SavedProducts() {
  const [items, setItems] = useState<CmsProduct[]>([]);

  function loadItems() {
    const saved = JSON.parse(localStorage.getItem("cms-products") || "[]");
    setItems(saved);
  }

  function clearItems() {
    localStorage.removeItem("cms-products");
    setItems([]);
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="mt-12 rounded-3xl border bg-white p-10 shadow">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">Сохраненные изделия</h2>

        <button
          type="button"
          onClick={clearItems}
          className="rounded-xl border px-5 py-3 font-semibold hover:bg-gray-50"
        >
          Очистить CMS
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-gray-500">Пока ничего не добавлено.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.slug} className="rounded-2xl border p-5">
              <div className="font-bold">{item.name}</div>

              <div className="mt-1 text-sm text-gray-500">
                {item.manufacturer || "Производитель не указан"} ·{" "}
                {item.category || "Категория не указана"}
              </div>

              <div className="mt-3 text-gray-600">
                {item.description || "Описание не указано"}
              </div>

              <div className="mt-3 text-sm text-blue-600">
                /knowledge/{item.slug}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}