"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { searchProducts } from "@/lib/products";

const popularQueries = ["FS510", "Hamilton C3", "Mindray SV300", "Airtraq", "Ambu"];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
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
    <section className="relative overflow-hidden border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_48%,#e8f5f7_100%)]">
      <div
        aria-hidden="true"
        className="absolute right-[-12rem] top-[-10rem] size-[30rem] rounded-full bg-cm-teal/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-14rem] left-[40%] size-[24rem] rounded-full bg-cm-verified/10 blur-3xl"
      />
      <div className="cm-container relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)] lg:items-center xl:gap-14">
        <div className="max-w-[46rem]">
          <div className="cm-label mb-7 flex items-center gap-2 !text-cm-teal">
            <span className="size-1.5 rounded-full bg-cm-teal" />
            Evidence Platform · Medical Devices
          </div>

          <h1 className="cm-balanced max-w-[44rem] text-[2.3rem] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[3rem] md:text-[3.35rem] lg:text-[3.05rem] xl:text-[3.45rem]">
            Экспертная база знаний{" "}
            <span className="text-cm-teal">для медицинских изделий</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-cm-slate">
            Каждая опубликованная характеристика верифицирована и ссылается на
            первичный источник. Платформа для врачей, инженеров и специалистов
            по закупкам.
          </p>

          <div className="relative mt-8 max-w-xl">
            <div className="flex overflow-hidden rounded-lg border border-[var(--cm-rule-strong)] bg-white focus-within:border-cm-teal focus-within:ring-3 focus-within:ring-cm-teal/10">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5">
                <span className="sr-only">Поиск медицинского изделия</span>
                <span className="text-cm-dim"><SearchIcon /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                  }}
                  placeholder="Название, производитель, РУ, КТРУ..."
                  className="min-h-12 min-w-0 flex-1 bg-transparent text-[13px] text-cm-ink placeholder:text-cm-dim"
                />
              </label>
              <button
                onClick={handleSearch}
                className="min-h-12 shrink-0 bg-cm-ink px-5 text-xs font-semibold text-white transition duration-200 hover:bg-cm-teal"
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
                  className="rounded-full border border-cm-teal/20 bg-cm-teal-soft px-3 py-1 font-mono text-[10px] text-cm-teal transition duration-200 hover:-translate-y-px hover:border-cm-teal/50 hover:bg-white"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {popularQueries.map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="rounded-full border border-cm-teal/20 bg-cm-teal-soft px-3 py-1 font-mono text-[10px] text-cm-teal transition duration-200 hover:-translate-y-px hover:border-cm-teal/40 hover:bg-white"
              >
                {item}
              </button>
            ))}
          </div>
        <div className="mt-14 grid gap-3 border-t border-[var(--cm-rule)] pt-7 sm:grid-cols-2 xl:grid-cols-4">
          {[
            "Врачам и клиницистам",
            "Медицинским инженерам",
            "Специалистам по закупкам",
            "Поставщикам",
          ].map((item) => (
            <div
              key={item}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cm-rule)] bg-white/70 px-3 text-xs text-cm-slate shadow-[0_8px_24px_rgba(11,19,32,0.035)]"
            >
              <span className="flex size-4 items-center justify-center rounded-full border border-cm-teal/30 bg-cm-teal-soft text-[9px] font-bold text-cm-teal">
                ✓
              </span>
              {item}
            </div>
          ))}
        </div>
        </div>

        <div className="lg:pl-2">
          <div className="cm-card cm-technical-surface relative overflow-hidden border-cm-teal/20 bg-white/86 p-5 shadow-[0_24px_70px_rgba(11,19,32,0.10)] backdrop-blur">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cm-teal via-cm-verified to-cm-teal"
            />
            <div
              aria-hidden="true"
              className="absolute -right-20 top-10 size-52 rounded-full border border-cm-teal/15"
            />
            <div
              aria-hidden="true"
              className="absolute -right-9 top-24 h-px w-44 rotate-[-28deg] bg-cm-teal/20"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-24 left-7 h-20 w-px bg-cm-teal/20"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-14 left-7 h-px w-28 bg-cm-teal/20"
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="cm-label !text-cm-teal">Clinical Intelligence</div>
                <h2 className="mt-2 text-lg font-extrabold tracking-[-0.03em]">
                  Verified / Research Record
                </h2>
              </div>
              <div className="rounded-xl border border-cm-verified/20 bg-cm-verified-soft px-3 py-2 font-mono text-[10px] font-semibold text-cm-verified">
                LIVE
              </div>
            </div>

            <div className="relative mt-6 grid gap-3">
              {[
                ["Опубликованная запись", "FS510", "CyberMedica Verified"],
                ["Draft research", "49 изделий", "ожидают источники"],
                ["Provenance", "Source → Evidence", "без выдуманных фактов"],
              ].map(([label, value, note]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--cm-rule)] bg-white/78 p-4 shadow-[0_10px_28px_rgba(11,19,32,0.045)] backdrop-blur transition duration-200 hover:-translate-y-px hover:border-cm-teal/25 hover:bg-white hover:shadow-[0_14px_34px_rgba(11,19,32,0.07)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="cm-label text-[8px]">{label}</div>
                      <div className="mt-2 text-sm font-bold">{value}</div>
                      <div className="mt-1 text-[11px] text-cm-slate">{note}</div>
                    </div>
                    <span className="mt-1 size-2 rounded-full bg-cm-teal" />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-5 rounded-xl bg-cm-ink p-4 text-white shadow-[0_18px_44px_rgba(11,19,32,0.16)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/45">
                Product rule
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                Если факт нельзя проверить — он не показывается как факт.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
