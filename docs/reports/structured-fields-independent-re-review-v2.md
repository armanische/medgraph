# Independent Structured Fields Re-Review v2

**Status:** APPROVED
**Scope:** Defensive local review of the two previously blocking Structured
Product Detail integrity findings.
**Reviewed branch:** `codex/structured-fields-blocking-corrective-fix-v1`
**Reviewed HEAD:** `72fe2692e64f07856c17b7e46611484fc61564c1`
**Runtime corrective commit:** `3c2ce20148a8da2eddc5d4997193619327aed257`

## 1. Executive Summary

The corrective implementation resolves both findings from the previous
independent review. An approval is now valid only for one immutable candidate
revision, its canonical SHA-256 payload, and the captured product identity.
Structured technical characteristics no longer share an UPSERT identity with
legacy characteristics. Local regression evidence confirms exact rollback,
idempotency, RLS/grants, and the published-only projection.

The review used only a disposable local Supabase PostgreSQL fixture with
synthetic rows. No remote database, credentials, or Product Data were used.

## 2. Scope

Included:

- immutable approval binding and writer preflight;
- legacy/structured row isolation and exact rollback;
- migration-chain reproducibility and local RLS/grant checks;
- published-only RPC projection, mapper, and Product Detail contracts.

Excluded:

- remote migration, RPC, or Cloud writes;
- Hamilton-T1 approval or publication;
- changes to implementation, Product Data, immutable snapshot, Cloud Catalog,
  `main`, or Production.

## 3. Git Scope Verification

The review branch starts exactly at the published corrective documentation
commit. The ancestry after the previous review commit contains exactly two
corrective commits:

1. `3c2ce20148a8da2eddc5d4997193619327aed257` — runtime, migration, and tests;
2. `72fe2692e64f07856c17b7e46611484fc61564c1` — documentation only.

The runtime commit changes nine files; the documentation commit changes four.
No Product Data, immutable snapshot, Cloud Catalog, remote configuration, or
unrelated runtime file is in the scope.

Historical migrations are byte-for-byte unchanged:

- `202607230001_structured_product_detail_fields_v1.sql` —
  `878f187b3dae8055c3e3ee434cdbb45102746787802d839de1636ef71fa21a33`;
- `202607230002_structured_product_detail_projection_v1.sql` —
  `13de262ac7e18fff7df90b29e3a67f4281126344b5e40fab1e4c58e53d57a339`.

Only forward migration `202607230003_structured_product_detail_integrity_v1.sql`
was added.

## 4. Migration Integrity

The manifest contains 14 chronological, unique migration versions. Every
manifest checksum passes, including corrective migration SHA-256:

`17198cbe4f973b1b01f12ee27a2c08add601590228298f0ae8b8db7dc526a778`

The clean local migration chain was applied twice in separate disposable
containers. Both runs passed. The corrective migration fails closed when an
existing unprovable v1 structured publication footprint is present; it does
not attempt ownership guessing or legacy backfill.

## 5. Immutable Revision Verification

`cloud.product_detail_candidate_revisions` stores candidate, product identity
snapshot, independent identity/payload checksums, combined canonical checksum,
schema version, revision number, actor, and timestamp. Database constraints
recompute every stored hash. The immutability trigger rejects update and delete
operations.

The canonical checksum covers schema version, canonical JSONB product identity,
and canonical candidate payload. JSONB canonicalizes object ordering while
arrays preserve field ordering, so provenance and sort-order changes affect the
digest. The server-side writer recomputes the checksum; it accepts no
client-provided checksum.

Relevant implementation: `202607230003_structured_product_detail_integrity_v1.sql`
lines 7–120 and 430–469.

## 6. Approval Integrity Results

PASS in `003_structured_product_detail_integrity_regression.sql`:

- payload mutation rejected before batch/event/row mutation;
- provenance mutation rejected;
- sort-order mutation rejected;
- product identity mutation rejected;
- a new revision inherits no approval;
- a decision from an earlier revision is rejected;
- rejected, unreviewed, and `needs_manual_approval` items cannot publish.

Revision approval and each field-level decision must match the exact revision,
payload checksum, product identity checksum, review item, approved value, and
review timestamp. The explicit preflight precedes the first publication batch
insert.

## 7. Writer and Idempotency Results

PASS:

- first approved request creates one batch;
- exact retry returns that batch;
- a different idempotency key cannot create a second publication for the same
  revision;
- an already-published revision cannot create another batch;
- the writer is product-scoped and service-role-only.

The server adapter is `server-only`, requires a service-role client, and passes
`cloud_api` schema headers only for the internal RPC surface.

## 8. Legacy Isolation Results

PASS. `product_characteristics.record_origin` separates `legacy` from
`structured_product_detail`. The old global `(product_id, key)` constraint is
replaced with a legacy-only key identity and managed batch/item identities.
The writer inserts structured rows with a `structured-` storage key, managed
origin, revision, batch, and decision identity; it has no legacy UPSERT path.

A synthetic same-display-key collision left the legacy row and its provenance,
review state, and publication state byte-for-byte unchanged. The public
projection returned only the approved, published managed structured row.

Relevant implementation: migration lines 208–285 and 625–702.

## 9. Exact Rollback Results

PASS. The local sequence initial → batch A → state A → batch B → state B →
rollback B restored exact state A; rollback A restored initial state. Repeat
rollback is idempotent.

Each batch retains full managed before-state and mutation evidence. Rollback
deletes only rows created by its own batch/revision, restores prior managed
rows including timestamps and archived state, restores the prior batch state,
and retains review, provenance, event, batch, and audit history. It refuses an
incomplete rollback state instead of performing a partial restoration.

Legacy rows and a synthetic unrelated product remained unchanged; residual
active structured rows after the full rollback were zero.

## 10. RLS and Access-Control Results

PASS:

- `anon` and `authenticated` have no EXECUTE on revision creation, v2 writer,
  or v2 rollback;
- only `service_role` has the required `cloud_api` function grants;
- revision and revision-approval tables have RLS enabled and public table
  privileges revoked;
- unpublished/rejected/archived structured rows are absent from public reads;
- SECURITY DEFINER functions use explicit safe `search_path` values and SQL
  references are schema-qualified.

The test runner contains no Supabase URL or service-role environment access;
its final result reports `remoteConnections: 0`.

## 11. RPC and Mapper Results

PASS. `cloud_storefront_preview_catalog` returns only revision-bound,
approved, published, non-archived key features and managed structured technical
specifications. Ordering, group titles, group order, and units are retained.
Legacy metadata is excluded. The mapper preserves explicit structured values,
does not parse HTML, invent a fallback, or contain Hamilton-specific logic.
`ProductService` and `CatalogRepository` APIs are unchanged.

## 12. Product Detail Contract Results

PASS. The local approved synthetic fixture exposes Advantages, grouped Technical
Specifications, and their navigation links. The no-structured-data fixture
omits both sections and their empty navigation links.

Existing Summary, Description, Gallery/Lightbox, Manufacturer, Back to Catalog,
Back to Top, and single-H1 contracts remain covered by the application suite.

## 13. Hamilton-T1 Package Status

Validation-only PASS:

- status: `needs_manual_approval`;
- publishable: `false`;
- approve decisions: `0`;
- key features: `6`;
- technical specifications: `15`;
- provenance references: `21`.

The package conforms to the generic candidate schema using a synthetic local
identity. The writer rejects it without revision-bound approvals. No
Hamilton-specific SQL or mapper branch exists. “Более 9 часов работы от
аккумулятора” remains **AMBIGUOUS / INSUFFICIENT EVIDENCE** and was neither
changed, approved, nor published.

## 14. Full QA Results

| Check | Result |
| --- | --- |
| Disposable local migration chain | PASS — 14 migrations, two clean applies |
| Immutable approval / stale revision regression | PASS |
| Legacy isolation / exact rollback regression | PASS |
| Idempotency / RLS / grants / RPC / mapper | PASS |
| Residual fixture state | PASS — all tracked residual counts are 0 |
| Remote connections | PASS — 0 |
| `npm test` | PASS — 398/398 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Turbopack |
| `npm run build -- --webpack` | PASS |
| Diff checks | PASS |

A fresh worktree initially lacked installed packages. `npm ci --ignore-scripts
--offline` restored the exact lockfile dependency set locally; it changed no
repository file or dependency version.

## 15. Findings

| Severity | Count | Result |
| --- | ---: | --- |
| BLOCKING | 0 | None |
| IMPORTANT | 0 | None |
| MINOR | 0 | None |
| ACCEPTED | 0 | None |

No finding related to either reviewed invariant remains.

## 16. Verdict

**APPROVED**

Both prior blockers are independently reproduced as corrected by local tests
and code inspection. The result is limited to the reviewed revision and does
not authorize publication without human approval.

## 17. ADR-005 Recommendation

**ACCEPTED.** The documented design now matches the verified immutable revision,
approval binding, managed identity, and exact rollback behavior.

## 18. Merge Recommendation

**READY FOR MERGE** into the intended integration branch, subject to the normal
repository integration review. No merge was performed here.

## 19. Staging Migration Recommendation

**READY FOR CONTROLLED STAGING MIGRATION.** Before any apply, confirm the
forward migration's explicit fail-closed precondition: no un-audited v1
structured batches or rows exist. Run the approved staged migration plan and
post-migration verification separately.

## 20. Cloud Publication Recommendation

**NOT READY FOR CLOUD PUBLICATION.** Hamilton-T1 requires separate Human Review
and revision-bound approvals. This review creates neither.

## 21. Exact Next Task

**Structured Fields Controlled Staging Migration v1**
