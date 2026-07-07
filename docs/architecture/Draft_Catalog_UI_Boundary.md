# Draft Catalog UI Boundary

Status: Approved for MVP-007

## Purpose

The draft catalog UI displays unverified research candidates without leaking importer internals into client components.

## Boundary rules

- `/catalog` receives only `DraftCatalogCard`.
- `DraftCatalogCard` must not include raw text, full documents, Evidence Candidates, Candidate Claims, or source payloads.
- `/catalog/[slug]` may read the full `DraftCatalogProduct` on the server for review-oriented detail pages.
- UI types live in `types/catalog-draft.ts`.
- UI and app components must not import from `scripts/importers/*`.
- Draft UI must not show CyberMedica Verified, Verified Claims, Publication Timeline, or Verification Status.

## Draft versus verified

Draft products are research candidates. They may show sources, candidate facts, warnings, missing fields, and review metadata. They must clearly state that Verification has not been performed.

Verified product pages remain separate and continue to read only published Projection data.
