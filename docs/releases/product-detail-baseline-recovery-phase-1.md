# Product Detail Baseline Recovery — Phase 1

**Status:** Local QA complete; Staging Preview pending

**Date:** 23 July 2026

**Scope:** Product Detail presentation contract only

## Recovery source

The permanent historical reference is
`refs/recovery/product-detail-baseline-v1` at
`a460698b5d4f7c1bc45e894b095149ca276ac473` (tree
`454bf8c46c4e5a8646986de28e6d18d5b8a3514e`). Phase 1 reconstructs the
approved presentation principles on current `origin/main`; it does not merge or
cherry-pick the historical runtime.

## Implemented contract

- Added a read-only Product Detail presentation adapter based only on current
  `Product`, `Manufacturer` and `Category` Storefront models.
- Summary is extracted from existing public copy, preserves source casing and
  never generates unsupported facts.
- Advantages use only explicit `keyFeatures`. Description list items are not
  promoted to advantages or specifications.
- Hero metadata is value-only visually and retains accessible `dt` labels.
- A model is omitted when already present in the product name.
- All available application areas are presented once in the Hero and are not
  repeated below the description.
- Explicit structured specifications remain the only source for technical
  specification sections and key specifications.
- Restored a dedicated, fail-closed manufacturer section and section-card
  hierarchy.
- Preserved Product Detail MVP breadcrumbs, media rendering, registration,
  downloads, related-product resolution, RFQ gating, canonical metadata and
  JSON-LD behavior.
- Added mobile width constraints so long names and metadata cannot expand and
  become clipped inside the Hero.

## Explicitly deferred

- Gallery/Lightbox client runtime;
- magnifier control;
- Back and scroll-to-top controls;
- Catalog card alignment;
- content enrichment or Product Data changes.

## Protected systems

No changes were made to Product Data, immutable inputs, Cloud Catalog,
Supabase, migrations, ProductService, CatalogRepository, Storefront Domain
Model, Publication, Review or Production.

## Local QA

| Check | Result |
| --- | --- |
| Focused Product Detail contracts | PASS — 29/29 |
| `npm test` | PASS — 380/380 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build -- --webpack` | PASS |
| `git diff --check` | PASS |
| Product/Service/Repository protected diff | PASS — no changes |

## Local visual QA

Read-only checks used the static Storefront source and `/catalog/fs510`.

- Desktop: one `h1`, Hero width equals its scroll width, Description,
  Advantages and Manufacturer sections present, console errors `0`.
- Mobile `390 px`: document and Hero scroll widths equal viewport/container
  widths; one `h1`; metadata, Advantages and Manufacturer sections present;
  no horizontal overflow.
- Initial mobile inspection exposed clipped internal Hero content. The fix was
  limited to presentation width and wrapping classes and was rechecked after a
  production webpack rebuild.

## Staging gate

The runtime is locally ready for an atomic commit and automatic Vercel Preview.
Per the project workflow, commit, push and deployment require explicit
authorization. Phase 1 must not be marked Staging Accepted until the immutable
Preview passes read-only Product Detail smoke QA.
