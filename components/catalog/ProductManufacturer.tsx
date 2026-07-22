import Link from "next/link";

import ManufacturerMark from "@/components/storefront/ManufacturerMark";
import { formatCountryForPublic } from "@/lib/storefront/country-presentation";
import type { Manufacturer } from "@/lib/storefront/types";

export default function ProductManufacturer({
  manufacturer,
}: {
  manufacturer: Manufacturer | null;
}) {
  if (!manufacturer) {
    return (
      <div className="max-w-[68rem] rounded-xl border border-dashed border-[var(--cm-rule)] bg-white/60 p-5" data-testid="product-manufacturer-placeholder">
        <div className="flex items-center gap-3">
          <ManufacturerMark logoUrl={null} name="Производитель" size="lg" />
          <div>
            <div className="text-sm font-semibold">Информация о производителе уточняется</div>
            <p className="mt-1 text-xs leading-5 text-cm-slate">
              Профиль будет доступен после подтверждения справочных данных.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const country = formatCountryForPublic(manufacturer.country);

  return (
    <div className="max-w-[68rem] rounded-xl border border-[var(--cm-rule)] bg-white p-5" data-testid="product-manufacturer">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <ManufacturerMark logoUrl={manufacturer.logoUrl} name={manufacturer.name} size="lg" />
          <div className="min-w-0">
            <h3 className="text-base font-bold">{manufacturer.name}</h3>
            {country && (
              <div className="mt-1 text-[11px] font-semibold text-cm-teal">
                {country}
              </div>
            )}
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cm-slate">
              {manufacturer.shortDescription || "Описание производителя пока не добавлено."}
            </p>
          </div>
        </div>
        <Link
          href={`/manufacturers/${manufacturer.slug}`}
          className="cm-button-secondary shrink-0 self-start"
        >
          Все товары производителя
        </Link>
      </div>
    </div>
  );
}
