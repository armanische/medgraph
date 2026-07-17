# RFC-014 — Legacy Publication Pipeline Audit

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: dependency audit only; no runtime, data, pipeline, or UI changes

## 1. Executive Summary

The Storefront migration has removed the legacy file-based Publication Pipeline
from every primary public Storefront route: `/`, `/catalog`,
`/catalog/[slug]`, `/manufacturers`, `/manufacturers/[slug]`, `/compare`,
`/search`, and the sitemap use `lib/storefront`. They do not import
`lib/published-catalog`, `data/public`, or
`scripts/importers/catalog/publication`.

No active Next.js route imports the file-based Publication Pipeline. Two
publication-adjacent dependencies remain and must not be conflated:

1. The internal Human Review workflow uses publication eligibility policy,
   shared types, and `data/public/summary.generated.json` to show whether a
   reviewed product is already published.
2. `/products/fs510` is a production Wave 2 route backed by a Supabase public
   product projection. It does not use the file-based Publication Pipeline, but
   it still exposes the older publication/verification page model.

The CLI pipeline remains operational through `publication:build`,
`publication:audit`, and `publication:candidates`. Therefore the whole
`scripts/importers/catalog/publication/` directory is **not safe to delete as a
single unit**. The dormant `lib/published-catalog.ts` and legacy
`lib/search/index.ts` pair has no route-level consumer and is the only
immediately removable runtime pair, together with its dedicated test cleanup.

This audit inspected the working tree. Existing staged changes under
`data/public` and `data/review-decisions` were treated as user-owned state and
were not changed.

## 2. Production Imports

### Active route dependencies

| File / dependency | Route or service | Purpose | Migration path | Ownership |
| --- | --- | --- | --- | --- |
| `app/products/fs510/page.tsx` → `lib/public-product-page.ts` | `/products/fs510` | Loads and renders the legacy public product projection, including publication dates, verification state, provenance, and publication history. | Move the canonical FS510 experience to `ProductService.getProductBySlug("fs510")`; retain a redirect or Storefront-backed compatibility page only if the old URL must survive. | Wave 2 legacy route, not Storefront and not the file-based Publication Pipeline. |
| `lib/public-product-page.ts` → `lib/supabase/server.ts` | FS510 server loader | Reads `page_payload` from the Supabase public projection and validates the old public-product page shape. | Remove only after `/products/fs510` no longer depends on the projection and its URL/SEO migration is decided. | Wave 2 / Supabase projection. |
| `components/product-page/ProvenanceChain.tsx` and `types/public-product-page.ts` | `/products/fs510` | Types and renders evidence/publication provenance from the legacy projection. | Replace with public-safe Storefront fields or remove with the FS510 route migration. | Wave 2 legacy UI. |

The active production dependency above contains publication concepts, but it
does **not** import:

- `lib/published-catalog.ts`;
- `data/public/**`;
- `scripts/importers/catalog/publication/**`.

### Dormant application modules

| File / dependency | Route or service | Purpose | Migration path | Ownership |
| --- | --- | --- | --- | --- |
| `lib/published-catalog.ts` → `data/public/summary.generated.json` | No active route | Legacy adapter combining published records with catalog drafts and exposing publication status, coverage, source counts, and fallback cards. | Delete with `lib/search/index.ts` and adjust legacy-only tests. Storefront equivalents already serve public routes. | Legacy Publication. |
| `lib/search/index.ts` → `lib/published-catalog.ts` | No active route; imported only by `tests/importers/search.test.ts` | Builds the retired mixed publication/draft/mock search index. | Delete with its test after confirming no external consumer outside this repository. Public search already uses `SearchService`. | Legacy search / Publication adapter. |

These files live in production source directories but are not reachable from an
active application route, component, loader, or service entry point.

### Storefront coverage

| Public surface | Current source |
| --- | --- |
| `/` | Storefront services |
| `/catalog`, `/catalog/[slug]` | `ProductService`, `CategoryService`, `ManufacturerService` |
| `/manufacturers`, `/manufacturers/[slug]` | `ManufacturerService`, `ProductService` |
| `/compare` | `CompareService` over `ProductService` |
| `/search` and search widgets | `SearchService` |
| `app/sitemap.ts` | Storefront sitemap/services |

## 3. Internal Imports

### Human Review route

| Internal dependency | Consumer | Purpose | Removal condition |
| --- | --- | --- | --- |
| `lib/review/human-workspace.ts` → `scripts/importers/catalog/review/publication-policy.ts` | `/internal/reviewer` | Computes product publication readiness and coverage for the reviewer workspace. | Replace publication readiness with a review-owned status model, or remove that status from the internal workspace. |
| `lib/review/human-workspace.ts` → `data/public/summary.generated.json` | `/internal/reviewer` | Marks products already present in the published catalog. | Introduce a Storefront-owned lookup if this signal is still needed, or remove the signal. |
| `app/internal/reviewer/actions.ts` → review service/summary | `/internal/reviewer` server action | Persists explicit human decisions and rebuilds review summary. | Keep Human Review; only decouple its types and status labels from Publication. |
| `review-service.ts`, `review-summary.ts`, `publication-policy.ts` | Human Review service and `review:summary` / `review:audit` CLI | Evaluates decision-level and product-level publication eligibility. | Rename/reframe as review readiness if still required, then move shared types into the review module. |
| `review/loader.ts`, `review/snapshot.ts`, `review/fixtures.ts` → `publication/types.ts` | Human Review loaders and tests | Reuses review product, item, artifact, and integrity shapes declared by Publication. | Move these shared input types to `review/types.ts` or a neutral importer contract before deleting Publication types. |

The Human Review append-only decision history is not a removal candidate. Its
dependency on Publication is a type/status coupling that should be migrated,
not deleted.

### Operational Publication CLI

The following npm scripts are still declared and callable:

- `publication:build` → `publication/index.ts` → `publisher.ts`;
- `publication:audit` → `publication/index.ts` → `publisher.ts`;
- `publication:candidates` → `publication/index.ts` →
  `publication-candidates.ts`.

The internal module graph is:

```text
index.ts
├── publisher.ts
│   ├── publication-builder.ts
│   │   ├── publication-summary.ts
│   │   └── review/publication-policy.ts
│   └── publication-validator.ts
├── publication-candidates.ts
│   ├── publication-builder.ts
│   └── publication-summary.ts
└── types.ts (shared by Publication and Human Review)
```

`publisher.ts` writes only the Publication output tree under `data/public`;
this audit did not execute it. The CLI is internal/operational and is not part
of the Next.js production route graph, but its declared npm entry points mean
it cannot be called unused or safely deleted without an explicit retirement
decision.

## 4. Test-only Imports

### Direct runtime imports in tests

| Test | Dependency | Role |
| --- | --- | --- |
| `tests/importers/publication.test.ts` | Publication `index.ts` and `lib/published-catalog.ts` | Builder, validation, audit, determinism, public schema, fallback, and source-safety coverage. |
| `tests/importers/human-review.test.ts` | Publication `index.ts` | Verifies fail-closed publication behavior after explicit human decisions. |
| `tests/importers/search.test.ts` | `lib/search/index.ts` | Covers the retired mixed publication/mock search implementation. |

### Guard-only references

The Storefront migration tests contain string assertions that public source
files do not import `lib/published-catalog` or Publication internals. These are
not runtime dependencies and should remain useful until the legacy modules are
deleted. They include:

- `homepage-storefront.test.ts`;
- `catalog-storefront.test.ts`;
- `product-detail-storefront.test.ts`;
- `manufacturers-storefront.test.ts`;
- `global-search-storefront.test.ts`;
- `compare-storefront.test.ts`;
- `storefront-infrastructure.test.ts`.

Other tests mentioning words such as `publicationCreated`, `published`, or
“does not publish” are safety assertions for Wave 2, evidence, tender, import
center, or catalog boundaries. They do not import the Publication Pipeline and
must not be removed as Publication tests.

### Fixtures and archived documentation

No standalone Publication fixture directory was found; Publication tests build
their fixtures in TypeScript or reuse the Human Review fixture helpers.

The following documents are historical or operational references rather than
runtime dependencies:

- `docs/architecture/Publication_Pipeline.md`;
- `docs/research/Publication_Pipeline_Report.md`;
- `docs/research/First_Published_Products_Report.md`;
- `docs/operations/Reviewer_Operating_Procedure.md`;
- publication notes embedded in Wave 2 execution/release reports;
- `docs/storefront-migration-audit.md`.

Architecture and research reports should be archived or clearly marked as
retired when the pipeline is removed; they are not blockers by themselves.

## 5. Candidate Files

### Safe now

Safe from an active production and internal runtime perspective, but deletion
should include the named legacy-only test adjustment in a dedicated RFC:

| Candidate | Evidence / companion work |
| --- | --- |
| `lib/published-catalog.ts` | No active route or internal service imports it. Delete its fallback assertions from `publication.test.ts`. |
| `lib/search/index.ts` | Imported only by `tests/importers/search.test.ts`; public search uses Storefront `SearchService`. |
| `tests/importers/search.test.ts` | Tests only the legacy search module above. |

Historical Publication reports may be moved to an archive, but keeping them is
preferred until the runtime retirement is complete.

### Requires migration

| Candidate | Required migration |
| --- | --- |
| `publication-builder.ts` | Retire the file-based build command and confirm Storefront data is maintained independently. |
| `publication-summary.ts` | Remove after builder/candidates no longer generate `data/public` indexes. |
| `publication-validator.ts` | Replace any still-required Storefront validation with Storefront schema validation before removal. |
| `publisher.ts` and `index.ts` | Remove the three npm scripts and operational documentation after the CLI is formally retired. |
| `publication-candidates.ts` | Move any still-needed approved-product selection into Human Review without writing Publication output. |
| `data/public/**` | Remove only after Human Review stops reading the summary and after confirming Storefront contains every product that must remain public. |
| `tests/importers/publication.test.ts` | Remove or replace when the file-based pipeline is retired; preserve relevant public-schema and fail-closed guarantees in Storefront/Review tests. |
| Publication-specific portions of `human-review.test.ts` | Rewrite against review-owned readiness contracts after type/policy decoupling. |

### Blocked

| Candidate | Blocker |
| --- | --- |
| `publication/types.ts` | Imported by Human Review loader, snapshot, fixtures, and publication policy. Shared contracts must move to Review or a neutral importer module first. |
| `review/publication-policy.ts` | Used by the internal Reviewer Workspace, review decision service, review summary, fixtures, and Publication builder. Human Review behavior must be preserved. |
| `lib/review/human-workspace.ts`, review service, decision store, state machine, and review summary | Internal Human Review is explicitly retained and includes append-only decisions. These are not legacy Publication deletion candidates. |
| `app/products/fs510/page.tsx`, `lib/public-product-page.ts`, `types/public-product-page.ts`, `components/product-page/ProvenanceChain.tsx` | Active production Wave 2 route and Supabase projection. Requires a separately approved URL/data migration to Storefront. |
| `lib/supabase/server.ts` publication projection support | Shared server adapter for the active FS510 route; assess only after that route migrates. |

## 6. Risks

1. **Human Review regression.** Deleting `publication/types.ts` or
   `review/publication-policy.ts` would break reviewer loading, snapshots,
   explicit decisions, summary generation, and audit behavior.
2. **False “unused” conclusion.** Publication CLI files are not imported by
   Next.js routes, but are still executable through package scripts.
3. **Data loss or catalog regression.** The working tree contains a published
   Ambu record in both `data/public` and Storefront. A product-by-product
   reconciliation is required before removing the whole file-based catalog.
4. **FS510 route regression.** The active `/products/fs510` page is independent
   of `data/public`; deleting Publication files will not migrate it. Treating it
   as part of the same deletion could break an indexed URL and its Supabase
   projection contract.
5. **Safety guarantee loss.** Publication tests contain useful fail-closed,
   stale-approval, determinism, schema, and internal-metadata-leak checks. The
   relevant guarantees must be retained in Storefront or Review tests even when
   the old builder is removed.
6. **Historical ambiguity.** Deleting architecture and research reports would
   erase the rationale for approval and publication boundaries. Marking them
   retired is safer than immediate deletion.

## 7. Recommendation

Use three small follow-up RFCs:

1. **Remove dormant adapters.** Delete `lib/published-catalog.ts`,
   `lib/search/index.ts`, and the legacy search test. Adjust the Publication
   fallback test without touching Storefront behavior.
2. **Decouple Human Review.** Move shared review input types out of
   `publication/types.ts`; rename publication eligibility to a review-owned
   readiness concept; replace the `data/public` lookup with a Storefront lookup
   or remove the published-state indicator. Preserve append-only decisions and
   all fail-closed rules.
3. **Retire the file-based CLI.** Reconcile `data/public` against Storefront,
   remove `publication:*` scripts, pipeline modules, pipeline-only tests and
   generated output, and mark the Publication documents retired. Do not include
   `/products/fs510` in this step.

Handle `/products/fs510` in a separate Wave 2/SEO migration RFC. Until that is
done, the overall legacy publication surface is **not fully removable**, even
though the file-based Publication Pipeline is absent from primary Storefront
routes.
