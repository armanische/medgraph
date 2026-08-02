# ИДН-03 Corporate Review Queue — 2026-08-02

The generic corporate Review Queue is bound to exactly one new pending revision:

| Field | Value |
| --- | --- |
| Product | ИДН-03 |
| Product ID | `24ac72fc-5c64-4f4e-9f92-cd4eca58e426` |
| Revision ID | `5801cde4-9341-4fe9-9e35-da47627754f9` |
| Review Item ID | `a0654fd4-d65f-450d-b8ed-2270408fdcbe` |
| Route contract | Revision ID |
| State | current, non-stale, `in_review` |
| SEO | present |
| Characteristics / media | `3 / 1` |
| Warnings | `missing_documents`, `missing_registration` |

The queue manifest contains the durable checksum triad recorded in the
[revision creation report](./idn-03-revision-creation-2026-08-02.md). The exact
corporate session can open `/internal/review` and
`/internal/review/5801cde4-9341-4fe9-9e35-da47627754f9`; anonymous access is
redirected to internal login and reveals no evidence. No Review action was
invoked during queue smoke.

The remaining eight special Products are excluded. Historical completed
revisions remain in the immutable source manifest but are filtered from the
pending queue by durable lifecycle state.
