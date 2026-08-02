# ИДН-03 Immutable Revision Creation — 2026-08-02

## Outcome

The corporate-only operation `idn-03-revision-creation-v1` created exactly one
immutable publication revision for ИДН-03 and stopped before Human Review.
Production execution used the authenticated corporate identity
`cybermedicaooo@gmail.com`, Auth UUID
`7e90a993-8b30-4e0d-aff4-a257d5a4a179`, role `admin`. The initial exact runner
commit was `9f12a0f7ecbe73aae52119ebedd11697e58eedce`, deployed READY as
`AB57bPbNU58ouV3ULyF5hNtr1hxW` in Vercel project `medgraph`.

## Immutable scope

| Field | Durable value |
| --- | --- |
| Product | ИДН-03 |
| Product ID | `24ac72fc-5c64-4f4e-9f92-cd4eca58e426` |
| Source UID | `363181290312` |
| Operation key | `idn-03-revision-creation-v1` |
| Per-Product idempotency key | `idn-03-initial-revision-v1` |
| Manifest SHA-256 | `666b2ec919182fce60c625d2642db1f1b2daba522833e7a583e58e8bca78963f` |
| Corrective preview SHA-256 | `92ffb9fb76f517bc4b9532380044bead7887ed4ca099b2447ec0cfd02e56e395` |
| Revision ID | `5801cde4-9341-4fe9-9e35-da47627754f9` |
| Review Item ID | `a0654fd4-d65f-450d-b8ed-2270408fdcbe` |
| Revision number | `1` |

The durable checksum triad is:

- candidate payload: `85dda33600089199c2075edf08cd75f77b474e9bcee424de254f3431b3347540`;
- immutable payload: `de5abe9eff70f515ab3d2908ff91f02888b46e60c0667c3b96c83fffe09a4b80`;
- Product identity: `855dff5fab9e9531e2063550b4bf9641f0ef12efac50d26adb743dd902faa561`.

## Durable verification

A Production transaction used `BEGIN`, `SET TRANSACTION READ ONLY`, SELECT-only
queries and `ROLLBACK`. It confirmed one Revision, one bound Review Item with
status `in_review`, and zero Decisions, Approvals or Publication Batches. All
three stored checksums matched the immutable manifest. The runner's immediate
replay returned the same Revision and Review Item as idempotent evidence; no
duplicate was created.

The snapshot includes canonical `ru`, SEO, three characteristics and one media
asset. Warnings remain `missing_documents` and `missing_registration`.

## Production invariance

After creation, totals are Products `79`, Published/Unpublished `70/9`, and
Revisions/Decisions/Approvals/Publication Batches `71/70/70/70`. Projection
version remains `72`, projection checksum remains
`e2d948c7fd63819099b88431592a643856e50284abebc9a1cf0781c42c2de446`,
and the sitemap remains 70 Product URLs. ИДН-03 remains unpublished. The other
eight special Products remain unchanged with no lifecycle records. No Human
Review, Approval, Publication, Product patch, migration, ENV or DNS change was
performed; Git Fork Protection remained enabled.

## Next manual operation

The Product Owner may open the exact ИДН-03 card in the corporate generic Review
Queue and perform one Human Review. Approval and Publication require a separate
authorized task after durable Decision verification.
