# RFC-009 — Storefront Migration Audit

Date: 2026-07-17  
Branch: `feature/publication-first-products`  
Audit type: static, read-only dependency audit

> Post-audit status: `lib/platform-stats.ts` was removed by RFC-011;
> `lib/published-catalog.ts`, `lib/search/index.ts`, and their legacy search
> test were removed by RFC-015. Historical dependency tables below describe
> the repository at the time of RFC-009.

## 1. Executive Summary

The six routes in the RFC scope are fully migrated to the Storefront Data Layer:

- `/`
- `/catalog`
- `/catalog/[slug]`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/compare`
- `/search`

Their pages, route loaders, rendered React components, shared public layout, and
data services do not import `lib/published-catalog`, `lib/catalog-drafts`,
`lib/platform-stats`, legacy `lib/search`, `data/public`, `data/research`, the
publication/review/verification layers, or a Supabase projection. The only
catalog storage reached by this graph is `data/storefront`, through
`FilesystemCatalogRepository`.

Storefront coverage for the routes explicitly listed in RFC-009 is **100% (7 of
7 route patterns)**. This does **not** yet prove that every ungated route in the
repository is Storefront-only. The public sitemap and several older public
routes remain connected to legacy modules. Wholesale deletion of legacy is
therefore not safe yet.

No functional code, UI, data, pipeline, or behavior was changed by this audit.

## 2. Public Routes

### Dependency map

All route graphs also pass through `app/layout.tsx`. The shared header has no
data dependency; the shared footer obtains its update timestamp from
`catalogRepository.getCatalogSummary()`.

| Route | Page and React components | Storefront dependency path | Legacy modules |
| --- | --- | --- | --- |
| `/` | `app/page.tsx`; `home/Search`; `PlatformStats`; `FeaturedProducts`; `Categories`; `WhyCyberMedica`; `CTA`; shared `Header` and `Footer` | `ProductService`, `ManufacturerService`, `CategoryService`, `SearchService`, `CatalogRepository` | None |
| `/catalog` | `app/catalog/page.tsx`; `CatalogExplorer`; shared layout | `ProductService.getActiveProducts()`, `CategoryService`, `ManufacturerService`, server and client `SearchService` | None |
| `/catalog/[slug]` | `app/catalog/[slug]/page.tsx`; route-local gallery, specifications, documents, compatibility, and related-product views; shared layout | `ProductService.getProductBySlug()`, `getRelatedProducts()`, `CatalogRepository` | None |
| `/manufacturers` | `app/manufacturers/page.tsx`; route-local cards and logo; shared layout | `ManufacturerService`, `ProductService`, `CatalogRepository` | None |
| `/manufacturers/[slug]` | `app/manufacturers/[slug]/page.tsx`; route-local product cards and logo; shared layout | `ManufacturerService.getManufacturerBySlug()`, `ProductService.getProductsByManufacturer()`, `CatalogRepository` | None |
| `/compare` | `app/compare/page.tsx`; `ComparisonTable`; shared layout | `CompareService` → `ProductService`; `CatalogRepository` for labels | None |
| `/search` | `app/search/page.tsx`; `SearchExperience`; shared layout | `SearchService`, `ProductService`, `ManufacturerService`, `CategoryService` | None |

### Storefront service graph

```text
Public route/page
  ├─ ProductService
  ├─ ManufacturerService
  ├─ CategoryService
  ├─ SearchService
  ├─ CompareService ──> ProductService
  └─ CatalogRepository
        └─ FilesystemCatalogRepository
             ├─ storefront schemas and types
             └─ data/storefront/*
```

`CompareService` does not read JSON or instantiate a repository. It receives a
`ProductService`. Client-side homepage and catalog search use
`SearchService.forProducts()` over Storefront DTOs already supplied by their
server route. No client component reads filesystem data.

### Checked public React components and loaders

- Shared: `app/layout.tsx`, `components/layout/Header.tsx`,
  `components/home/Footer.tsx`.
- Homepage: all six components rendered by `app/page.tsx`.
- Catalog: `CatalogExplorer` and the server route loader.
- Product detail: metadata, static params, slug loader, related-product loader,
  and route-local render helpers.
- Manufacturers: list/detail loaders, metadata, static params, and route-local
  render helpers.
- Comparison: `ComparisonTable`, page loader, `CompareService`, and the
  workspace comparison loader that previously consumed the old compare engine.
- Search: `SearchExperience`, homepage autocomplete, catalog search, and all
  server-side Storefront search calls.

## 3. Remaining Legacy Dependencies

### Requested dependency checks

| Legacy dependency | Present in scoped route graph? | Remaining repository dependency |
| --- | --- | --- |
| `lib/published-catalog` | No | `app/sitemap.ts`, `lib/platform-stats.ts`, legacy `lib/search/index.ts`, publication tests |
| `lib/catalog-drafts` | No | `app/sitemap.ts`, `lib/published-catalog.ts`, `lib/platform-stats.ts` |
| `lib/platform-stats` | No | No production importer found; negative migration test references only |
| legacy `lib/search` | No | `tests/importers/search.test.ts`; it also imports old comparison and publication data |
| `data/public` | No | Publication pipeline, human review workspace, published-catalog adapter, tests, and sitemap transitively |
| `data/research` | No | Import/review/Wave 2/internal dashboard pipeline and tests |
| publication modules | No | Publication CLI, tests, review policy, and generated public catalog |
| review modules | No | Internal reviewer/review queue, CLI, tests, and publication eligibility |
| verification modules/data | No | Legacy product projection and import-domain contracts/tests |
| Supabase projection | No | Legacy `/products/fs510` through `lib/public-product-page.ts` and `lib/supabase/server.ts` |

### Public dependencies outside the RFC route list

These paths prevent a repository-wide statement that the entire public surface
is Storefront-only:

- `app/sitemap.ts` imports both `lib/catalog-drafts` and
  `lib/published-catalog`.
- `/products/fs510` uses the Supabase-backed `lib/public-product-page` plus
  verification/publication UI.
- `/knowledge/[slug]` uses `lib/products` and `data/products` rather than the
  Storefront repository.
- `/request` uses `lib/products` for product lookup.
- `/tender` still uses the legacy tender model and publication-ready source
  vocabulary.
- `/workspace` now uses Storefront search and comparison, but still depends on
  legacy compatibility and tender mock-data modules.

These are migration gaps, not regressions in the seven scoped routes.

## 4. Storefront Coverage

| Area | Coverage | Result |
| --- | ---: | --- |
| RFC-009 page loaders | 7/7 | Complete |
| RFC-009 rendered component graphs | 7/7 | Complete |
| Product listing/detail data | 3/3 relevant route patterns | Complete |
| Manufacturer listing/detail data | 2/2 | Complete |
| Search scenarios in scope | Homepage, catalog, search route | Complete |
| Comparison page and active workspace loader | 2/2 | Complete |
| Shared public footer catalog metadata | 1/1 | Complete |
| Sitemap | 0/1 | Legacy remains |
| Other ungated legacy routes | Not in RFC route list | Incomplete |

The Storefront boundary is well-defined: routes consume services, services
consume `CatalogRepository`, and only the filesystem repository reads
`data/storefront`. Direct JSON access is absent from the audited UI graph.

## 5. Candidate Modules for Removal

### LIST A — Safe to delete now

Static inbound-reference analysis found one production module with no runtime
or positive test consumer:

- `lib/platform-stats.ts` — superseded by counts derived from Storefront
  services on the homepage. Its filename appears only in a negative migration
  assertion. Deletion should still be performed in a dedicated cleanup RFC so
  the assertion can be retained or adjusted intentionally.

No other reviewed legacy module is safe to delete in isolation at this point.

### LIST B — Still required

- `lib/published-catalog.ts` and `lib/catalog-drafts.ts`: required by the
  sitemap and legacy/publication tests.
- `data/public/**`: required by publication, human review state, audit tests,
  and the current sitemap dependency chain.
- `data/research/**`: required by import pipelines, evidence/review/Wave 2
  reports, internal tools, and their tests.
- `lib/search/index.ts`: no public UI consumer remains, but the legacy search
  contract is still directly tested and depends on old comparison/publication
  fixtures. Retire its tests and callers together.
- `lib/compare/engine.ts`, `lib/compare/mock-data.ts`, and
  `lib/compare/types.ts`: removed from active comparison UI, but still consumed
  by legacy search and comparison tests.
- `lib/public-product-page.ts`, `lib/supabase/server.ts`,
  `types/public-product-page.ts`, and legacy product-page components: still
  required by `/products/fs510`.
- `lib/products.ts` and `data/products`: still required by knowledge and request
  routes.
- Publication, review, verification, evidence, Wave 2, downloader, resolver,
  artifact, and internal dashboard modules: outside the Storefront route graph
  but still required by commands, internal routes, reports, and tests.
- `lib/compatibility/**`, `lib/tender/**`, and `lib/workspace/**`: still required
  by their public pilot routes and tests; workspace is only partially migrated.

## 6. Risks

1. **Sitemap regression.** Removing published/draft adapters now would break
   sitemap generation and therefore the production build.
2. **Hidden public-route regression.** Treating the RFC route list as the entire
   application would leave `/products/fs510`, `/knowledge/[slug]`, `/request`,
   `/tender`, and `/workspace` with unresolved legacy imports.
3. **Test contract regression.** Several otherwise dormant modules are direct
   fixtures for legacy tests. Deleting implementation without retiring or
   replacing those contracts will fail `npm test`.
4. **Pipeline/history loss.** `data/public` and `data/research` are not UI
   sources for the audited routes, but they remain operational inputs and audit
   history. UI migration is not authorization to delete them.
5. **Dynamic import blind spot.** No dynamic legacy import was found in the
   audited graph, but future cleanup should repeat static scans and a production
   build after every deletion batch.
6. **Storefront source ownership.** `data/storefront` is now the public catalog
   source. A cleanup must define how it is maintained before removing the
   pipelines that may currently help produce or validate catalog content.

## 7. Recommendation

The seven scoped routes are ready for a legacy-cleanup phase, but the repository
as a whole is **not ready for wholesale legacy deletion**.

Recommended deletion sequence:

1. Remove only the unused `lib/platform-stats.ts` in a dedicated, verified
   cleanup commit.
2. Migrate `app/sitemap.ts` to Storefront services and add sitemap coverage.
3. Decide whether `/products/fs510` redirects to `/catalog/fs510` or is migrated
   to `ProductService`; then retire its Supabase projection and provenance UI.
4. Migrate or explicitly retire `/knowledge/[slug]`, `/request`, `/tender`, and
   `/workspace` legacy loaders.
5. Replace or retire legacy search/compare tests, then remove
   `lib/search/index.ts` and `lib/compare/**` as one bounded change.
6. Audit CLI/internal consumers separately before considering removal of
   publication, review, verification, evidence, Wave 2, or their data trees.
7. After each step, run import scans, the full test suite, production build,
   lint, TypeScript, and `git diff --check`.

The safe decision boundary is: **public Storefront migration is complete for
the RFC-009 route list; legacy operational systems and remaining public pilot
routes must be handled by subsequent RFCs.**
