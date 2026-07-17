# RFC-028 — Production Release Readiness

**Status:** Audit complete  
**Date:** 2026-07-17  
**Branch:** `feature/publication-first-products`  
**Audited revision:** `53d7f8419aea5c13dc994acebd851dab427f211f`  
**Scope:** Public Storefront and the production controls that directly affect it

## 1. Executive Summary

CyberMedica Storefront is technically buildable and its Storefront boundary is
well enforced. The final clean run passed all 328 tests, ESLint, TypeScript, the
Next.js production build, and whitespace validation. The primary Storefront
routes read through `lib/storefront`; no imports from Review, Publication,
Research, Supabase Projection, or the FS510 vertical were found in their pages,
loaders, or public Storefront components.

The release verdict is **Not Ready** for an indexable production launch. This is
not caused by a build or security failure. Two previously documented release
gates remain open:

1. FS510 has two indexable, self-canonical product identities,
   `/catalog/fs510` and `/products/fs510`, and both are emitted in the sitemap.
   RFC-022 identifies this as a duplicate-entity and keyword-cannibalization
   risk and recommends making the catalog URL the primary identity.
2. `Ambu VivaSight 2 DLT` has no image. It therefore fails the catalog-ready
   media rule defined by RFC-027 for a public `active` or `on_request` product.

The application may be deployed to a protected Preview now. Production may be
deployed with indexing disabled for final smoke testing, but public indexing
must not be enabled until the two gates above are closed and the production
environment checklist is confirmed.

No functional code, route, data, UI, Storefront API, FS510, Review, or
Publication file was changed by this RFC.

## 2. Audit Method and Boundary

The audited Storefront surface is:

- `/`;
- `/catalog`;
- `/catalog/[slug]`;
- `/manufacturers`;
- `/manufacturers/[slug]`;
- `/compare`;
- `/search`;
- shared Header, Footer, catalog, comparison, search, SEO, and JSON-LD
  components used by those routes;
- `robots.txt`, `sitemap.xml`, root metadata, security headers, and the lead
  request endpoint where they affect a production release.

Legacy routes such as `/products/fs510`, `/knowledge/fs510`, `/workspace`, and
`/tender` remain deployed application routes but are not part of the Storefront
domain. Their continued public discoverability is nevertheless included in the
release assessment because it affects SEO and product identity.

The audit used repository searches, source inspection, the current Storefront
dataset, existing architectural RFCs, dependency inspection, and a clean
production build. External URLs, a deployed Vercel environment, live webhook,
Supabase, search-engine crawlers, and third-party schema validators were not
available to this repository-only audit.

## 3. Architecture Review

### 3.1 Storefront dependency boundary

| Area | Source | Result |
| --- | --- | --- |
| Homepage | Product, Manufacturer, and Category services | Pass |
| Catalog and filters | Product, Category, Manufacturer, and Search services | Pass |
| Product detail | Product service and catalog repository | Pass |
| Manufacturer routes | Manufacturer and Product services | Pass |
| Search | Search service with Storefront domain records | Pass |
| Comparison | Compare service over Product service | Pass |
| Sitemap Storefront entries | Storefront services through `buildStorefrontSitemap()` | Pass |
| Shared public Header/Footer | Navigation plus Storefront catalog summary | Pass |

No Storefront consumer imports `data/storefront` directly. The filesystem is
owned by `FilesystemCatalogRepository`; services and route consumers depend on
repository contracts. No prohibited Storefront import from `data/research`,
`data/public`, Review, Publication, Verification, Supabase, or the FS510
vertical was found.

The public Storefront client boundary is limited to interactive features:

- global Header navigation state;
- Homepage search autocomplete;
- catalog search/filter explorer;
- search experience;
- request form outside the Storefront data boundary.

Product detail, manufacturer pages, comparison, featured content, SEO, and
structured data remain Server Components. JSON-LD adds no client JavaScript.

### 3.2 Remaining non-Storefront production surfaces

The repository intentionally retains legacy routes and pipelines. They do not
flow into the Storefront route implementations, but the following remain
production-relevant:

- `app/sitemap.ts` composes Storefront entries with the isolated FS510 sitemap;
- `/products/fs510` reads a read-only Supabase Projection and exposes the
  legacy verification/provenance experience;
- `/knowledge/fs510` uses the legacy product dataset;
- `/request` still uses the legacy `lib/products` lookup only to prefill the
  lead form;
- Wave 2, Review, Publication, internal dashboards, workspace, and tender code
  remain in the deployable repository but are not imported by Storefront routes.

This is isolation, not removal. The release must not claim that the entire
application contains only Storefront architecture.

### 3.3 Documentation

The Storefront migration, route strategy, SEO, structured data, homepage,
conversion, and catalog-content RFCs match the inspected implementation. The
open FS510 route decision in RFC-022 and content gap in RFC-027 are accurately
documented and remain unresolved rather than silently reclassified.

## 4. Build and Quality

| Check | Result | Evidence |
| --- | --- | --- |
| Tests | Pass | 328 passed, 0 failed, 0 skipped |
| Production build | Pass | Next.js 16.2.9, compiled in 1.607 s |
| Build TypeScript phase | Pass | completed in 1.601 s |
| ESLint | Pass | no warnings or errors |
| Standalone TypeScript | Pass | no diagnostics |
| `git diff --check` | Pass | no whitespace errors |
| Dependencies | Pass with limitation | dependency tree is resolved; no duplicate top-level packages reported |

The first sandboxed build attempt failed because Turbopack could not bind its
local CSS worker port (`EPERM`). Re-running the same build with the required
local process permission succeeded. This is an execution-sandbox limitation,
not an application build defect.

No package installation, dependency upgrade, network vulnerability scan, merge,
or deployment was performed. A registry-backed dependency/security audit must
remain part of the release pipeline.

## 5. SEO and Discovery

### 5.1 Storefront matrix

| Route | Canonical | Metadata | JSON-LD | Rendering | Status |
| --- | --- | --- | --- | --- | --- |
| `/` | `/` | complete | `WebSite`, `Organization` | Static | Pass |
| `/catalog` | `/catalog` | complete; query results noindex-follow | `CollectionPage` | Dynamic for query params | Pass |
| `/catalog/[slug]` | self-canonical | product-derived | `Product`, `BreadcrumbList` | SSG for 2 products | Pass |
| `/manufacturers` | `/manufacturers` | complete | `CollectionPage` | Static | Pass |
| `/manufacturers/[slug]` | self-canonical | manufacturer-derived | `Organization`, `BreadcrumbList` | SSG for 2 manufacturers | Pass |
| `/compare` | `/compare` | complete | intentionally absent | Static | Pass |
| `/search` | `/search` | complete; query results noindex-follow | intentionally absent | Dynamic for query params | Pass |

Metadata, canonical URLs, Open Graph, Twitter cards, robots policy, and
structured-data URLs share `https://cybermedica.ru`. Product and manufacturer
static params are generated through Storefront services. Sitemap Storefront
entries use the same canonical route family.

`CYBERMEDICA_ALLOW_INDEXING` is fail-closed: only the exact value `1` permits
indexing; Preview and unconfigured environments remain noindex. The production
release owner must verify the flag after deployment rather than assume it from
build success.

### 5.2 Blocking duplicate product identity

Current output contains both:

```text
/catalog/fs510   -> canonical /catalog/fs510   -> sitemap entry
/products/fs510  -> canonical /products/fs510  -> sitemap entry
```

Both describe the same product with overlapping intent. The content is not
byte-identical, but two self-canonicals split entity and ranking signals. Before
indexing, execute the RFC-022 Hybrid decision: make `/catalog/fs510` primary and
either permanently redirect the vertical URL or explicitly make the specialist
surface noindex and remove it from the sitemap.

There is no pagination today. Search and filtered-query canonicals intentionally
consolidate to their base pages. Search and Compare correctly omit JSON-LD
because they are interactive/result surfaces rather than stable entities.

External Rich Results Test, Schema Markup Validator, sitemap fetch, and live
robots verification remain post-deploy release steps.

## 6. Performance and Rendering

The production build generated 26 pages. Storefront rendering is:

- static: Homepage, Compare, manufacturer directory;
- SSG: two product pages and two manufacturer pages;
- dynamic: Catalog and Search because they consume query parameters;
- server-only dynamic outside Storefront: FS510, request API/page, and internal
  surfaces.

The build output was 19 MB, with 880 KB in `.next/static/chunks` and 812 KB of
JavaScript chunk files in aggregate. These are build-directory totals, not
per-route transfer sizes or compressed browser payloads; the current Next build
did not emit per-route bundle metrics.

No Storefront data fetch is made from the browser. Interactive search and
filter components receive Storefront records through the React Server Component
payload and execute locally. This is acceptable for the current two-product
baseline but must be revisited before mass catalog expansion: serializing the
entire catalog into multiple client islands will scale linearly with content.

No Web Vitals, Lighthouse, CDN cache, image transfer, or real-user metric was
measured in this repository audit. Add route-level budgets before catalog scale
turns the current architectural observation into a performance regression.

## 7. Content Readiness Baseline

The current Storefront baseline remains the RFC-027 baseline:

| Measure | Result |
| --- | ---: |
| Products | 2 |
| Products with descriptions | 2 / 2 |
| Products with key features | 2 / 2 |
| Products with specifications | 2 / 2 |
| Products with an official document | 2 / 2 |
| Products with an image | 1 / 2 |
| Manufacturers | 2 |
| Manufacturers with complete descriptions/country | 2 / 2 |
| Manufacturers with logo | 0 / 2 |
| Manufacturers with an official website | 1 / 2 |
| Categories | 2 |
| Categories with an image | 0 / 2 |

The aggregate schema is valid: entity IDs/slugs are unique, references resolve,
strict public schemas reject unknown internal fields, and summary counts match.
However, schema-valid is not equivalent to catalog-ready. Ambu VivaSight 2 DLT
is public without an image and fails the RFC-027 readiness rule. Manufacturer
logos and category images are non-blocking enrichment warnings.

The repository does not yet implement the separate content-quality audit gate
recommended by RFC-027. Root-relative FS510 assets exist; external document
reachability and content signatures were not revalidated in this RFC.

## 8. Security Review

### 8.1 Passed controls

- Storefront schemas are strict and reject Review, Evidence, Publication,
  artifact, checksum, and unknown workflow fields.
- Storefront JSON-LD is built only from page-local Storefront domain records.
- Serialization escapes `<`, `>`, `&`, `</script>` through character escaping,
  U+2028, and U+2029 before insertion into the server-rendered script.
- Product JSON-LD omits price, offers, availability, rating, review,
  registration, verification, provenance, evidence, hashes, and artifact paths.
- CSP, nosniff, frame denial, referrer policy, permissions policy, and COOP are
  applied globally; the Next powered-by header is disabled.
- Internal/admin routes are production-gated and noindexed. Their environment
  flags are not treated as authentication and require Deployment Protection
  when enabled.
- Lead webhook URL/token remain server-only. Input lengths and payload size are
  bounded, a honeypot and timeout are present, and the endpoint is no-store.
- No hard-coded credential or new secret was added by this RFC.

### 8.2 Release conditions and limitations

- Production must configure `CYBERMEDICA_LEADS_WEBHOOK_URL`; otherwise the main
  conversion form correctly fails closed with HTTP 503.
- If `/products/fs510` stays reachable, its Supabase URL/anon key and RLS-backed
  `public_api` projection must be verified. Without them the route degrades to a
  temporary-unavailable page despite remaining in the sitemap.
- The in-memory lead rate limiter is per-process and is not a distributed abuse
  control in a serverless/multi-instance deployment. Webhook-side throttling,
  WAF rules, and monitoring are required operational defenses.
- The CSP intentionally allows inline scripts/styles for Next.js. It blocks
  third-party image origins; future external Storefront media must be proxied or
  explicitly reviewed before changing policy.
- Dependency vulnerability status was not refreshed from the registry.
- Production logs, alerting, retention, incident response, backup, and webhook
  delivery monitoring cannot be proven from application source alone.

## 9. Production Release Checklist

Legend: `[x]` complete, `[!]` release condition, `[ ]` external/manual step.

### Architecture

- [x] Storefront public routes use Storefront services/repository only.
- [x] No Review, Publication, Research, Supabase, or FS510 imports in the
  Storefront page/component boundary.
- [x] Storefront schemas reject internal workflow metadata.
- [!] Resolve the dual FS510 public product identity per RFC-022.
- [x] Relevant architecture and migration documents match the implementation.

### Testing and build

- [x] 328 automated tests pass.
- [x] Production build passes.
- [x] ESLint passes.
- [x] Standalone TypeScript passes.
- [x] Whitespace validation passes.
- [ ] Run registry-backed dependency vulnerability scanning in CI.

### SEO and discovery

- [x] Storefront canonical paths are consistent with sitemap paths.
- [x] Metadata, Open Graph, Twitter, robots, and JSON-LD are present where
  appropriate.
- [x] Search/query pages are noindex-follow when production indexing is on.
- [!] Remove, redirect, or noindex the duplicate FS510 product identity.
- [ ] Validate deployed robots and sitemap responses.
- [ ] Validate representative product/manufacturer JSON-LD with external tools.
- [ ] Set `CYBERMEDICA_ALLOW_INDEXING=1` only after every blocking item passes.

### Content

- [x] Storefront aggregate schema and references validate.
- [x] Every product has descriptions, features, specifications, and an official
  document.
- [!] Add a usable public image and alt text to Ambu VivaSight 2 DLT, or keep
  the incomplete record hidden until it meets RFC-027.
- [ ] Verify external document URLs from the deployed region.
- [ ] Record content-owner sign-off for product claims and compatibility.
- [ ] Add the RFC-027 content-quality audit gate before mass import.

### Security

- [x] JSON-LD serializer and public-schema leak controls are tested.
- [x] Global security headers are configured.
- [x] Internal route flags fail closed in production by default.
- [ ] Confirm Deployment Protection for any enabled internal/admin surface.
- [ ] Confirm webhook destination, token rotation, WAF/rate limits, and delivery
  alerting.
- [ ] Confirm Supabase RLS and anon-only credential if the FS510 vertical remains.
- [ ] Run secret and dependency scans in the release environment.

### Operations

- [ ] Deploy a protected immutable Preview from the intended release revision.
- [ ] Smoke `/`, catalog, both product pages, manufacturers, compare, search,
  request submission, robots, sitemap, and 404 behavior.
- [ ] Confirm production environment variables without copying local secrets.
- [ ] Confirm logs, alerts, ownership, escalation path, and uptime monitoring.
- [ ] Confirm webhook data-retention and personal-data handling procedures.
- [ ] Define rollback to the previous immutable deployment and verify an owner
  can execute it.
- [ ] Enable indexing only after post-deploy smoke and SEO gates pass.

## 10. Critical Issues, Warnings, and Decision

### Production blockers

1. Dual self-canonical, sitemap-listed FS510 product routes.
2. One public product fails the RFC-027 image baseline.

### Non-blocking warnings

- manufacturer logos are absent for both current manufacturers;
- category images are absent for both current categories;
- root layout fallback metadata retains legacy “expert knowledge” positioning,
  although all audited Storefront routes override it;
- Storefront client search/filter payload size is acceptable only at the current
  small catalog scale;
- static Storefront pages have no dedicated social share image;
- request prefill still depends on the legacy product lookup;
- external link, Rich Results, Web Vitals, live environment, and dependency
  vulnerability checks remain manual/external;
- rate limiting is process-local and requires platform-level reinforcement.

### Final assessment

**NOT READY for an indexable production release.**

The codebase is build- and Preview-ready, and no critical implementation defect
was found that justified changing functionality in this RFC. Readiness is
blocked by an SEO identity decision and a content-standard violation, not by
test quality. Close those two gates, complete the external production checks,
and rerun this checklist. If they pass, the expected next classification is
**Ready for Production** without an architectural rewrite.
