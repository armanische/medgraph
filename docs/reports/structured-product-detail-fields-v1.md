# Structured Product Detail Fields v1

**Status:** corrective implementation local; migrations not applied; no data published

**Scope:** Cloud schema contract, manual-review gate, service-only publication/rollback, Storefront projection and mapper

**Date:** 23 July 2026

**Normative basis:** [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md), ADR-001, ADR-002 and proposed ADR-005

## Executive summary

The implementation adds a generic, revision-bound review path for Product Key
Features and Product Technical Specifications. The forward-only integrity
migration binds approval to an immutable candidate revision, canonical payload
SHA-256 and product identity/version snapshot. It also separates legacy and
structured characteristic identity and records an exact rollback mutation log.
It does not contain product-specific
conditions, HTML extraction, metadata promotion, data backfill or synthetic
values. Existing Product Data, immutable inputs and the ProductService API are
unchanged.

The three migrations are code artifacts only. They have not been applied to
local, staging or Production Supabase, and the publication/rollback RPCs have
not been called.

## Current-state audit

The effective Cloud contract already provides:

- `cloud.products` and `cloud.product_characteristics`;
- product-level `cloud.publication_candidates`;
- manual `cloud.review_items` and field-level `cloud.review_decisions`;
- append-only `cloud.publication_events` and `cloud.audit_log`;
- `cloud.is_service_request()` and service-only `cloud_api` RPCs;
- `cloud.cloud_storefront_preview_catalog()` and the server-only
  `CloudPreviewCatalogRepository`;
- Storefront `Product.keyFeatures` and `Product.specifications` fields.

The existing `product_characteristics` relation already has canonical label,
value, unit, ordering, provenance reference and reviewer status columns. It is
therefore extended instead of duplicated. Existing review and publication
entities are reused. No batch entity existed for a reversible structured-field
publication, so one minimal relation is added.

The full prerequisite migration chain is committed and checksum-pinned by
`supabase/tests/structured-fields-migration-chain-v1.json`. Historical
Structured Fields migrations `202607230001` and `202607230002` remain unchanged;
`202607230003` is the only forward corrective migration.

## Dependency graph

```text
publication_candidates (editable schema v1 candidate payload)
        |
        v
immutable candidate revision (payload + product identity SHA-256)
        |
        +--> revision approval
        +--> review_items --> revision-bound review decisions
        |
        v
service-only publication RPC
        |
        +--> product_detail_publication_batches
        +--> product_key_features
        +--> product_characteristics (technical_specification only)
        +--> publication_events / audit_log
        |
        v
service-only Cloud Preview RPC
        |
        v
CloudPreviewCatalogRepository
        |
        v
Cloud Preview mapper --> existing Storefront Product contract
        |
        v
Product Detail fail-closed presentation
```

Public UI, ProductService and CatalogRepository do not know about review,
publication batches, provenance or service credentials.

## Candidate and review contract

Candidate schema version 1 contains a product identity plus atomic
`keyFeatures` and `specifications`. Every record has a stable key, ordering and
source `{ type, ref, url? }`. Specifications may carry an optional group.

Before review, a service-only boundary creates an immutable revision containing
the canonical JSONB payload, schema version, full product identity/version
snapshot, separate candidate/product checksums and one combined SHA-256. Arrays
retain their order, so ordering, grouping, units and provenance are covered.
Editing the candidate creates a new revision; it cannot mutate an existing one.

Publication requires all of the following:

1. `publication_candidates.validation_status = approved`;
2. candidate `approved_by` and `approved_at` are present;
3. candidate target and payload product IDs match;
4. optional source UID matches the target product;
5. payload schema and provenance validate;
6. candidate-level approval references the exact revision and both checksums;
7. the latest field-level decision references the same revision and checksums;
8. the decision is `approve` and its approved value exactly equals the field.

The field paths are deterministic:

- `structuredProductDetail.keyFeatures.{key}`;
- `structuredProductDetail.specifications.{key}`.

`pending`, `rejected`, deferred/replacement decisions, stale revisions and
mismatched approved values all fail closed before a publication batch is
created. The writer never creates an approval.

## Storage and publication

`product_key_features` stores atomic revisions with provenance, review status,
publication status, order, approval decision and publication batch.

`product_characteristics` keeps its existing columns as canonical mappings:

| Structured concept | Existing/new column |
| --- | --- |
| label | `display_name` |
| value | `normalized_value` (`raw_value` retains the approved value too) |
| unit | `unit` |
| order | `sort_order` |
| provenance ref | `source_reference` |
| review status | `reviewer_status` |
| technical/metadata distinction | `content_kind` |
| optional group | `group_key`, `group_title`, `group_sort_order` |
| provenance type/URL | `source_type`, `source_url` |
| managed identity | `record_origin`, `structured_item_id`, `candidate_revision_id` |
| publication/rollback | `publication_status`, `publication_batch_id`, `archived_at` |

Legacy import rows receive safe defaults: `record_origin = legacy`,
`content_kind = legacy_metadata` and `publication_status = unpublished`.
Structured rows use `record_origin = structured_product_detail` plus stable
item/revision/batch identity. Partial unique indexes allow the same display key
in each namespace; the writer never uses a legacy row as an UPSERT target.

The SQL writer executes in one transaction, takes a per-product advisory lock,
recomputes all hashes, verifies current product identity and revision-bound
decisions, checks idempotency, snapshots every managed row before mutation,
creates a publication batch, writes only approved fields and records a complete
before/after mutation log plus publication/audit events. The v1 service grant is
revoked by the corrective migration. The v2 writer does not mutate the editable
candidate payload or its review status; publication state belongs to the
revision-bound batch.

## Rollback

Rollback is limited to the latest published batch for one product. It:

- deletes only structured rows created by that batch;
- restores every managed row changed by the batch, including exact timestamps,
  archive state, decision, provenance, revision and batch identity;
- restores the previous batch status;
- preserves decisions, provenance, events and audit history;
- returns the same result on repeated calls;
- never changes or deletes a legacy row.

Global or out-of-order rollback is rejected.

## Projection and mapper

The Preview RPC returns only revision-bound, managed, approved, published and
non-archived structured records:

```json
{
  "keyFeatures": [{ "text": "…", "sortOrder": 10 }],
  "characteristicGroups": [{
    "key": "general",
    "title": "Характеристики",
    "sortOrder": 0,
    "items": [{ "label": "…", "value": "…", "unit": null, "sortOrder": 10 }]
  }]
}
```

Provenance and review identifiers stay internal. The mapper rejects markup,
preserves group/item ordering and ignores transitional legacy
`characteristics`. Empty/missing arrays remain empty, so Product Detail keeps
its existing fail-closed behavior. ProductService and the Storefront Domain
Model required no change.

## Hamilton-T1 boundary

No Hamilton-specific data or condition is part of the runtime implementation.
The recovered package is used only as an offline validation fixture: 6 key
features, 15 specifications and 21 provenance references. It remains
`needs_manual_approval`, has zero approvals and is not publishable. The claim
“Более 9 часов работы от аккумулятора” remains ambiguous and has insufficient
evidence; it was neither changed nor approved.

## Deployment sequence (not executed)

1. Independently re-review the immutable revision, grants and rollback contract.
2. Review all three Structured Fields migrations and exercise them against an isolated local
   Supabase database.
3. Apply migrations to staging under an explicit migration authorization.
4. Create a revision without approving it and verify publication is rejected.
5. Record revision-bound candidate and field decisions, then run an explicitly authorized
   service-only publication.
6. Verify RPC/mapper/Product Detail and exercise batch rollback.
7. Run schema, RLS, baseline and public-write audits.

No step above is authorized or executed by this implementation task.
