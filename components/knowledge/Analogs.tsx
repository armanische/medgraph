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

      <div className="space-y-2">
        {product.analogs.map((item) => (
          <div
            key={item}
            className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low p-3"
          >
            <div className="text-xs font-semibold">
              {item}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
