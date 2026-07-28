# Publication Candidate Payload Completeness Corrective v1

**Date:** 29 July 2026

**Branch:** `codex/publication-candidate-payload-completeness-corrective-v1`

**Base:** `b901335c2b6ff740c9e4b90c3782a9a4e4197963`

**Verdict:** PASS — ready for independent regression review and a separately authorized Production apply

## 1. Scope

The corrective replaces only the existing internal
`cloud.product_publication_candidate_payload_v1(uuid)` definition through one
additive forward migration. It adds canonical Product SEO and active publishable
characteristics to the immutable revision candidate. No lifecycle RPC,
Storefront projection, Product content, schema table, UI or runtime repository
contract changed.

Production, staging and all remote systems were intentionally not connected.
No Production revision, Human Review decision, approval, publication batch or
publication action was executed.

## 2. Candidate schema diff

Before:

```text
schemaVersion
product (without SEO)
descriptions
applicationAreas
media
documents
registrations
```

After:

```text
schemaVersion
product (+ seoTitle, + seoDescription)
descriptions
+ characteristics
applicationAreas
media
documents
registrations
```

No existing key was removed or renamed. `schemaVersion` remains `1` because the
change is additive and existing JSON consumers do not use a closed candidate
schema.

## 3. SEO source and normalization

| Candidate field | Canonical source | Normalization |
| --- | --- | --- |
| `product.seoTitle` | `cloud.products.seo_title` | trim; empty -> `null` |
| `product.seoDescription` | `cloud.products.seo_description` | trim; empty -> `null` |

There is no per-locale SEO table. The canonical editable locale remains the
single `ru` Product description row, while Product is the only SEO source. No
arbitrary locale or fallback was introduced.

## 4. Characteristic contract

```json
{
  "key": "legacy:<key> | structured:<structured_item_id>",
  "contentKind": "legacy_metadata | technical_specification",
  "recordOrigin": "legacy | structured_product_detail",
  "label": "<display_name>",
  "value": "<normalized_value>",
  "unit": "<unit or null>",
  "group": {
    "key": "<group_key or general>",
    "title": "<group_title or Характеристики>",
    "sortOrder": 0
  },
  "sortOrder": 0
}
```

Stable identity is the existing Product-scoped `key` for legacy rows and the
existing `structured_item_id` for Structured Fields, with explicit namespaces.
Existing unique indexes reject ambiguous active identities.

Exact order:

1. normalized group sort order;
2. normalized group key;
3. characteristic sort order;
4. namespaced stable key;
5. lower-cased trimmed canonical display name;
6. exact canonical display name.

Characteristic UUID, physical row order, timestamps, raw values, internal
source references and moderation metadata do not participate.

## 5. Checksum and invalidation evidence

The SHA-256 algorithm and revision/approval/publication functions are unchanged.
All existing lifecycle checks recompute the same expanded candidate helper.

The disposable fixture proved:

- 100 repeated reads return the same payload and checksum;
- changing only SEO title changes the checksum;
- changing only SEO description changes the checksum;
- restoring SEO restores the original checksum;
- changing characteristic value, unit or order changes the checksum;
- adding or removing a characteristic changes the checksum;
- reinserting identical business content under a different UUID/source restores
  the exact checksum;
- raw/internal metadata, archived-row content and Product `updated_at` do not
  change the checksum;
- an immutable reviewed revision is rejected as stale at approval after an SEO
  mutation and after a characteristic mutation.

Checksum evidence:

| Evidence | SHA-256 |
| --- | --- |
| Existing Production incomplete Hamilton preflight (read-only evidence supplied before this task) | `f10ab71802eb3ae5cae76ce4be842a035aa9863e51a30d41a014697c89d89e68` |
| Expanded Hamilton approved-79 local fixture | `1e66114fcbbee393c502ae887be8bbfb0a9f3b93acd18ea133c1c0c2a0edf9e9` |
| Fixed-ID deterministic completeness fixture | `f16c99142802551f87c66a5c45fa7c4f4156256554fcfeefd3086bb0cd3d830c` |

The Hamilton value is a local fixture checksum, not a prediction of the future
Production checksum. Existing v1 candidate sections contain environment-local
Product/media/description identifiers, so whole-revision checksums are intended
for exact validation inside one environment. The new characteristics subarray
was independently proven identical across different UUID/source-reference rows.

## 6. Hamilton-T1 regression

The approved immutable 79-Product Git snapshot was imported only into a
disposable local database and rolled back:

| Field | Active | Candidate |
| --- | ---: | ---: |
| SEO title | 1 | 1 |
| SEO description | 1 | 1 |
| Characteristics | 3 | 3 |
| Media | 3 | 3 |
| Canonical `ru` description | 1 | 1 |

Characteristic keys were exactly `legacy:raw-001`, `legacy:raw-002`,
`legacy:raw-003`. The historical unsupported claim was absent. Decisions,
approvals, publication batches and published Products remained `0` in this
fixture.

## 7. Migration and security evidence

- Migration: `202607290001_publication_candidate_payload_completeness_corrective_v1.sql`.
- SHA-256: `38f3f9c0180960675eade1dded1b705f55e9bfa390ee12af0eaded34350fc309`.
- Migration chain: `24/24`, checksum-pinned and clean-applied from zero.
- Function owner: `supabase_admin` (preserved).
- Function mode: security invoker (`securityDefiner=false`), `STABLE`.
- Fixed setting: `search_path=pg_catalog, cloud`.
- Direct execute: `PUBLIC=false`, `anon=false`, `authenticated=false`,
  `service_role=false`.
- Approved `cloud_api` wrapper permissions remained unchanged.
- No dynamic SQL and no new grant, RLS policy, table, column, backfill or data
  mutation.
- Existing ACL, publication, Structured Fields and Published Projection
  regression suites passed.

## 8. QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 487/487 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next 16.2.9 Webpack |
| `npm run qa:catalog-admin-description-sync:local` | PASS — 24 migrations; Hamilton + candidate completeness |
| `npm run qa:product-publication:local` | PASS — publication lifecycle/concurrency/cleanup |
| `npm run qa:published-catalog:local` | PASS — projection/security/cleanup |
| `npm run qa:structured-fields:local` | PASS — structured writer/projection/rollback compatibility |
| migration manifest validation | PASS — 24/24 SHA-256 |
| `git diff --check` | PASS |

All database suites used disposable local PostgreSQL containers. Their fixtures
were rolled back or removed. Remote connections = 0; remote writes = 0.

## 9. Invariance and remaining risk

- Production Product Data, lifecycle evidence, projection and migration ledger
  were not read or changed during this task.
- Staging was not connected or changed.
- Storefront projection, ProductService, Repository, UI, routing, ENV, DNS, TLS
  and indexing were not changed.
- `docs/00-product/ui-constitution.md` was not changed.
- `missing_documents` and `missing_registration` remain warnings outside this
  corrective.
- A separately authorized Production preflight/apply and post-apply read-only
  regression gate are still required. Production revision creation must occur
  only after that gate passes.

## 10. Verdict

The blocking fingerprint gap is closed locally without weakening the existing
publication, projection or ACL boundaries.

**READY FOR PRODUCTION APPLY: YES**
