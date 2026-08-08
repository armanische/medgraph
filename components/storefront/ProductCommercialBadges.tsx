import type { ProductCommercialPresentation } from "@/lib/storefront/types";

export default function ProductCommercialBadges({
  presentation,
  compact = false,
}: {
  presentation?: ProductCommercialPresentation;
  compact?: boolean;
}) {
  if (!presentation) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label="Коммерческие условия"
      data-testid="endomarket-commercial-badges"
    >
      <span
        className={`inline-flex min-h-7 items-center rounded-full border border-emerald-600/20 bg-emerald-50 font-bold text-emerald-800 ${compact ? "px-2 text-[9px]" : "px-3 text-xs"}`}
      >
        {presentation.availabilityLabel}
      </span>
      {presentation.installmentEnabled ? (
        <span
          className={`inline-flex min-h-7 items-center rounded-full border border-cm-teal/20 bg-cm-teal-soft font-bold text-cm-teal ${compact ? "px-2 text-[9px]" : "px-3 text-xs"}`}
          title={presentation.installmentDescription}
        >
          {presentation.installmentLabel}
          {!compact ? ` · до ${presentation.installmentTermMonths} мес.` : ""}
        </span>
      ) : null}
    </div>
  );
}
