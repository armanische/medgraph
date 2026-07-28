# Catalog Admin Active Description Contract v1

## Purpose

Catalog Admin edits one canonical active Product description without changing
immutable import provenance or the Product Publication Revision contract. The
contract prevents stale writes and prevents divergence between the active
description columns in `cloud.products` and the normalized description table.

## Canonical locale

The canonical active locale for the current CyberMedica catalog workflow is
`ru`.

- `cloud.products.short_description` maps to
  `cloud.product_descriptions.short_description` for the same Product and
  `locale = 'ru'`.
- `cloud.products.full_description` maps to
  `cloud.product_descriptions.full_description` for the same Product and
  `locale = 'ru'`.
- Other locales are never edited, deleted, used as fallback, or synchronized
  automatically.
- The database uniqueness contract permits at most one description row per
  `(product_id, locale)`.
- A description edit fails closed when the canonical `ru` row is missing. The
  patch operation does not invent or backfill that row.

## Patch contract

The existing PostgreSQL signature is unchanged:

```sql
cloud.catalog_admin_patch_product(uuid, jsonb, text)
```

Every `p_patch` object must include the control field:

```json
{
  "expectedUpdatedAt": "2026-07-28T20:00:00.000000+00:00"
}
```

`expectedUpdatedAt` must be an ISO timestamp with an explicit timezone. It is
not a mutable Product field. Missing, malformed, timezone-free, or stale
values are rejected before any Product mutation. A successful caller must use
the `updatedAt` value returned by the current Catalog Admin Product read.

The existing mutable field names remain unchanged. `shortDescription` and
`description` are the canonical description controls. The wrapper signature
and the positional argument list are unchanged.

## Atomicity and concurrency

The function locks the Product row first and compares its current
`updated_at` with `expectedUpdatedAt`. A description edit then locks only the
same Product's `ru` description row. This stable lock order provides one
optimistic-concurrency boundary for the Product and its canonical active
description.

Within one database transaction the function:

1. validates the trusted service request, actor, patch keys, version, and
   references;
2. locks and version-checks the Product;
3. locks the canonical `ru` description when required;
4. updates the active Product fields;
5. copies the final active short/full values to the locked `ru` row;
6. recomputes the existing quality and review diagnostics;
7. returns the existing Catalog Admin Product DTO.

Any failure rolls back both representations. A concurrent request holding the
same old token waits for the Product lock and then fails with the stale-write
error. An exact retry with an already-consumed token is therefore rejected,
not replayed.

## Provenance boundary

Catalog Admin changes active content only. It does not update:

- `cloud.import_sources.snapshot`;
- import source checksums;
- `cloud.products.source_checksum`;
- import run or import Product evidence;
- immutable publication revisions that already exist.

Historical source content may continue to contain an earlier claim as source
evidence. New Product Publication revisions continue to use the existing
revision payload function and capture the synchronized active Product state.
No revision schema, checksum function, approval binding, publication writer,
or Published Projection contract changes in this corrective.

## Security boundary

The internal implementation remains `SECURITY DEFINER`, owned by `postgres`,
with fixed search path `pg_catalog, cloud, extensions`. Direct execution by
`PUBLIC`, `anon`, `authenticated`, and `service_role` remains denied. The
approved service-only entry point remains:

```sql
cloud_api.catalog_admin_patch_product(uuid, jsonb, text)
```

The migration adds no grants, policies, tables, columns, dynamic SQL, or
caller-controlled object names.

## Operational requirement

Any Catalog Admin consumer integrated after this migration must forward the
current Product `updatedAt` value as `p_patch.expectedUpdatedAt`. Requests from
older consumers that omit the token intentionally fail closed.
