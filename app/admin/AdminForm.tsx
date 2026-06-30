"use client";

import { useState } from "react";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(makeSlug(value));
    setSaved(false);
  }

  function handleSubmit() {
    if (!name || !slug) {
      alert("Заполни название и slug");
      return;
    }

    const product = {
      name,
      slug,
      manufacturer,
      category,
      description,
    };

    const existing = JSON.parse(localStorage.getItem("cms-products") || "[]");

    localStorage.setItem(
      "cms-products",
      JSON.stringify([...existing, product])
    );
    window.dispatchEvent(new Event("cms-products-changed"));

    setSaved(true);
  }

  return (
    <div className="mt-12 rounded-3xl border bg-white p-10 shadow">
      <div className="grid gap-6">
        <input
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Название изделия"
          className="rounded-xl border p-4"
        />

        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Slug"
          className="rounded-xl border p-4"
        />

        <input
          value={manufacturer}
          onChange={(event) => setManufacturer(event.target.value)}
          placeholder="Производитель"
          className="rounded-xl border p-4"
        />

        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Категория"
          className="rounded-xl border p-4"
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          placeholder="Описание"
          className="rounded-xl border p-4"
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-blue-600 p-4 font-bold text-white hover:bg-blue-700"
        >
          Сохранить изделие
        </button>

        {saved && (
          <div className="rounded-xl bg-green-50 p-4 font-semibold text-green-700">
            Черновик сохранён в этом браузере. Для публикации потребуется
            подключение базы данных.
          </div>
        )}
      </div>
    </div>
  );
}
