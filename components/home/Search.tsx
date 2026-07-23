"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef } from "react";

export default function Search() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();

    if (!query) {
      inputRef.current?.focus();
      return;
    }

    router.push(`/catalog?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="mt-6 max-w-[56rem] sm:mt-7">
      <label
        htmlFor="homepage-search-input"
        className="text-xs font-semibold text-cm-ink"
      >
        Найти оборудование
      </label>
      <form
        role="search"
        aria-label="Поиск по каталогу медицинского оборудования"
        onSubmit={handleSearch}
        className="mt-2 grid gap-2 sm:flex sm:min-h-[56px] sm:gap-0 sm:overflow-hidden sm:rounded-xl sm:border sm:border-[var(--cm-rule-strong)] sm:bg-white sm:shadow-[0_12px_34px_rgba(11,19,32,0.07)] sm:transition sm:duration-200 sm:focus-within:border-cm-teal sm:focus-within:ring-3 sm:focus-within:ring-cm-teal/10"
      >
        <span className="flex min-h-[52px] min-w-0 items-center gap-3 rounded-[var(--cm-radius-control)] border border-[var(--cm-rule-strong)] bg-white px-4 transition duration-200 focus-within:border-cm-teal focus-within:ring-3 focus-within:ring-cm-teal/10 sm:min-h-[56px] sm:flex-1 sm:rounded-none sm:border-0 sm:px-5 sm:focus-within:ring-0">
          <span aria-hidden="true" className="text-cm-dim">
            ⌕
          </span>
          <input
            ref={inputRef}
            id="homepage-search-input"
            name="q"
            type="search"
            placeholder="Название, модель, производитель или категория"
            autoComplete="off"
            className="min-h-[44px] min-w-0 flex-1 bg-transparent text-sm text-cm-ink placeholder:text-cm-dim"
          />
        </span>
        <button
          type="submit"
          className="cm-button-primary !min-h-[44px] w-full sm:!min-h-[56px] sm:w-28 sm:shrink-0 sm:rounded-none sm:border-0"
        >
          Найти
        </button>
      </form>
    </div>
  );
}
