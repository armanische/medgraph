# Catalog Importers

The MVP-007 V1 Research Runtime was retired by RFC-013. The removed commands
`research:catalog-products` and `research:product` must not be used or restored.

Active catalog workflows are explicit, bounded stages:

```bash
npm run import:catalog-seed -- "Каталог Кибермедика.pdf"
npm run discover:catalog-sources
npm run download:discovered-documents
npm run extract:discovered-documents
npm run build:review-queue
npm run wave2:execute -- <Manufacturer>
```

Human Review is the sole canonical decision workflow. The generated Review
Queue is an upstream handoff and read-only presentation input; reviewer
decisions are written only through `/internal/reviewer` into the append-only
decision store. The retired `process:review-decisions` manual-JSON command must
not be restored.

The public storefront reads only `data/storefront` through `lib/storefront`.
Operational Discovery, Documents, Extraction, Review, Integrity, Artifact, and
Wave 2 outputs remain under their existing `data/research` subdirectories until
their dedicated storage-boundary migrations. They are not part of the removed
V1 runtime and must not be deleted as a side effect of this retirement.

Manual official URL seeds remain at:

```text
data/research/source-seeds.manual.json
```

Discovery inputs are candidates only. Verification, publication, reviewer
decisions, and public Storefront records remain separate workflows.

The legacy `publication:build`, `publication:audit`, and
`publication:candidates` commands were retired by RFC-017. Retained Publication
implementation files must not be executed directly; they remain temporarily as
Review/Wave 2 migration dependencies.
