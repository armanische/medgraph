import type { Metadata } from "next";
import Link from "next/link";

import { manufacturers } from "@/data/manufacturers";
import { getManufacturerProducts } from "@/lib/products";
import { getPlatformStats } from "@/lib/platform-stats";

export const metadata: Metadata = {
  title: "Производители медицинских изделий",
  description:
    "Производители медицинских изделий, категории, документы и связанные карточки в экспертной базе CyberMedica.",
  alternates: {
    canonical: "/manufacturers",
  },
};

export default function ManufacturersPage() {
  const stats = getPlatformStats();

  return (
    <main className="min-h-screen bg-cm-canvas">
      <header className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]">
        <div className="cm-container py-8">
          <div className="cm-label">База производителей</div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.025em]">Производители</h1>
          <p className="mt-3 max-w-2xl text-[13px] leading-6 text-cm-slate">
            Изделия, регистрационные документы, категории и совместимость —
            собраны в одном месте.
          </p>
          <div className="mt-6 grid gap-2 overflow-hidden rounded-2xl border border-[var(--cm-rule)] bg-[var(--cm-rule)] shadow-[0_14px_44px_rgba(11,19,32,0.06)] sm:grid-cols-3">
            {[
              ["Производителей", stats.manufacturers],
              ["Изделий", stats.devices],
              ["Категорий", stats.categories],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-5"
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
        <div className="grid gap-3 md:grid-cols-2">
          {manufacturers.map((manufacturer) => {
            const productCount = getManufacturerProducts(
              manufacturer.slug
            ).length;

            return (
              <Link
                key={manufacturer.slug}
                href={`/manufacturers/${manufacturer.slug}`}
              className="group cm-card relative overflow-hidden p-5"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cm-teal/70 to-cm-verified/60 opacity-0 transition duration-200 group-hover:opacity-100"
                />
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
                      className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] font-medium text-cm-teal transition duration-200 group-hover:border-cm-teal/30"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-5 border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim transition duration-200 group-hover:text-cm-teal">
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
