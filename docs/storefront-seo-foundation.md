# RFC-023 — Storefront SEO Foundation

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: public Storefront metadata audit and shared SEO foundation. No visual UI,
Storefront API, FS510 vertical, Review, Publication, route, or redirect changes.

## 1. Executive Summary

All audited Storefront routes had a title, description, and canonical before
RFC-023. Robots policy came from the root layout, while Open Graph and Twitter
metadata were inconsistent:

- static child pages inherited the root homepage social title, description, and
  URL;
- dynamic product and manufacturer pages defined only part of Open Graph and
  inherited generic Twitter metadata;
- canonical, title, and description objects were repeated across seven files;
- the site URL was independently declared by layout, robots, and sitemap;
- no audited Storefront route emitted JSON-LD;
- none had a semantic breadcrumb trail or BreadcrumbList structured data;
- pagination is not implemented on the audited routes.

RFC-023 introduces `lib/storefront/seo.ts` as the Storefront metadata boundary.
Every audited route now calls `buildStorefrontMetadata()`, which supplies:

- route-specific title and description;
- canonical alternate;
- explicit env-controlled robots policy;
- complete route-specific Open Graph metadata;
- route-specific Twitter Card metadata;
- optional social image for products/manufacturers;
- a shared site URL/name.

The helper also provides a deterministic BreadcrumbList builder and a JSON-LD
serializer that escapes `<` as `\u003c`, following the installed Next.js 16.2.9
guidance. No JSON-LD script is emitted yet: schema semantics should be reviewed
and validated before publication rather than inferred automatically from
Storefront records.

Existing staged changes under `data/public/**` and `data/review-decisions/**`
were treated as user-owned state and were not changed.

## 2. Route Matrix

Legend:

- **Complete** — route-specific metadata uses the shared helper.
- **Foundation** — metadata is complete; structured-data rollout remains.
- **N/A** — the feature is not used by the current route.

| Route | Metadata API | Title / description | Canonical / alternates | Robots | Open Graph | Twitter | Breadcrumbs | JSON-LD | Pagination | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Static `metadata` | Storefront-specific | `/`; canonical only | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |
| `/catalog` | Static `metadata` | Catalog-specific | `/catalog`; query `q` consolidates to base canonical | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |
| `/catalog/[slug]` | `generateMetadata()` | Storefront Product name + short description | `/catalog/{slug}` | Explicit helper policy | Complete, with first product image when available | `summary_large_image` with image, otherwise `summary` | UI has a catalog label/link but no semantic trail | None emitted | N/A | Foundation |
| `/manufacturers` | Static `metadata` | Directory-specific | `/manufacturers` | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |
| `/manufacturers/[slug]` | `generateMetadata()` | Manufacturer name + short description | `/manufacturers/{slug}` | Explicit helper policy | Complete, with logo when available | `summary_large_image` with logo, otherwise `summary` | Back-link only, not a semantic trail | None emitted | N/A | Foundation |
| `/compare` | Static `metadata` | Comparison-specific | `/compare` | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |
| `/search` | Static `metadata` | Search-specific | `/search`; query `q` consolidates to base canonical | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |

### Routes explicitly outside RFC-023

- `/products/fs510` remains owned by the isolated FS510 vertical.
- `/knowledge/[slug]`, `/workspace`, `/request`, `/tender`, and internal routes
  were not migrated to the Storefront SEO helper.
- No route, canonical, redirect, sitemap entry, or visual component was changed.

## 3. Metadata

### Shared helper contract

`buildStorefrontMetadata()` requires:

```text
title
description
canonical
optional image { url, alt }
```

It returns a Next.js `Metadata` object with consistent `alternates`, `robots`,
`openGraph`, and `twitter` fields. Relative URLs are resolved by the existing
root `metadataBase`.

The helper is Storefront-only and imports neither FS510, Review, Publication,
Supabase, nor generated data.

### Metadata inheritance

The root layout still owns global application metadata and `metadataBase`.
Before RFC-023, nested metadata objects did not provide all social fields, so
static routes could retain the root Open Graph URL/title and dynamic routes had
partial social metadata. Audited pages now return complete route-level nested
objects and do not rely on ambiguous nested-field inheritance.

### Static vs generated metadata

Static metadata is correct for pages whose SEO content does not depend on route
parameters:

- `/`;
- `/catalog`;
- `/manufacturers`;
- `/compare`;
- `/search`.

Generated metadata is correct where Storefront entity data is required:

- `/catalog/[slug]`;
- `/manufacturers/[slug]`.

Both dynamic functions preserve fail-closed `notFound()` behavior. Product and
manufacturer data are local filesystem repository reads, not remote fetches.

### Robots

The helper mirrors the existing global policy:

```text
CYBERMEDICA_ALLOW_INDEXING=1 -> index, follow
otherwise                    -> noindex, nofollow
```

This does not change the indexing gate; it makes the policy explicit and
consistent in every audited route's resolved metadata.

### Alternates

Only canonical alternates are emitted. This is appropriate while the Storefront
has one public locale (`ru`). `hreflang` must not be invented until translated
routes and equivalent localized content exist.

### Social images

- Product pages use the first Storefront image when present.
- Manufacturer pages use the logo when present.
- Static routes have no dedicated social image and use a `summary` Twitter
  card. A future branded 1200x630 image can be added through Next file-based
  metadata without changing this helper.

## 4. Structured Data

No audited Storefront page currently emits an
`application/ld+json` script. This is recorded as a deliberate pending layer,
not silently marked complete.

RFC-023 adds two safe primitives:

1. `buildBreadcrumbJsonLd()` creates absolute, ordered BreadcrumbList records.
2. `serializeStorefrontJsonLd()` escapes `<` to prevent raw Storefront strings
   from becoming script markup.

Recommended future schema mapping:

| Route | Candidate schema | Required review |
| --- | --- | --- |
| `/` | `WebSite` + `Organization`, optional `SearchAction` | Confirm public search target template and organization identity fields |
| `/catalog` | `CollectionPage` + `ItemList` | Define list limits and whether filtered query pages are represented |
| `/catalog/[slug]` | `Product` + `BreadcrumbList` | Do not add `Offer`, price, availability, rating, GTIN, or certification unless real public data exists |
| `/manufacturers` | `CollectionPage` + `ItemList` | Decide whether entries are `Organization` or `Brand` for this catalog |
| `/manufacturers/[slug]` | `Organization`/`Brand` + `BreadcrumbList` | Validate website/logo/country semantics and product relationships |
| `/compare` | `WebPage` + `BreadcrumbList` | Avoid representing comparison metrics as reviews or ratings |
| `/search` | `SearchResultsPage` + `BreadcrumbList` | Decide query-page indexing policy first |

Structured data should be validated with Schema Markup Validator and Google's
Rich Results Test before release. Storefront Product must remain public-safe;
Review, Evidence, Verification, Publication, SHA, artifact paths, and internal
IDs must never enter JSON-LD.

## 5. Canonical Strategy

### Stable route canonicals

```text
/                              -> /
/catalog                       -> /catalog
/catalog/{slug}                -> /catalog/{slug}
/manufacturers                 -> /manufacturers
/manufacturers/{slug}          -> /manufacturers/{slug}
/compare                       -> /compare
/search                        -> /search
```

Canonical paths are relative in Metadata API and become absolute through the
root `metadataBase` (`https://cybermedica.ru`). Sitemap generation now imports
the same `STOREFRONT_SITE_URL` constant from the SEO foundation, eliminating a
duplicate URL declaration between Storefront metadata and sitemap.

### Query parameters

`/catalog?q=...` and `/search?q=...` currently canonicalize to their base route.
This consolidates query variations, but both routes remain indexable when the
global indexing flag is enabled. Before public scale, choose one explicit rule:

- keep query pages crawlable but canonicalize them to the base; or
- return `noindex, follow` when a non-empty query is present.

The second option would require `generateMetadata({ searchParams })` and is not
implemented by this RFC.

### Pagination

No audited route implements pagination or pagination query parameters. No
`prev`/`next` relationship is needed today. When pagination is introduced, each
page must receive a stable self-canonical rather than canonicalizing every page
to page 1.

## 6. Risks

1. **No JSON-LD today.** Search engines receive good metadata but no explicit
   entity/list/breadcrumb graph.
2. **No semantic Storefront breadcrumbs.** Dynamic pages show navigation links,
   but not a consistent trail or BreadcrumbList.
3. **Query-page crawl policy is implicit.** Search and catalog query variants
   are canonicalized but not conditionally noindexed.
4. **Static pages lack branded social images.** They use valid summary cards but
   have weaker share previews than product/manufacturer pages with media.
5. **Root metadata retains legacy positioning.** Audited routes override their
   title/description/social fields, but non-Storefront routes may still inherit
   old “expert knowledge” language. That requires a broader site-positioning
   RFC, not an FS510/Storefront-only change.
6. **No automated rendered-head integration test.** Unit/source tests validate
   helper contracts and usage; a future browser smoke should inspect actual
   canonical, robots, OG, Twitter, and JSON-LD tags in Preview.
7. **Environment-dependent indexing.** A production deployment with the flag
   unset intentionally emits noindex. Release checks must verify the intended
   value rather than assume indexing.

## 7. Recommendations

### Immediate foundation — completed

- Keep `lib/storefront/seo.ts` as the only Storefront metadata builder.
- Keep the shared site URL as the source for metadata and sitemap.
- Require every new Storefront public route to provide title, description, and
  canonical through the helper.
- Keep FS510 vertical outside this helper until its route strategy is executed.

### Next safe SEO RFC

1. Add a non-visual JSON-LD component that uses the safe serializer.
2. Roll out BreadcrumbList to product and manufacturer detail pages.
3. Add conservative Product JSON-LD without price/rating/availability claims.
4. Add WebSite/Organization and CollectionPage mappings.
5. Validate rendered markup in Preview and external validators.
6. Decide query-page noindex policy.

### Later improvements

- add a branded file-based Open Graph/Twitter image for static Storefront pages;
- introduce semantic visual breadcrumbs without changing route structure;
- add pagination-specific metadata only when pagination exists;
- audit root metadata positioning across non-Storefront routes;
- add browser-level SEO smoke checks for resolved absolute URLs and metadata
  inheritance.

The foundation intentionally separates reliable metadata normalization from
structured-data claims. Metadata is unified now; JSON-LD should be introduced
only with verified public semantics.
