import type { ProductSpecification } from "@/lib/storefront/types";

export default function ProductSpecifications({
  specifications,
}: {
  specifications: readonly ProductSpecification[];
}) {
  const groups = groupSpecifications(specifications);

  return (
    <div className="grid max-w-[68rem] gap-4 lg:grid-cols-2" data-testid="product-specifications">
      {groups.map(([group, items]) => (
        <section
          key={group}
          className="overflow-hidden rounded-xl border border-[var(--cm-rule)] bg-white"
          aria-labelledby={`specification-group-${slugify(group)}`}
        >
          <h3
            id={`specification-group-${slugify(group)}`}
            className="border-b border-[var(--cm-rule)] bg-cm-surface-low/65 px-4 py-2.5 text-xs font-bold"
          >
            {group}
          </h3>
          <dl>
            {items.map((specification) => (
              <div
                key={`${specification.label}:${specification.position}`}
                className="grid gap-1 border-b border-[var(--cm-rule)] px-4 py-2.5 last:border-b-0 sm:grid-cols-[minmax(9rem,0.9fr)_1.1fr] sm:items-baseline"
              >
                <dt className="text-xs leading-5 text-cm-slate">{specification.label}</dt>
                <dd className="text-sm font-semibold leading-5 sm:text-right">
                  {specification.value}
                  {specification.unit ? ` ${specification.unit}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function groupSpecifications(specifications: readonly ProductSpecification[]) {
  const groups = new Map<string, ProductSpecification[]>();
  for (const specification of specifications) {
    const group = groups.get(specification.group) ?? [];
    group.push(specification);
    groups.set(specification.group, group);
  }
  return [...groups.entries()];
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9]+/giu, "-")
    .replace(/^-|-$/gu, "");
}
