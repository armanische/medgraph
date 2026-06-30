import type { Metadata } from "next";
import CatalogExplorer from "@/components/catalog/CatalogExplorer";

export const metadata: Metadata = {
  title: "Каталог медицинских изделий | CyberMedica",
  description:
    "Поиск медицинских изделий по названию, РУ, аналогам и совместимости.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-8 py-16">

        <h1 className="text-5xl font-bold">
          Каталог медицинских изделий
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-gray-600">
          Ищите по названию, регистрационному удостоверению, производителю,
          аналогам и совместимому оборудованию.
        </p>
        <CatalogExplorer initialQuery={q} />
      </div>
    </main>
  );
}
