import Image from "next/image";
import Link from "next/link";

interface ManufacturerEntry {
  id: string;
  slug: string;
  name: string;
  country: string;
  shortDescription: string;
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

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {manufacturers.map((manufacturer) => (
            <Link
              key={manufacturer.id}
              href={`/manufacturers/${manufacturer.slug}`}
              className="group cm-card flex min-h-40 flex-col p-4"
            >
              <div className="flex items-center gap-3">
                <ManufacturerLogo manufacturer={manufacturer} />
                <div>
                  <h3 className="text-[15px] font-bold">{manufacturer.name}</h3>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-cm-dim">
                    {manufacturer.country}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-cm-slate">
                {manufacturer.shortDescription}
              </p>
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

function ManufacturerLogo({ manufacturer }: { manufacturer: ManufacturerEntry }) {
  if (!manufacturer.logoUrl) {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-[var(--cm-rule)] bg-cm-teal-soft font-mono text-sm font-bold text-cm-teal">
        {manufacturer.name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-[var(--cm-rule)] bg-white">
      <Image
        src={manufacturer.logoUrl}
        alt={`${manufacturer.name} — логотип`}
        fill
        sizes="44px"
        className="object-contain"
      />
    </span>
  );
}
