import Link from "next/link";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  return (
    <section className="mx-auto max-w-7xl px-8 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">
            Популярные изделия
          </h2>

          <p className="mt-3 text-lg text-gray-500">
            Начинаем с расходных материалов для анестезиологии и реанимации.
          </p>
        </div>

        <Link href="/catalog" className="font-semibold text-blue-600">
          В каталог →
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/knowledge/${product.slug}`}
            className="group rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="text-sm font-semibold text-blue-600">
              {product.category}
            </div>

            <h3 className="mt-4 text-2xl font-bold">
              {product.name}
            </h3>

            <p className="mt-4 line-clamp-3 text-gray-600">
              {product.description}
            </p>

            <div className="mt-8 font-semibold text-blue-600">
              Открыть Knowledge Page →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}