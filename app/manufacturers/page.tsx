import type { Metadata } from "next";
import Link from "next/link";

import { manufacturers } from "@/data/manufacturers";
import { getManufacturerProducts } from "@/lib/products";
import { getPlatformStats } from "@/lib/platform-stats";

export const metadata: Metadata = {
  title: "Производители медицинских изделий | CyberMedica",
  description:
    "Производители, категории, изделия, документы и совместимость в базе CyberMedica.",
};

export default function ManufacturersPage() {
  const stats = getPlatformStats();

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container py-8">
          <div className="cm-label">База производителей</div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.025em]">Производители</h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
            Изделия, регистрационные документы, категории и совместимость —
            собраны в одном месте.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {[
              ["Производителей", stats.manufacturers],
              ["Изделий", stats.devices],
              ["Категорий", stats.categories],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--cm-rule)] bg-cm-surface-low p-4"
              >
                <div className="font-mono text-2xl font-bold text-cm-ink">
                  {value}
                </div>
                <div className="mt-1 cm-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="cm-container py-7">
        <div className="grid gap-2 md:grid-cols-2">
          {manufacturers.map((manufacturer) => {
            const productCount = getManufacturerProducts(
              manufacturer.slug
            ).length;

            return (
              <Link
                key={manufacturer.slug}
                href={`/manufacturers/${manufacturer.slug}`}
                className="group cm-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cm-teal/30 hover:shadow-[0_10px_28px_rgba(11,19,32,0.08)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-mono text-[10px] text-cm-teal">
                    {manufacturer.country}
                  </div>
                  <div className="rounded border border-[var(--cm-rule)] bg-cm-surface-low px-2.5 py-1 font-mono text-[9px] text-cm-dim">
                    Изделий в базе: {productCount}
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-bold">
                  {manufacturer.name}
                </h2>
                <p className="mt-3 text-xs leading-6 text-cm-slate">
                  {manufacturer.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {manufacturer.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] font-medium text-cm-teal transition duration-150 group-hover:border-cm-teal/30"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-5 border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim transition duration-150 group-hover:text-cm-teal">
                  Открыть производителя →
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
