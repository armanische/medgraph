import { Product } from "@/types/product";

interface DocumentsProps {
  product: Product;
}

export default function Documents({ product }: DocumentsProps) {
  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Документы
      </h2>

      <div className="space-y-4">
        {product.documents.map((document) => (
          <a
            key={document.title}
            href={document.url}
            target="_blank"
            className="flex items-center justify-between rounded-2xl border p-5 transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div>
              <div className="font-semibold">
                {document.title}
              </div>

              <div className="mt-1 text-sm text-gray-500">
                PDF-документ
              </div>
            </div>

            <div className="text-blue-600 font-semibold">
              Скачать →
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}