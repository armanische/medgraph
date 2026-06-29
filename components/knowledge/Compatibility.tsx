import { Product } from "@/types/product";

interface CompatibilityProps {
  product: Product;
}

export default function Compatibility({
  product,
}: CompatibilityProps) {
  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Совместимость
      </h2>

      <div className="space-y-3">
        {product.compatibility.map((item) => (
          <div
            key={item}
            className="flex items-center rounded-2xl border p-4"
          >
            <div className="mr-4 text-green-600 text-xl">
              ✓
            </div>

            <div className="font-medium">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}