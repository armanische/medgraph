import Link from "next/link";
import ManufacturerMark from "@/components/storefront/ManufacturerMark";

interface ManufacturerEntry {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  logoUrl: string | null;
  productCount: number;
}

export default function FeaturedManufacturers({
  manufacturers,
}: {
  manufacturers: readonly ManufacturerEntry[];
}) {
  return (
    <section
      aria-labelledby="featured-manufacturers-title"
      className="cm-section border-y border-[var(--cm-rule)] bg-white"
    >
      <div className="cm-container">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="cm-label">Бренды каталога</div>
            <h2
              id="featured-manufacturers-title"
              className="cm-section-title"
            >
              Производители
            </h2>
          </div>
          <Link
            href="/manufacturers"
            className="text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark"
          >
            Все производители →
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {manufacturers.map((manufacturer) => (
            <Link
              key={manufacturer.id}
              href={`/manufacturers/${manufacturer.slug}`}
              className="group cm-card flex min-h-32 flex-col p-4"
            >
              <div className="flex items-center gap-3">
                <ManufacturerMark logoUrl={manufacturer.logoUrl} name={manufacturer.name} />
                <div>
                  <h3 className="text-[15px] font-bold">{manufacturer.name}</h3>
                  {manufacturer.country && (
                    <div className="mt-1 text-[10px] text-cm-slate">{manufacturer.country}</div>
                  )}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--cm-rule)] pt-3 text-xs">
                <span className="font-mono text-[9px] text-cm-dim">
                  {manufacturer.productCount} товаров
                </span>
                <span className="font-semibold text-cm-dim transition group-hover:text-cm-teal">
                  Открыть →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
