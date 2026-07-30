# Group A Minimal Publishable Content Batch — 2026-07-31

## Executive result

The revised Product Owner policy was applied to the 33 High-confidence model
resolutions. No Product had a concrete media conflict, so working media passed
the revised metadata/URL gate. Existing claims were replaced with a minimal
Russian package grounded in the recorded manufacturer source; no uncertain
registration number was added.

| Gate | Result |
| --- | ---: |
| Eligible candidates | 33 |
| Explicit media conflicts | 0 |
| Controlled Catalog Admin patches | 33/33 PASS |
| Stale patches | 0 |
| Failed patches | 0 |
| Canonical locale changed | `ru` only |
| Characteristics retained | 3 per Product |
| Media retained | 55 total |
| Claims policy | imported claims replaced; minimal neutral copy |
| Registration | warning only; no RU number added |

The patch preview was generated before writes and contained no lifecycle or
immutable fields. Every patch used the existing
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` contract with an exact
`expectedUpdatedAt` token. Product title was retained to avoid changing stable
identity; model, descriptions, SEO and synchronized canonical `ru` content were
updated atomically.

Preview artifact (outside Git, mode `0600`):

`/tmp/group-a-minimal-batch-patch-preview-2026-07-31.json`

SHA-256: `e0fbf16998279efb57a230b9b857dddefdcf1314df6d8e52f396c3663d7d6d54`

Patch result artifact (outside Git, mode `0600`):

`/tmp/group-a-minimal-batch-patch-results-2026-07-31.json`

SHA-256: `e6da67936c7818cdb941914a60498472690825e1b1e27577f1ea6dc392412882`

## Post-patch state

All 33 Products remain unpublished and carry only the non-blocking warnings
`missing_registration` and `missing_documents`. Published Products remain
exactly Hamilton-T1, Mindray SV300 and Fresenius Kabi Agilia SP MC.

No migration, ENV, DNS, Storefront, Projection or Product mutation outside the
approved Catalog Admin RPC occurred.
