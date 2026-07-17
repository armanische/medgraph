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
- no audited Storefront route emitted JSON-LD before RFC-024;
- none had a semantic breadcrumb trail or BreadcrumbList structured data before
  RFC-024;
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

The helper also provides a deterministic BreadcrumbList builder and a safe
JSON-LD serializer. RFC-024 now uses those primitives through centralized schema
builders and a server-only JSON-LD component. The schema layer remains
conservative and consumes Storefront records only.

Existing staged changes under `data/public/**` and `data/review-decisions/**`
were treated as user-owned state and were not changed.

## 2. Route Matrix

Legend:

- **Complete** — route-specific metadata uses the shared helper.
- **Foundation** — metadata is complete; structured-data rollout remains.
- **N/A** — the feature is not used by the current route.

| Route | Metadata API | Title / description | Canonical / alternates | Robots | Open Graph | Twitter | Breadcrumbs | JSON-LD | Pagination | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Static `metadata` | Storefront-specific | `/`; canonical only | Explicit helper policy | Complete website OG | `summary` | None | `WebSite`, `Organization` | N/A | Complete |
| `/catalog` | `generateMetadata()` | Catalog-specific | `/catalog`; query `q` consolidates to base canonical | Query pages: noindex-follow | Complete website OG | `summary` | None | `CollectionPage` | N/A | Complete |
| `/catalog/[slug]` | `generateMetadata()` | Storefront Product name + short description | `/catalog/{slug}` | Explicit helper policy | Complete, with first product image when available | `summary_large_image` with image, otherwise `summary` | Non-visual canonical trail | `Product`, `BreadcrumbList` | N/A | Complete |
| `/manufacturers` | Static `metadata` | Directory-specific | `/manufacturers` | Explicit helper policy | Complete website OG | `summary` | None | `CollectionPage` | N/A | Complete |
| `/manufacturers/[slug]` | `generateMetadata()` | Manufacturer name + short description | `/manufacturers/{slug}` | Explicit helper policy | Complete, with logo when available | `summary_large_image` with logo, otherwise `summary` | Non-visual canonical trail | `Organization`, `BreadcrumbList` | N/A | Complete |
| `/compare` | Static `metadata` | Comparison-specific | `/compare` | Explicit helper policy | Complete website OG | `summary` | None | None emitted | N/A | Foundation |
| `/search` | `generateMetadata()` | Search-specific | `/search`; query `q` consolidates to base canonical | Query pages: noindex-follow | Complete website OG | `summary` | None | Deliberately none | N/A | Complete |

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

RFC-024 implements the reviewed schema mapping through
`lib/storefront/structured-data.ts` and
`components/seo/JsonLd.tsx`. Homepage, catalog, product, manufacturer directory,
and manufacturer detail pages now emit conservative JSON-LD. Search and compare
deliberately emit none.

Product specifications map to `PropertyValue`. Offers, price, availability,
ratings, reviews, GTIN, registration, verification, provenance, internal IDs,
artifact paths, and checksums are prohibited. Catalog directories use
`CollectionPage` without a huge `ItemList`. Full contracts and validation are
documented in `docs/storefront-structured-data.md`.

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

`/catalog?q=...` and `/search?q=...` canonicalize to their base route and return
`noindex, follow` when the global indexing flag is enabled. Environments with
indexing disabled retain `noindex, nofollow`. Empty-query base pages use the
normal environment-controlled policy.

### Pagination

No audited route implements pagination or pagination query parameters. No
`prev`/`next` relationship is needed today. When pagination is introduced, each
page must receive a stable self-canonical rather than canonicalizing every page
to page 1.

## 6. Risks

1. **Static pages lack branded social images.** They use valid summary cards but
   have weaker share previews than product/manufacturer pages with media.
2. **Root metadata retains legacy positioning.** Audited routes override their
   title/description/social fields, but non-Storefront routes may still inherit
   old “expert knowledge” language. That requires a broader site-positioning
   RFC, not an FS510/Storefront-only change.
3. **External validator checks remain a release step.** Automated tests and the
   production build validate output locally; Schema Markup Validator and Rich
   Results Test still require a deployed public URL.
4. **Environment-dependent indexing.** A production deployment with the flag
   unset intentionally emits noindex. Release checks must verify the intended
   value rather than assume indexing.

## 7. Recommendations

### Immediate foundation — completed

- Keep `lib/storefront/seo.ts` as the only Storefront metadata builder.
- Keep the shared site URL as the source for metadata and sitemap.
- Require every new Storefront public route to provide title, description, and
  canonical through the helper.
- Keep FS510 vertical outside this helper until its route strategy is executed.

### Structured data — completed by RFC-024

- Use a non-visual server-only JSON-LD component and shared safe serializer.
- Emit BreadcrumbList on product and manufacturer detail pages.
- Emit conservative Product JSON-LD without commercial or verification claims.
- Emit WebSite/Organization and CollectionPage mappings.
- Apply explicit noindex-follow metadata to non-empty search query pages.

### Later improvements

- add a branded file-based Open Graph/Twitter image for static Storefront pages;
- introduce semantic visual breadcrumbs without changing route structure;
- add pagination-specific metadata only when pagination exists;
- audit root metadata positioning across non-Storefront routes;
- add browser-level SEO smoke checks for resolved absolute URLs and metadata
  inheritance.

The foundation keeps metadata normalization and structured-data claims as
separate modules. RFC-024 introduces JSON-LD only for reviewed, public
Storefront semantics; future schemas must preserve the same fail-closed rule.
