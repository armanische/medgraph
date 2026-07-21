import Link from "next/link";
import Image from "next/image";

interface CategoryEntry {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  productCount: number;
  image: { url: string; alt: string } | null;
}

export default function Categories({
  categories,
}: {
  categories: readonly CategoryEntry[];
}) {
  return (
    <section
      aria-labelledby="featured-categories-title"
      className="cm-section bg-cm-canvas"
    >
      <div className="cm-container">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="cm-label">Классификация</div>
            <h2
              id="featured-categories-title"
              className="cm-section-title"
            >
              Категории оборудования
            </h2>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark">Смотреть все категории →</Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={`/catalog?category=${encodeURIComponent(category.slug)}`}
              key={category.id}
              className="cm-card group flex min-h-52 flex-col overflow-hidden p-0"
            >
              {category.image ? (
                <div className="relative h-20 border-b border-[var(--cm-rule)] bg-white">
                  <Image
                    src={category.image.url}
                    alt={category.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                <div className="h-2 border-b border-[var(--cm-rule)] bg-gradient-to-r from-cm-teal/65 via-cm-teal/15 to-transparent" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-[14px] font-bold leading-5 tracking-[-0.01em]">{category.name}</h3>
                <p className="mt-2 line-clamp-2 max-w-[18rem] text-[11px] leading-5 text-cm-slate">{category.shortDescription}</p>
                <div className="mt-auto flex items-center justify-between border-t border-[var(--cm-rule)] pt-3">
                  <span className="font-mono text-[9px] text-cm-dim">
                    {category.productCount} товаров
                  </span>
                  <span className="text-xs font-semibold text-cm-teal">Открыть →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
