# Legacy Import Pipeline — Architecture Decoupling

**Phase:** Architecture Decoupling / Phase 1 — Pipeline Contracts

**Scope:** offline Import Pipeline only

**Status:** implemented locally; no Cloud, Storefront UI, Admin, Vercel or data operation performed

## Decision

The Legacy Import Pipeline is now split into an independent Core library and
explicit external adapters. Parsing and normalization no longer import Storefront,
Review, Publication, Cloud or Supabase modules.

The historical pilot CLI retains its behavior by composing adapters at the
entrypoint. Core code has no filesystem, repository, generated-output, database or
runtime dependency.

## Layers

| Layer | Location | Responsibility | Prohibited dependencies |
|---|---|---|---|
| Core Domain | `scripts/importers/legacy/core-pipeline.ts` | deterministic orchestration and diagnostics | Storefront, Review, Publication, Cloud, Supabase |
| Import Contracts | `scripts/importers/legacy/contracts.ts` | source, normalized product/reference/specification/media/document, diagnostics, result and neutral review hint | Storefront, Review State/Package, Publication, Cloud |
| Parser | `scripts/importers/legacy/parser.ts` | source checksum and raw extraction | all external adapters |
| Normalization | `normalization.ts`, `resolvers.ts` | pure text/media/specification normalization and exact reference resolution | Storefront, Review, Publication, Cloud |
| Adapters | `scripts/importers/legacy/adapters/` | translate Core result to external concerns | reverse dependencies into Core |

### Adapter ownership

| Adapter | Owns | May depend on |
|---|---|---|
| `reference-file-adapter.ts` | loading versioned local reference JSON | Node filesystem and Import Contracts |
| `storefront-adapter.ts` | Storefront schema, types, existing-product read, candidate and diff | `lib/storefront/**` and Import Contracts |
| `review-adapter.ts` | Review Package, Review State and Publication Candidate | Import Contracts only; it does not import Storefront code |
| `publication-adapter.ts` | writing generated review/publication files under `data/review` | Node filesystem and Review Adapter |
| `cloud-adapter.ts` | explicit future Cloud persistence seam | Import Contracts only in this phase; no implementation or credentials exist |

## Dependency rule

```text
Legacy Source
    ↓
Parser
    ↓
Import Contracts ← Normalization / Resolvers
    ↓
Core Pipeline Result
    ↓
External Adapters
    ↓
Storefront | Review | Publication output | future Cloud
```

The Core Pipeline receives `LegacyImportRequest`, including reference data and a
run timestamp, as input. It returns `PipelineResult`. It never chooses an adapter
and never writes output.

## BEFORE

```text
index CLI
    ↓
pipeline.ts
    ├── lib/storefront/types.ts
    ├── lib/storefront/schemas.ts
    ├── data/storefront/products
    ├── data/reference/*
    ├── ReviewPackage / ReviewState
    ├── PublicationCandidate
    └── generated data/review output

Cloud Catalog Quality migration
    └── imports legacy pipeline helpers directly
```

The former single orchestration module combined parsing, normalization, Storefront
candidate validation, Review package construction, Publication concepts and
generated-output concerns.

## AFTER

```text
contracts.ts
  ↑        ↑        ↑
parser.ts  normalization.ts  resolvers.ts
     \       |       /
      \      |      /
       core-pipeline.ts
              ↓ PipelineResult

reference-file-adapter.ts ───────────────┐
storefront-adapter.ts ───────────────────┤
review-adapter.ts ───────────────────────┤ composition only
publication-adapter.ts ──────────────────┤
cloud-adapter.ts (interface, unimplemented) ┘
              ↓
         legacy CLI entrypoint
```

`index.ts` is a composition root for the historical pilot command, not part of the
Core library. It explicitly selects the Storefront, Review and Publication
adapters. The compatibility `pipeline.ts` module exports the Core runner and the
filesystem reference loader for existing offline callers; Core itself has no
adapter imports.

## Contract inventory

`contracts.ts` owns only portable import concepts:

- `LegacySourceInput`, `SourceSnapshot`, `ExtractedProduct`;
- `NormalizedProduct`, `NormalizedManufacturer`, `NormalizedCategory`,
  `NormalizedReference`, `NormalizedSpecification`, `NormalizedImage` and
  `NormalizedDocument`;
- `ImportReferenceData` and its reference record contracts;
- `ImportDiagnostic`, `PipelineError`, `PipelineWarning` and `PipelineResult`;
- `NormalizedReviewHint`, which is a portable completeness hint and not a Review
  workflow state.

`ReviewPackage`, `ReviewState`, `PublicationCandidate`, Storefront `Product`,
Storefront schema validation, existing-product diff and generated output are no
longer part of Core contracts.

## Compatibility

- Existing Pilot CLI command and its generated outputs retain their previous
  behavior through adapter composition.
- `types.ts` is a type-only compatibility re-export during the split.
- `writer.ts` is a compatibility re-export to the Publication adapter.
- Existing Catalog Quality code can keep importing `loadReferenceData` from
  `pipeline.ts`; that compatibility export is an external filesystem adapter and
  is not imported by `core-pipeline.ts`.

No runtime UI, database schema, Cloud repository, Catalog Admin API, Product Data,
immutable snapshot, Review decision or Publication data was changed.

## Verification

The dedicated architecture test verifies that `contracts.ts`, `parser.ts`,
`normalization.ts`, `resolvers.ts` and `core-pipeline.ts` have no direct imports of:

- `lib/storefront`;
- Storefront, Review, Publication or Cloud adapters;
- `data/review`;
- Supabase or Cloud API paths.

It also verifies that the Storefront adapter is the only adapter importing
`lib/storefront`, the Review adapter has no Storefront dependency, and the
Publication adapter depends on the Review adapter only for its serializable output.

## Remaining intentionally external links

1. The legacy CLI composes all three historical adapters. This is intentional and
   outside Core.
2. The compatibility `pipeline.ts` re-exports `loadReferenceData` for the existing
   offline Catalog Quality caller. The Core runner does not use it.
3. A Cloud adapter implementation is deliberately absent. Adding Supabase access or
   Cloud writes would be a separate explicit phase.
