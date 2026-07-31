# Controlled Indexing Activation — 2026-07-30

## Verdict

This report records the controlled Production indexing contract for CyberMedica.
The runtime change is fail-closed: only a Vercel Production deployment bound to
the approved `cloud_published` Production Supabase project may emit indexable
public metadata. Preview, local, mismatched-project and static/catalog-preview
deployments remain non-indexable.

Production data, publication lifecycle, migrations, ENV values, DNS and RFQ
records are outside this change and are not mutated by it.

## Scope and approved baseline

| Item | Value |
| --- | --- |
| Canonical source baseline | `6813b3ba8529ec96480acf940b6113966143d554` |
| Reconciliation baseline | `c7882ffd2f54cd4978fef812f7ac5f20666e8795` |
| Indexing branch | `codex/controlled-indexing-activation-v1` |
| Canonical host | `https://cyber-medica.ru` |
| Vercel project | `medgraph` (`prj_emEZsTDpPLEaXuC8cM9URmmG0zX8`) |
| Production Supabase project | `clbzibuusyuajsylcbvl` |
| Catalog source | `cloud_published` |

The implementation does not add a mutable indexing flag. It derives the
indexing decision from exact deployment and catalog-source binding.

## Runtime contract

`lib/storefront/indexing.ts` requires all of the following:

- `VERCEL_ENV=production`;
- `CATALOG_DATA_SOURCE=cloud_published`;
- `CYBERMEDICA_SUPABASE_PROJECT_REF=clbzibuusyuajsylcbvl`;
- both server and public Supabase URLs are the exact Production project origin.

Any missing, preview, local or mismatched value returns the fail-closed result.

Production `robots.txt` allows `/` and disallows internal, authentication, API,
admin/workspace, tender, knowledge and completion routes. Preview and local
robots remain `Disallow: /`. Public Storefront metadata follows the same
binding; internal and knowledge/legacy pages retain explicit `noindex` metadata.

The Production sitemap returns only the published Storefront projection. The
static FS510/knowledge sitemap is not appended when `cloud_published` is active.

## Changed files

- `lib/storefront/indexing.ts` — exact Production indexing predicate.
- `app/robots.ts` — public allowlist/private disallow rules and Preview default deny.
- `lib/storefront/seo.ts`, `app/layout.tsx` — metadata uses the exact predicate.
- `app/sitemap.ts` — published projection only in Production.
- `app/knowledge/[slug]/page.tsx` — explicit noindex for legacy knowledge pages.
- `.env.example` — removed obsolete mutable indexing flag.
- focused SEO/infrastructure/hardening tests.
- canonical Production readiness, Preview, SEO, changelog, roadmap and launch
  evidence documentation.

No Product, publication, projection, migration, Supabase, RFQ, DNS or ENV file
was changed.

## Validation evidence

| Check | Result |
| --- | --- |
| Focused indexing/storefront tests | PASS (42/42) |
| Full test suite | PASS (503/503) |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` (Turbopack) | PASS |
| `npm run build -- --webpack` | PASS |
| `git diff --check` | PASS |
| Secret scan | PASS — no credential values, tokens, cookies or connection strings in changed files |

Known package-audit findings are pre-existing dependency advisories from the
approved lockfile; no audit remediation or dependency change is included here.

## Production verification record

The following fields are populated from the exact Production deployment and
read-only smoke performed after the implementation commit:

| Evidence | Result |
| --- | --- |
| Implementation commit | `a6dcf375de913e1d0a84433249166272a4ad1dcf` |
| Deployment ID | `dpl_H9TfiUxWyWDeDkZCFnBMkvfofvmm` |
| Deployment URL/status/time | `https://medgraph-8bz9i4b36-medgraph.vercel.app`, READY/Production, `2026-07-29T22:28:11Z` |
| Canonical alias | `https://cyber-medica.ru` |
| `/robots.txt` | PASS — HTTP 200, public allow, private/legacy disallow, apex sitemap |
| `/sitemap.xml` | PASS — HTTP 200, 2 Product URLs, published projection only |
| Public metadata | PASS — homepage/catalog/Hamilton `index, follow`, apex canonical |
| Internal/auth/API metadata | PASS — internal response `noindex, nofollow`; robots disallow `/internal/`, `/auth/`, `/api/` |
| Hamilton-T1 URL | PASS — present exactly once at the approved slug |
| Unpublished/static Product URLs | PASS — 77 unpublished Products, legacy knowledge and FS510 routes absent |
| RFQ route/API contract | PASS — `/request` 200, GET `/api/request` 405 |
| Production database writes | None — deployment and smoke were read-only |

The deployment was executed from the clean worktree at the implementation
commit above; Vercel inspection returned `target=production` and
`readyState=READY`. The Vercel generated URL is retained as deployment
evidence only; public canonical metadata and sitemap use the apex domain.

## Production smoke details

The canonical smoke returned HTTP 200 for `/`, `/catalog`, Hamilton-T1,
`/manufacturers`, `/request`, `/robots.txt` and `/sitemap.xml`. The public
`robots.txt` contained `Allow: /`, the three mandatory private disallows, and
the apex sitemap. The sitemap now contains 2 apex HTTPS Product URLs: the
published Hamilton-T1 and Mindray SV300 Products, plus 25 manufacturer
reference pages and the six approved Storefront entry routes; it contains no
`www`, Vercel, query, internal, auth, API, knowledge, static FS510 or other
Product URL. Hamilton-T1 and Mindray render their approved projection data;
Hamilton-T1 rendered three
characteristic rows, six image tags for its three media assets, the approved
autonomy claim, and zero occurrences of the retired `более 9 часов` claim.

The internal review route redirected unauthenticated access to the internal
login flow and returned `x-robots-tag: noindex, nofollow`; no internal content
was exposed. `www.cyber-medica.ru` returned HTTP 301 to the apex and HTTP on
the apex returned the expected permanent HTTPS redirect.

Preview/default-deny behavior is covered by the exact-environment unit tests:
Preview, local and mismatched-project bindings return global `Disallow: /` and
`noindex`; no Preview deployment or Preview ENV was changed in this task.

## External webmaster registration

The corporate Yandex Webmaster owner is preserved through the existing DNS
verification for `info@cyber-medica.ru`; the canonical sitemap remains
submitted. The obsolete HTML verification artifact associated with a previous
personal Yandex account was removed from the current repository and Production
baseline without changing DNS or sitemap state. Revocation of that account's
Webmaster access remains a manual action for the corporate owner.

Google Search Console ownership/registration remains an account-level
operation. No password, cookie, verification token or DNS value is recorded in
this report.

## Published catalog addendum — 2026-07-30

After the controlled Agilia SP MC lifecycle, the same projection-only indexing
contract exposes exactly three Product URLs: Hamilton-T1, Mindray SV300 and
Agilia SP MC. Production remains at 79 Products, now 3 Published and 76
Unpublished. Projection version is 5. The Agilia Product Detail and sitemap
returned HTTP 200; no unpublished Product URL or internal evidence was exposed.

## Rollback

Rollback is a Vercel deployment rollback to the prior approved Production
deployment. It does not modify Supabase data or publication state. If the
deployed robots contract remains globally disallowed, exposes a non-published
URL, emits `noindex` for the public Hamilton page, or leaks an internal/API
route, stop indexing activation and roll back before any webmaster submission.

## Published catalog addendum — 2026-07-31

Publication Wave 1 preserved the projection-only indexing contract. Sitemap now
contains exactly 13 Product URLs: the prior three and ten Wave 1 Products.
Production is 79 Products, 13 Published and 66 Unpublished; projection version
is 15. No internal, Auth, API or unpublished Product URL was introduced.

## Published catalog addendum — Wave 2

Publication Wave 2 also preserved the projection-only indexing contract.
Sitemap now contains exactly 28 Product URLs; Production is 79 Products, 28
Published and 51 Unpublished, and projection version is 30. The fifteen Wave 2
Product Detail routes return HTTP 200. No internal, Auth, API or unpublished
Product URL was introduced.
