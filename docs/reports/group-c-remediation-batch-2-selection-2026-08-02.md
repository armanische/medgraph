# Group C Remediation Batch 2 Selection — 2026-08-02

## Gate and identity

- Canonical base: `e5fd88c55cc07f484c44b434d96be37373f17d12`.
- Production project: `clbzibuusyuajsylcbvl`.
- Corporate actor: `cybermedicaooo@gmail.com` /
  `7e90a993-8b30-4e0d-aff4-a257d5a4a179` / `admin`.
- Classification artifact SHA-256:
  `8a1215e8779382cb89c94009bf53e4175cd94b1c4a89ecc5c114ae9fbf451170`.
- Selection used Production Product IDs and source UIDs; display names were not
  used as identity keys.

The read-only baseline matched `79 / 50 / 29` Products / Published /
Unpublished and `50 / 50 / 50 / 50` revisions / decisions / approvals /
publication batches. The public projection was version 52 and the sitemap had
50 Product URLs.

## Exact Batch 2 selection

| # | Source UID | Product ID | Canonical model | Risk | Effort | Selection result |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `122386402842` | `050240d2-c1b5-472e-b202-39ab3bb35289` | АПДН-01 | Low | S | Eligible |
| 2 | `198869594712` | `2eb7fd5b-63b9-4eb6-a12f-00001f2f4a4c` | ЭК12Т-01-«Р-Д»/260 | Low | S | Eligible |
| 3 | `259394139301` | `c8ba4609-de12-4109-abf6-07d750f5c14b` | CM1200A | Low | S | Eligible |
| 4 | `279448521542` | `107e911f-5d55-470a-87de-cf9e8be0cdbc` | КРТ | Low | S | Eligible |
| 5 | `344327759482` | `1014ca16-3996-4f17-98b3-057b67cab362` | Corometrics 259cx | Low | S | Eligible |
| 6 | `403689762041` | `5143084e-5fe7-4094-bf8c-6cd8197b741e` | AXEON | Low | S | Eligible |
| 7 | `420215548801` | `37853370-f39c-45ac-9fc5-ecc093cba831` | FB-15V | Low | S | Eligible |
| 8 | `485427737755` | `946b74d5-0163-43b1-b1c8-eb3c488776ae` | ДФР-02 | Low | S | Eligible |
| 9 | `513492182572` | `3a33254d-4088-4bf1-bab6-65c28fe9f5e5` | FG-29V | Low | S | Eligible |
| 10 | `571191341342` | `79b6082c-b63e-4c8e-9769-36383747b57b` | OEC 9900 Elite | Low | S | Eligible |
| 11 | `576228046022` | `46340003-dffa-4321-b5c1-cb3f4a5cf317` | Гемос-ПФ | Low | S | Selected, excluded before patch |
| 12 | `694791065122` | `8bee3a8e-97a7-420a-aa9f-2f082136060d` | УНИКОС-01 | Low | S | Eligible |
| 13 | `757604699272` | `f3053ed8-d29a-41ff-b9e1-a873dd6b77f1` | Гемос | Low | S | Selected, excluded before patch |
| 14 | `860641516881` | `54cac861-bc82-4142-a4c4-bb014f21e68e` | ИДН-02 | Low | S | Eligible |
| 15 | `939922758055` | `eee213c1-3906-474d-8a28-37aa7ea8dc51` | FB-18RBS | Low | S | Eligible |

`Гемос-ПФ` and `Гемос` have cross-contaminated category/base-characteristic
metadata: the plasmapheresis and hemosorption types are swapped. The approved
Catalog Admin RPC cannot mutate characteristics. Both Products therefore
remain unchanged and require a narrow data corrective; guessing or a partial
content-only patch was rejected.

## Batch 3 deferral

Ten High-confidence identities were intentionally deferred because their
content pass includes a manufacturer correction, suffix cleanup, or a broader
contamination reset. Their exact identities are recorded in
[Group C Batch 3 Queue](./group-c-remediation-batch-3-queue-2026-08-02.md).

## Special exclusions

| Product | Source UID | Decision | Durable result | Блокирует запуск |
| --- | --- | --- | --- | --- |
| AOHUA VME-5B | `275089738610` | Media corrective remains open | Unchanged, lifecycle `0/0/0/0` | Нет |
| Pentax EPK-i7010 | `529970599662` | Media corrective remains open | Unchanged, lifecycle `0/0/0/0` | Нет |
| УНИКОС-02/03 combined row | `412668785772` | Exact execution remains unresolved | Unchanged, lifecycle `0/0/0/0` | Нет |
| DIXION Instilar 1438 | `532456144899` | KEEP as a separate Product | Unchanged, lifecycle `0/0/0/0` | Нет |

No revision, Review Decision, Approval or Publication was created in this
selection and patch-preparation operation.

## Revision creation closure — 2026-08-02

The 13 eligible patched Products advanced through the exact immutable
`group-c-batch-2-revision-creation-v1` manifest. Production durable verification
found 13 unique current/non-stale revision 1 records and 13 matching Review
Items. New Decisions, Approvals and Publication Batches remain `0/0/0`.
`Гемос` and `Гемос-ПФ` remain excluded pending the narrow characteristics
corrective. See the [revision creation report](./group-c-remediation-batch-2-revision-creation-2026-08-02.md).
