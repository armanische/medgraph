import Link from "next/link";
import { products } from "@/data/products";

export default function FeaturedProducts() {
  return (
    <section className="cm-container py-14">
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <div className="cm-label">Опубликованные записи</div>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">
            Изделия в базе знаний
          </h2>
        </div>
        <Link href="/catalog" className="text-xs font-semibold text-cm-teal hover:text-cm-teal-dark">
          В каталог →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/knowledge/${product.slug}`}
            className="group cm-card flex min-h-56 flex-col p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                {product.category}
              </span>
              <span className="rounded-md border border-[var(--cm-verified-border)] bg-cm-verified-soft px-2 py-1 font-mono text-[9px] font-semibold text-cm-verified">
                Проверено
              </span>
            </div>
            <h3 className="mt-5 text-[15px] font-bold leading-6">{product.name}</h3>
            <p className="mt-3 line-clamp-3 text-xs leading-6 text-cm-slate">
              {product.description}
            </p>
            <div className="mt-auto border-t border-[var(--cm-rule)] pt-4 text-xs font-semibold text-cm-dim transition group-hover:text-cm-teal">
              Открыть запись →
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
