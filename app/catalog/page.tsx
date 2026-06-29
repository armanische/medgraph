import Link from "next/link";
import { products } from "@/data/products";

export default function CatalogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-8 py-16">

        <h1 className="text-5xl font-bold">
          Каталог медицинских изделий
        </h1>

        <p className="mt-4 text-xl text-gray-600">
          База знаний CyberMedica
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/knowledge/${product.slug}`}
              className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-sm text-blue-600 font-semibold">
                {product.category}
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                {product.name}
              </h2>

              <p className="mt-4 text-gray-600">
                {product.description}
              </p>

              <div className="mt-8 text-blue-600 font-semibold">
                Открыть →
              </div>
            </Link>
          ))}

        </div>

      </div>
    </main>
  );
}