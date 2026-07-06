import { Product } from "@/types/product";

interface DocumentsProps {
  product: Product;
}

export default function Documents({ product }: DocumentsProps) {
  return (
    <section className="cm-card p-6">
      <div className="cm-label mb-2">Evidence Sources</div>
      <h2 className="mb-5 text-base font-bold">
        Документы
      </h2>

      <div className="space-y-2">
        {product.documents.map((document) => (
          <a
            key={document.title}
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-4 transition hover:border-cm-teal/30"
          >
            <div>
              <div className="text-xs font-semibold">
                {document.title}
              </div>

              <div className="mt-1 font-mono text-[9px] text-cm-dim">
                PDF-документ
              </div>
            </div>

            <div className="text-xs font-semibold text-cm-teal">
              Скачать →
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
