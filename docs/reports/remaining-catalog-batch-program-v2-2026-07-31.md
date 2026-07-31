# Remaining Catalog Batch Program v2 — 2026-07-31

## Scope

This report records the revised policy execution for the 33 High-confidence
Products from the authoritative model-resolution artifact. The initial
validation report remains historical; its visual exact-match and exact-RU
requirements were superseded by the Product Owner rule that only explicit
media contradiction is a blocker and missing registration is a warning.

## Initial execution state

| Area | Result |
| --- | ---: |
| Initial Group A | 33 |
| Eligible under revised policy | 33 |
| Excluded | 0 |
| Catalog patches | 33/33 |
| Revision preflight | 33/33 |
| Revisions created | 33 |
| Human Review decisions | 0 |
| Approvals | 0 |
| Publications | 0 |
| Generic Review Queue | implemented, not deployed |

All 33 records were prepared for the Product Owner's Human Review. The queue
is generic and uses `/internal/review` plus `/internal/review/[revisionId]`;
there are no per-Product routes.

## Wave 1 completed state

The following ten completed Human Review, Approval and Publication through the
exact server-only Wave 1 manifest:

1. BeneVision N1 — revision `df13433f-7461-40fd-9c9c-e026254f9ec4`
2. Instilar 1428 — revision `0fcedfbd-bc41-41e2-b6c5-fadae6ef4918`
3. BeneVision N17/N15/N12 — revision `3a510da7-13b9-40ae-9791-2d7475577dd3`
4. Hamilton-C1 — revision `45f10d39-7204-4cef-bee4-a6e644671a08`
5. Hamilton-C3 — revision `cdce4e6c-3788-4e43-b73a-d61c870bdd71`
6. BeneHeart D3 — revision `c811034f-cb9d-44ac-8cf7-b2f6cb223c1e`
7. Vacus 7308 — revision `d96aade7-9733-41ad-965f-b60ddcd9187e`
8. Bionet BM3 — revision `6c61405f-2765-484d-8dbb-27581e12397e`
9. Storm 5800 — revision `f150f4bc-c8d7-4069-ab45-c73c15d091dc`
10. GE Versana Essential — revision `a84e9afe-0245-429a-ba4a-acc9926d49d0`

All entries retain the same non-blocking warnings:
`missing_registration`, `missing_documents`.

All 33 Group A revisions are now Published across three controlled waves.
Production contains 36 Published and 43 Unpublished Products; the Group A
reviewed/unpublished queue is empty. See [Wave 1 closure](./catalog-publication-wave-1-2026-07-30.md),
[Wave 2 closure](./catalog-publication-wave-2-2026-07-31.md) and
[reviewed batch closure](./catalog-publication-reviewed-batch-closure-2026-07-31.md).

## Next controlled action

The seven Group B decisions were resolved. Six exact Products completed manual
Human Review, Approval and Publication through
[`group-b-six-publication-v1`](./group-b-six-publication-2026-07-31.md).
Production now contains 42 Published and 37 Unpublished Products; projection
version is 44 and the sitemap contains 42 Product URLs. Instilar 1438 remains
excluded with lifecycle `0/0/0/0`.

The next controlled action is the read-only
[Group C remediation queue](./group-c-remediation-queue-2026-07-31.md).
Completed operation keys must not be reused.
