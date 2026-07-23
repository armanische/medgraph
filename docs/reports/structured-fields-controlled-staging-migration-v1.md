# Structured Fields Controlled Staging Migration v1

**Status:** STAGING MIGRATION PASS — DOCUMENTATION UNCOMMITTED

**Mode:** Stage A preflight plus owner-authorized Stage B controlled staging migration

**Date:** 23 July 2026

**Branch:** `codex/structured-fields-controlled-staging-migration-v1`

**Base:** `fb2d923333cd5f9b244eb9f67c101af2cc11c2bb`

> This report follows [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md). Stage B
> began only after the owner explicitly authorized the named staging project
> and the three pinned migration checksums. No Production connection, migration,
> deployment, publication, or environment change was performed.

## 1. Executive Summary

The controlled target is unambiguously the Supabase project
`cybermedica-staging` (`gjlpkqdhlzbfnzzoxlsk`). It is distinct from the
Production Supabase project `cybermedica` (`clbzibuusyuajsylcbvl`) by project
reference, API/DB hostname, name, and region. Vercel Production has no
Supabase or Cloud Catalog environment variables; its configured production
branch is `production`.

The staging ledger contains the nine committed Cloud migrations from
`202607180001` through `202607210002`. The three Structured Fields migrations
`202607230001`–`202607230003` are absent. An official Supabase CLI
`db push --dry-run` from a temporary, staging-linked migration workdir proposed
exactly those three migrations and performed no push.

The legacy structured-row precondition is **SAFE EMPTY**. Staging has no
`product_key_features`, structured publication batch, candidate-revision, or
revision-approval table and no v1 structured writer/RPC. The existing 237
`product_characteristics` rows use the pre-Structured-Fields legacy schema and
cannot carry a structured origin, item identity, candidate revision, or
publication batch.

A permissions-restricted logical backup was created outside Git and verified
by per-file SHA-256, archive SHA-256, and archive listing. After the exact
approval recorded in section 11, only the three pinned Structured Fields
migrations were applied to staging. Schema, RLS/grants, data invariance,
writer/idempotency, projection, rollback, cleanup, and runtime checks passed.

## 2. Target Staging Environment

| Property | Verified staging value |
| --- | --- |
| Project name | `cybermedica-staging` |
| Project ref | `gjlpkqdhlzbfnzzoxlsk` |
| API hostname | `gjlpkqdhlzbfnzzoxlsk.supabase.co` |
| Database hostname | `db.gjlpkqdhlzbfnzzoxlsk.supabase.co` |
| Database name | `postgres` (Supabase managed default) |
| Region | `eu-north-1` |
| Status | `ACTIVE_HEALTHY` |
| Environment classification | Staging / Vercel Preview `cloud_preview` |
| Anon health | HTTP 200 against `/auth/v1/health` |

The isolated worktree is linked locally only to the staging project ref. The
link is ignored operational metadata and is not part of Git.

## 3. Production Separation Evidence

| Property | Production baseline |
| --- | --- |
| Supabase project name | `cybermedica` |
| Supabase project ref | `clbzibuusyuajsylcbvl` |
| Supabase API hostname | `clbzibuusyuajsylcbvl.supabase.co` |
| Supabase DB hostname | `db.clbzibuusyuajsylcbvl.supabase.co` |
| Supabase region | `eu-west-3` |
| Vercel project | `medgraph/medgraph` |
| Configured Production branch | `production` |
| Remote Production branch SHA | `66b0f97b0d37fc6fef808833a1a90b415975d5de` |
| Current Production deployment | `dpl_7z3WatNfSCm3dZ1ZCdoGJZ9Ybq9E` |
| Deployment commit/ref | `66b0f97b0d37fc6fef808833a1a90b415975d5de` / `main` |
| Deployment created | `2026-07-16T12:42:55.265Z` |
| Deployment status | `READY` |

Vercel environment metadata shows all Supabase URL/key variables and
`CATALOG_DATA_SOURCE=cloud_preview` scoped to Preview only. Vercel Production
contains none of `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or
`CATALOG_DATA_SOURCE`. Therefore the staging credentials are not attached to
the Production deployment or Production domains.

No SQL or API request was made to the Production Supabase project.

## 4. Credential Boundary

- The local public URL resolves to staging ref `gjlpkqdhlzbfnzzoxlsk`.
- The local anon JWT reports role `anon` and the same staging ref.
- The local server-only JWT reports role `service_role` and the same staging
  ref.
- Secret values were not printed, copied into the worktree, placed in Git, or
  written to this report.
- No database password, direct database URL, or Supabase access token exists in
  the project `.env.local`; Supabase CLI used its controlled authenticated
  session and an ephemeral login role.
- The worktree contains no `.env.local`. Browser runtime receives only the anon
  credential; the service role remains server-only.
- Vercel CLI redacts Sensitive values when pulling environment metadata, so
  the displayed redaction marker is not treated as a key fingerprint. Actual
  local-key role/ref claims were checked without emitting either token.

## 5. Staging Schema Inventory

The schema inventory was obtained with an official read-only Supabase schema
dump and inspection commands.

| Inventory item | Result |
| --- | ---: |
| Application schemas | `cloud`, `cloud_api` |
| Cloud tables | 33 |
| Functions | 15 `cloud` + 14 `cloud_api` |
| Cloud enums | 7 |
| RLS-enabled Cloud tables | 33 |
| RLS policies | 16 |
| Explicit grants in dump | 37 |
| Explicit revokes in dump | 14 |

Existing enums are `confidence_level`, `import_status`, `product_status`,
`reference_status`, `review_decision_type`, `review_status`, and
`rights_status`.

Existing `cloud_api` functions are:

- `apply_catalog_data_quality_v1`;
- `apply_product_import_v1`;
- `apply_reference_import`;
- `apply_reference_publication`;
- `catalog_admin_patch_product`;
- `catalog_admin_product`;
- `catalog_admin_products`;
- `catalog_admin_references`;
- `catalog_data_quality_inventory`;
- `cloud_storefront_preview_catalog`;
- `reference_publication_snapshot`;
- `rollback_product_import_v1`;
- `rollback_reference_publication`;
- `shadow_reference_snapshot`.

The current Product Detail projection is the pre-Structured-Fields
`cloud_api.cloud_storefront_preview_catalog()`. The Structured Fields writer
and rollback RPCs do not yet exist. The migration uses the canonical name
`cloud.product_detail_publication_batches`; there is no generic
`cloud.publication_batches` table in the current or proposed contract.

Exact affected-table row counts from the verified Cloud data dump:

| Object | Exists now | Rows |
| --- | ---: | ---: |
| `cloud.products` | yes | 79 |
| `cloud.product_characteristics` | yes | 237 |
| `cloud.product_key_features` | no | 0 |
| `cloud.publication_candidates` | yes | 0 |
| `cloud.product_detail_candidate_revisions` | no | 0 |
| `cloud.product_detail_candidate_revision_approvals` | no | 0 |
| `cloud.review_items` | yes | 0 |
| `cloud.review_decisions` | yes | 0 |
| `cloud.product_detail_publication_batches` | no | 0 |
| `cloud.publication_events` | yes | 0 |
| `cloud.audit_log` | yes | 99 |

## 6. Migration Ledger Diff

All fourteen local files match the SHA-256 manifest. Supabase's remote ledger
records migration versions but not the repository SHA-256 values; remote
compatibility is therefore checked by ledger version plus current schema
inventory and the official dry-run.

| Migration | SHA-256 | Applied in staging | Action |
| --- | --- | ---: | --- |
| `202607020001_fs510_vertical_slice.sql` | `7a05defd0eb69a0fab552f5c0146c1ee32d3a11b88b2c87f3c42c7b3e28bf6dd` | no | No action: separate legacy FS510 vertical, deliberately absent and not a Structured Fields prerequisite |
| `202607030001_fs510_registration_claim.sql` | `55c3c7264a7ba28d68198a4a80956417f2fbacc20be0cecd2c887263e9fbdd95` | no | No action: separate legacy FS510 vertical, deliberately absent and not a Structured Fields prerequisite |
| `202607180001_cloud_data_foundation_v1.sql` | `d60a8a49eb99b4a9f6fb8b0423a001571f358d36ccf5180156132f1c683f1b79` | yes | Preserve |
| `202607200001_shadow_read_v1.sql` | `d07a09a6bcbdd1470f0c6bf9aaadd1b36e64205b65fd90af06e56f531787195d` | yes | Preserve |
| `202607200002_shadow_read_schema_usage.sql` | `ddb1ae610dd75756aa8c6da7a83e89c77487fbe1804c65437c470cc84b56c7fc` | yes | Preserve |
| `202607200003_reference_publication_alignment_v1.sql` | `95cbb2afe71a3d09336d9e0e59e38a033402cbcb27d5edb48fc6143a47cea97d` | yes | Preserve |
| `202607200004_product_import_v1.sql` | `9b677c558c0cdb0a4615f698a6679cdfa9dfc3266b3858e55eb27c7037c3af26` | yes | Preserve |
| `202607200005_catalog_admin_v1.sql` | `3f83109dcccd514657f5b83cfdb890684fd3751e960575282f42021370097291` | yes | Preserve |
| `202607200006_cloud_storefront_preview_v1.sql` | `f38387b6f1af280db00e63476cf4a1197951c40236312e6ba944e1769b77995d` | yes | Preserve |
| `202607210001_catalog_data_quality_v1.sql` | `6a45a733cf07976e8fe2b5122d3677601c19f83f80fe33235ce9710e533c272b` | yes | Preserve |
| `202607210002_catalog_data_quality_editor_alignment.sql` | `b2ac244a40232e66099f4d3d44558e2a4e38e57f07f8ee29fd4c6d19e24f7da1` | yes | Preserve |
| `202607230001_structured_product_detail_fields_v1.sql` | `878f187b3dae8055c3e3ee434cdbb45102746787802d839de1636ef71fa21a33` | yes | Applied to verified staging after owner approval |
| `202607230002_structured_product_detail_projection_v1.sql` | `13de262ac7e18fff7df90b29e3a67f4281126344b5e40fab1e4c58e53d57a339` | yes | Applied after `202607230001` |
| `202607230003_structured_product_detail_integrity_v1.sql` | `17198cbe4f973b1b01f12ee27a2c08add601590228298f0ae8b8db7dc526a778` | yes | Applied after `202607230002` |

The temporary migration workdir contains the nine already-applied Cloud
migrations and the three Structured Fields migrations, but excludes the two
unrelated legacy FS510 migrations. `supabase db push --linked --dry-run`
proposed exactly `202607230001`, `202607230002`, and `202607230003`.

## 7. Legacy Structured Rows Precondition

**Classification: SAFE EMPTY**

Evidence:

1. None of the three Structured Fields migrations exists in the remote ledger.
2. `product_key_features`, `product_detail_publication_batches`, candidate
   revisions, and revision approvals do not exist in staging.
3. The v1/v2 structured writer and rollback RPCs do not exist.
4. The 237 legacy characteristics have only the original columns; they have no
   `content_kind`, publication batch, approval decision, `record_origin`,
   `structured_item_id`, or candidate revision.
5. Candidate, review-item, review-decision, and publication-event counts are
   zero.
6. `202607230001` and `202607230002` contain no backfill, approval, or
   publication. When applied serially without any intervening writer, the
   fail-closed guard in `202607230003` sees empty v1 structured tables.

No legacy row was changed, reclassified, deleted, or backfilled during
preflight.

## 8. Backup Evidence

| Property | Value |
| --- | --- |
| Backup identifier | `structured-fields-staging-preflight-gjlpkqdhlzbfnzzoxlsk-20260723T162230Z` |
| Project ref | `gjlpkqdhlzbfnzzoxlsk` |
| Type | Supabase CLI logical schema + Cloud data + migration ledger |
| Timestamp | `2026-07-23T16:22:30Z` |
| Directory | `/Users/arman/Desktop/cybermedica-recovery-backups/structured-fields-staging-preflight-gjlpkqdhlzbfnzzoxlsk-20260723T162230Z` |
| Archive | `/Users/arman/Desktop/cybermedica-recovery-backups/structured-fields-staging-preflight-gjlpkqdhlzbfnzzoxlsk-20260723T162230Z.tar.gz` |
| Archive SHA-256 | `48945c12e7a6412c2b4c4d23e38ff58115fe9c4791d9f03cd895d518fe3ac1e5` |
| Permissions | backup directory `0700`; files/archive `0600` |
| Verification | all per-file SHA-256 checks PASS; archive listing PASS |

The archive contains full application schema, a scoped Cloud schema copy,
Cloud table data, the remote migration ledger, and per-file checksums. It is
outside the repository and contains no credential file. The Supabase managed
backup API currently reports no listed physical backup and PITR disabled, so
this verified logical backup is the available rollback artifact for this gate.

Restore procedure:

1. Stop all staging writers and confirm the destination project ref is not
   Production.
2. Verify the archive and all enclosed hashes.
3. Provision an isolated PostgreSQL 17/Supabase restore target with the required
   Supabase roles, extensions, Auth references, and no application traffic.
4. Restore `schema-full.sql`, then `data-cloud.sql`, using the controlled
   database restore credential; preserve the migration ledger evidence.
5. Re-run exact counts, constraints, indexes, functions, grants, RLS, orphan,
   duplicate, and application smoke checks before any traffic is attached.
6. A restore into shared staging or any Production system requires a separate
   explicit recovery approval. Never overwrite a live database ad hoc.

## 9. Migration Plan

Target: staging project `gjlpkqdhlzbfnzzoxlsk` only.

Immediately before apply, repeat project ref/hostname, Production ref, backup
availability, manifest checksums, and remote ledger. If any value differs,
stop and obtain a new approval.

Apply with official Supabase migration tooling from the verified temporary
Cloud-chain workdir, in this order:

1. `202607230001_structured_product_detail_fields_v1.sql`
   - creates publication-batch and key-feature tables;
   - adds additive structured/publication columns and constraints to
     characteristics;
   - enables/restricts RLS and installs service-only v1 writer/rollback;
   - performs no backfill, approval, publication, or product mutation.
2. `202607230002_structured_product_detail_projection_v1.sql`
   - replaces the service-only Cloud Preview projection to expose only
     approved/published key features and grouped specifications;
   - performs no data mutation.
3. `202607230003_structured_product_detail_integrity_v1.sql`
   - adds immutable candidate revisions, approvals, payload/product hashes,
     managed row namespace/identity, exact mutation log, v2 writer and
     product-scoped rollback;
   - executes the fail-closed empty-v1-state guard;
   - revokes v1 writer/rollback execution and grants only the v2 API surface to
     `service_role`;
   - performs no backfill, approval, publication, or product mutation.

Expected row mutations from the migrations themselves: **zero**. Expected
Product Data enrichment, Hamilton decisions/publication, HTML backfill, or
legacy-row replacement: **none**.

After the migrations, Stage B must perform schema/RLS/grant checks, pre/post
counts, then the separately identified staging-only synthetic fixture through
writer, exact retry, projection, rollback, idempotent rollback, and complete
cleanup. Hamilton-T1 is excluded.

## 10. Rollback Plan

- Each migration is wrapped in its own transaction. On the first SQL error,
  stop; do not continue to the next migration. Confirm transaction rollback
  and re-inventory the ledger/schema.
- Before synthetic testing, no Product Data row should change. Unexpected
  mutation is BLOCKING and triggers immediate stop.
- Do not edit the remote migration ledger and do not run ad hoc destructive
  down SQL.
- If a committed migration succeeds but post-migration verification fails,
  keep writers disabled and choose either a reviewed forward repair or a
  controlled restore from the verified backup into confirmed staging.
- Synthetic publication is reverted only through the v2 product-scoped
  rollback contract, followed by fixture cleanup and residual-count checks.
- Production is not a rollback target and remains outside this operation.

## 11. Approval Gate

Stage B is prohibited until the owner sends exactly:

> «Разрешаю применить Structured Fields migrations к staging Supabase project gjlpkqdhlzbfnzzoxlsk».

Approval is bound to:

- staging ref `gjlpkqdhlzbfnzzoxlsk`;
- the three checksums listed above;
- backup identifier
  `structured-fields-staging-preflight-gjlpkqdhlzbfnzzoxlsk-20260723T162230Z`;
- unchanged remote ledger through `202607210002`.

Any target, checksum, backup, or ledger change invalidates the approval and
requires a new preflight.

## 12. Stage B Authorization and Repeated Gate

The owner authorized only Supabase project `gjlpkqdhlzbfnzzoxlsk` and explicitly
excluded Production ref `clbzibuusyuajsylcbvl`. Immediately before apply:

- the linked ref and API/DB host still resolved to staging;
- the Production project remained a distinct, unlinked project;
- the backup archive and per-file checksums passed again;
- all fourteen local migration files matched the committed SHA-256 manifest;
- `db push --linked --dry-run` proposed exactly `202607230001`–`202607230003`;
- the legacy structured-row classification remained **SAFE EMPTY**.

No approval was inferred for any other migration or environment.

## 13. Applied Migrations and Ledger

Official Supabase CLI migration tooling applied, in one ordered operation:

1. `202607230001_structured_product_detail_fields_v1.sql`;
2. `202607230002_structured_product_detail_projection_v1.sql`;
3. `202607230003_structured_product_detail_integrity_v1.sql`.

All three returned success. No manual SQL repair and no migration-ledger edit
was performed. The post-apply remote ledger contains the nine pre-existing
Cloud migrations plus these three versions. The two unrelated FS510 migration
files remain unapplied, exactly as planned.

## 14. Schema, RLS, and Grants Verification

| Check | Result |
| --- | --- |
| New structured tables | PASS — 4/4 present |
| Structured-table RLS | PASS — 4/4 enabled |
| Required additive characteristic columns | PASS — 6/6 present |
| Candidate revision/hash contract | PASS |
| Structured origin/item namespace | PASS |
| v2 revision/writer/rollback service-role execute | PASS — 3/3 |
| anon/authenticated execute on v2 write functions | PASS — 0 |
| anon/authenticated direct privileges on new tables | PASS — 0 |
| v1 writer/rollback service-role execute | PASS — both revoked |
| SECURITY DEFINER search path | PASS — `pg_catalog, cloud` |

The published projection remains service-only and exposes only the approved,
published, non-archived contract. No unpublished structured row was created.

## 15. Data Invariance

| Object | Before migration | After migration | After synthetic cleanup |
| --- | ---: | ---: | ---: |
| `products` | 79 | 79 | 79 |
| `product_characteristics` | 237 | 237 | 237 |
| `product_key_features` | 0 / absent | 0 | 0 |
| `publication_candidates` | 0 | 0 | 0 |
| candidate revisions | 0 / absent | 0 | 0 |
| revision approvals | 0 / absent | 0 | 0 |
| review items / decisions | 0 / 0 | 0 / 0 | 0 / 0 |
| publication batches | 0 / absent | 0 | 0 |
| publication events | 0 | 0 | 0 |
| audit log | 99 | 99 | 99 |

The existing-product common-field checksum remained
`72581cd7a0aa6642b65521d149f263516d102e9d115416ede06935cd1c75385c`.
The legacy-characteristic original-field checksum remained
`c75963e035606386d65ea48a88ca0eb28006f63404034a815ab0ddfd66100d45`.
Normalized post-migration and post-cleanup Cloud dumps are byte-identical with
SHA-256 `7530530b7e2da904db74ac55d52d7ac3f074e23dd55490a896fdd58cfba7f95f`.

## 16. Synthetic Integration Evidence

The fixture used unique `71000000-…` UUIDs, source UID
`structured-fields-staging-synthetic-v1-source`, and an obvious staging-only
name. Hamilton-T1 was not used or referenced.

The first test transaction stopped on a local assertion that incorrectly
expected a structured row to reuse the legacy physical key. The migration had
correctly namespaced it as `structured-staging-specification`. PostgreSQL rolled
the entire transaction back; an independent read-only query confirmed every
synthetic count was zero and catalog counts were unchanged. Only the temporary
QA assertion in `/private/tmp` was corrected; no schema, ledger, or repository
file was changed.

The corrected test then passed:

- immutable candidate revision and hash-bound test approvals: PASS;
- service-only writer: PASS — 1 feature and 1 grouped specification;
- exact idempotent retry: PASS — same publication batch;
- Product Detail RPC projection, group, ordering, and unit: PASS;
- legacy collision row isolation and exact preservation: PASS;
- product identity and publication status preservation: PASS;
- product-scoped rollback: PASS;
- idempotent rollback retry: PASS;
- unrelated product/characteristic checksum: PASS;
- transaction cleanup and independent residual check: PASS — all counts 0.

The final synthetic artifact SHA-256 was
`4e3f153ca3037f6f2b6efd1d519a509b580937a35f29678972dc84253f9c1e05`;
the artifact remains outside Git and contains no credentials or Product Data.

## 17. RPC, Mapper, and Runtime Smoke

The same server-side RPC route used by Storefront,
`/rest/v1/rpc/cloud_storefront_preview_catalog`, returned HTTP 200 with the
required `cloud_api` profile headers. Existing mapper output matched the RPC:
79 products, 25 manufacturers, and 19 categories. Hamilton-T1 was present with
zero structured key features and zero grouped specifications.

Existing Preview (no new deployment):

- URL: `https://medgraph-hs3inh0cu-medgraph.vercel.app`;
- deployment: `dpl_2uJZSFKHGzdc6AnENFgGKG1s4A4p`;
- branch/commit: `codex/structured-fields-independent-re-review-v2` /
  `fb2d923333cd5f9b244eb9f67c101af2cc11c2bb`;
- status: `READY`.

Runtime checks passed for `/catalog` and Hamilton-T1: 79 products; Summary,
Description, Gallery, Lightbox and Escape, Manufacturer, Back to Catalog, and
Back to Top worked; no synthetic product appeared; Advantages and Technical
Specifications remained fail-closed. Desktop 1440 px and mobile 390 px had one
H1, no horizontal overflow, no runtime-error UI, and zero browser-console
errors.

## 18. Hamilton-T1 and Production Invariance

- Hamilton-T1 has zero structured features and zero structured
  specifications; no candidate, review decision, approval, publication batch,
  enrichment, or Product Data edit was created for it.
- The disputed autonomy claim was neither approved nor published through the
  Structured Fields contract.
- Production Supabase ref remains `clbzibuusyuajsylcbvl`; it was never queried
  with database credentials and received no migration or write.
- Remote Production branch remains
  `66b0f97b0d37fc6fef808833a1a90b415975d5de`.
- Production deployment remains `dpl_7z3WatNfSCm3dZ1ZCdoGJZ9Ybq9E`, created
  `2026-07-16T12:42:55.265Z`, status `READY`.
- Vercel Production still has no environment variables. No Production deploy,
  domain change, or ENV change was performed.

## 19. Local QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 398/398 |
| `npm run lint` | PASS |
| `npx --no-install tsc --noEmit --pretty false` | PASS |
| `npm run build -- --webpack` | PASS — 26/26 static pages generated |
| `git diff --check` | PASS |

The default Turbopack build did not enter application compilation because the
isolated worktree used an ignored symlink to the already-installed dependency
tree in the main workspace; Turbopack rejects symlinks outside its filesystem
root. The accepted webpack build completed successfully. No dependency was
installed and no package or lock file changed.

## 20. ADR and Git Status

ADR-005 is accepted on the evidence of Independent Re-Review v2 and this
controlled staging PASS. Acceptance does not authorize Production migration or
Hamilton publication.

Documentation changes are intentionally uncommitted pending a separate owner
authorization required by the Project Guide. No commit, push, merge, or
deployment was performed in this Stage B task.

## 21. Final Status

**STAGING MIGRATION PASS — READY TO REQUEST DOCUMENTATION COMMIT/PUSH APPROVAL**

- Controlled staging migration: **PASS**.
- Synthetic integration and cleanup: **PASS**.
- Hamilton-T1 changes/publication/approvals: **0**.
- Production connections/writes/migrations/deployments/ENV changes: **0**.
- ADR-005: **Accepted**.
- Main integration: not started.
