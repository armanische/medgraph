# RFC-020 — Supabase Projection Audit

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: dependency isolation audit only. No runtime, UI, Supabase schema, data,
route, pipeline, or behavior changes.

## 1. Executive Summary

The active Supabase Projection dependency is already narrow but is not yet
replaceable as a whole. Exactly one Next.js route, `/products/fs510`, reads
Supabase data. Its runtime chain is:

```text
app/products/fs510/page.tsx
  -> lib/public-product-page.ts
  -> lib/supabase/server.ts
  -> public_api.product_pages
```

The adapter is server-only, uses the anon key, sends an `Accept-Profile` for
`public_api`, performs only a `GET`, and sets `cache: "no-store"`. No browser
component imports the Supabase adapter. No Supabase SDK is installed or used;
the adapter calls the REST endpoint with `fetch`.

The primary Storefront, including `/`, `/catalog`, `/catalog/[slug]`,
`/manufacturers`, `/manufacturers/[slug]`, `/compare`, `/search`, and most
sitemap generation, has no Supabase Projection dependency. Internal Review,
Import Center, Wave 2 Dashboard, Wave 2 execution, and retained Publication
modules do not call the Supabase adapter either.

FS510 already exists as an active Storefront Product and can supply the public
merchandising portion of the old page: identity, descriptions, media, key
features, specifications, documents, compatibility, related products, and
updated timestamp. Projection remains necessary only while the legacy page
continues to render registration details not represented in Storefront,
verification/publication status and dates, scoped claims and limitations,
evidence excerpts and locators, provenance, and publication history.

Therefore the correct next step is a route/data-contract migration, not a
Supabase deletion. Migrate the public merchandising surface of
`/products/fs510` to `ProductService`, explicitly decide whether the old
verification/provenance UI is still a product requirement, and only then make
the projection optional or retire it in a separately approved RFC.

Existing staged changes under `data/public/**` and `data/review-decisions/**`
were treated as user-owned state and were not changed.

## 2. Dependency Graph

### Runtime read graph

```text
/products/fs510
       |
       v
getPublicProductPage("fs510")
       |
       v
createServerSupabaseClient().getProductPage(slug)
       |
       v
Supabase REST: public_api.product_pages
       |
       v
projection.product_pages
       |
       v
RLS: private.is_public_product_page_active(...)
       |
       +--> projection.product_page_publications
       +--> publication.current_state (all linked records must be active)
```

The page receives only the public view row fields
`product_id`, `locale`, `page_payload`, `projection_version`, and `built_at`.
The application parser returns only the validated `page_payload`; database ids,
hashes, and projection metadata are not rendered.

### Write/build graph encoded in the Supabase migration

The direction proposed in the RFC describes the conceptual domains, but the
implemented data flow runs from verification to the public page:

```text
source evidence
       |
       v
knowledge.result_revisions
       |
       v
factory_api.verify_result_revision(...)
       |
       v
knowledge.verifications
       |
       v
factory_api.activate_publication(...)
       |
       v
publication.records / decisions / current_state
       |
       v
factory_api.upsert_product_page(...)
       |
       v
projection.product_pages
       |
       v
public_api.product_pages
       |
       v
lib/public-product-page.ts
       |
       v
/products/fs510
```

The Next.js application does not call the three `factory_api` functions. They
exist only in the Supabase migration, fixture, and SQL smoke test. Runtime web
access is read-only.

### Adjacent references, not Projection imports

- `lib/storefront/storefront-sitemap.ts` preserves `/products/fs510` as the
  canonical FS510 URL, but does not query Supabase.
- Workspace mock data and its UI link to `/products/fs510` and its compatibility
  anchor, but do not load projection data.
- `scripts/qa/preview-smoke.ts` checks the URL, but does not import the adapter.
- `lib/compatibility/mock-data.ts` supplies the compatibility panel independently
  of Supabase and links to FS510 documents.
- Tender mock records called `published_projection` are local test/demo models,
  not Supabase consumers.

No executable import cycle was found.

## 3. Production Usage

### Active route matrix

| Route / surface | Production usage | Internal usage | Wave 2 usage | Projection role |
| --- | --- | --- | --- | --- |
| `/products/fs510` | Direct server-side read through `getPublicProductPage()` | None | Legacy route is documented as Wave 2-adjacent, but it does not import or execute Wave 2 | Sole active Supabase Projection consumer |
| `/catalog/fs510` | Storefront ProductService | None | None | No Projection dependency |
| Primary Storefront routes | Storefront services/repository | None | None | No Projection dependency |
| `/workspace` | Links to `/products/fs510` | Local mock workspace only | No pipeline call | Navigation dependency only |
| `/internal/reviewer` | No Supabase import | Canonical Human Review | Reads persisted Review inputs | None |
| `/internal/review-queue` | No Supabase import | Read-only Human Review projection | None | None |
| `/internal/import-center` | No Supabase import | Reads Wave 2 summaries | Displays `supabaseWrites=false` safety metric | None |
| `/internal/wave2` | No Supabase import | Reads Wave 2 summaries | Read-only metrics | None |

### `/products/fs510` data ownership

| Page data | Current source | Storefront availability | Classification |
| --- | --- | --- | --- |
| Name, model, manufacturer, category | Supabase `page_payload` | Available in Storefront Product plus Manufacturer/Category services | Group A |
| Short/full description | Supabase `page_payload` | Available | Group A |
| Hero image | Supabase `page_payload` | Available through `ProductMedia` | Group A |
| Key summary/features | Supabase `page_payload` | Available through `keyFeatures` | Group A |
| Characteristics | Supabase `page_payload` | Available through grouped `ProductSpecification` | Group A |
| Documents and public links | Supabase source objects | Available through public-safe `ProductDocument` | Group A for document list; provenance detail is not equivalent |
| Compatibility | Local compatibility mock, not Supabase | Available through `ProductCompatibility` | Group A |
| CTA and related navigation | Route-local UI | Supported by Storefront product slug/id | Group A |
| Registration number/status | Supabase `page_payload.registration` | Storefront has registration documents but no structured number/status | Group B |
| Publication status and timestamps | Supabase `page_payload.publication` | Not in Storefront Product | Group B |
| Verification status/date | Supabase nested source metadata | Intentionally absent from public Storefront schema | Group B |
| Scoped claims, applies-to, limitations | Supabase `page_payload.claims` | Not represented by ProductSpecification | Group B |
| Evidence locator/excerpt | Supabase `page_payload.sources` | Intentionally absent from Storefront ProductDocument | Group B |
| Source/document/version provenance chain | Supabase `page_payload.sources` | Storefront exposes only public document fields | Group B |
| Publication history | Supabase `page_payload.publicationHistory` | Not in Storefront schema | Group B |
| Projection version/build timestamp | Supabase row | Parsed row type only; not rendered | Not required by current UI |

There is intentional overlap between Storefront and Projection. It should not
be resolved by silently merging the schemas: Storefront is public-safe and
merchandising-oriented, while the old Projection contract exposes knowledge,
verification, and publication concepts that the current repositioning is
removing from the main UI.

## 4. Internal Usage

No internal route or operational TypeScript command imports
`lib/supabase/server.ts`, `lib/public-product-page.ts`, or
`types/public-product-page.ts`.

Internal appearances of the word `supabase` are one of the following:

- safety metrics such as `supabaseWrites=false` in Wave 2 and Import Center;
- negative assertions preventing Supabase writes/imports in tests;
- environment/deployment documentation;
- future persistence notes for Human Review;
- non-executable architecture history.

Retained file-based Publication and Human Review do not populate the Supabase
Projection. The SQL fixture is the only repository-owned sample that performs
the verification -> publication -> projection sequence for FS510.

### Supabase assets

| Asset | Usage | Classification |
| --- | --- | --- |
| `supabase/migrations/202607020001_fs510_vertical_slice.sql` | Defines source, verification, publication, projection, RLS, `public_api`, and factory commands | Group B; active database contract for the legacy route |
| `supabase/fixtures/202607020001_fs510_mvp.sql` | Seeds and publishes the FS510 vertical slice | Group B while a target Supabase project relies on the route |
| `supabase/tests/001_fs510_smoke.sql` | Verifies database constraints and public projection behavior | Group B while schema remains supported |
| `supabase/RUN.md` | Operational instructions and schema exposure boundary | Group B documentation |

### Wave 2 relationship

Wave 2 has no runtime import or data-write edge to Supabase. Its reports assert
`supabaseWrites=false`; this is a safety invariant, not Projection usage.
The `/products/fs510` label as a Wave 2 route is historical ownership. Its
actual data is populated by the standalone SQL vertical-slice fixture, not the
Wave 2 orchestrator. Accordingly, nothing in Wave 2 blocks migration of the
merchandising fields, but preserving the legacy evidence/verification page may
be a product-level blocker.

## 5. Candidate Migration

### Group A — Can migrate to Storefront

- `/products/fs510` identity, descriptions, image, key features,
  specifications, documents, compatibility, CTA, and related-product data.
- Metadata description can be constructed from Storefront Product.
- The FS510 sitemap entry can remain at the same URL while its loader changes,
  or be moved to `/catalog/fs510` only in a separately approved URL/SEO RFC.
- Workspace links can remain unchanged if the compatibility URL is retained.

These fields already exist in `data/storefront/products/fs510.json` and are
available through `ProductService`; no Supabase fallback is required for them.

### Group B — Requires Supabase under current behavior

- structured registration number/status;
- verification decision/status and verified date;
- publication status/date;
- scoped claims, applicability, and limitations;
- source/document/version/evidence provenance;
- evidence excerpts and locators;
- publication history;
- fail-closed RLS check that all linked Publications remain active.

These are required only to preserve the exact legacy page behavior. If the
storefront repositioning explicitly removes those sections, they should not be
copied into Storefront merely to preserve a legacy contract.

### Group C — Blocked by Wave 2 or unresolved ownership

No direct code migration is blocked by the Wave 2 runtime. The following items
are blocked by ownership/product decisions often described as Wave 2 legacy:

- whether `/products/fs510` remains a distinct canonical URL or redirects to
  `/catalog/fs510`;
- whether provenance, verification, and publication-history sections remain
  public at all;
- whether registration metadata becomes a public-safe Storefront extension or
  is removed from this page;
- whether any external deployment still depends on the Supabase migration,
  fixture, RLS policy, or `public_api.product_pages` contract.

Until those decisions are explicit, the Supabase files and adapter must remain.

### Safe isolation sequence for a future RFC

1. Add route-level characterization tests for current success, not-found, error,
   metadata, and public data behavior.
2. Load Group A fields through `ProductService` without changing the URL or UI.
3. Put Group B behind an explicit projection repository interface or remove its
   UI only in an approved behavior-change RFC.
4. Decide the canonical FS510 URL and update sitemap/workspace/smoke references
   atomically if it changes.
5. Confirm no production deployment or operator relies on the Supabase schema.
6. Audit imports again; only then propose removal of the adapter, types, SQL
   fixture/test, and environment variables.

## 6. Risks

- Migrating only visible values but retaining verification labels could make
  Storefront data appear verified without the Projection's active-publication
  RLS guarantee.
- Copying evidence, review, or publication metadata into Storefront would break
  its strict public-safe contract and reverse the completed isolation work.
- Redirecting `/products/fs510` without an SEO decision can break its canonical
  URL, anchors, sitemap entry, preview smoke checks, and workspace links.
- Removing Supabase environment variables before the route migration makes the
  legacy page return its neutral unavailable state for every request.
- Removing SQL/RLS assets before confirming external database usage can leave
  an undocumented deployed contract with no reproducible migration or smoke
  test.
- The loader catches and logs all projection failures. A future dual-source
  implementation must remain fail-closed and must not silently present stale
  verification/publication state.
- There are no focused TypeScript tests for the Supabase adapter/parser today;
  existing coverage is primarily SQL smoke coverage and build behavior.

## 7. Recommendation

Keep the current Supabase Projection intact for this RFC. Treat
`lib/supabase/server.ts` plus `lib/public-product-page.ts` as a quarantined
legacy adapter owned solely by `/products/fs510`; no new route may import it.

Approve a separate FS510 route migration next. The preferred target is:

```text
/products/fs510
       |
       v
ProductService.getProductBySlug("fs510")
       |
       v
Storefront Product
```

Preserve the URL initially to avoid an SEO/anchor change. Render only the
Storefront-supported product fields unless product owners explicitly require a
separate public provenance feature. If provenance must remain, introduce a
narrow read-only Projection repository for those Group B fields rather than
letting the page or Storefront service import Supabase directly.

After the route has no Projection dependency and external database usage is
confirmed absent, a later removal RFC can evaluate:

- `lib/public-product-page.ts`;
- `lib/supabase/server.ts`;
- `types/public-product-page.ts`;
- `components/product-page/ProvenanceChain.tsx`;
- Supabase FS510 migration/fixture/smoke assets;
- the two `NEXT_PUBLIC_SUPABASE_*` variables.

None of those files is safe to delete in RFC-020.
