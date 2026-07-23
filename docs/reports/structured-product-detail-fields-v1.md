# Structured Product Detail Fields v1

**Status:** implemented locally; migration not applied; no data published

**Scope:** Cloud schema contract, manual-review gate, service-only publication/rollback, Storefront projection and mapper

**Date:** 23 July 2026

**Normative basis:** [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md), ADR-001, ADR-002 and proposed ADR-005

## Executive summary

The implementation adds a generic, review-gated path for Product Key Features
and Product Technical Specifications. It does not contain product-specific
conditions, HTML extraction, metadata promotion, data backfill or synthetic
values. Existing Product Data, immutable inputs and the ProductService API are
unchanged.

The two migrations are code artifacts only. They have not been applied to
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

The base branch does not contain the earlier Cloud Foundation migration files;
the currently versioned Preview RPC nonetheless depends on those deployed
tables. The schema audit used the recovered local foundation migration as
read-only evidence. Those unrelated, untracked migration files were not copied
into this branch.

## Dependency graph

```text
publication_candidates (schema v1 candidate payload)
        |
        +--> review_items --> review_decisions (one exact decision per field)
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

Publication requires all of the following:

1. `publication_candidates.validation_status = approved`;
2. candidate `approved_by` and `approved_at` are present;
3. candidate target and payload product IDs match;
4. optional source UID matches the target product;
5. payload schema and provenance validate;
6. the latest field-level decision is `approve`;
7. `review_decisions.approved_value` exactly equals the published field.

The field paths are deterministic:

- `structuredProductDetail.keyFeatures.{key}`;
- `structuredProductDetail.specifications.{key}`.

`pending`, `rejected`, deferred/replacement decisions and mismatched approved
values all fail closed. The writer never creates an approval.

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
| publication/rollback | `publication_status`, `publication_batch_id`, `archived_at` |

Legacy import rows receive safe defaults: `content_kind = legacy_metadata` and
`publication_status = unpublished`. They are not emitted as technical
specifications.

The SQL writer executes in one transaction, takes a per-product advisory lock,
checks an idempotency key and payload checksum, snapshots the previous published
state, creates a publication batch, writes only approved fields and records
publication/audit events.

## Rollback

Rollback is limited to the latest published batch for one product. It:

- archives only fields belonging to that batch;
- restores the immediately previous key-feature and specification state;
- restores the previous batch status;
- preserves decisions, provenance, events and audit history;
- returns the same result on repeated calls;
- never deletes or truncates data.

Global or out-of-order rollback is rejected.

## Projection and mapper

The Preview RPC returns only approved, published and non-archived structured
records:

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

No Hamilton-specific data or condition is part of this implementation. The
review candidate described in the task is not present in base commit
`502504a9106a462c4a7ade226d8a8b74d8956ee2`; consequently it was not copied,
changed, approved or published. It may be supplied later as evidence conforming
to the generic candidate contract and must still pass manual review.

## Deployment sequence (not executed)

1. Restore/version the missing prerequisite Cloud Foundation migrations in a
   separate repository-integrity change.
2. Review both new migrations and exercise them against an isolated local
   Supabase database.
3. Apply migrations to staging under an explicit migration authorization.
4. Load a candidate without approving it and verify publication is rejected.
5. Record per-field manual decisions, then run an explicitly authorized
   service-only publication.
6. Verify RPC/mapper/Product Detail and exercise batch rollback.
7. Run schema, RLS, baseline and public-write audits.

No step above is authorized or executed by this implementation task.
