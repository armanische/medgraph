# Publication Candidate Function Owner Contract Alignment v1

Date: 2026-07-29

Branch: `codex/publication-candidate-owner-contract-alignment-v1`

Base: `1b0e4c508fb46dd24e143186ef21a2b143b65457`

Verdict: **PASS**

## Contract

The authoritative owner of
`cloud.product_publication_candidate_payload_v1(uuid)` is `postgres`.

The owner is explicitly normalized by migration
`202607290002_publication_candidate_function_owner_alignment_v1.sql`.

Runtime access remains controlled independently by function ACL and the
existing application/database boundary. The function remains a `STABLE`,
security-invoker SQL function returning `jsonb`, with fixed
`search_path=pg_catalog, cloud` and no direct runtime execution for `PUBLIC`,
`anon`, `authenticated`, or `service_role`.

## Repository Owner Audit

- No existing migration established a repository-wide rule that internal
  `cloud` functions must be owned by `supabase_admin`.
- Before this corrective, the migration chain contained no explicit
  `ALTER FUNCTION ... OWNER TO ...` convention for the candidate helper.
- Local disposable QA runners execute migrations as `supabase_admin`; that
  explains the historical local owner but is not an authoritative production
  ownership contract.
- Existing production-oriented hardening documentation already records
  `postgres` ownership as compatible with independently enforced runtime ACL.
- No stronger contradictory project rule was found. The approved owner
  contract can therefore be normalized safely to `postgres`.

## Migration Evidence

Migration:
`supabase/migrations/202607290002_publication_candidate_function_owner_alignment_v1.sql`

SHA-256:
`80605a02e4f747cd169f0fe50d494eb6599a848bc18ff847a0eb4d27a3898b7f`

Exact operative SQL:

```sql
ALTER FUNCTION cloud.product_publication_candidate_payload_v1(uuid)
  OWNER TO postgres;
```

The migration contains no function replacement, grant, revoke, data mutation,
DDL for tables or columns, RLS change, lifecycle call, or candidate invocation.

The approved preceding migration remains byte-for-byte unchanged:

- file: `202607290001_publication_candidate_payload_completeness_corrective_v1.sql`;
- SHA-256:
  `38f3f9c0180960675eade1dded1b705f55e9bfa390ee12af0eaded34350fc309`.

## Upgrade and Integrity Evidence

All database checks used the already installed local Supabase PostgreSQL image
and disposable databases only.

| Scenario | Owner before `202607290002` | Owner after | Result |
| --- | --- | --- | --- |
| Fresh full chain executed by local migration role | `supabase_admin` | `postgres` | PASS |
| Production-shaped upgrade executed by `postgres` | `postgres` | `postgres` | PASS |
| Deliberately divergent local owner | `supabase_admin` | `postgres` | PASS |

Contract evidence before and after owner alignment:

| Invariant | Before | After |
| --- | --- | --- |
| Function definition MD5 | `06bb2e97bafee067710205b3bc171ba9` | `06bb2e97bafee067710205b3bc171ba9` |
| Identity arguments | `p_product_id uuid` | `p_product_id uuid` |
| Return type | `jsonb` | `jsonb` |
| Security mode | `INVOKER` | `INVOKER` |
| Volatility | `STABLE` | `STABLE` |
| Search path | `pg_catalog, cloud` | `pg_catalog, cloud` |
| Fixture candidate checksum | `f16c99142802551f87c66a5c45fa7c4f4156256554fcfeefd3086bb0cd3d830c` | `f16c99142802551f87c66a5c45fa7c4f4156256554fcfeefd3086bb0cd3d830c` |
| Candidate JSON | canonical fixture payload | byte/logically identical payload |

Hamilton-shaped fixture regression remained complete:

- SEO title: present;
- SEO description: present;
- active characteristics: 3;
- candidate characteristics: 3;
- active media: 3;
- candidate media: 3;
- old unsupported claim: absent.

## ACL and Security Evidence

| Principal | Effective EXECUTE before | Effective EXECUTE after |
| --- | --- | --- |
| `PUBLIC` | false | false |
| `anon` | false | false |
| `authenticated` | false | false |
| `service_role` | false | false |

No `GRANT` or `REVOKE` is present in the migration. PostgreSQL necessarily
re-keys the owner-only catalog ACL entry when ownership changes from
`supabase_admin` to `postgres`; this is the ownership change itself and does
not create an effective runtime grant. `cloud` exposure and existing
`cloud_api` boundaries are unchanged.

## Migration Chain and QA

The manifest contains 25 checksum-pinned migrations. Fresh chain, both upgrade
paths, rollback-scoped fixtures, and cross-foundation compatibility passed.

| Check | Result |
| --- | --- |
| `npm run qa:publication-candidate-owner:local` | PASS — fresh/Production-shaped/divergent owner paths |
| Publication Candidate DB suite | PASS — payload/checksum/body/metadata/ACL invariance |
| Hamilton completeness DB suite | PASS — approved 79-product fixture |
| `npm run qa:catalog-admin-description-sync:local` | PASS — 25 migrations |
| `npm run qa:product-publication:local` | PASS — lifecycle, concurrency, cleanup |
| `npm run qa:published-catalog:local` | PASS — projection, security, cleanup |
| `npm run qa:structured-fields:local` | PASS — isolation, projection, rollback |
| Migration manifest validation | PASS — 25/25 checksums |
| `npm test` | PASS — 488/488 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 Webpack |
| `git diff --check` | PASS |

Disposable database fixtures were removed. Remote connections and remote
writes were both zero. No Product data, Hamilton-T1 content, revision, review,
approval, publication, projection, deployment, ENV, DNS, indexing, staging, or
Production state was changed.

## Remaining Risks

- Production application of `202607290001` and `202607290002` remains a
  separate controlled task requiring explicit authorization and its own
  preflight/stop-on-error discipline.
- The applying database role must be permitted by PostgreSQL to set ownership
  to `postgres`. The Production-shaped test covers execution by `postgres`; the
  divergent local test covers normalization by the local privileged migration
  role.
- This result authorizes only controlled Production apply readiness. It does
  not authorize Hamilton-T1 revision creation, review, approval, publication,
  merge, push, or deployment.

## Decision

`cloud.product_publication_candidate_payload_v1(uuid)` now has an explicit,
deterministic `postgres` owner contract without changing its function body,
candidate payload/checksum, security properties, or effective runtime ACL.

OWNER CONTRACT ALIGNMENT: PASS

READY FOR CONTROLLED PRODUCTION APPLY: YES
