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
| Secret scan | Pending final pre-commit scan |

Known package-audit findings are pre-existing dependency advisories from the
approved lockfile; no audit remediation or dependency change is included here.

## Production verification record

The following fields are populated from the exact Production deployment and
read-only smoke performed after the implementation commit:

| Evidence | Result |
| --- | --- |
| Implementation commit | To be recorded at commit time |
| Deployment ID | To be recorded from Vercel Production result |
| Deployment URL/status/time | To be recorded from Vercel Production result |
| `/robots.txt` | Expected: HTTP 200, public allow, private disallow |
| `/sitemap.xml` | Expected: HTTP 200, published projection only |
| Public metadata | Expected: index/follow, apex canonical |
| Internal/auth/API metadata | Expected: noindex and/or robots disallow |
| Hamilton-T1 URL | Expected: present exactly once |
| Unpublished/static Product URLs | Expected: absent |
| RFQ route/API contract | Expected: `/request` 200, GET `/api/request` 405 |
| Production database writes | None |

## External webmaster registration

Yandex Webmaster and Google Search Console ownership/registration are
account-level operations. If an authenticated account is not already available
in the browser, this technical gate remains complete while those two statuses
are reported as `PENDING USER INTERACTION`; no password, cookie or token is
requested or recorded by this task.

## Rollback

Rollback is a Vercel deployment rollback to the prior approved Production
deployment. It does not modify Supabase data or publication state. If the
deployed robots contract remains globally disallowed, exposes a non-published
URL, emits `noindex` for the public Hamilton page, or leaks an internal/API
route, stop indexing activation and roll back before any webmaster submission.
