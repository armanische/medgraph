# RFC-022 — Product Route Strategy

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: route, metadata, canonical, sitemap, data-source, and dependency audit
only. No code, UI, route, redirect, SEO behavior, or data changes.

## 1. Executive Summary

CyberMedica currently has two product-page systems:

1. `/catalog/[slug]` is the canonical Storefront product route. It is generic,
   catalog-derived, statically generated for active products, and serves the
   commercial equipment-discovery experience.
2. `/products/fs510` is an isolated legacy vertical. It is dynamically rendered
   from a read-only Supabase Projection and exposes verification, scoped claims,
   provenance, evidence excerpts, and publication history.

FS510 exists in both systems:

- `/catalog/fs510` declares canonical `/catalog/fs510`;
- `/products/fs510` declares canonical `/products/fs510`;
- both URLs are emitted by the sitemap;
- there is no redirect or rewrite between them.

This is technically valid because the pages serve different content, but it is
not a sustainable product-route strategy. Both pages target overlapping search
intent around the same product name/model, so separate self-canonicals create
duplicate-entity and keyword-cannibalization risk. Users can also receive two
different content contracts and availability behaviors for one product.

The recommended long-term strategy is **Option C — Hybrid**, used as a controlled
transition toward one public product identity:

- `/catalog/[slug]` becomes the only primary product URL and SEO canonical;
- Storefront remains the source for product identity, merchandising,
  specifications, documents, compatibility, related products, and CTA;
- provenance/verification data, if still a product requirement, is exposed as
  an optional read-only extension behind a narrow vertical adapter rather than
  as a second product identity;
- `/products/fs510` is preserved initially, then either redirects permanently
  to `/catalog/fs510` or becomes a non-indexable specialist/audit surface after
  an explicit SEO and product decision.

No such change is made by RFC-022.

Existing staged changes under `data/public/**` and `data/review-decisions/**`
were treated as user-owned state and were not changed.

## 2. Current State

### Route inventory

| Route | Data source | Page type | SEO role | Audience | Long-term status |
| --- | --- | --- | --- | --- | --- |
| `/catalog` | Product, Category, Manufacturer, and Search services over Storefront repository | Dynamic catalog/search landing page | Primary catalog hub; canonical `/catalog` | Buyers, procurement teams, clinicians browsing equipment | Keep |
| `/catalog/[slug]` | `ProductService`, `CatalogRepository`, Storefront Product/Manufacturer/Category | Generic Storefront detail; SSG through `generateStaticParams()` for active products | Primary scalable product-detail family; per-product self-canonical | Buyers, procurement teams, clinicians, distributor/commercial users | Keep and make the only primary product family |
| `/catalog/fs510` | Storefront FS510 Product | Instance of generic Storefront detail | Self-canonical, sitemap product entry | General catalog audience | Keep; recommended future FS510 canonical |
| `/products/fs510` | FS510 vertical loader -> read-only Supabase `public_api.product_pages`; compatibility panel also uses local compatibility data | Dynamic, `connection()`-bound vertical page with neutral error/not-found states | Separate self-canonical legacy product page; explicit sitemap entry | Users seeking registration, verification, provenance, evidence, and publication history | Transitional; merge, redirect, or make specialist/non-indexable after explicit decision |
| `/knowledge/fs510` | Separate knowledge route/data | Knowledge detail, outside the two product-page implementations | Separate self-contained sitemap entry | Legacy knowledge/research audience | Out of scope for product-route migration, but must be reviewed when FS510 vertical SEO is changed |

### `/catalog/[slug]` behavior

- Reads only Storefront services and public-safe Storefront Product fields.
- `generateStaticParams()` emits every active product slug.
- `generateMetadata()` uses product name, short description, and first image.
- Canonical is `/catalog/${product.slug}`.
- Missing or inactive products call `notFound()` in metadata and page loading.
- Displays gallery, description, key features, grouped specifications,
  documents, compatibility, related products, and commercial CTA.
- Product cards, homepage featured products, search results, manufacturer pages,
  and related-product links consistently point to `/catalog/[slug]`.
- Sitemap entries use product `updatedAt`, weekly frequency, and priority `0.72`.

### `/products/fs510` behavior

- Reads a validated page payload through the isolated FS510 Supabase Projection
  adapter.
- Uses `connection()` and `cache: "no-store"`; it is server-rendered on demand.
- Has static metadata and canonical `/products/fs510`.
- Does not call `notFound()` for absent/unavailable projection data; it renders
  a neutral temporary-unavailable page with catalog and request CTAs.
- Displays registration data, verified/published dates, scoped claims,
  limitations, source/document/version/evidence chain, excerpts, locators, and
  publication history.
- Has a dedicated loading state and static assets under `public/products/fs510`.
- Workspace links target `/products/fs510` and its `#compatibility` anchor.
- Preview smoke includes `/products/fs510`.
- Sitemap uses monthly frequency and priority `0.8`.

### Redirects and rewrites

No product redirect or rewrite is configured:

- `next.config.ts` defines headers only;
- neither route calls `redirect()` or `permanentRedirect()`;
- no middleware/proxy route mapping exists;
- `/catalog/fs510` and `/products/fs510` both return their own content.

### Robots and indexing

`app/robots.ts` applies a site-wide environment gate. When indexing is enabled,
both product routes are allowed; when disabled, the whole site is disallowed.
Neither product page declares `noindex`. Because both are in the sitemap and
self-canonical, both are intended to be indexable under the current behavior.

### Current sitemap composition

```text
app/sitemap.ts
  +--> buildStorefrontSitemap()
  |      +--> /catalog/fs510
  |      +--> all other active Storefront products
  |
  +--> buildFs510Sitemap()
         +--> /products/fs510
         +--> /knowledge/fs510
```

RFC-021 correctly isolates ownership, but isolation alone does not resolve the
duplicate product identity.

## 3. Route Comparison

| Criterion | `/catalog/[slug]` | `/products/fs510` |
| --- | --- | --- |
| Architecture | Generic Storefront route over ProductService and CatalogRepository | Isolated one-product vertical over Supabase Projection |
| Scalability | Automatically supports every active Storefront Product | Hard-coded to FS510; a new product would require another route/vertical or new generic projection design |
| Rendering | SSG for active products; metadata is product-derived | Dynamic server render with no-store projection read |
| Availability | Local deterministic Storefront data; missing product is 404 | Depends on Supabase env/network/RLS/payload; failure renders neutral unavailable state |
| SEO canonical | `/catalog/{slug}` | `/products/fs510` |
| Sitemap | Generic active-product entry, weekly, priority 0.72 | Explicit vertical entry, monthly, priority 0.8 |
| Search/navigation | Primary destination from catalog, homepage, search, manufacturers, and related products | Reached from workspace, sitemap, direct links, and preview smoke |
| Product identity | Storefront Product is the public merchandising identity | Projection payload is a separate legacy identity contract |
| Content | Name, model, manufacturer, category, descriptions, media, features, specifications, documents, compatibility, related products, CTA | Registration, verification/publication state, claims, scope, limitations, provenance, excerpts, locators, history, plus overlapping product content |
| Verification | Intentionally absent from strict public Storefront schema | Explicit verification labels, dates, and evidence chain |
| Provenance | Public documents only; no internal evidence metadata | Detailed source -> document -> version -> evidence -> verification -> publication chain |
| UX | Consistent with all catalog products and storefront positioning | Dense specialist/knowledge presentation with a separate loading/failure model |
| Audience | Product discovery, comparison, selection, commercial request | Regulatory/evidence-oriented users and historical knowledge-platform use case |
| Maintenance | One generic implementation and schema | Separate payload parser, types, adapter, component, sitemap entries, SQL contract, env, and route tests |
| Current strategic fit | Matches CyberMedica's storefront positioning | Preserves previous verification/publication positioning |

### SEO assessment

The risk is not byte-for-byte duplicate content. It is **entity duplication**:
two self-canonical URLs describe FS510, share product identity and commercial
intent, and are both discoverable through the sitemap. Search engines must
choose between a scalable catalog page and a higher-priority specialist page.
Incoming links, crawl signals, and relevance can split between them.

The static metadata also diverges operationally:

- `/catalog/fs510` title/description/image follow Storefront data;
- `/products/fs510` metadata is hard-coded and can drift from the payload or
  Storefront record;
- the vertical page has no projection-derived Open Graph image;
- the generic page's `updatedAt` drives sitemap recency, while the vertical uses
  the aggregate Storefront sitemap timestamp rather than Projection `built_at`.

These are strategy concerns, not defects to change in this audit.

## 4. Strategy Options

### Option A — Keep a separate vertical

Maintain both `/catalog/fs510` and `/products/fs510` as independent,
self-canonical, indexable pages.

Advantages:

- zero migration risk to the existing FS510 experience;
- preserves full provenance, verification, publication history, and RLS-backed
  projection behavior;
- permits specialist content and release cadence independent of Storefront;
- retains existing workspace anchors and direct links.

Disadvantages:

- permanent duplicate product identity and SEO cannibalization risk;
- two sources for overlapping product fields can drift;
- separate availability, metadata, testing, sitemap, and operational support;
- Supabase environment and projection remain required for one public product;
- does not match the new Storefront-first positioning.

Migration cost: **Low initial (0-2 engineering days)**, but **high recurring
maintenance**. Work is limited to documenting ownership and adding drift/SEO
monitoring, yet every FS510 content or platform change must consider both pages.

Primary risks: content divergence, split search ranking, inconsistent user
expectations, and indefinite retention of legacy infrastructure.

### Option B — Fully merge into Storefront

Make `/catalog/fs510` the only FS510 page. Move any approved public fields into
the Storefront product contract or intentionally remove legacy
verification/provenance sections. Permanently redirect `/products/fs510`.

Advantages:

- one product identity, canonical, sitemap entry, metadata source, and UX;
- eliminates SEO cannibalization;
- consistent search/catalog/manufacturer/compare navigation;
- removes a network dependency and one-product Supabase operational burden once
  the vertical is retired;
- best fit with the Storefront positioning.

Disadvantages:

- full provenance and publication history do not fit the current strict
  Storefront Product schema;
- copying evidence/verification fields into Storefront would weaken its
  public-safe boundary unless a new approved extension is designed;
- users relying on specialist anchors or evidence detail may lose functionality;
- redirect/canonical changes require careful rollout and monitoring.

Migration cost: **Medium to high (6-12 engineering days)** plus product/content
review. The lower end assumes provenance sections are intentionally retired;
the upper end includes a new public-safe trust-data contract and rendering.

Primary risks: loss of valuable regulatory context, accidental leakage of
internal fields, redirect/anchor regressions, and incorrect claims if old
verification labels are reproduced without the Projection policy boundary.

### Option C — Hybrid

Use `/catalog/fs510` as the primary product identity while retaining provenance
as an optional, narrowly isolated read-only capability during migration.

Possible target form:

```text
/catalog/fs510
  +--> Storefront Product (identity, merchandising, specifications, documents)
  +--> optional FS510 trust/provenance projection (specialist extension)

/products/fs510
  +--> transitional compatibility URL
       then 308 redirect to /catalog/fs510
       or noindex specialist/audit page, if independently justified
```

Advantages:

- establishes one Storefront product identity without immediately discarding
  valuable provenance;
- allows field-by-field migration and characterization tests;
- preserves the isolated Projection adapter instead of contaminating Storefront;
- reduces rollout and rollback risk;
- supports an explicit later decision on whether public provenance belongs in
  the product experience at all.

Disadvantages:

- temporary dual-source composition is more complex than either pure option;
- until redirect/noindex is applied, duplicate SEO risk remains;
- requires a clear precedence rule for overlapping fields;
- Supabase remains operational during the transition.

Migration cost: **Medium (4-8 engineering days)** for the first safe phase;
**2-4 additional days** for redirect/cleanup after monitoring and ownership
confirmation. Total expected range: **6-12 engineering days**, but it can be
split into reversible releases.

Primary risks: inconsistent fallback behavior during dual-source rendering,
stale projection badges applied to Storefront values, prolonged transition, and
premature redirect before workspace/anchor consumers are migrated.

## 5. Recommendation

Adopt **Option C — Hybrid**, with a declared end state close to Option B unless
public provenance is explicitly retained as a distinct product capability.

The governing rules should be:

1. One product has one primary public URL: `/catalog/{slug}`.
2. Storefront Product owns identity, descriptions, media, specifications,
   documents, compatibility, related products, and commercial CTA.
3. Verification/provenance data never silently changes Storefront Product
   values or status. It remains an optional read-only extension with its own
   fail-closed contract.
4. `/products/fs510` is a compatibility URL, not a second permanent product
   identity.
5. No redirect or canonical change occurs until workspace links, anchors,
   sitemap, preview smoke, metadata, and analytics baselines are accounted for.
6. If provenance is not aligned with the Storefront product strategy, retire
   those sections rather than expanding the Storefront schema with legacy
   verification/publication concepts.

### Proposed target SEO policy

Preferred end state:

- `/catalog/fs510`: indexable, in sitemap, self-canonical;
- `/products/fs510`: permanent redirect to `/catalog/fs510` and absent from
  sitemap;
- `/knowledge/fs510`: separate decision; retain only if it serves distinct
  non-product search intent, otherwise include it in the legacy-content audit.

Alternative specialist end state, only if justified by users/analytics:

- `/catalog/fs510`: primary product canonical;
- `/products/fs510`: `noindex`, not in sitemap, clearly labelled specialist
  provenance view linking back to the product canonical.

The project should not retain two indexable self-canonical FS510 product pages.

## 6. Migration Plan (if approved)

RFC-022 executes none of these steps.

### Phase 0 — Characterization

- Add route tests for both metadata objects, canonical URLs, success,
  not-found/error behavior, anchors, and sitemap entries.
- Record production analytics, backlinks, search impressions, and direct use of
  `/products/fs510` and `#compatibility`.
- Confirm whether `/knowledge/fs510` has independent value.

Risk: low. No behavior change.

Estimated cost: **1-2 days**.

### Phase 1 — Storefront ownership

- Make Storefront Product the source of overlapping FS510 fields.
- Keep the isolated Projection adapter only for registration, scoped claims,
  provenance, verification/publication dates, and history.
- Define fail-closed behavior when the optional projection is unavailable.
- Do not display verification state as a property of Storefront fields unless
  the relationship is explicitly validated.

Risk: medium. Dual-source precedence and fallback must be deterministic.

Estimated cost: **2-4 days**.

### Phase 2 — Unified experience decision

Choose one:

- render approved provenance sections inside `/catalog/fs510`; or
- retire them from the public product experience; or
- retain a non-indexable specialist page.

Update metadata generation to use the chosen canonical data owner.

Risk: medium to high depending on retained provenance scope.

Estimated cost: **2-4 days** plus content/product review.

### Phase 3 — SEO and route consolidation

- Remove `/products/fs510` from sitemap.
- Update workspace links, anchors, preview smoke, and any external navigation.
- Add a permanent redirect to `/catalog/fs510`, or apply the approved noindex
  specialist policy.
- Preserve query strings where relevant and verify canonical/robots output.

Risk: medium. Incorrect redirect timing can break anchors and search signals.

Estimated cost: **1-2 days**.

### Phase 4 — Projection retirement audit

- Re-run import/dependency and external-deployment audit.
- If unused, propose removal of the isolated FS510 loader, adapter, payload
  types, provenance component, env variables, SQL fixture/test, and schema
  assets in a separate RFC.
- Do not remove the Supabase migration contract solely because application
  imports disappear; first confirm no deployed database relies on it.

Risk: medium because repository evidence cannot prove external database use.

Estimated cost: **1-2 audit days**, excluding any later database retirement.

### Overall estimate

| End state | Engineering estimate | Organizational dependency |
| --- | --- | --- |
| Keep separate vertical | 0-2 days now; recurring maintenance | SEO acceptance and ownership monitoring |
| Full Storefront merge | 6-12 days | Product decision on provenance and registration content |
| Hybrid transition | 4-8 days initial, 6-12 days through redirect/cleanup | Product/SEO decision plus usage monitoring |

The Hybrid estimate is not necessarily cheaper in total than a direct merge;
its advantage is reversibility, smaller releases, and lower migration risk.
