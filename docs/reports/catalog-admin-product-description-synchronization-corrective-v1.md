# Catalog Admin Product Description Synchronization Corrective v1

**Status:** PASS

**Date:** 28 July 2026

**Branch:** `codex/catalog-admin-description-sync-corrective-v1`

**Base:** `875d85f90a0e57c017bad4c05a089e47d68fb68d`

**Runtime commit:** `cfa5f20f3de4c8006da75ce165cc1ea51ee7b55f`

## Executive summary

The existing Catalog Admin patch function now requires the approved
`expectedUpdatedAt` concurrency token and atomically synchronizes active
description content between `cloud.products` and the single canonical
`cloud.product_descriptions(locale = 'ru')` row. Other locales and immutable
source provenance remain unchanged.

Migration `202607280002` passed the clean 23-migration local chain, generic
atomicity/concurrency regressions, the exact immutable 79-product Hamilton-T1
regression, and the existing publication/projection/structured-field suites.
It was then applied once to Production project `clbzibuusyuajsylcbvl` through
the official Supabase migration command after an exact one-migration dry-run.
Production business data remains empty.

## Migration

| Property | Result |
| --- | --- |
| File | `202607280002_catalog_admin_product_description_sync_corrective_v1.sql` |
| SHA-256 | `4731174956ff983251a0dfc95df2689b422bc4da6ab49a6029b41c0807de4297` |
| Change type | Additive `CREATE OR REPLACE FUNCTION` only |
| Tables/schema/RLS changes | None |
| SQL signature | Unchanged: `cloud.catalog_admin_patch_product(uuid,jsonb,text)` |
| Wrapper | Unchanged |
| Function owner | `postgres` before and after |
| Security mode | `SECURITY DEFINER` before and after |
| Search path | `pg_catalog, cloud, extensions` before and after |
| Body MD5 | `f9caeda28719395076326cb5502c98d7` → `bf7e15acc39049fc6c60abd59be70bd3` |

## Description data-model mapping

`cloud.product_descriptions` has a UUID primary key, a Product foreign key,
`locale`, short/full description fields, and a unique constraint on
`(product_id, locale)`. It has no independent active/current or type marker.
The import workflow creates one `ru` row per imported Product. The publication
revision payload includes every Product description ordered by locale and ID.

The approved canonical mapping is therefore unambiguous:

| Active Product field | Canonical normalized field |
| --- | --- |
| `cloud.products.short_description` | `cloud.product_descriptions.short_description`, same Product, `locale='ru'` |
| `cloud.products.full_description` | `cloud.product_descriptions.full_description`, same Product, `locale='ru'` |

No other locale participates in this mapping.

## Function contract

Before the corrective, the function updated Product columns without a version
token and did not update normalized description rows. After the corrective:

- `p_patch.expectedUpdatedAt` is mandatory;
- the value must be ISO 8601 with an explicit timezone;
- the Product row is locked and its `updated_at` must match exactly;
- stale and concurrent-loser writes fail closed;
- description edits require and lock the same Product's canonical `ru` row;
- Product and `ru` description receive one shared change timestamp;
- missing `ru` state or any later failure rolls back the whole operation;
- other locales, Products, provenance, and publication contracts are untouched.

## Local evidence

The targeted disposable PostgreSQL runner applied all 23 migrations from zero
and passed:

- mandatory/malformed/timezone-free token rejection;
- short-only, full-only, and combined description patches;
- non-description patch with no canonical description row;
- missing and duplicate canonical-row handling;
- stale version rejection with zero mutation;
- forced post-Product description failure with complete rollback;
- Product-scoped and locale-scoped isolation;
- two-connection concurrency where the second old-token writer waits and then
  fails stale;
- unchanged function signature and hardened ACL matrix.

Result: `Catalog Admin description synchronization local integration PASS`.

## Hamilton-T1 production-shaped regression

The regression reads the approved immutable Product Data exclusively from Git
commit `5ca5fe24c308fd636743eaf78874f4647749dc21`.

| Evidence | Result |
| --- | --- |
| Dataset SHA-256 | `13176ac8b5a7ffca86ecae0250a3345dd2ddcdda75ee8e1445e85546ccd3ca8c` |
| Imported Products | 79 |
| Automatically published Products | 0 |
| Hamilton source UID | `330695211247` |
| Hamilton source checksum | `92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb` |
| Historical claim present before patch | Yes, in imported active state and immutable snapshot |
| Historical claim in active Product after patch | 0 occurrences |
| Historical claim in canonical `ru` row after patch | 0 occurrences |
| Approved claim in active state | Present |
| Immutable snapshot/checksum after patch | Unchanged |
| Other Products changed | 0 of 78 |
| Revision number | 1 |
| Historical claim in revision JSON | 0 occurrences |
| Approved claim in revision JSON | Present |
| Revision checksum vs patched active payload | Exact match |
| Review Decisions / Approvals / Publication Batches | 0 / 0 / 0 |

The disposable transaction was rolled back and the database removed.

## Regression and application QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 482/482 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS |
| `git diff --check` | PASS |
| Secret scan | PASS |
| Conflict-marker scan | PASS |
| Product Publication disposable regression | PASS |
| Published Catalog disposable regression | PASS |
| Structured Fields disposable regression | PASS |

All local database fixtures were disposable. Local regression remote
connections and writes were zero.

## Production apply

Preflight confirmed:

- target project `clbzibuusyuajsylcbvl` through the exact Production DB
  endpoint and role binding;
- backup SHA-256
  `6a37a8ebb35e76fc0d6569df4d5983a198eda657e36a4e71a7d47175dfdce89f`;
- ledger 22, latest `202607280001`, target migration absent;
- Products, Published Products, references, imports, reviews, revisions,
  approvals, and publication batches all zero;
- projection version 0 and v4 initialized;
- original function signature, owner, security mode, search path, and ACL;
- official CLI dry-run proposed only `202607280002`.

The official Supabase CLI applied `202607280002` once. No retry or ad hoc SQL
repair was performed.

Postflight:

| Property | Result |
| --- | --- |
| Migration ledger | 23 |
| Latest migration | `202607280002` |
| Target ledger rows | 1 |
| ACL/RLS regression | PASS, 16/16 internal functions |
| Service-only Catalog Admin wrapper | PASS |
| Published RPC | PASS, 0 Products |
| Products / Published Products | 0 / 0 |
| Manufacturers / Categories / Application Areas | 0 / 0 / 0 |
| Import runs / sources / Products | 0 / 0 / 0 |
| Review items / decisions | 0 / 0 |
| Revisions / approvals / batches | 0 / 0 / 0 |
| Audit log | 0 |
| Projection version | 0 |
| v4 initialization evidence | Preserved: 1 |

## Invariance and decision

- Product Import RPC was not changed.
- Product Publication and Revision payload contracts were not changed.
- Published Projection, Repository, ProductService, Storefront, UI, Product
  Data, and immutable snapshots were not changed.
- No Product was imported to Production.
- Human Review, Approval, and Publication were not performed.
- Production ENV, deployment, DNS, TLS, and indexing were not changed.
- `main` and `production` Git refs were not changed.
- Hamilton-T1 lifecycle was not resumed.

**Final verdict: PASS.** The corrected database contract is ready for the
separately authorized Production Hamilton-T1 lifecycle, whose caller must pass
the current `updatedAt` value as `expectedUpdatedAt`.
