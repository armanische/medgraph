import { Product } from "@/types/product";
import { products } from "@/data/products";

interface Props {
  product: Product;
}

export default function RelatedProducts({ product }: Props) {
  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Похожие изделия
      </h2>

      <div className="grid gap-4">

        {product.analogs.map((item) => {
          const related = products.find(
            (candidate) =>
              candidate.slug !== product.slug &&
              candidate.name.toLowerCase().includes(item.toLowerCase())
          );

          return (
          <div
            key={item}
            className="rounded-2xl border p-5"
          >
            <div className="font-semibold">
              {item}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {related
                ? `Страница доступна: /knowledge/${related.slug}`
                : "Сравнение готовится"}
            </div>
          </div>
          );
        })}

      </div>
    </section>
  );
}
