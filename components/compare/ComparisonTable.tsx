import Link from "next/link";

import type {
  Category,
  Manufacturer,
  ProductComparison,
  ProductDocument,
  ProductSpecification,
} from "@/lib/storefront";

function formatSpecification(specification: ProductSpecification | null) {
  if (!specification) return "";
  return `${specification.value}${specification.unit ? ` ${specification.unit}` : ""}`;
}

function Documents({ documents }: { documents: readonly ProductDocument[] }) {
  if (!documents.length) return <span aria-label="Нет документов" />;

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li key={`${document.kind}-${document.publicUrl}`}>
          <a
            className="text-sm font-semibold text-cm-teal hover:underline"
            href={document.publicUrl}
          >
            {document.title}
          </a>
          <div className="mt-1 text-xs text-cm-dim">
            {document.kind} · {document.language}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ComparisonTable({
  result,
  manufacturers,
  categories,
}: {
  result: ProductComparison;
  manufacturers: ReadonlyMap<string, Manufacturer>;
  categories: ReadonlyMap<string, Category>;
}) {
  if (result.products.length < 2) {
    return (
      <section className="cm-empty-state text-cm-slate">
        Выберите минимум два изделия для сравнения.
      </section>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cm-rule)] bg-white shadow-[var(--cm-shadow-card)]">
      <table className="min-w-[860px] border-collapse text-left">
        <thead className="bg-cm-surface-low text-xs text-cm-slate">
          <tr>
            <th className="sticky left-0 z-10 min-w-56 bg-cm-surface-low px-4 py-3 font-semibold">
              Параметр
            </th>
            {result.products.map((product) => (
              <th key={product.id} className="min-w-64 px-4 py-3 font-semibold">
                <Link
                  href={`/catalog/${product.slug}`}
                  className="hover:text-cm-teal hover:underline"
                >
                  {product.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--cm-rule)]">
            <th className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold">
              Производитель
            </th>
            {result.products.map((product) => (
              <td key={product.id} className="border-l border-[var(--cm-rule)] px-4 py-4 text-sm">
                {manufacturers.get(product.manufacturerId) ? (
                  <Link
                    href={`/manufacturers/${manufacturers.get(product.manufacturerId)?.slug}`}
                    className="font-semibold text-cm-teal hover:underline"
                  >
                    {manufacturers.get(product.manufacturerId)?.name}
                  </Link>
                ) : null}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--cm-rule)]">
            <th className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold">
              Категория
            </th>
            {result.products.map((product) => (
              <td key={product.id} className="border-l border-[var(--cm-rule)] px-4 py-4 text-sm">
                {categories.get(product.categoryId)?.name ?? ""}
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--cm-rule)]">
            <th className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold">
              Описание
            </th>
            {result.products.map((product) => (
              <td key={product.id} className="border-l border-[var(--cm-rule)] px-4 py-4 text-sm leading-6 text-cm-slate">
                {product.shortDescription}
              </td>
            ))}
          </tr>
          {result.rows.map((row) => (
            <tr
              key={row.key}
              className={`border-t border-[var(--cm-rule)] ${row.hasDifference ? "bg-amber-50/35" : ""}`}
            >
              <th className="sticky left-0 bg-white px-4 py-4 align-top">
                <div className="text-sm font-semibold text-cm-ink">{row.label}</div>
                <div className="mt-1 text-xs text-cm-dim">{row.group}</div>
              </th>
              {row.cells.map(({ specification }, index) => (
                <td
                  key={result.products[index]?.id ?? index}
                  className="border-l border-[var(--cm-rule)] px-4 py-4 align-top text-sm font-semibold text-cm-ink"
                >
                  {formatSpecification(specification)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-[var(--cm-rule)]">
            <th className="sticky left-0 bg-white px-4 py-4 align-top text-sm font-semibold">
              Документы
            </th>
            {result.products.map((product) => (
              <td key={product.id} className="border-l border-[var(--cm-rule)] px-4 py-4 align-top">
                <Documents documents={product.documents} />
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--cm-rule)]">
            <th className="sticky left-0 bg-white px-4 py-4 align-top text-sm font-semibold">
              Совместимость
            </th>
            {result.products.map((product) => (
              <td key={product.id} className="border-l border-[var(--cm-rule)] px-4 py-4 align-top text-sm text-cm-slate">
                {product.compatibility.map(({ label, note }) => (
                  <div key={`${label}-${note}`} className="mb-2 last:mb-0">
                    <span className="font-semibold text-cm-ink">{label}</span>
                    {note ? ` — ${note}` : ""}
                  </div>
                ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
