# Catalog Publication Inventory — 2026-07-31

Canonical Production inventory after Group C remediation Batch 3 publication:

| Metric | Value |
| --- | ---: |
| Products | 79 |
| Published | 71 |
| Unpublished | 8 |
| In Review — resolved Group B six | 0 |
| Reviewed and ready for controlled Approval | 0 |
| Group B pending Product Owner resolution | 0 |
| Group C remaining | 8 |
| Group C Batch 2 published | 13 |
| Group C Batch 2 characteristic corrective | 2 |
| Group C Batch 3 published | 7 |
| Group C special correctives unresolved | 8 |
| Final-nine pending corporate Review | 0 |
| Projection version | 73 |
| Sitemap Product URLs | 71 |

The published set consists of Hamilton-T1, Mindray SV300, Agilia SP MC, the ten
Products recorded in [Catalog Publication Wave 1](./catalog-publication-wave-1-2026-07-30.md),
the fifteen Products recorded in [Catalog Publication Wave 2](./catalog-publication-wave-2-2026-07-31.md),
the eight Products recorded in [Catalog Publication Wave 3](./catalog-publication-wave-3-2026-07-31.md),
the six Products recorded in the
[resolved Group B publication closure](./group-b-six-publication-2026-07-31.md),
and the eight Products recorded in the
[Group C Batch 1 publication closure](./group-c-remediation-batch-1-publication-2026-08-01.md),
plus the thirteen Products recorded in the
[Group C Batch 2 publication closure](./group-c-remediation-batch-2-publication-2026-08-02.md),
and the seven Products recorded in the
[Group C Batch 3 publication closure](./group-c-remediation-batch-3-publication-2026-08-02.md).
No unpublished Product is present in the public projection or sitemap.

The 2026-08-02 read-only
[Published Product Detail audit](./published-product-detail-audit-2026-08-02.md)
confirmed all 71 Product pages at HTTP 200 with no unpublished leakage. Every
published Product currently has exactly three base characteristics. The first
15-Product enrichment queue is documented separately; no Product or lifecycle
write occurred during the audit.

The reviewed Group A and resolved Group B queues are closed. Instilar 1438 is
excluded in the [dedup backlog](./instilar-1438-dedup-backlog-2026-07-31.md).
The remaining eight Products are tracked in the
[special correctives queue](./group-c-special-correctives-queue-2026-08-02.md).

Batch 3 closed with seven corporate-reviewed Products published. The final-nine
corrective pass subsequently patched ИДН-03 through the approved Catalog Admin
boundary. Its exact immutable revision completed corporate Human Review,
Approval and Publication with lifecycle `1/1/1/1`; eight rows remain in
controlled technical/owner/policy queues with lifecycle `0/0/0/0`. None is
exposed by the 71-URL sitemap.
