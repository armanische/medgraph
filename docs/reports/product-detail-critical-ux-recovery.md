# Product Detail Critical UX Recovery

**Branch:** `codex/product-detail-critical-ux-recovery`

**Baseline:** `c571b37f98ebd78d87df17f2fcd703867dc88e77`
**Scope:** Product Detail presentation and its directly coupled catalog-card interaction only.

## Pre-implementation Preview audit

The audit was completed against the latest READY Preview of
`codex/restore-launch-sprint-1-2-visual-polish`, using the real Cloud product
Hamilton-T1 (`/catalog/767632362-330695211247-apparat-ivl-hamilton-t1`).

| Component | Exists in code | Displayed in Preview | Finding |
| --- | --- | --- | --- |
| Hero | Yes | Yes | 40/60 media-first layout was present. |
| Product Gallery | Yes | Yes | Three real images and thumbnails were present. |
| Magnifier | Yes | Yes | Round icon control opened the gallery. |
| Lightbox | Yes | Yes | Esc and arrow navigation were manually verified. |
| Summary | Yes | Yes | Rendered from safe short description. |
| Full description | Yes | Yes | Separate, sanitized section. |
| Advantages | Yes | No | Correctly absent: Hamilton-T1 has no structured `keyFeatures`. |
| Technical specifications | Yes | No | Correctly absent: no public structured technical specifications survived the projection. |
| Documents | Yes | No | No public document records; this is optional. |
| Manufacturer | Yes | Yes | Hamilton Medical card was present. |
| Section navigation | No | No | Removed in the previous baseline. |
| Breadcrumbs | Yes | Yes | Semantic current-page breadcrumb was present. |
| Back to catalog | No | No | Missing explicit return control. |
| Back to top | No | No | Missing. |

The catalog audit also found that cards showed a category badge while their
lower specification area still exposed both **Категория** and **Тип товара**.
That contradicted the single public category vocabulary.

## Implemented presentation recovery

- A catalog-origin marker is written only when a user opens a product from
  `/catalog`. The Product Detail **Назад к каталогу** action uses browser
  history in that case, retaining URL parameters and native scroll restoration;
  it falls back to `/catalog` for direct entry.
- A keyboard-accessible floating **Наверх** action appears after 480px of
  scrolling and honours `prefers-reduced-motion`.
- Section navigation appears only when at least two real sections exist. Its
  possible order is: Description, Manufacturer, Technical specifications,
  Advantages. Documents, regulatory information and application areas are not
  inserted into this navigation.
- Catalog cards keep their fixed title, manufacturer, description and detail
  regions, show one public category badge, and restrict the lower detail area
  to real technical specifications. `Тип товара` is never rendered as a
  customer-facing card field.
- The gallery keeps its existing real media and lightbox, adds compact previous/
  next controls only when more than one image exists, focus trapping, focus
  return and body-scroll locking. It retains Esc, arrows, backdrop close,
  close control and mobile swipe.
- Summary continues to be generated only from `shortDescription`, never from
  HTML or inferred facts. It now uses the first two to four real sentences,
  capped at 700 characters; it remains absent when there is not safe material.

## Structured-data blocker

Hamilton-T1 is **PARTIALLY READY / BLOCKED BY STRUCTURED DATA** for the
Advantages and Technical Specifications sections. This recovery intentionally
does not infer claims from its long HTML description, images, model name or
marketing text.

The distinct follow-up data task is:

> Through the approved catalog enrichment/review workflow, add provenance-backed
> `keyFeatures` and normalized `ProductSpecification` records for Hamilton-T1
> (and only other products with equivalent evidence). Then re-run the public
> Cloud projection and Product Detail contract tests.

That task must not be combined with this UI recovery and must preserve the
immutable source snapshot and Cloud review controls.

## Explicitly unchanged

- ProductService, CatalogRepository and the Cloud Domain Model.
- Cloud Catalog data, Product Data, source snapshots, Supabase schema/RPC,
  migrations, imports, publication and review state.
- Production deployment and production environment.

## Validation

Local validation completed before commit:

- `npm test` — 388 passing tests.
- `npm run lint` — pass with no warnings.
- `npx tsc --noEmit --pretty false` — pass.
- `npm run build -- --webpack` — pass.
- `git diff --check` — pass.

The contract coverage includes the category-only card presentation,
history/fallback return behavior, reduced-motion top action, real-section
navigation and the gallery keyboard/touch/focus contract. Preview validation is
performed from the pushed branch without changing this recovery scope.
