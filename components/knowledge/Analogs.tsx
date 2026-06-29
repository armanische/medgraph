import { Product } from "@/types/product";

interface AnalogsProps {
  product: Product;
}

export default function Analogs({
  product,
}: AnalogsProps) {
  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Аналоги
      </h2>

      <div className="space-y-3">
        {product.analogs.map((item) => (
          <div
            key={item}
            className="rounded-2xl border p-4 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="font-semibold">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}