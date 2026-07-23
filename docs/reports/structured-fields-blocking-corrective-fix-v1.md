# Structured Fields Blocking Corrective Fix v1

**Status:** LOCAL READY FOR CODE REVIEW

**Corrective branch:** `codex/structured-fields-blocking-corrective-fix-v1`

**Corrective base:** `f028480f79fc49c1014d598e1e6a2df089cb6fce`

**Independent review commit / remote SHA:**
`f028480f79fc49c1014d598e1e6a2df089cb6fce`

**Environment:** isolated worktree and disposable local Supabase PostgreSQL only

**Date:** 23 July 2026

## Executive Summary

The two blocking findings from the independent review are corrected without
editing either historical Structured Fields migration.

1. Publication now accepts an immutable candidate revision rather than a
   mutable candidate ID. Database-calculated SHA-256 values bind canonical
   payload, product identity/version, candidate approval and every field
   decision.
2. Structured characteristics now use a separate managed origin and stable item
   identity. The writer performs inserts in its own namespace, never UPSERTs a
   legacy row, and records full before/after mutation evidence for exact
   product-scoped rollback.

The corrective code has not been committed or pushed. No remote migration,
Cloud/Supabase write, publication, preview or Production action was performed.

## Review Evidence Preservation

The independent review report was committed alone in the review worktree with
message `docs: record structured fields blocking review`. Commit and remote
branch SHA both equal:

`f028480f79fc49c1014d598e1e6a2df089cb6fce`

The corrective worktree was created from that commit. No runtime or migration
change was added to the review branch.

## Blocker 1 — Immutable Approval Binding

### Revision strategy

`cloud.product_detail_candidate_revisions` is an immutable relation. Each row
contains:

- candidate ID and monotonic revision number;
- product ID;
- schema version;
- canonical candidate JSONB;
- full product identity/version JSONB;
- candidate-only, product-identity and combined payload SHA-256 values;
- creator and creation timestamp.

Update and delete triggers reject any revision mutation. Editing an editable
candidate therefore requires a new revision. Revision creation is service-only,
idempotent for identical canonical content and calculates all hashes inside
PostgreSQL.

### Canonical hash strategy

The combined hash is calculated over canonical PostgreSQL JSONB:

```text
{
  schemaVersion,
  productIdentity,
  candidatePayload
}
```

The candidate payload contains feature/specification ordering, grouping, units
and provenance. Array order is retained by JSONB. The product snapshot contains
product ID, source UID/checksum, snapshot version, import batch key and product
`updated_at`. Changing any covered field changes the database-calculated hash.
No browser-provided hash is trusted.

### Review binding

Candidate-level approval is stored separately in immutable
`product_detail_candidate_revision_approvals`. Field decisions now carry the
exact revision ID, combined payload checksum and product identity checksum.
Bound decisions are append-only; a later decision must be a new row.

The v2 writer recomputes and compares all hashes and current product identity,
then verifies the candidate, approved review item, revision approval and latest
decision for every field. A changed candidate, changed product, stale decision,
missing decision, rejection or unreviewed field fails before the publication
batch/event/structured-row mutation boundary.

## Blocker 2 — Structured Identity and Exact Rollback

### Row identity

`product_characteristics` now has:

- `record_origin`: `legacy` or `structured_product_detail`;
- `structured_item_id`;
- `candidate_revision_id`;
- existing publication batch and approval decision identity.

The original global `(product_id, key)` uniqueness is replaced by partial
identity boundaries: legacy key uniqueness remains inside the legacy namespace,
while managed rows use revision/batch/item identity and an active managed-item
constraint. The v2 writer uses plain `INSERT`; it has no `(product_id, key)`
UPSERT path.

Legacy and structured rows may therefore carry the same display key without
sharing ownership. Projection requires managed origin, non-null revision,
approved review status, published status and no archive timestamp. Legacy
metadata cannot become a Technical Specification.

The migration fails closed if pre-existing v1 structured rows are detected. It
does not guess whether such a row was originally legacy or rewrite it. A future
authorized staging plan must confirm this precondition before apply.

### Rollback snapshot

Every v2 batch stores complete before-state and after-state mutation evidence.
Rollback:

1. serializes by product and permits only the latest published batch;
2. deletes only feature/specification rows created by that exact batch/revision;
3. restores every previously managed row from its complete before-row,
   including timestamps, archive state, provenance, approval, revision and batch
   identity;
4. restores the previous batch status; the v2 writer never mutates the editable
   candidate payload or review status;
5. retains revision, decisions, provenance, publication events, audit rows and
   rolled-back batch history;
6. returns the existing result on an exact repeated rollback.

The local chain proves state A → batch A → state B → batch B → state C →
rollback B → exact state B, followed by rollback A → original state. Legacy and
unrelated product rows remain byte-for-byte equal to their pre-publication
snapshots.

## Forward-Only Migration Chain

New migration:

`202607230003_structured_product_detail_integrity_v1.sql` —
`17198cbe4f973b1b01f12ee27a2c08add601590228298f0ae8b8db7dc526a778`

Historical migrations remain byte-for-byte unchanged:

- `202607230001_structured_product_detail_fields_v1.sql` —
  `878f187b3dae8055c3e3ee434cdbb45102746787802d839de1636ef71fa21a33`;
- `202607230002_structured_product_detail_projection_v1.sql` —
  `13de262ac7e18fff7df90b29e3a67f4281126344b5e40fab1e4c58e53d57a339`.

The manifest now contains fourteen ordered migrations. Its checksum is verified
by the repository contract test and the clean-database runner.

## Local Integrity Evidence

`supabase/tests/003_structured_product_detail_integrity_regression.sql` is a
transactional, synthetic, local-only suite. It verifies:

- payload, provenance, ordering and product-version changes are rejected;
- a new revision inherits no approval;
- a stale decision from another revision is rejected;
- failed preflight creates zero batches, events or structured rows;
- exact publication retry returns one batch;
- a different idempotency key cannot duplicate the revision;
- a legacy collision row remains byte-for-byte unchanged;
- projection emits only the managed structured row;
- rollback B restores exact state after A;
- rollback A restores the original state;
- rollback retry is idempotent;
- unrelated rows, review/provenance/audit history and RLS/grants are preserved.

The QA runner starts an installed Supabase PostgreSQL image, waits for two
consecutive SQL-ready probes, applies all migrations, executes both SQL suites,
checks zero residual fixture state, and removes only its own container. It reads
no remote URL or credential.

## RPC and Mapper Compatibility

The forward projection keeps the existing public DTO. It adds managed-origin
and revision filters while preserving order, groups and units. The existing
mapper remains unchanged, performs no HTML parsing, creates no synthetic
fallback and has no product-specific branch. ProductService and
CatalogRepository APIs are unchanged.

## Hamilton-T1 Validation Fixture

The recovered review package remains:

- status: `needs_manual_approval`;
- publishable: `false`;
- approvals: `0`;
- key features: `6`;
- technical specifications: `15`;
- provenance references: `21`.

Its proposed fields can be converted to and validated against the generic
structured candidate payload only with a synthetic local product identity. The
actual Cloud product identity is intentionally not invented or read remotely.
Because no revision-bound approvals exist, the generic v2 writer gate rejects
publication. No Hamilton-specific logic exists in SQL or runtime.

The statement “Более 9 часов работы от аккумулятора” remains **AMBIGUOUS /
INSUFFICIENT EVIDENCE**. It was not changed, approved or published.

## QA

| Check | Result |
| --- | --- |
| Targeted Structured Fields tests | PASS — 10/10 |
| Clean local migration chain | PASS — 14 migrations |
| Integrity regression SQL | PASS |
| Residual local fixture state | PASS — all counts 0 |
| Remote connections | PASS — 0 |
| `npm test` | PASS — 398/398 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Turbopack; local port bind required permitted execution outside sandbox |
| `npm run build -- --webpack` | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS; staging empty |

## Protected State

- corrective commit/push: not performed;
- staging area: must remain empty;
- remote migrations/RPC: not performed;
- Supabase/Cloud writes: not performed;
- Hamilton approvals/publication: not performed;
- Product Data and immutable snapshot: unchanged;
- Cloud Catalog: unchanged;
- `main`: unchanged;
- Production: unchanged;
- ADR-005: remains `Proposed`.

## Next Task

**Independent Structured Fields Re-Review v2**
