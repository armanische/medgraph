# Group C Remediation Batch 1 Publication — 2026-08-01

## Verdict

Eight exact Group C Batch 1 Products completed corporate Human Review,
Approval and Publication. The immutable operation manifest is
`group-c-batch-1-publication-v1`, SHA-256
`8df78bc385aa62f829831af2c8dcc87622b9639b2daedc66d52c57b7664f1853`.
It contains no browser-supplied Product scope and excludes VME-5B, EPK-i7010,
both UNIKOS records and Instilar 1438.

## Corporate durable Review evidence

Read-only Production verification ran inside an explicit read-only transaction
and ended with `ROLLBACK`. Each revision is revision 1, current/non-stale, bound
to exactly one Review Item and one positive Decision. The reviewer is the
corporate admin UUID `7e90a993-8b30-4e0d-aff4-a257d5a4a179`; no legacy identity
was used. Rationale is present and all three tracked checksums match.

| Model | Revision ID | Review Item ID | Decision ID |
| --- | --- | --- | --- |
| EPK-i5000 | `685637b7-471a-4b8e-bd85-95633f6caf03` | `b9de9b94-06d5-4dd2-8eca-be70842521e5` | `e9acacb1-3e09-41c9-afa7-e5c4fc9301bd` |
| HD-350 | `e87cbd30-ccd5-4418-93ac-2c3817a842c9` | `376c2abb-3a5c-4332-8102-87c830380cbe` | `030b1756-46f4-4475-9252-9e903bc4a5f6` |
| HD-500 | `650e6150-fada-41ee-a3a3-f8ea2da5b65c` | `000ca5ac-040e-4043-bc79-4217861afaee` | `3e6c9e37-ea8d-4424-b9a0-f79b7028680a` |
| Dialog+ | `acae1207-9d59-4ad9-94d8-1716a6655812` | `f29dc1b9-46bd-416d-b3ce-43cee09438d6` | `89987466-3879-415f-8798-38de2e185e77` |
| BabyGuard 1120 | `c4c4cc16-1631-4289-9437-7a908c4b53ed` | `31a9eadd-79bd-4773-8ed4-297d9ed7e4e5` | `13d17a15-d5ea-46b8-add5-263603097d87` |
| JAY-10 | `a7fef268-87c8-44b4-bb38-265befedaed1` | `8871eedd-311c-403d-a79a-098ed6b0d4e2` | `d90b951f-b846-4926-a5e4-0d3684bbdbc2` |
| Discovery RF180 | `8f68bcc0-0822-4a14-ae1f-09b3804a2d6a` | `b0df7213-03c1-4419-aace-4f88ef481c4d` | `1a74035d-30e4-46c7-816c-7d88ef6063a5` |
| CM1200B | `181da0a6-fad3-4c2c-aed9-fec7ca06634f` | `7811faa4-45c5-4a2a-b169-4b02f3d9e3d2` | `4ec94b06-276f-4fdc-9ddc-f022391c2bfd` |

## Approval and Publication evidence

The closed server-only runner accepted only the operation key and manifest
digest, reloaded the exact scope server-side and required the live corporate
admin session. Approval completed 8/8 before Publication began.

| Model | Approval ID | Publication Batch ID | Public URL |
| --- | --- | --- | --- |
| EPK-i5000 | `3bff17ca-5698-419a-a498-99cf09020ff2` | `7ef6e613-aeb9-4c86-88fa-872af8c3e1c8` | `/catalog/767632362-446510199362-videoendoskopicheskaya-sistema-pentax-ep` |
| HD-350 | `a7a9a435-fe25-4265-9061-41c64c55b5a0` | `66ad6f57-b813-46b4-b5a6-c72e44f317b3` | `/catalog/767632362-776712772161-videoendoskopicheskaya-sistema-sonoscape` |
| HD-500 | `1eba140b-1795-4b3e-a4ee-d0852ac1f275` | `deea5e94-4475-40d1-b493-4c4eb46d7cfc` | `/catalog/767632362-697047413241-videoendoskopicheskaya-sistema-sonoscape` |
| Dialog+ | `0c177ffd-822a-4618-a0e0-a9ae5441526a` | `c53e516e-f48d-435f-92c0-d9b9027f132e` | `/catalog/767632362-601909099101-gemodializnii-apparat-iskusstvennaya-poc` |
| BabyGuard 1120 | `e2a144f2-e7c4-4888-a656-5d2331176c08` | `1bbe9c1f-b93f-47cc-88ab-add703b99d20` | `/catalog/767632362-574929514601-inkubator-dlya-nedonoshennih-detei-bebig` |
| JAY-10 | `57bc60e5-734e-4eea-a98a-c57160546e2f` | `0eea66bd-669f-40d5-b9a7-d4a295fa6ac4` | `/catalog/767632362-608519946332-kislorodnii-kontsentrator-jay-10-longfia` |
| Discovery RF180 | `64c9d2c5-f887-40f1-acfe-6d588ab38217` | `d629f17a-8e32-4dbf-a874-47bde0704237` | `/catalog/767632362-322249256482-rentgen-apparat-tsifrovoi-discovery-rf-1` |
| CM1200B | `3b9799a5-1ec8-4239-9606-3efb6961660f` | `16956d5b-09ad-4baf-8317-54271aaa61a3` | `/catalog/767632362-241834833046-elektrokardiograf-comen-cm1200b` |

The first execution returned Approval 8/8 and Publication 8/8. Replay of the
same operation returned `already_complete`; totals, projection version and
projection checksum remained unchanged.

## Production and projection result

| Metric | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 42 | 50 |
| Unpublished | 37 | 29 |
| Revisions | 50 | 50 |
| Decisions | 42 | 50 |
| Approvals | 42 | 50 |
| Publication Batches | 42 | 50 |
| Projection version | 44 | 52 |
| Sitemap Product URLs | 42 | 50 |

Final projection checksum:
`0f966677a30ae913e2f1a0b428749891a114c5a26d1bc228cbef20aa34e48b33`.

Every new projection has SEO title and description, canonical Russian content,
three characteristics and at least one media item. Homepage, Catalog, RFQ and
all eight Product Detail routes return HTTP 200; unsupported `GET /api/request`
returns 405. Sitemap contains 50 unique Product URLs, contains all eight new
URLs and exposes no internal, Auth or API route.

## Runtime and invariance

Publication runner commit `461b69f7c63ec496ccf2f2f9b4b71606ee875468`
was deployed as Production deployment `dpl_5hz8cn61n9xQqmmwrCMeBTvqjyug`.
The deployment is READY and owns both canonical aliases. Full tests passed
545/545; lint, TypeScript, Turbopack and Webpack builds passed.

The prior 42 published Products were outside the immutable manifest. VME-5B,
EPK-i7010, both UNIKOS records and Instilar 1438 remain draft/unpublished with
lifecycle `0/0/0/0`. Product content, raw snapshots, source checksums,
migrations, ENV and DNS were unchanged. Vercel `gitForkProtection` remains
enabled.
