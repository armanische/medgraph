# Structured Fields Integration Readiness & Migration Chain Recovery v1

**Status:** HISTORICAL LOCAL EVIDENCE — SUPERSEDED FOR MERGE READINESS

**Branch:** `codex/structured-fields-integration-readiness-v1`

**Base:** `213e841e816e5c0b62484be54cb7b004ff05a3e4`

**Date:** 23 July 2026

**Environment:** isolated local worktree and disposable local Supabase PostgreSQL only

> Independent review later found two blocking integrity defects in the v1
> approval and characteristic rollback contracts. This document remains
> historical evidence for commit `d386ca2`; current readiness is defined by
> `structured-fields-blocking-corrective-fix-v1.md`. It must not be used as a
> merge or remote-migration approval.

## Executive Summary

The previously missing Cloud migration chain has been recovered locally and
checksum-pinned. All thirteen migrations now apply in chronological order to a
clean database. A transactional SQL fixture proves the complete generic path:

```text
reviewed candidate
  -> exact field-level approve decisions
  -> service-only writer
  -> idempotent publication batch
  -> published-only Cloud Preview RPC
  -> Storefront mapper contract
  -> product-scoped rollback
  -> idempotent rollback
```

The original Hamilton-T1 recovery package was found in an uncommitted recovery
worktree. Its four files were recovered byte-for-byte, and a checksum manifest
was added. The exact immutable Hamilton source snapshot was also recovered from
commit `5ca5fe24c308fd636743eaf78874f4647749dc21`, because the published recovery
ref does not contain that path. The package remains `needs_manual_approval` and
is not a publication payload.

No remote migration, Cloud/Supabase write, publication or product approval was
performed.

## Migration Chain

The canonical local chain is pinned by
`supabase/tests/structured-fields-migration-chain-v1.json`:

| Version | Purpose | Recovery status |
| --- | --- | --- |
| `202607020001` | FS510 vertical slice | Already committed in base history |
| `202607030001` | FS510 registration claim | Already committed in base history |
| `202607180001` | Cloud Data Foundation v1 | Recovered byte-for-byte |
| `202607200001` | Shadow Read v1 | Recovered byte-for-byte |
| `202607200002` | Shadow Read schema usage | Recovered byte-for-byte |
| `202607200003` | Reference Publication Alignment v1 | Recovered byte-for-byte |
| `202607200004` | Product Import v1 | Recovered byte-for-byte |
| `202607200005` | Catalog Admin v1 | Recovered byte-for-byte |
| `202607200006` | Cloud Storefront Preview v1 | Already committed in base history |
| `202607210001` | Catalog Data Quality v1 | Recovered byte-for-byte |
| `202607210002` | Catalog Data Quality editor alignment | Recovered byte-for-byte |
| `202607230001` | Structured Product Detail fields/writer | Existing implementation plus local idempotency correction |
| `202607230002` | Structured Product Detail projection | Existing implementation |

The recovered files match the audited main-workspace files exactly. The two
Catalog Data Quality migrations are part of the chronological repository chain,
but they are not direct Structured Fields schema prerequisites and must not be
applied to staging merely because they are present in Git.

## Direct Prerequisites

`202607230001` directly requires objects introduced by Cloud Foundation and
Product Import v1:

- schemas `cloud`, `cloud_api`, `extensions`;
- `cloud.products`, `cloud.product_characteristics`;
- `cloud.publication_candidates`, `cloud.review_items`,
  `cloud.review_decisions`, `cloud.publication_events`, `cloud.audit_log`;
- `cloud.is_service_request()` and `extensions.digest()`;
- Product Import columns `source_uid`, `review_state`, generated `published`;
- `cloud.product_media` for the Storefront projection.

The projection additionally reads manufacturers, categories, application areas,
documents/storage objects and registration links defined by Cloud Foundation.

## Clean Database Evidence

The reproducible command is:

```bash
npm run qa:structured-fields:local
```

It deliberately:

1. requires the already-installed image
   `public.ecr.aws/supabase/postgres:17.6.1.147` and never pulls automatically;
2. creates a uniquely named disposable container;
3. applies a test-only `auth` bootstrap, then all thirteen migrations;
4. executes the transactional integration fixture;
5. verifies that products, features, batches and events are all zero after the
   fixture rollback;
6. stops and removes only its own container.

Observed result:

```json
{
  "status": "PASS",
  "migrationCount": 13,
  "postTest": {
    "events": 0,
    "batches": 0,
    "features": 0,
    "products": 0
  },
  "remoteConnections": 0
}
```

## Defect Found by Real Integration

The first clean-database run found an idempotency defect that static tests did
not detect. The initial publication succeeded and marked its candidate
`published`, but the retry required `approved` before checking the existing
idempotency batch. Therefore a legitimate retry failed.

The gate now allows `published` only far enough to compare the existing batch,
candidate ID and payload checksum. If no matching batch exists, a published
candidate is still forbidden from creating a new batch. Review, provenance and
service-role gates remain unchanged.

## Hamilton-T1 Review Package

Recovered package:

`data/review/product-detail-data-recovery-v1/hamilton-t1/`

Integrity:

- key features: 6;
- technical specifications: 15;
- field-level provenance references: 21;
- package status: `needs_manual_approval`;
- publishable: false;
- source UID: `330695211247`;
- immutable payload SHA-256:
  `92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb`;
- immutable file SHA-256:
  `b81ae442047ae4ed676953c2e4f119e07c0385bd7102ccd59cc01d04ff8ec89b`.

The package contains no approve decisions. Its legacy claim “more than nine
hours” conflicts with the existing repository research note describing four
hours with one battery and eight hours with two. Neither source is sufficient
for automatic approval. Battery configuration, operating conditions and market
version require explicit reviewer resolution against an allowed official
source.

Documents and registration records remain unproposed because the immutable
snapshot contains no confirmed references for them.

## Security and Data Boundaries

- The local writer is reachable only through `cloud_api` by `service_role`.
- `anon` and `authenticated` have no writer or rollback execute privilege.
- Unapproved/unpublished structured rows do not enter the projection.
- The SQL fixture contains no Hamilton identifiers or product-specific logic.
- The fixture is wrapped in `BEGIN`/`ROLLBACK` and leaves zero rows.
- Product source UID and product publication status remain unchanged by the
  structured-field writer.
- No remote credentials are read by the local QA runner.
- No Supabase URL, RPC endpoint or remote database is contacted.

## Readiness Assessment

| Gate | Status | Evidence / blocker |
| --- | --- | --- |
| Migration chain in Git worktree | Ready locally | 13 checksum-pinned migrations |
| Clean-database apply | PASS | disposable Supabase PostgreSQL |
| Review validation | PASS for contract; Hamilton remains pending | 6/15/21 package, no approve decisions |
| Service-only writer | PASS locally | real SQL function and privilege assertions |
| Idempotency | PASS after correction | initial call plus exact retry |
| Published-only RPC | PASS locally | one feature and one grouped specification |
| Mapper contract | PASS | existing TypeScript contract tests |
| Rollback | PASS locally | scoped rollback plus exact retry |
| ADR approval | Pending | ADR-005 remains Proposed |
| Staging migration | Not authorized | no remote migration performed |
| Hamilton publication | Blocked | explicit field-level human review required |

## Required Next Decision

Code review should evaluate the recovered historical migrations, the
idempotency correction and the local SQL fixture. Only after ADR-005 is accepted
and a separate staging migration plan is explicitly authorized may the chain be
compared with remote migration history and applied. Hamilton review and
publication remain separate subsequent decisions.
