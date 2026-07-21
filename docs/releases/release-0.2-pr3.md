# CyberMedica — Release 0.2 PR3

**Scope:** Homepage, Manufacturers & Public Data Presentation Cleanup
**Date:** 2026-07-21
**Status:** Implemented and validated
**Data baseline:** Catalog Baseline v1

## Summary

PR3 makes the public catalog easier to scan and removes unsupported public promises without changing product data or the Cloud catalog. Homepage collections are now derived from commercially ready products, countries are presented through one fail-closed formatter, manufacturer branding accepts only verified local assets, and comparison is no longer promoted in shared public navigation.

## Implemented

### Homepage and navigation

- Reduced the Hero media footprint while preserving `object-contain` rendering and the product aspect ratio.
- Removed the statistics overlay and Compare entry points from Hero, Header and Footer.
- Added an inline Header search backed by the existing `SearchService`.
- Search supports focus-on-open, Escape/close, up to five suggestions, product navigation, Enter navigation, and a link to the full `/search` experience.
- Kept the homepage search as the primary full-width discovery entry point and balanced its heading width.
- Replaced speculative capabilities with four implemented capabilities: catalog search, filters, manufacturer pages and RFQ.

### Categories and manufacturers

- Homepage categories are ranked by the number of READY products and limited to eight.
- Category cards use a unique real product image when available and a neutral visual fallback otherwise.
- Homepage manufacturers are ranked by READY-product count and limited to eight.
- Manufacturer directory now uses a compact responsive `4 / 3 / 2 / 1` grid.
- Manufacturer marks render only verified local assets following `/manufacturers/{slug}/logo.{png,webp,svg}`. No unverified remote logo is shown.
- No new manufacturer logos were added: the current baseline contains no assets that satisfy the verified-local convention, so the neutral fallback is used intentionally.

### Public data presentation

- Added one country presentation helper for all touched public surfaces.
- Known ISO values are localized to Russian; unknown two-letter codes are hidden instead of exposed.
- Product presentation and manufacturer structured data use the same fail-closed rules.
- Catalog summary is a compact four-metric panel.
- Product card media is now an accessible link to the product page.
- Footer brand image is rendered without an opaque white container.

## Baseline and safety

Read-only baseline audit passed with checksum:

`e757f5d2e0664f8a235c799dfe30d209d6bd607e165a9ebc0e0338d2ccbd894b`

| Metric | Result |
| --- | ---: |
| Products | 79 |
| Manufacturers | 25 |
| Categories | 19 |
| Application areas | 7 |
| READY | 76 |
| Requires editor review | 3 |
| Published | 0 |

No Product Data, Catalog Baseline, Immutable Snapshot, Cloud Import, Import Pipeline, Review State, Publication, production configuration or production rules were changed by PR3.

## QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 508/508 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9, 31 static pages generated |
| `npm run catalog:baseline:audit` | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

Browser QA used the read-only `cloud_preview` source with 79 products. Desktop, tablet (820 px) and mobile (390 px) showed no horizontal overflow. The catalog exposed 79 accessible image links. Header search returned the Hamilton T1 product from `SearchService`; the Enter handler was corrected after the interaction check and is covered by the final source test, TypeScript and production build. A second local server launch for a post-build click-through was unavailable because the execution environment exhausted its sandbox-escalation allowance.

## Screenshots

- `docs/screenshots/release-0.2-pr3/desktop-home-hero.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-home-search.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-home-categories.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-home-manufacturers.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-home-footer.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-home-full.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-catalog-summary.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-catalog-cards.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-manufacturers-hero.jpg`
- `docs/screenshots/release-0.2-pr3/desktop-manufacturers-grid.jpg`
- `docs/screenshots/release-0.2-pr3/tablet-home.jpg`
- `docs/screenshots/release-0.2-pr3/mobile-home.jpg`

## Scoped files

- `app/layout.tsx`
- `app/page.tsx`
- `app/catalog/page.tsx`
- `app/manufacturers/page.tsx`
- `app/manufacturers/[slug]/page.tsx`
- `components/catalog/CatalogExplorer.tsx`
- `components/home/Categories.tsx`
- `components/home/FeaturedManufacturers.tsx`
- `components/home/Footer.tsx`
- `components/home/Hero.tsx`
- `components/home/Search.tsx`
- `components/home/WhyCyberMedica.tsx`
- `components/layout/Header.tsx`
- `components/storefront/ManufacturerMark.tsx`
- `lib/storefront/country-presentation.ts`
- `lib/storefront/manufacturer-presentation.ts`
- `lib/storefront/product-presentation.ts`
- `lib/storefront/structured-data.ts`
- `tests/importers/global-search-storefront.test.ts`
- `tests/importers/homepage-information-architecture.test.ts`
- `tests/importers/homepage-redesign-v2.test.ts`
- `tests/importers/product-presentation-v1.test.ts`
- `tests/importers/release-0.2-pr3.test.ts`
- `tests/importers/storefront-conversion.test.ts`
- `docs/screenshots/release-0.2-pr3/*`
- `docs/releases/release-0.2-pr3.md`

## Remaining limitations

- Manufacturer logos remain neutral until official local assets are reviewed and added under the verified convention.
- Header search currently receives the active catalog payload from the server; a compact search-index DTO can be considered in a later performance-focused PR.
- The Compare route remains in the codebase for compatibility but is not promoted by shared public navigation.

## Git

No commit was created. The worktree contains a large set of pre-existing staged and untracked user changes from earlier releases, so an isolated PR3-only commit cannot be produced safely without touching user state.
