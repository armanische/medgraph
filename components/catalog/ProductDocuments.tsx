import type { ProductDocument, ProductDocumentKind } from "@/lib/storefront/types";

const DOCUMENT_KIND_LABELS: Partial<Record<ProductDocumentKind, string>> = {
  brochure: "Brochure",
  datasheet: "Datasheet",
  ifu: "Руководство",
  operator_manual: "Руководство",
  quick_guide: "Руководство",
  technical_specification: "Datasheet",
};

export default function ProductDocuments({
  documents,
}: {
  documents: readonly ProductDocument[];
}) {
  return (
    <div className="grid max-w-[68rem] gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-documents">
      {documents.map((document) => (
        <a
          key={`${document.kind}:${document.publicUrl}`}
          href={document.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex min-h-28 flex-col justify-between rounded-xl border border-[var(--cm-rule)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-cm-teal hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cm-surface-low text-cm-teal" aria-hidden="true">
              ↓
            </span>
            <span className="rounded-md border border-[var(--cm-rule)] bg-white px-2 py-1 font-mono text-[9px] font-semibold text-cm-slate">
              {documentKindLabel(document.kind)}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold leading-5 group-hover:text-cm-teal">
              {document.title}
            </div>
            <div className="mt-1.5 text-[10px] text-cm-dim">
              {document.language}{document.isOfficial ? " · официальный" : ""}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function documentKindLabel(kind: ProductDocumentKind) {
  if (kind === "other") return "Каталог";
  return DOCUMENT_KIND_LABELS[kind] ?? kind.replaceAll("_", " ");
}
