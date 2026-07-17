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
  return (
    <section className="border-y border-[var(--cm-rule)] bg-white py-16">
      <div className="cm-container">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="cm-label">Классификация</div>
            <h2 className="mt-2 text-[1.35rem] font-extrabold tracking-[-0.018em]">Категории изделий</h2>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark">Весь каталог →</Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Link
              href={`/catalog?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
              className="cm-card group p-5"
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-cm-teal/15 bg-cm-teal-soft font-mono text-[10px] font-bold text-cm-teal">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 text-[13px] font-bold leading-5 tracking-[-0.01em]">{category.name}</h3>
              <p className="mt-2 max-w-[16rem] text-[11px] leading-5 text-cm-slate">{category.shortDescription}</p>
              <div className="mt-4 font-mono text-[9px] text-cm-dim">
                {category.productCount} товаров
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
