import { Product } from "@/types/product";

interface AnalogsProps {
  product: Product;
}

export default function Analogs({
  product,
}: AnalogsProps) {
  return (
    <section className="cm-card p-6">
      <div className="cm-label mb-2">Comparison Candidates</div>
      <h2 className="mb-5 text-base font-bold">
        Аналоги
      </h2>

      {product.analogs.length === 0 ? (
        <div className="cm-empty-state px-5 py-7">
          <div className="cm-empty-icon">≃</div>
          <div className="mt-4 text-xs font-semibold">Нет аналогов</div>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-cm-slate">
            Сравнение аналогов еще анализируется.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {product.analogs.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-3 transition duration-200 hover:-translate-y-px hover:border-cm-teal/30 hover:bg-white hover:shadow-[0_10px_24px_rgba(11,19,32,0.05)]"
            >
              <div className="text-xs font-semibold">
                {item}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
