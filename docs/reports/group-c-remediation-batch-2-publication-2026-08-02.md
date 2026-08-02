# Group C Remediation Batch 2 Publication — 2026-08-02

## Verdict

Thirteen exact Group C Batch 2 Products completed corporate Human Review,
Approval and Publication. The closed operation used version and operation key
`group-c-batch-2-publication-v1` and immutable manifest SHA-256
`33b32702f4c433c07a8bb568d8a97f815be2afbb59d750ebddf989a0c01785be`.
Browser input contained only that operation key and digest; all Product,
revision, Review Item, Decision and checksum bindings were loaded from the
server-only manifest.

## Corporate durable Review evidence

Independent Production verification ran inside an explicit read-only
transaction and ended with `ROLLBACK`. All 13 revisions were current/non-stale,
had exactly one positive Decision and retained the exact checksum triad. Every
new Decision and Approval is bound to corporate admin UUID
`7e90a993-8b30-4e0d-aff4-a257d5a4a179`. The legacy reviewer identity was not
used for any Batch 2 action.

| Model | Revision ID | Review Item ID | Decision ID |
| --- | --- | --- | --- |
| АПДН-01 | `08b210a6-2217-4a02-a6ea-ed7c5a847334` | `4351a2f4-9033-40a8-9e60-05b770e2765f` | `4fe1c393-5ea9-440a-985b-b68cf656756c` |
| ЭК12Т-01-«Р-Д»/260 | `882e2a25-bedb-4e6d-b72b-7fc91951a0d7` | `d0849892-ebf1-4089-9539-c7cd2ef1f40a` | `49dbd9ee-2103-437f-ab71-12dfe3848c1c` |
| CM1200A | `8b13c3d0-ae6b-487e-83e5-7b56dbed31a7` | `f254793b-b993-4e56-a972-c09929a3ce41` | `095f35e4-d987-43bf-9d45-2428a97704dc` |
| КРТ | `c0731b0f-cf49-4acf-a227-694e78dca3ab` | `144366fb-f9fa-481d-ab66-1d659234bd40` | `24c97cc8-58c6-4c33-baba-e73fca68b11c` |
| Corometrics 259cx | `4c3b1418-d6d4-43f8-b8c9-269c8af64c5d` | `3a4963b0-30c8-44d5-a49f-48be44b81e73` | `c0431499-52f6-4410-a2b3-c7d981ee260d` |
| AXEON | `70ffc7e1-3953-4c8b-a247-d961c5af23d2` | `3c0d1e94-6c63-4986-9997-962bbdd12f85` | `d1ce6e89-93ee-40e2-94a4-01e94c30ba9c` |
| FB-15V | `cd8abd72-ebb3-4b63-8eaa-a4edf7a933d6` | `43e5460d-c89b-4b26-bef4-d0cadd7e0fa0` | `5dba8373-85b8-452b-b8cf-5b0de0498e38` |
| ДФР-02 | `e9adfcee-3294-4eb1-b33b-bc961f54b8d2` | `5c928d3a-b776-4b7b-8001-c620dbc5b369` | `e9ca6631-748e-42b2-bfb1-0c67c6721b61` |
| FG-29V | `66e2dd8f-9913-4768-8869-306a9cf81789` | `ebc0589c-3e94-4c1b-a264-c41fe7373a4c` | `060d1d4c-ad63-4b74-a5a7-9aead18d8389` |
| OEC 9900 Elite | `12cd2d90-98ad-4cce-a8b8-350f3a0ee4e2` | `2dcd9ee0-377b-4830-84f2-5297eaf1f82e` | `a30a4cc2-6c86-4e91-8549-aaa54b2a65dd` |
| УНИКОС-01 | `dea0e398-4336-4b6e-a2bd-7ba969fa4ef6` | `d413992f-af52-4e0e-918c-61c14dfef427` | `7201c493-6693-4456-8f23-bd22248b76fb` |
| ИДН-02 | `d67a05d2-09d6-4176-910d-8607e6945a9c` | `841a4ae7-dced-469a-8590-ee148c17387f` | `e2ed1888-73b8-4b40-998d-b4ff66578bd9` |
| FB-18RBS | `b3374a31-8103-49d7-adca-dce0740002cb` | `acaa94df-9c4c-4464-8a80-4710ca44f1e5` | `5643b3e1-fc40-4fcd-b149-506cf86c31a4` |

## Approval and Publication evidence

Approval completed 13/13 before Publication began. The runner executed the
existing lifecycle RPCs sequentially, re-read every durable result using the
same idempotency key and rejected any Product outside the manifest.

| Model | Approval ID | Publication Batch ID | Public URL |
| --- | --- | --- | --- |
| АПДН-01 | `b1a4ee02-12ea-4836-984b-bbaf5c0d460c` | `61b90b43-668c-4c78-ae7f-cae6ea51f308` | `/catalog/767632362-122386402842-apparat-podderzhki-dihaniya-neonatalnii` |
| ЭК12Т-01-«Р-Д»/260 | `c0d1cf8c-aca5-44a6-8d66-5e53ab00c948` | `85713a71-b1e9-4751-a7a5-ece322d39ae8` | `/catalog/767632362-198869594712-elektrokardiograf-3-6-12-kanalnii-s-regi` |
| CM1200A | `7bac9147-0c3d-4cd0-9654-1cb0404e8ece` | `45329330-0934-4dab-b14d-4adc50c637fd` | `/catalog/767632362-259394139301-elektrokardiograf-comen-cm1200a` |
| КРТ | `7fad1889-07d3-47bd-b0db-1a6f1eb0c9d9` | `9fb5a27e-db48-4dbb-a557-a973ce9e494c` | `/catalog/767632362-279448521542-teleupravlyaemii-rentgenodiagnosticheski` |
| Corometrics 259cx | `d67aa525-1970-434c-af32-98139d13928c` | `ce82b22c-da10-4374-acf8-9f87055a49ee` | `/catalog/767632362-344327759482-fetalnii-monitor-corometrics-259-cx` |
| AXEON | `3d7989e3-fe97-471c-95c4-dc909433f7f1` | `c3b2f5fc-4623-4d30-a44b-4361265e99ba` | `/catalog/767632362-403689762041-videoendoskopicheskaya-sistema-olympus-a` |
| FB-15V | `6c4915be-c023-4051-be31-1b12060930c1` | `6c6a882f-0dcc-433e-8bb4-6dc56895e294` | `/catalog/767632362-420215548801-bronhofibroskop-pentax-fb-15v` |
| ДФР-02 | `1004c909-7960-4ee9-8be5-3e659e2374e8` | `c4915923-8899-4fc3-a238-0328b875dc75` | `/catalog/767632362-485427737755-defibrillyator-monitor-dfr-02` |
| FG-29V | `6e624028-0ee8-4f9f-8f09-758dcb88cb41` | `16c432b0-edbe-461b-8ad0-5d4f1f9eb58c` | `/catalog/767632362-513492182572-gastrofibroskop-pentax-fg-29v` |
| OEC 9900 Elite | `2e901f8e-a97b-4f3c-a7a3-8a9debfbaaf5` | `bfe572a3-39ec-442c-a4fa-55ea29f89f43` | `/catalog/767632362-571191341342-rentgenohirurgicheskii-apparat-tipa-s-du` |
| УНИКОС-01 | `9799bf89-cf10-4b33-8c7c-ab8ea1ec5b4c` | `409d275f-0554-4372-a3c7-d20bd5a31c36` | `/catalog/767632362-694791065122-fetalnii-monitor-unikos-01` |
| ИДН-02 | `f236e8a0-cc2c-482c-8daa-a32105495bc6` | `349cd68d-bbe8-4c2c-9787-a409dc1b5c59` | `/catalog/767632362-860641516881-inkubator-dlya-novorozhdennih-idn-02-dan` |
| FB-18RBS | `6602fae2-4e45-4264-8992-356746f0aa6f` | `7f33b822-445d-4130-8418-49a6ac269a38` | `/catalog/767632362-939922758055-bronhofibroskop-pentax-fb-18rbs` |

The first operation returned `completed`. An independent second invocation
returned `already_complete` and created no additional Approval or Publication
Batch.

## Production and projection result

| Metric | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 50 | 63 |
| Unpublished | 29 | 16 |
| Revisions | 63 | 63 |
| Decisions | 63 | 63 |
| Approvals | 50 | 63 |
| Publication Batches | 50 | 63 |
| Projection version | 52 | 65 |
| Sitemap Product URLs | 50 | 63 |

Final projection checksum:
`e37f2096713807ff966b25998ff383d788c5dc686de66a6ef0da434a4487298f`.

All 13 Product Detail routes returned HTTP 200 with the exact model, canonical
Russian content, SEO title/description, at least three characteristics and at
least one media item. No internal lifecycle metadata appeared. Homepage,
Catalog and `/request` returned HTTP 200; unsupported `GET /api/request`
returned 405. Sitemap returned 63 unique Product URLs and contains all 13 new
canonical URLs.

## Runtime, exclusions and invariance

Runtime commit `854a4a33dd9626f9ebe4d4b41e32f3ba1cce6fff` was deployed as
Production deployment `dpl_5i7oV47FkVXCE1MK1gRMMRKyQsd1`, status READY,
with canonical aliases assigned. Full tests passed 551/551; lint, TypeScript,
Turbopack and Webpack builds passed. Vercel Git Fork Protection remained
enabled.

The prior 50 published Products were outside the immutable scope. Гемос,
Гемос-ПФ, VME-5B, EPK-i7010, the combined УНИКОС record and Instilar 1438
remain draft with lifecycle `0/0/0/0`. Product content, raw snapshots, source
checksums, migrations, ENV and DNS were unchanged.
