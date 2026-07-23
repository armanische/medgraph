# Structured Fields Independent Code & Security Review v1

**Status:** REVIEW COMPLETE — CHANGES REQUIRED

**Scope:** Structured Product Detail Fields v1 and local integration readiness

**Review branch:** `codex/structured-fields-independent-review-v1`

**Reviewed HEAD:** `d386ca2d6a40ea5e960c3df5d761be74d4fb5396`

**Implementation commit:** `213e841e816e5c0b62484be54cb7b004ff05a3e4`

**Recovery base:** `502504a9106a462c4a7ade226d8a8b74d8956ee2`

**Date:** 23 July 2026

**Environment:** isolated worktree and disposable local Supabase PostgreSQL only

## 1. Executive Summary

The implementation has a sound service-only surface, fixed `search_path`,
explicit RPC grants, published-only projection, fail-closed mapper, checksum-
pinned local migration chain and a transactional happy-path test. Standard QA
passes.

The production gate nevertheless fails. Two independently reproduced integrity
defects can break the core review/publication guarantees:

1. an approval is not bound to an immutable candidate revision, payload hash and
   product identity/version;
2. a structured specification can reuse an existing legacy characteristic key,
   overwrite that row, and leave it unrestored after rollback.

Both defects are **BLOCKING** because they permit reviewed state to diverge from
published state or can irreversibly change existing Product Data. No correction
was made during this review.

**Formal verdict: CHANGES REQUIRED.**

## 2. Review Scope

Reviewed:

- Git ancestry and the delta from the Product Detail recovery base;
- all 13 migrations and their SHA-256 manifest;
- `product_key_features` and the additive `product_characteristics` extension;
- SQL functions, `SECURITY DEFINER`, RLS, grants and service-only wrappers;
- candidate/review/decision reuse, writer, idempotency and rollback;
- Cloud Preview projection, mapper and Product Detail presentation contract;
- Hamilton-T1 review-only package and its immutable source reference;
- standard project QA and disposable-local database integration.

Protected systems remained read-only and unchanged. No remote Supabase endpoint,
Cloud Catalog, Production environment or publication mechanism was used.

## 3. Git and Ancestry Review

Mandatory preflight produced:

- HEAD: `d386ca2d6a40ea5e960c3df5d761be74d4fb5396`;
- merge base with `origin/main`:
  `68ca9417c21e80f390c2ea231c339ec962c26d4a`;
- worktree was clean before the documentation report;
- the branch is a linear descendant of `origin/main`.

Commit classification:

| Commit | Responsibility |
| --- | --- |
| `5d6280c` | Product Detail presentation baseline recovery |
| `c571b37` | Launch Sprint 1.2 visual-polish recovery |
| `4d61190` | critical Product Detail UX recovery |
| `502504a` | Product Detail accessibility/summary correction and review base |
| `213e841` | Structured Fields implementation |
| `d386ca2` | migration-chain and Hamilton review-package recovery |

The Structured Fields delta `502504a..d386ca2` contains 31 files, 5,020
insertions and 35 deletions. It consists of the implementation, mapper contract,
two new migrations, recovered prerequisite migrations, local integration QA,
ADR/reporting and the Hamilton review-only evidence package. No duplicate commit
was found in this linear range.

The recovered Product Detail UI commits remain ancestors of the reviewed HEAD,
so integrating the same branch does not discard that recovery. Integration is
technically linear, but is prohibited until the blocking findings are fixed.

## 4. Migration Chain Review

The manifest contains 13 unique, chronologically ordered versions:

1. `202607020001` — FS510 vertical slice;
2. `202607030001` — FS510 registration claim;
3. `202607180001` — Cloud Data Foundation v1;
4. `202607200001` — Shadow Read v1;
5. `202607200002` — Shadow Read schema usage;
6. `202607200003` — Reference Publication Alignment v1;
7. `202607200004` — Product Import v1;
8. `202607200005` — Catalog Admin v1;
9. `202607200006` — Cloud Storefront Preview v1;
10. `202607210001` — Catalog Data Quality v1;
11. `202607210002` — Catalog Data Quality editor alignment;
12. `202607230001` — Structured Product Detail fields/writer;
13. `202607230002` — Structured Product Detail projection.

The recorded SHA-256 value of every file matches its current bytes. The manifest
test also confirms that no migration file is omitted or duplicated. All 13 files
apply to a clean disposable database in filename order.

The eight recovered historical files first become committed Git artifacts in
`d386ca2`. The manifest protects their present bytes from future drift; it does
not independently prove equivalence to an already-applied remote schema. A
separate read-only migration-ledger/schema comparison remains mandatory before
any staging plan.

The two Structured Fields migrations perform no backfill, HTML extraction or
network work. Historical migration `202607210001` includes its documented,
batch-scoped catalog-quality recomputation, and historical rollback functions
contain explicit service-only delete paths. None of those functions or data
operations was invoked by this review.

Clean application is reproducible. One initial runner attempt met the Supabase
image during its internal startup restart; an unchanged rerun completed and left
zero residual rows. This startup observation does not alter the two classified
findings.

## 5. Schema Review

### `cloud.product_key_features`

The relation has a UUID primary key, restrictive product/candidate/decision/batch
foreign keys, atomic text value, non-negative ordering, provenance fields,
review/publication state, archive timestamps and indexes for the active public
key and public order. The partial unique index prevents two simultaneously
published rows for the same `(product_id, field_key)`. Product deletion is
restricted.

The schema does not itself establish that the approval decision belongs to the
immutable candidate/product revision being published. That invariant is part of
Blocking Finding 1.

### `cloud.product_characteristics`

The extension is additive. Existing rows receive `legacy_metadata` and
`unpublished`, while new grouping, provenance, decision, batch and archive fields
are nullable where backward compatibility requires it. The public policy and
projection require structured rows to be technical, approved, published and not
archived.

The candidate validator excludes category, product type, country,
manufacturer and application-area labels from technical specifications. Existing
legacy rows therefore remain excluded from the structured projection.

The writer's `ON CONFLICT (product_id, key)` can nevertheless reuse and mutate a
legacy row whose key collides with the `structured-` key. That is Blocking
Finding 2.

## 6. SQL Security Review

The new SQL contains no dynamic SQL and no product- or slug-specific branch.
`SECURITY DEFINER` functions use fixed `search_path` values, and relation/function
references are schema-qualified. Public, `anon` and `authenticated` execute
privileges are revoked from publication and rollback surfaces; only the
`cloud_api` wrappers are granted to `service_role`.

The server adapter begins with `server-only`, requires a service-role client and
uses the `cloud_api` profile headers. It is not exported through the Storefront
barrel and has no browser route or Server Action. No service credential is added
to the public Product model or mapper.

The service-only boundary therefore passes. It does not compensate for the two
data-integrity defects inside the privileged transaction.

## 7. RLS and Grants Review

Local catalog inspection and integration assertions confirmed:

- RLS is enabled on both new tables;
- `anon` and `authenticated` cannot execute writer or rollback RPCs;
- the new tables have no public write grant;
- unpublished/unapproved structured rows are excluded from the service-only
  Storefront projection;
- provenance, reviewer identity, candidate ID, decision ID and batch ID are not
  returned to Storefront;
- existing published-product RLS for legacy characteristics is preserved, with
  an additional fail-closed rule for technical specifications.

**RLS/grants result: PASS for the reviewed access surface.**

## 8. Review Workflow Review

The writer reuses `publication_candidates`, the unique review item for an import
product, and the latest field-level `review_decisions`. Pending, rejected,
missing, mixed or value-mismatched decisions fail closed. Schema version 1 and
candidate/product identifiers are checked.

Review completeness is not durable because the approved candidate row remains
mutable and approval stores no immutable candidate revision or approval-time
payload checksum. The decision links only to a review item and field path, not to
the exact candidate revision/product version. This is Blocking Finding 1.

## 9. Writer and Idempotency Review

The happy path is transactional. It locks the candidate, serializes publication
per product, records a unique idempotency key and payload checksum, creates one
batch, updates audit/event history and returns a typed result.

Local integration confirms:

- first approved publication creates one batch;
- an exact retry returns that batch;
- a published candidate cannot create a new batch;
- the normal retry does not duplicate rows;
- a partial SQL failure rolls back the transaction.

The normal idempotency path passes. The writer as a whole does not pass the
production gate because approval identity/version and legacy row isolation are
not enforced.

## 10. Rollback Review

The intended A → B → rollback B model is represented by `previous_batch_id` and
`previous_state`. Review decisions, provenance, events and audit rows are
preserved, rollback is product-scoped, out-of-order rollback is rejected, and an
exact repeated rollback is idempotent.

The happy-path local fixture passes. A separate disposable-local integrity check
confirmed that a legacy row overwritten through the structured UPSERT is not in
the captured previous structured state and is therefore not restored. Rollback
is **FAIL** for the full supported data state; see Blocking Finding 2.

## 11. RPC Review

The projection returns only structured rows satisfying all of:

- approved review status;
- published publication status;
- technical content kind for specifications;
- no archive timestamp.

Feature, group and item order are deterministic. Group title and units are
preserved. Legacy metadata, provenance and internal workflow identifiers are not
projected. Empty sets become arrays, and no Hamilton- or slug-specific rule
exists.

**RPC projection result: PASS for read isolation and shape.**

## 12. Mapper Review

`keyFeatures` are no longer overwritten with an unconditional empty array.
Features, groups and items are sorted, plain-text checked and mapped to the
existing Storefront `Product` fields. Transitional legacy characteristics are
ignored, metadata is not promoted, HTML is not parsed as a data source, and
empty structured fields remain empty. ProductService and CatalogRepository APIs
are unchanged.

**Mapper result: PASS.**

## 13. Product Detail Contract Review

Static review and contract tests confirm:

- Advantages render only from non-empty `product.keyFeatures`;
- Technical Specifications render only from explicit structured
  `product.specifications`;
- section navigation includes only present sections;
- Summary, Description, Gallery, Lightbox, Manufacturer, Back to Catalog and
  Back to Top remain intact;
- the page has one H1 and no service credential boundary;
- empty structured fields keep both sections absent;
- Catalog Experience contracts remain green.

**Product Detail contract result: PASS.**

## 14. Hamilton-T1 Candidate Review

Package integrity checks confirm:

- source UID `330695211247` and immutable snapshot checksums match;
- 6 proposed key features;
- 15 proposed specifications;
- 21 field-level provenance references;
- approve decisions: 0;
- status `needs_manual_approval`;
- `publishable: false`;
- no proposed documents or registration placeholders;
- no Cloud write or publication payload was produced.

The claim “Более 9 часов работы от аккумулятора” is present in the immutable
legacy source, while the repository research note records a conflicting 4/8-hour
battery configuration. No committed authoritative evidence resolves conditions,
configuration or market version.

**Claim classification: AMBIGUOUS / INSUFFICIENT EVIDENCE.** It remains
unapproved and must not be published before separate Human Review against an
allowed official source.

## 15. Local Integration Results

| Check | Result |
| --- | --- |
| `npm run qa:structured-fields:local` | PASS on unchanged rerun; 13 migrations; residual products/features/batches/events = 0; remote connections = 0 |
| Migration SHA-256 manifest | PASS |
| Clean migration chain | PASS |
| RLS/grants assertions | PASS |
| Happy-path service-only writer | PASS |
| Exact idempotent retry | PASS |
| Published-only RPC | PASS |
| Mapper/Product Detail contracts | PASS |
| Happy-path product-scoped rollback | PASS |
| Full rollback integrity | FAIL — Blocking Finding 2 |
| `npm test` | PASS — 396/396 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `git diff --check` | PASS before report; repeated after report |
| `git diff --cached --check` | PASS; staging empty |

The defensive local evidence used only synthetic records in a disposable
database transaction. The temporary acceptance contract is stored outside Git
at `/private/tmp/structured-fields-integrity-regression-v1.sql`; it contains only
the five expected integrity assertions for the corrective task.

## 16. Findings

### SF-SEC-001 — Approval is not bound to an immutable candidate/product revision

- **Severity:** BLOCKING
- **Files/lines:**
  - `supabase/migrations/202607180001_cloud_data_foundation_v1.sql:427-441`;
  - `supabase/migrations/202607230001_structured_product_detail_fields_v1.sql:257-345`.
- **Affected invariant:** published fields must be exactly the candidate/product
  state that received approval.
- **Local result:** a changed approved candidate identity was not rejected by the
  writer; the transaction accepted earlier field approval for a different
  product identity.
- **Risk:** stale approval, cross-product publication and divergence between
  reviewed evidence and published data.
- **Minimal corrective recommendation:** persist an immutable candidate revision,
  approval-time payload checksum and unambiguous product identity/version; bind
  every field decision to that revision; prevent mutation after approval; make
  the writer compare the locked candidate, approval checksum, product identity
  and complete reviewed field set before any batch mutation.

### SF-DATA-002 — Structured UPSERT can overwrite a legacy row that rollback cannot restore

- **Severity:** BLOCKING
- **File/lines:**
  - `supabase/migrations/202607230001_structured_product_detail_fields_v1.sql:355-370`;
  - `supabase/migrations/202607230001_structured_product_detail_fields_v1.sql:431-464`;
  - `supabase/migrations/202607230001_structured_product_detail_fields_v1.sql:567-596`.
- **Affected invariant:** structured publication must not mutate legacy Product
  Data, and rollback must exactly restore every affected row.
- **Local result:** a synthetic legacy characteristic with a conflicting key was
  converted into a structured row; rollback left the reviewed structured value
  and state instead of the original legacy row.
- **Risk:** loss or irreversible alteration of existing product characteristics
  and an incomplete rollback audit trail.
- **Minimal corrective recommendation:** isolate structured identity from legacy
  `(product_id, key)` identity, preferably through a dedicated revision relation
  or a collision-safe namespace/constraint; fail closed on any legacy collision;
  snapshot every affected row before mutation and verify exact, product-scoped
  restoration, including unrelated-row preservation.

Finding counts:

- BLOCKING: 2;
- IMPORTANT: 0;
- MINOR: 0;
- ACCEPTED: 0.

## 17. Risk Assessment

The access boundary reduces exposure to a trusted server/service operator, but
does not reduce the impact of an application defect, stale review state,
operator retry or future publication automation. Both findings affect canonical
data integrity inside a privileged transaction and therefore block merge and any
remote schema/application step.

No evidence of public writer access, unpublished-field leakage, dynamic SQL,
runtime credential exposure or Hamilton-specific code was found.

## 18. Verdict

**CHANGES REQUIRED**

Reason: two BLOCKING findings affect review authenticity, product isolation,
legacy data preservation and rollback correctness.

## 19. ADR-005 Recommendation

**Leave ADR-005 as Proposed until both blocking findings are fixed and the
corrective implementation receives an independent regression review.**

The intended architecture remains viable, but the current implementation does
not yet satisfy the ADR's exact-approval and reversible-publication claims.

## 20. Merge Recommendation

**NOT READY FOR MERGE**

Do not merge `213e841`/`d386ca2` into `main` until both findings are corrected,
all integrity regressions pass, and the review is repeated on the corrective
commit.

## 21. Remote Migration Recommendation

**NOT READY FOR REMOTE MIGRATION**

No staging or Production migration should be planned from the current SQL. After
the corrective fix, perform a separate read-only migration-ledger/schema drift
preflight before a newly authorized controlled staging migration.

## 22. Cloud Publication Recommendation

**NOT READY FOR CLOUD PUBLICATION**

Hamilton-T1 remains review-only with zero approvals. No structured candidate,
including Hamilton-T1, may be published through the current writer.

## 23. Exact Next Task

**Structured Fields Blocking Corrective Fix v1**

Scope only:

1. bind approval to immutable candidate revision, payload hash and product
   identity/version;
2. isolate structured specification identity from legacy characteristics and
   implement exact rollback restoration;
3. add disposable-local regression coverage for changed/stale candidate
   rejection, approval/hash binding, legacy collision rejection, A → B → rollback
   restoration and preservation of unrelated products/rows;
4. rerun the complete local chain and request a new independent review.

The corrective task must not include remote migration, Cloud write, Hamilton
approval/publication, Product Data edits, runtime redesign or ADR acceptance.

---

No remote migration, remote RPC, Supabase/Cloud write, Hamilton approval,
Hamilton publication, merge to `main`, Production deployment or Production
configuration change occurred during this review.
