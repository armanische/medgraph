"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { searchProducts } from "@/lib/products";

const popularQueries = ["FS510", "Hamilton C3", "Mindray SV300", "Airtraq", "Ambu"];
const chipClassName =
  "inline-flex min-h-8 items-center rounded-md border border-cm-teal/18 bg-white/76 px-3.5 font-mono text-[10px] font-semibold text-cm-teal transition duration-200 hover:border-cm-teal/35 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal";
const audienceCardClassName =
  "flex h-full min-h-11 items-center gap-2 rounded-md border border-[var(--cm-rule)] bg-white/64 px-3 py-2 text-xs font-medium leading-5 text-cm-slate transition duration-200 hover:border-cm-teal/22 hover:bg-white/88";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
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
    <section className="relative overflow-hidden border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f7fafc_52%,#eef7f8_100%)]">
      <div
        aria-hidden="true"
        className="absolute right-[-12rem] top-[-10rem] size-[30rem] rounded-full bg-cm-teal/7 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-14rem] left-[40%] size-[24rem] rounded-full bg-cm-verified/7 blur-3xl"
      />
      <div className="cm-container relative grid gap-12 py-18 sm:py-22 lg:grid-cols-[minmax(0,1.14fr)_minmax(22rem,0.86fr)] lg:items-center lg:py-24 xl:gap-15">
        <div className="max-w-[47rem]">
          <div className="cm-label mb-5 flex items-center gap-2 !text-cm-teal">
            <span className="size-1.5 rounded-full bg-cm-teal" />
            Evidence Platform · Medical Devices
          </div>

          <h1 className="cm-balanced max-w-[44.5rem] text-[2.55rem] font-extrabold leading-[1.01] tracking-[-0.032em] text-cm-ink sm:text-[3.35rem] md:text-[3.85rem] lg:text-[3.55rem] xl:text-[4rem]">
            База знаний
            <br />
            <span className="font-bold text-cm-teal">медицинских изделий</span>
          </h1>
          <p className="mt-6 max-w-[38rem] text-base leading-8 text-cm-slate sm:text-[17px]">
            Экспертная платформа для клиницистов, инженеров и закупочных команд:
            проверенные характеристики, документы и совместимость в одной записи.
          </p>

          <div className="relative mt-8 max-w-[39rem]">
            <div className="flex overflow-hidden rounded-xl border border-[var(--cm-rule-strong)] bg-white shadow-[0_14px_40px_rgba(11,19,32,0.065)] transition duration-200 hover:border-cm-teal/25 focus-within:border-cm-teal/70 focus-within:shadow-[0_16px_44px_rgba(11,123,142,0.10)] focus-within:ring-3 focus-within:ring-cm-teal/10">
              <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 sm:min-h-16 sm:px-5">
                <span className="sr-only">Поиск медицинского изделия</span>
                <span className="text-cm-dim"><SearchIcon /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="Введите изделие, производителя, РУ или КТРУ"
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] leading-none text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                onClick={handleSearch}
                className="min-h-14 shrink-0 bg-cm-ink px-5 text-sm font-semibold text-white transition duration-200 hover:bg-cm-teal active:bg-cm-teal-dark sm:min-h-16 sm:px-7"
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
                    className="block w-full rounded-md p-3 text-left transition duration-200 hover:bg-cm-surface-low"
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
                      className={chipClassName}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            {popularQueries.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className={chipClassName}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-12 grid auto-rows-fr gap-3 border-t border-[var(--cm-rule)] pt-7 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Врачам и клиницистам",
              "Медицинским инженерам",
              "Специалистам по закупкам",
              "Поставщикам",
            ].map((item) => (
              <div
                key={item}
                className={audienceCardClassName}
              >
                <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-cm-teal/24 bg-cm-teal-soft text-[8px] font-bold leading-none text-cm-teal">
                  ✓
                </span>
                <span className="flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block lg:pl-2">
          <div className="relative overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white/68 p-5 shadow-[0_14px_46px_rgba(11,19,32,0.055)] backdrop-blur">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-cm-teal/25"
            />
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-cm-teal/20 via-transparent to-transparent"
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="cm-label !text-cm-teal">Экспертная проверка</div>
                <h2 className="mt-2 text-lg font-extrabold tracking-[-0.02em]">
                  Проверенная запись
                </h2>
              </div>
              <div className="rounded-md border border-cm-verified/20 bg-cm-verified-soft px-3 py-2 font-mono text-[10px] font-semibold text-cm-verified">
                Актуально
              </div>
            </div>

            <div className="relative mt-6 grid gap-2.5">
              {[
                ["Опубликованная запись", "FS510", "проверено CyberMedica"],
                ["Исследование в работе", "49 изделий", "ожидают источники"],
                ["Подтверждение данными", "Документ → подтверждение", "без неподтверждённых фактов"],
              ].map(([label, value, note], index) => (
                <div
                  key={label}
                  className={
                    index === 0
                      ? "rounded-md border border-cm-teal/22 bg-white/82 p-4 shadow-[0_8px_24px_rgba(11,19,32,0.04)] backdrop-blur transition duration-200 hover:border-cm-teal/30 hover:bg-white"
                      : "rounded-md border border-[var(--cm-rule)] bg-white/54 p-4 backdrop-blur transition duration-200 hover:border-cm-teal/18 hover:bg-white/72"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="cm-label text-[8px]">{label}</div>
                      <div className={index === 0 ? "mt-2 text-sm font-bold" : "mt-2 text-[13px] font-semibold text-cm-ink/90"}>
                        {value}
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-cm-slate">{note}</div>
                    </div>
                    <span className={index === 0 ? "mt-1 size-2 rounded-full bg-cm-teal/70" : "mt-1 size-2 rounded-full bg-cm-dim/35"} />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-5 rounded-md border border-white/8 bg-cm-ink p-4 text-white shadow-[0_14px_34px_rgba(11,19,32,0.13)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">
                Правило публикации
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                Если факт нельзя подтвердить документом — он не публикуется как проверенный.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
