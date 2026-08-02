# Group C Remediation Batch 3 Revision Creation — 2026-08-02

## Durable result

The exact corporate Production operation created seven immutable revision 1
records and seven Review Items. Its built-in replay check returned the same
seven durable bindings without increasing lifecycle totals a second time.

| Model | Product ID | Source UID | Revision ID | Review Item ID | Chars / media |
| --- | --- | --- | --- | --- | ---: |
| HD-1 | `64b8a4a0-9d45-472d-aa85-f47c5b593fcd` | `300255468231` | `075ff1ca-ecdd-4f78-a2cf-904d9a28a6bf` | `7ef0838d-0f4d-47ac-9a49-02e4edb262ac` | 3 / 2 |
| Овертон 6200 | `8ac30c51-503e-404c-9912-0ec4dc68920c` | `323650602021` | `e5ecef0b-8d13-4f01-9f51-080790d8f481` | `b6665afb-4b8a-4763-a806-6805840f1cb0` | 3 / 2 |
| Versana Premier | `cb139c6c-5cbc-4dc0-aa80-3114856d3dd1` | `358648454622` | `af0233e6-71f9-4ade-a118-bff8c7b69446` | `8a2344e2-1811-4923-a4fc-83abdef47c52` | 3 / 1 |
| Giraffe Incubator Carestation | `d05a5e6a-c431-4ff3-81ef-0b8bf7804da3` | `480491530831` | `a0365bdb-2bbc-44ac-9e02-c920c3afba7f` | `65feb6a5-21ef-4d48-a484-8a3f65a32c53` | 3 / 1 |
| EPK-3000 DEFINA | `ec3d6459-264c-43f6-841c-b092c7abeb06` | `670271281172` | `46222169-c0e4-446b-bb69-a6e52c553fbc` | `b6cb6ef1-2e07-4644-a5af-cf5610ad680e` | 3 / 2 |
| CARDIPIA 200 | `eb488432-182d-4808-a96e-a17462f1b4f0` | `868434933208` | `b4cafd0c-fc0c-4d64-91fc-e4065ae679a6` | `0b22bed6-da14-470b-a8aa-933840a5f322` | 3 / 1 |
| Овертон 6900 | `d683e351-fbc6-40a0-8b5c-f844edb6cfa4` | `928472985221` | `271c99e7-d6ff-45ab-86ef-81678a15a9ca` | `9d400544-5705-479e-8c2f-759aefa72f78` | 3 / 1 |

For every row the candidate, immutable payload and Product identity checksums
equal the deterministic preflight triad recorded in the
[controlled patch report](./group-c-remediation-batch-3-patch-2026-08-02.md).
Canonical `ru`, SEO, characteristics and media are included. Warnings remain
`missing_documents` and `missing_registration`.

## Lifecycle and invariance

| Metric | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published / unpublished | 63 / 16 | 63 / 16 |
| Revisions | 63 | 70 |
| Decisions | 63 | 63 |
| Approvals | 63 | 63 |
| Publication Batches | 63 | 63 |
| Pending Review Items | 0 | 7 |
| Projection version | 65 | 65 |
| Sitemap Product URLs | 63 | 63 |

No Human Review, Approval or Publication was performed. Published Products,
all explicitly excluded Products, raw snapshots, source checksums, migrations,
ENV and DNS were unchanged.

## Publication handoff

The seven revisions subsequently completed corporate Human Review, Approval
and Publication through the immutable `group-c-batch-3-publication-v1`
operation. Production reached 70 Published Products. See the
[Batch 3 publication closure](./group-c-remediation-batch-3-publication-2026-08-02.md).
