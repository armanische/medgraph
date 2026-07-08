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

      {product.compatibility.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--cm-rule)] bg-cm-surface-low p-5">
          <div className="text-xs font-semibold">Нет совместимости</div>
          <p className="mt-2 text-xs leading-6 text-cm-slate">
            Совместимость еще анализируется.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {product.compatibility.map((item) => (
            <div
              key={item}
              className="flex items-center rounded-md border border-[var(--cm-rule)] bg-cm-surface-low p-3 transition duration-150 hover:border-cm-teal/30 hover:bg-white"
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
      )}
    </section>
  );
}
