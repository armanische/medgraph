# Production Launch Operational Decisions — 2026-07-29

**Status:** Accepted operational baseline

**Scope:** decisions used by the first public CyberMedica launch. This is a
decision log, not a replacement for an ADR or for the publication contract.

## Decisions

1. Canonical editable Product description locale is `ru`.
2. Catalog Admin patches require `expectedUpdatedAt`.
3. `rawSnapshot` and `sourceChecksum` are immutable provenance fields.
4. Revision creation is the lifecycle entry into `in_review`.
5. Candidate payload, immutable payload and Product identity checksums remain
   distinct integrity values.
6. The approved expanded Hamilton-T1 claim baseline contains five occurrences.
7. `missing_documents` and `missing_registration` are warnings and do not block
   the current lifecycle; structural invariants remain blocking.
8. Hamilton-T1 is the only Product in the first public launch scope.
9. Production public source is `cloud_published`.
10. The remaining 78 Products remain unpublished.

## Boundaries

- These decisions do not authorize a new Product publication, migration,
  database write, or Production deployment.
- Structural invariants remain independent from editorial warnings.
- Internal UUIDs are environment-local identities. Cross-environment matching
  uses approved stable/natural keys such as source UID, slug and source checksum.
- The first public Product does not imply that draft, approved-but-unpublished or
  static Products are public.

## References

- [Production launch baseline](../reports/production-launch-baseline-2026-07-29.md)
- [ADR-006 — Product publication foundation](./ADR/ADR-006-product-publication-foundation.md)
- [Catalog Admin active description contract](../04-data/catalog-admin-active-description-contract-v1.md)
