# Production Cloud Internal Function Grants Hardening v1

## Purpose

This policy removes inherited `PUBLIC EXECUTE` from sixteen internal
`cloud.*` implementation functions. Public and server runtime integrations
continue to use the approved `cloud_api` wrappers. The migration does not
change function bodies, signatures, owners, search paths, RLS policies, data,
or publication/projection behavior.

Migration:

- `202607280001_production_cloud_internal_function_grants_hardening_v1.sql`
- SHA-256:
  `ba341fbdefe1a0cc9657b251060f841437f2e86a90517970a8c9a0d04adc91c2`

## Approved ACL matrix

All sixteen functions deny direct `EXECUTE` to `PUBLIC` and `anon`.

| Internal function group | authenticated | service_role | Execution path |
| --- | --- | --- | --- |
| Twelve writer/read/rollback implementations | denied | denied | `cloud_api` SECURITY DEFINER wrapper |
| `enforce_product_publication_state_v1()` | denied | denied | trigger only |
| `prevent_product_publication_record_mutation_v1()` | denied | denied | trigger only |
| `current_app_role()` | allowed | allowed | authenticated RLS and service policy helper |
| `is_service_request()` | denied | allowed | service policy helper |

Function ownership remains `postgres`. Owner execution follows PostgreSQL's
native ownership contract and is not represented by a runtime grant.

## Exact protected inventory

1. `cloud.apply_catalog_data_quality_v1(jsonb, text)`
2. `cloud.apply_product_import_v1(jsonb, text)`
3. `cloud.apply_reference_import(jsonb, text)`
4. `cloud.apply_reference_publication(jsonb, text)`
5. `cloud.catalog_admin_patch_product(uuid, jsonb, text)`
6. `cloud.catalog_admin_product(uuid)`
7. `cloud.catalog_admin_products(text, text, text)`
8. `cloud.catalog_admin_references(text)`
9. `cloud.catalog_data_quality_inventory()`
10. `cloud.current_app_role()`
11. `cloud.enforce_product_publication_state_v1()`
12. `cloud.is_service_request()`
13. `cloud.prevent_product_publication_record_mutation_v1()`
14. `cloud.reference_publication_snapshot()`
15. `cloud.rollback_product_import_v1(text)`
16. `cloud.rollback_reference_publication(text)`

## Preserved contracts

- `review_decisions_reviewer_insert` and `internal_viewer_read` retain access
  to `cloud.current_app_role()` for `authenticated` callers.
- `import_runs_service_insert` retains access to
  `cloud.is_service_request()` for `service_role`.
- service-only Catalog, import, quality and reference operations remain
  callable through their existing `cloud_api` wrappers.
- `cloud_api.cloud_published_storefront_catalog_v1()` is unchanged.
- trigger execution remains attached to the Product publication integrity
  tables without any direct runtime grant.

## Verification contract

The targeted SQL regression verifies all sixteen identities and body hashes,
owners, SECURITY DEFINER modes, exact role privileges, wrapper privileges,
RLS/policy inventory, trigger attachment, authenticated/service helper paths,
the empty Published RPC, and zero Product/publication rows. Reapplying the raw
migration is idempotent; the remote Supabase ledger still applies it once.

Production application requires the controlled preflight and stop conditions
defined by the Production Cloud Internal Function Grants Hardening v1 gate.
