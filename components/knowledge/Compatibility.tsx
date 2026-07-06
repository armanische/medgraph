import { Product } from "@/types/product";

interface CompatibilityProps {
  product: Product;
}

export default function Compatibility({
  product,
}: CompatibilityProps) {
  return (
    <section className="cm-card p-6">
      <div className="cm-label mb-2">Confirmed · ISO 5356-1</div>
      <h2 className="mb-5 text-base font-bold">
        Совместимость
      </h2>

      <div className="grid gap-2 sm:grid-cols-2">
        {product.compatibility.map((item) => (
          <div
            key={item}
            className="flex items-center rounded-md border border-[var(--cm-rule)] bg-cm-surface-low p-3"
          >
            <div className="mr-3 text-sm text-cm-verified">
              ✓
            </div>

            <div className="text-xs font-medium">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
