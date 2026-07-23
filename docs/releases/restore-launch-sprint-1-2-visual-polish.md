# Restore Launch Sprint 1.2 Visual Polish

**Status:** Local implementation complete; Preview validation pending

## Recovery source

The approved visual reference was recovered from:

- `add30644888b32d24c64ab1ac57a192f9a7ed589` — Product Detail experience;
- `340ce6aa18d68aadbcb4c214eb52c713dad0ea8a` — Launch Sprint 1.2 polish;
- `a460698b5d4f7c1bc45e894b095149ca276ac473` — Product Acceptance decisions;
- `refs/recovery/product-detail-baseline-v1` — permanent recovery ref.

The implementation starts from Product Detail Baseline Recovery Phase 1
(`5d6280cb6e69aa02005ffac0befa4e25d7632b60`). Historical HTML-derived
advantages/specifications were intentionally not restored: they conflict with
the current fail-closed Cloud presentation policy.

## Restored decisions

- Catalog cards reserve title, manufacturer, description and specification
  regions so the lower card area starts on a consistent line.
- Product Hero retains visually value-only metadata and accessible hidden labels.
- The model remains absent when it duplicates the H1; no model/SKU badge was
  introduced.
- Hero no longer carries a decorative status chip, registration strip, key-spec
  panel, or section-link rail. The first screen is gallery, H1, metadata,
  Summary and permitted CTA only.
- Gallery is restored as an isolated client component with a round magnifier,
  keyboard/touch lightbox and no new-tab image links.
- Summary is a bounded projection of the existing short description only. It is
  hidden when no safe compact source exists or when it duplicates the full
  description.
- Application areas remain visible in Hero metadata only.
- Advantages retain compact cards and render solely from structured
  `keyFeatures`; the block remains hidden when that data is absent.
- Marketing-labelled rows are excluded from the technical specification section.

## Explicit non-changes

No Product Data, Cloud Catalog, Supabase schema, migrations, imports,
publication, ProductService, CatalogRepository, or Cloud Domain Model changed.
No runtime legacy HTML parsing was added.

## Local QA

- Focused Product Detail/Sprint 1.2 contracts: PASS — 24/24.
- Full test suite: PASS — 385/385.
- Lint: PASS.
- TypeScript: PASS.
- Webpack production build: PASS.
- `git diff --check`: PASS.
- Preview and responsive smoke validation remain gated on the automatic Preview
  deployment created after the atomic commit is pushed.

## Remaining gate

After the atomic commit is pushed to
`codex/restore-launch-sprint-1-2-visual-polish`, the automatic Preview must
verify Hamilton-T1, «Гемос», a minimal-data product and `/catalog` at 1440 px
and 390 px. Cloud Preview must remain read-only.
