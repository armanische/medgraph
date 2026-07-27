# Publication Policy v2 — Editorial Diagnostics

**Status:** Launch Critical policy
**Effective date:** 28 July 2026
**Scope:** editorial and diagnostic classification only

## Purpose

Publication Policy v2 removes artificial publication blockers caused by absent
supplementary materials while preserving the approved Cloud publication
architecture. It does not change the Product model, Publication Pipeline,
Published Projection, Storefront, ProductService, CatalogRepository, UI, or
Supabase schema.

The policy separates two independent layers. A warning in the editorial layer
cannot bypass a failed structural invariant, Human Review, or publication
approval.

## A. Structural invariants

Structural invariants describe the minimum coherent catalog object. They remain
authoritative in the existing publication and projection contracts.

- Product identity, including a non-empty title, slug, and canonical identity.
- Model, manufacturer, and assignable published category.
- Application area is a structural invariant: every Product requires at least
  one published application area and no invalid mandatory reference.
- No duplicate identity or slug, and no unresolved import conflict.
- Valid characteristics where characteristics are present and required by the
  applicable product contract.
- Current Human Review approval and revision-bound publication approval.

Failure of a structural invariant remains a publication blocker. This policy
does not change its enforcement.

## B. Editorial diagnostics

The following codes are editorial warnings:

- `missing_registration`
- `missing_documents`
- `missing_manual`
- `missing_brochure`
- `missing_datasheet`

An editorial warning may lower editorial completeness or a future Quality Score,
but it must not change Publication Eligibility. The current data model has no
separate Quality Score; `catalog_quality_status` remains a structural status and
must not be derived from these warning codes.

`missing_manual`, `missing_brochure`, and `missing_datasheet` are reserved
warning codes. They do not add new database columns or alter the existing
document model.

## Admin and audit behaviour

Existing internal admin surfaces render unresolved `cloud.import_warnings` as
warnings. No UI change is required for this policy. Import diagnostics retain
their source product, timestamp, resolution fields, and metadata, which is the
audit record for an editorial diagnostic.

If a later importer emits one of the five codes, it must write it as an
`import_warning`, never as an unresolved `import_blocking_error`. Resolving the
warning remains auditable; resolving it is not a prerequisite for publication.

## Eligibility boundary

The existing Publication Pipeline remains the sole authority for Product
eligibility. Product publication still requires all existing structural checks,
an immutable current revision, a valid Human Review decision, and an exact
publication approval. Policy v2 neither approves nor publishes a product.

## Operational consequence

Publication Readiness reports must show two independent values:

1. structural/publication blockers; and
2. editorial warnings.

This prevents missing optional materials from being counted as publication
blockers while keeping them visible to the editorial team.
