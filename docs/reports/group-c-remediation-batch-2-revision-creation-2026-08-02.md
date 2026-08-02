# Group C Batch 2 Immutable Revision Creation — 2026-08-02

## Durable result

The exact 13-Product manifest completed in Production. The runner performed an
immediate full replay and received the same durable bindings with idempotent
results. A subsequent read-only transaction independently verified 13 unique
Products, 13 unique Review Items, revision number 1, current/non-stale checksum
triads, `in_review` state and zero Decisions/Approvals/Batches; it ended with
`ROLLBACK`.

| Source UID | Model | Revision ID | Review Item ID |
| --- | --- | --- | --- |
| `122386402842` | АПДН-01 | `08b210a6-2217-4a02-a6ea-ed7c5a847334` | `4351a2f4-9033-40a8-9e60-05b770e2765f` |
| `198869594712` | ЭК12Т-01-«Р-Д»/260 | `882e2a25-bedb-4e6d-b72b-7fc91951a0d7` | `d0849892-ebf1-4089-9539-c7cd2ef1f40a` |
| `259394139301` | CM1200A | `8b13c3d0-ae6b-487e-83e5-7b56dbed31a7` | `f254793b-b993-4e56-a972-c09929a3ce41` |
| `279448521542` | КРТ | `c0731b0f-cf49-4acf-a227-694e78dca3ab` | `144366fb-f9fa-481d-ab66-1d659234bd40` |
| `344327759482` | Corometrics 259cx | `4c3b1418-d6d4-43f8-b8c9-269c8af64c5d` | `3a4963b0-30c8-44d5-a49f-48be44b81e73` |
| `403689762041` | AXEON | `70ffc7e1-3953-4c8b-a247-d961c5af23d2` | `3c0d1e94-6c63-4986-9997-962bbdd12f85` |
| `420215548801` | FB-15V | `cd8abd72-ebb3-4b63-8eaa-a4edf7a933d6` | `43e5460d-c89b-4b26-bef4-d0cadd7e0fa0` |
| `485427737755` | ДФР-02 | `e9adfcee-3294-4eb1-b33b-bc961f54b8d2` | `5c928d3a-b776-4b7b-8001-c620dbc5b369` |
| `513492182572` | FG-29V | `66e2dd8f-9913-4768-8869-306a9cf81789` | `ebc0589c-3e94-4c1b-a264-c41fe7373a4c` |
| `571191341342` | OEC 9900 Elite | `12cd2d90-98ad-4cce-a8b8-350f3a0ee4e2` | `2dcd9ee0-377b-4830-84f2-5297eaf1f82e` |
| `694791065122` | УНИКОС-01 | `dea0e398-4336-4b6e-a2bd-7ba969fa4ef6` | `d413992f-af52-4e0e-918c-61c14dfef427` |
| `860641516881` | ИДН-02 | `d67a05d2-09d6-4176-910d-8607e6945a9c` | `841a4ae7-dced-469a-8590-ee148c17387f` |
| `939922758055` | FB-18RBS | `b3374a31-8103-49d7-adca-dce0740002cb` | `acaa94df-9c4c-4464-8a80-4710ca44f1e5` |

Every revision preserves the checksum triad recorded in the controlled patch
report, includes canonical Russian content, SEO, exactly three characteristics,
approved media and warnings `missing_documents` / `missing_registration`.

## Invariance

- Products / Published: `79 / 50`;
- lifecycle Revisions / Decisions / Approvals / Batches: `63 / 50 / 50 / 50`;
- public projection: version `52`, 50 Products;
- Product content, raw snapshots and source checksums: unchanged;
- Гемос and Гемос-ПФ: draft, lifecycle `0/0/0/0`;
- Human Review, Approval and Publication performed by this operation: none.

## Publication closure — 2026-08-02

The thirteen revisions later completed corporate Human Review, Approval and
Publication through the separate immutable
`group-c-batch-2-publication-v1` operation. Durable Production totals are
`63/63/63/63` for Revisions/Decisions/Approvals/Batches. See the
[Batch 2 publication report](./group-c-remediation-batch-2-publication-2026-08-02.md).
