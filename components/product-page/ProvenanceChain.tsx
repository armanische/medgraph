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
      className="flex min-w-[700px] items-start pb-2"
    >
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="group relative flex min-w-0 flex-1 flex-col items-center px-2 text-center"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[8px] tracking-[0.08em] text-cm-dim">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={`flex size-11 items-center justify-center rounded-lg border font-mono text-[10px] font-bold ${
              index === 4
                ? "border-[var(--cm-verified-border)] bg-cm-verified-soft text-cm-verified"
                : index === 5
                  ? "border-cm-teal/25 bg-cm-teal-soft text-cm-teal"
                  : "border-[var(--cm-rule)] bg-cm-surface-low text-cm-slate"
            }`}>
              {stage.label.slice(0, 3).toUpperCase()}
            </span>
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-cm-dim">
              {stage.label}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 max-w-24 text-[10px] font-semibold leading-4 text-cm-ink">
            {stage.value}
          </p>
          <p className="mt-1 max-w-24 truncate font-mono text-[8px] text-cm-dim">{stage.detail}</p>
          {index < stages.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute -right-2 top-9 z-10 flex text-[10px] text-cm-dim"
            >
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
