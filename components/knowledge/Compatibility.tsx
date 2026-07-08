import { Product } from "@/types/product";

interface CompatibilityProps {
  product: Product;
}

export default function Compatibility({
  product,
}: CompatibilityProps) {
  return (
    <section className="cm-card p-6">
      <div className="cm-label mb-2 !text-cm-teal">Совместимость</div>
      <h2 className="mb-5 text-base font-bold">
        Совместимость
      </h2>

      {product.compatibility.length === 0 ? (
        <div className="cm-empty-state px-5 py-7">
          <div className="cm-empty-icon">↔</div>
          <div className="mt-4 text-xs font-semibold">Нет совместимости</div>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-cm-slate">
            Совместимость еще анализируется.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {product.compatibility.map((item) => (
            <div
              key={item}
              className="flex items-center rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low/70 p-3 transition duration-200 hover:-translate-y-px hover:border-cm-teal/30 hover:bg-white hover:shadow-[0_10px_24px_rgba(11,19,32,0.05)]"
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
