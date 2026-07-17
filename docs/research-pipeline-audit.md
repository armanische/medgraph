# RFC-012 — Legacy Research Pipeline Audit

Date: 2026-07-17  
Branch: `feature/publication-first-products`  
Method: static import, filesystem-reference, command, route, and test audit

## 1. Executive Summary

The public Storefront routes and Storefront service graph do not import the
legacy Research Pipeline or read `data/research`. The homepage, catalog,
product details, manufacturers, comparison, search, sitemap, shared footer, and
their Storefront services are isolated from Research.

The repository-wide isolation is **not complete**. Production-built internal
routes still read generated files below `data/research`, and the reviewer server
action reaches the same tree transitively through the review loader. These
routes are env-gated, but they are still part of the Next.js production bundle;
they cannot be classified as development-only.

The old V1 catalog-research executable (`research.ts` and its dedicated
orchestration modules) has no production importer. It is reachable only from
two npm CLI commands and `catalog.test.ts`. That bounded V1 cohort can be
removed by a subsequent RFC, together with its commands, tests, and V1-only
generated reports. The wider `data/research` tree cannot yet be removed because
Review, Publication, Wave 2, artifact integrity, and internal dashboards still
depend on it.

No file, import, command, report, or behavior was removed or changed by this
audit.

## 2. Production Imports

### Group A — production runtime dependencies

| Production route or action | Loader/service chain | Research dependency | Purpose | Migration target |
| --- | --- | --- | --- | --- |
| `/internal/import-center` | `app/internal/import-center/page.tsx` → `lib/internal-import-center.ts` | `data/research/wave2/**` | Reads aggregate and per-manufacturer Wave 2 reports | Introduce a `Wave2ReportRepository` rooted outside `data/research`, or retire the internal route with Wave 2 |
| `/internal/wave2` | `app/internal/wave2/page.tsx` → `lib/wave2-dashboard.ts` | `data/research/wave2/**` | Builds the read-only Wave 2 dashboard | Use the same dedicated Wave 2 report repository; Storefront is not appropriate for operational metrics |
| `/internal/review-queue` | `app/internal/review-queue/page.tsx` → `lib/internal-review-queue.ts` | `data/research/review/**` | Reads generated review queue, product reports, and legacy decision report | Move to a dedicated Review repository/store outside the Research namespace |
| `/internal/reviewer` | `app/internal/reviewer/page.tsx` → `lib/review/human-workspace.ts` → `review/loader.ts` | `data/research/review/products`, `data/research/integrity`, and `data/research/extraction/products` | Builds reviewer items, evidence locators, artifact validity, and publication eligibility | Create a Review Workspace repository backed by the append-only review store plus an explicit evidence snapshot; do not move internal review fields into Storefront |
| Reviewer server action | `app/internal/reviewer/actions.ts` → `review-summary.ts` → `review/loader.ts` | `data/research/review/products` and `data/research/integrity` | Rebuilds review summary after an explicit decision | Make the review summary service consume the dedicated Review repository/snapshot |

All five entry points are internal and gated, but all are production code. The
correct target is a Wave 2 or Review boundary, not Storefront: Storefront must
remain public-safe and must not acquire review, evidence, integrity, or pipeline
state.

### Production paths with no Research dependency

No `data/research`, Research Pipeline, research loader, or research helper is
reachable from these Storefront paths:

- `/`
- `/catalog`
- `/catalog/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/compare`
- `/search`
- `/sitemap.xml`
- `lib/storefront/**`

The old V1 modules below are also absent from every `app/**`, `components/**`,
and `lib/**` production import chain:

- `scripts/importers/catalog/research.ts`
- `scripts/importers/catalog/research-product.ts`
- `scripts/importers/catalog/research-manifest.ts`
- `scripts/importers/catalog/claims.ts`
- `scripts/importers/catalog/knowledge-engine.ts`

## 3. Test Imports

### Group B — tests

| Test | Research usage |
| --- | --- |
| `tests/importers/catalog.test.ts` | Directly imports V1 `research.ts`, `research-manifest.ts`, `claims.ts`, and `knowledge-engine.ts`; exercises V1 reports and safety rules |
| `tests/importers/artifact-storage.test.ts` | Uses temporary `data/research` roots and content-addressed artifact paths |
| `tests/importers/evidence-integrity.test.ts` | Uses extraction, review, integrity, artifact, and Wave 2 paths as fixtures and audit assertions |
| `tests/importers/import-center.test.ts` | Creates temporary Wave 2 reports under `data/research/wave2` |
| `tests/importers/wave2-dashboard.test.ts` | Creates temporary aggregate and manufacturer Wave 2 summaries |
| `tests/importers/publication.test.ts` | Confirms that a private `data/research` path is rejected from public output |

Only `catalog.test.ts` is a direct consumer of the removable V1 Research
implementation. The other tests protect still-required Wave 2, Review,
Evidence, Publication, or Artifact behavior and must not be removed as part of
a V1 cleanup.

### Group B — development and operational CLI

Direct `data/research` readers/writers that are not imported by the public
Storefront runtime:

- V1 commands: `research:catalog-products`, `research:product`.
- Discovery and source seeds: `discovery.ts`, `providers.ts`.
- Trusted documents and extraction: `trusted-documents.ts`.
- Review queue and review loader: `review-queue.ts`, `review/**`.
- Evidence integrity: `evidence-integrity.ts`.
- Publication input loader: `publication/publisher.ts`.
- Wave 2 execution: `wave2-execution.ts`.
- Artifact audit and manifest: `artifact-storage/**`.

These commands are not public UI imports, but most are active operational
systems. “Not imported by Next.js” is not sufficient evidence that they are
safe to delete.

### Group B — archived and architecture documentation

Twenty-four Markdown files mention `data/research` or the Research Pipeline.
They include the V1 architecture, generated-data policy, Wave 2 execution
reports, Review/Publication architecture, artifact and evidence audits, and the
Storefront migration audit. They are non-executable references. Historical
reports should be archived or annotated rather than silently rewritten during
code deletion.

The primary V1 documents are:

- `docs/architecture/Catalog_Research_Pipeline.md`
- `docs/architecture/Generated_Data_Policy.md`
- `scripts/importers/catalog/README.md`

## 4. Candidate Files for Removal

### Candidate cohort: V1 Catalog Research

The following cohort has no production importer and can be handled by the next
deletion RFC as one bounded change:

- `scripts/importers/catalog/research.ts`
- `scripts/importers/catalog/research-product.ts`
- `scripts/importers/catalog/research-manifest.ts`
- `scripts/importers/catalog/claims.ts`
- `scripts/importers/catalog/knowledge-engine.ts`
- `data/research/products/*.research.json` (49 V1 product reports)
- `data/catalog-research-report.generated.json`
- npm scripts `research:catalog-products` and `research:product`
- only the V1-specific sections of `tests/importers/catalog.test.ts`
- V1 instructions in `scripts/importers/catalog/README.md` and the two primary
  architecture documents listed above

This list is a deletion unit, not authorization to delete individual shared
dependencies. Before deletion, the next RFC must re-run inbound-reference scans
and prove that `claims.ts` and `knowledge-engine.ts` have not gained new callers.

### Explicitly not ready for removal

- `data/research/discovery/**`
- `data/research/documents/**`
- `data/research/extraction/**`
- `data/research/review/**`
- `data/research/integrity/**`
- `data/research/wave2/**`
- `data/research/artifacts/**`
- `data/research/source-seeds.manual.json`
- Discovery, Resolver, Trusted Downloader, Extraction Profiles, Review,
  Publication, Evidence Integrity, Wave 2, and Artifact Storage modules
- Shared catalog modules such as `providers.ts`, `documents.ts`, `extractor.ts`,
  `seed.ts`, and `types.ts`
- `data/catalog-products.generated.json`, which is still consumed by
  `lib/catalog-drafts.ts`
- `data/catalog-import-report.generated.json`, which is also produced by the
  catalog seed workflow

## 5. Risks

1. **Internal production outage.** Removing `data/research/review`, `integrity`,
   `extraction`, or `wave2` now would break gated routes at runtime.
2. **Reviewer write failure.** The reviewer server action rebuilds its summary
   through `loadReviewContext`; deleting the source reports would make an
   explicit human decision fail after submission.
3. **Publication input loss.** Publication still consumes Review and Integrity
   reports. Storefront migration does not replace that operational input.
4. **Evidence and audit loss.** Artifacts and integrity reports are immutable
   audit assets, not disposable UI cache.
5. **Shared-module over-deletion.** Providers, document download, extraction,
   seed, and catalog types are shared with newer pipelines even though V1
   `research.ts` imports them.
6. **Historical ambiguity.** The term “research” is used for both the obsolete
   V1 orchestrator and the current `data/research` namespace. Deleting by name
   or directory wildcard would cross system boundaries.
7. **Generated-file coupling.** `data/catalog-products.generated.json` remains
   a legacy catalog-drafts input and must not be grouped with the V1 research
   aggregate merely because both were emitted by `research.ts`.

## 6. Recommendation

The public Storefront is already isolated from Research. The next safe step is
to remove only the V1 Catalog Research cohort listed above. Do not delete the
whole `data/research` directory.

After the V1 cleanup, isolate the remaining production readers in two separate
migrations:

1. **Wave 2 reports:** introduce `Wave2ReportRepository` and relocate or retain
   its immutable reports under an explicit Wave 2 storage boundary.
2. **Review/Evidence:** introduce a Review Workspace repository that owns review
   reports, evidence snapshots, integrity state, and append-only decisions.

Only after both migrations should a final audit consider removing or renaming
the remaining `data/research` namespace. Storefront must remain independent and
must never become the storage location for internal review or evidence data.
