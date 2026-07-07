# CyberMedica Architecture Principles v1

Status: Approved v1.0

Purpose: immutable engineering principles for CyberMedica MVP development.

## Scope

These principles apply to Portal, Projection, Knowledge Engine, importers, artifact storage, manifests, candidate claims, verification, publication, and generated data.

## Non-negotiable principles

1. CyberMedica is an evidence platform, not a marketplace.
2. Trust is the primary product.
3. Importers ingest data; they never publish data.
4. Importers never create Verified Claims.
5. Provider adapters are provider-neutral and do not know Knowledge Factory internals.
6. Raw artifacts are immutable.
7. Documents and DocumentVersions are different entities.
8. Every public fact is represented as a Claim Revision.
9. Every published Claim must have Evidence.
10. Verification and Publication are separate actions.
11. Human review is required before medical facts become verified.
12. Public Portal reads only published Projection.
13. Projection is not a source of truth.
14. AI may retrieve and explain; it must not invent medical facts.
15. Conflicts are preserved, not overwritten.
16. History is append-only.
17. Document identity must be stable and evolvable.
18. No data without provenance may appear as fact.
19. Recommendations must be reproducible.
20. Commercial relationships must not affect verification status.

## Core data flow

```text
Provider / Source
→ Raw Artifact
→ Normalized Record
→ Ingestion Plan
→ Import Manifest
→ Evidence Candidate
→ Candidate Claim
→ Human Verification
→ Publication
→ Projection
→ Portal
```

Draft research may stop at Evidence Candidate or Candidate Claim. It must not cross into Verification or Publication automatically.

## Layer boundaries

- Portal must not import code from importer scripts.
- UI receives UI-safe DTOs, not raw ingestion or research models.
- Importers must not depend on Portal, Projection, Supabase publication tables, or UI components.
- Generated data is an artifact of a pipeline, not a source of verified truth.

## Definition of Done for new modules

- The module has a clear layer and owner.
- It preserves provenance and append-only history.
- It does not publish or verify facts unless explicitly part of the approved Verification or Publication layer.
- It has tests for boundary violations and failure states.
- It documents generated artifacts and mutation points.

## Change control

Any change that weakens provenance, verification, publication integrity, or auditability requires an explicit architecture decision before implementation.

If a shortcut breaks provenance, verification, publication integrity, or auditability, it is not allowed in CyberMedica.
