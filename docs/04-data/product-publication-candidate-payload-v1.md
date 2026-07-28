# Product Publication Candidate Payload v1

**Date:** 29 July 2026

**Scope:** immutable Product publication candidate and checksum coverage

## 1. Purpose

`cloud.product_publication_candidate_payload_v1(product_id)` is the canonical
database snapshot reviewed by the Product publication workflow. A revision is
valid only while the current candidate payload is equal to its immutable copy.

The contract is built in one PostgreSQL statement and therefore uses one
transaction snapshot. No application-side follow-up reads participate in the
checksum.

## 2. Schema

Corrective migration
`202607290001_publication_candidate_payload_completeness_corrective_v1.sql`
preserves all existing v1 keys and adds two canonical SEO fields inside
`product` plus the top-level `characteristics` array:

```json
{
  "schemaVersion": 1,
  "product": {
    "seoTitle": "...",
    "seoDescription": "..."
  },
  "descriptions": [],
  "characteristics": [],
  "applicationAreas": [],
  "media": [],
  "documents": [],
  "registrations": []
}
```

Existing Product identity, description, application-area, media, document and
registration semantics are unchanged.

## 3. Canonical SEO

The authoritative sources are:

- `cloud.products.seo_title` -> `product.seoTitle`;
- `cloud.products.seo_description` -> `product.seoDescription`.

The Catalog Admin canonical-locale contract keeps active Product content and
the single `cloud.product_descriptions(locale = 'ru')` row synchronized. SEO is
stored only on Product, so no arbitrary locale selection or fallback is
performed. Values are trimmed; empty strings normalize to JSON `null`.

## 4. Characteristic JSON contract

Each active publishable characteristic is serialized as:

```json
{
  "key": "legacy:<key> | structured:<structured_item_id>",
  "contentKind": "legacy_metadata | technical_specification",
  "recordOrigin": "legacy | structured_product_detail",
  "label": "Canonical display name",
  "value": "Canonical normalized value",
  "unit": "Canonical unit or null",
  "group": {
    "key": "Stable group key",
    "title": "Public group title",
    "sortOrder": 0
  },
  "sortOrder": 0
}
```

Eligibility is fail-closed:

- an active legacy row requires `record_origin = 'legacy'`,
  `content_kind = 'legacy_metadata'` and `archived_at IS NULL`;
- an active Structured Fields row additionally requires
  `technical_specification`, `published`, `approved`, a non-null
  `structured_item_id` and no archive marker.

The existing unique constraints make the selected stable key unambiguous for a
Product. Legacy identity is `key`; Structured Fields identity is
`structured_item_id`. The serialized namespace prevents cross-origin
collisions. Characteristic UUIDs are neither serialized nor used for ordering.

The array order is:

1. normalized group `sortOrder`;
2. normalized group `key`;
3. characteristic `sortOrder`;
4. namespaced stable characteristic `key`;
5. lower-cased trimmed display name;
6. exact display name.

The two name fields are deterministic final tie-breakers over canonical
business content. No physical row order or environment-local UUID is used.

Fields intentionally excluded from the characteristic element include
`id`, `raw_value`, `source_reference`, source URL/type, reviewer metadata and
database timestamps. They are not public characteristic content. Eligibility
state changes still affect the checksum by adding or removing the row.

## 5. Checksum and stale revision semantics

The existing SHA-256 functions are unchanged:

```text
current database snapshot
  -> product_publication_candidate_payload_v1
  -> sha256_jsonb_v1
  -> immutable candidate_payload_checksum
  -> existing revision/review/approval/publication stale checks
```

Therefore:

- a Product SEO change changes the candidate checksum;
- a publishable characteristic label/value/unit/group/order change changes it;
- addition, removal, archive or publication-eligibility change changes it;
- restoring the exact publishable state restores the exact checksum;
- a raw provenance, internal source reference or timestamp change does not
  change it.

Review, approval and publication functions already recompute the same candidate
helper, so no parallel invalidation mechanism is introduced.

## 6. Security boundary

The helper remains a `STABLE`, security-invoker SQL function with fixed
`search_path = pg_catalog, cloud`. Direct execution is revoked from `PUBLIC`,
`anon`, `authenticated` and `service_role`. Approved `cloud_api` SECURITY
DEFINER publication wrappers remain the only runtime entry points.

The authoritative owner of
`cloud.product_publication_candidate_payload_v1(uuid)` is `postgres`.
Migration
`202607290002_publication_candidate_function_owner_alignment_v1.sql`
normalizes this explicitly so ownership does not depend on the migration
executor. Ownership is not a substitute for runtime authorization: the closed
direct-execute ACL above remains the independently enforced access boundary.

The migration performs no data mutation, backfill, revision creation, review,
approval, publication or projection change.

## 7. Rollback strategy

The migration is forward-only. If the contract requires correction, deploy a
separately reviewed additive migration that replaces the function definition.
Reverting to the incomplete payload after revisions use the expanded checksum
is unsafe and is not an operational rollback option.

## 8. Verification

`supabase/tests/013_publication_candidate_payload_completeness.sql` proves
determinism, natural-key equivalence, checksum inclusion/exclusion, stale
revision rejection and ACL invariance in a disposable transaction.

`supabase/tests/012_catalog_admin_hamilton_79_regression.sql` imports the
approved immutable 79-Product fixture and proves that Hamilton-T1 candidate
state contains canonical SEO, three active characteristics, three media rows,
current descriptions, and no historical unsupported claim.

`scripts/qa/publication-candidate-owner-alignment-local.ts` proves both the
Production-shaped `postgres -> postgres` upgrade path and normalization of a
divergent local `supabase_admin -> postgres` owner. The function definition,
candidate JSON/checksum, metadata and effective runtime ACL remain unchanged.
