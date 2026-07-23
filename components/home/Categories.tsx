import Link from "next/link";

interface CategoryEntry {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  productCount: number;
}

export default function Categories({
  categories,
}: {
  categories: readonly CategoryEntry[];
}) {
  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-categories-title"
      className="cm-section bg-cm-canvas"
    >
      <div className="cm-container">
        <div className="flex items-end justify-between gap-5">
          <h2
            id="featured-categories-title"
            className="cm-section-title"
          >
            Категории оборудования
          </h2>
          <Link
            href="/catalog"
            className="hidden text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark sm:inline-flex"
          >
            Все категории →
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              href={`/catalog?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
              className="cm-card group flex min-h-[7.75rem] flex-col p-4 sm:min-h-36 sm:p-5"
            >
              <h3 className="text-[15px] font-bold leading-5 tracking-[-0.01em]">
                {category.name}
              </h3>
              {category.shortDescription && (
                <p className="mt-2 line-clamp-2 max-w-[30rem] text-xs leading-5 text-cm-slate">
                  {category.shortDescription}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--cm-rule)] pt-3">
                <span className="font-mono text-[10px] text-cm-dim">
                  {category.productCount} товаров
                </span>
                <span className="text-xs font-semibold text-cm-teal">
                  Открыть →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/catalog"
          className="cm-button-secondary mt-4 w-full sm:hidden"
        >
          Все категории
        </Link>
      </div>
    </section>
  );
}
