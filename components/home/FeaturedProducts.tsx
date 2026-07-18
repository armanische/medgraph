import Link from "next/link";

interface FeaturedProductEntry {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
}

export default function FeaturedProducts({
  products,
}: {
  products: readonly FeaturedProductEntry[];
}) {
  return (
    <section
      aria-labelledby="popular-products-title"
      className="cm-container cm-section"
    >
      <div className="mb-5 flex items-end justify-between gap-5">
        <div>
          <div className="cm-label">Избранное из каталога</div>
          <h2
            id="popular-products-title"
            className="cm-section-title"
          >
            Популярные товары
          </h2>
        </div>
        <Link href="/catalog" className="text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark">
          В каталог →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/catalog/${product.slug}`}
            className="group cm-card flex min-h-44 flex-col p-4"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                {product.category}
              </span>
            </div>
            <h3 className="mt-3 text-[15px] font-bold leading-6 tracking-[-0.01em]">{product.name}</h3>
            <p className="mt-2 line-clamp-3 max-w-[28rem] text-xs leading-5 text-cm-slate">
              {product.description}
            </p>
            <div className="mt-auto border-t border-[var(--cm-rule)] pt-3 text-xs font-semibold text-cm-dim transition group-hover:text-cm-teal">
              Открыть карточку →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
