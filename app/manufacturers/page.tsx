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
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-widest text-blue-600">
            База производителей
          </div>
          <h1 className="mt-4 text-5xl font-bold">Производители</h1>
          <p className="mt-5 text-xl leading-8 text-gray-600">
            Изделия, регистрационные документы, категории и совместимость —
            собраны в одном месте.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {manufacturers.map((manufacturer) => {
            const productCount = getManufacturerProducts(
              manufacturer.slug
            ).length;

            return (
              <Link
                key={manufacturer.slug}
                href={`/manufacturers/${manufacturer.slug}`}
                className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-blue-600">
                    {manufacturer.country}
                  </div>
                  <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                    Изделий в базе: {productCount}
                  </div>
                </div>
                <h2 className="mt-4 text-3xl font-bold">
                  {manufacturer.name}
                </h2>
                <p className="mt-4 leading-7 text-gray-600">
                  {manufacturer.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {manufacturer.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-8 font-semibold text-blue-600">
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
