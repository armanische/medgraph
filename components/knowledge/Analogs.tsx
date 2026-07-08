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
        <div className="rounded-lg border border-dashed border-[var(--cm-rule)] bg-cm-surface-low p-5">
          <div className="text-xs font-semibold">Нет аналогов</div>
          <p className="mt-2 text-xs leading-6 text-cm-slate">
            Сравнение аналогов еще анализируется.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {product.analogs.map((item) => (
            <div
              key={item}
              className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low p-3 transition duration-150 hover:border-cm-teal/30 hover:bg-white"
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
