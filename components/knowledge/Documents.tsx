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

      {product.documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--cm-rule)] bg-cm-surface-low p-5">
          <div className="text-xs font-semibold">Нет документов</div>
          <p className="mt-2 text-xs leading-6 text-cm-slate">
            Документы еще не добавлены. Исследование продолжается.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {product.documents.map((document) => (
            <a
              key={document.title}
              href={document.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cm-teal/30 hover:bg-white"
            >
              <div>
                <div className="text-xs font-semibold">
                  {document.title}
                </div>

                <div className="mt-1 flex flex-wrap gap-2 font-mono text-[9px] text-cm-dim">
                  <span>PDF</span>
                  <span>Размер: нет данных</span>
                  <span>Страниц: нет данных</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-cm-teal">
                Скачать →
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
