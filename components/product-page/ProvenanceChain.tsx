import type { PublicProductSource } from "@/types/public-product-page";

export function ProvenanceChain({ source }: { source: PublicProductSource }) {
  const stages = [
    {
      label: "Source",
      value: source.source.name,
      detail: source.source.type,
    },
    {
      label: "Document",
      value: source.document.title,
      detail: source.document.type,
    },
    {
      label: "Version",
      value: source.documentVersion.label,
      detail: "Зафиксированная версия",
    },
    {
      label: "Evidence",
      value: source.evidence.locator,
      detail: "Точный локатор",
    },
    {
      label: "Verification",
      value: source.verification.status,
      detail: source.verification.verifiedAt,
    },
    {
      label: "Publication",
      value: source.publication.status,
      detail: source.publication.publishedAt,
    },
  ];

  return (
    <ol
      aria-label="Цепочка происхождения данных"
      className="grid gap-2 md:grid-cols-3 xl:grid-cols-6"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="group relative min-w-0 rounded-2xl border border-[#163247]/10 bg-white p-4"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E1F2EF] font-mono text-[10px] font-bold text-[#0B7182]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667985]">
              {stage.label}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-[#163247]">
            {stage.value}
          </p>
          <p className="mt-1 truncate text-xs text-[#74838D]">{stage.detail}</p>
          {index < stages.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-[#163247]/10 bg-[#F4F7F8] text-[10px] text-[#0B7182] xl:flex"
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
