import type { Metadata } from "next";
import Link from "next/link";

import { manufacturers } from "@/data/manufacturers";
import { getManufacturerProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Производители медицинских изделий | CyberMedica",
  description:
    "Производители, категории, изделия, документы и совместимость в базе CyberMedica.",
};

export default function ManufacturersPage() {
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
                className="group cm-card p-5 transition hover:border-cm-teal/30 hover:shadow-[0_2px_8px_rgba(11,19,32,0.06)]"
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
                      className="rounded-md border border-cm-teal/15 bg-cm-teal-soft px-2.5 py-1 text-[10px] font-medium text-cm-teal"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-5 border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim group-hover:text-cm-teal">
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
