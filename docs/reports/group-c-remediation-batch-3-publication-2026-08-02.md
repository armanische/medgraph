# Group C Remediation Batch 3 Publication — 2026-08-02

## Verdict

The seven exact Group C Batch 3 revisions completed corporate Human Review,
Approval and Publication. The closed Production operation used version and
operation key `group-c-batch-3-publication-v1` and the tracked immutable
manifest in
`lib/operations/group-c-batch-3-publication-manifest.ts`, SHA-256
`f0889e6738b984d18445c8fe2af42bbbf1dd6de68a373c3f66d3d37aa020fb3f`.
The browser supplied only the operation key and digest; Product scope and all
lifecycle/checksum bindings were resolved server-side.

Runtime commit `17a3993454fb1744e14e2e7143b1525855da8564` was deployed as
Production deployment `dpl_C5GFDmezrWSusgDNaJPLBQ6GstJW`, status `READY`,
with the canonical aliases assigned.

## Corporate durable Review evidence

Independent Production verification used explicit read-only transactions and
ended with `ROLLBACK`. All seven revisions were current/non-stale, bound to the
expected Review Item, retained their exact checksum triad, and had exactly one
positive Decision with rationale. Every Decision and Approval is bound to the
corporate admin UUID `7e90a993-8b30-4e0d-aff4-a257d5a4a179`; the legacy
reviewer UUID was not used.

| Model | Revision ID | Review Item ID | Decision ID |
| --- | --- | --- | --- |
| HD-1 | `075ff1ca-ecdd-4f78-a2cf-904d9a28a6bf` | `7ef0838d-0f4d-47ac-9a49-02e4edb262ac` | `a4ed6f7c-ebc4-4e35-bbae-510e54f48909` |
| Овертон 6200 | `e5ecef0b-8d13-4f01-9f51-080790d8f481` | `b6665afb-4b8a-4763-a806-6805840f1cb0` | `77f263be-4011-45f4-8f9a-fac863d3b96a` |
| Versana Premier | `af0233e6-71f9-4ade-a118-bff8c7b69446` | `8a2344e2-1811-4923-a4fc-83abdef47c52` | `5090c53a-c890-491f-b1c4-85edd69e4d55` |
| Giraffe Incubator Carestation | `a0365bdb-2bbc-44ac-9e02-c920c3afba7f` | `65feb6a5-21ef-4d48-a484-8a3f65a32c53` | `484f0ad1-390c-4f93-8237-acb9076c74ff` |
| EPK-3000 DEFINA | `46222169-c0e4-446b-bb69-a6e52c553fbc` | `b6cb6ef1-2e07-4644-a5af-cf5610ad680e` | `270faf63-b1d0-4a39-bf36-a8c2ff647248` |
| CARDIPIA 200 | `b4cafd0c-fc0c-4d64-91fc-e4065ae679a6` | `0b22bed6-da14-470b-a8aa-933840a5f322` | `3295180d-03d9-46e8-ad67-7828ea73566f` |
| Овертон 6900 | `271c99e7-d6ff-45ab-86ef-81678a15a9ca` | `9d400544-5705-479e-8c2f-759aefa72f78` | `65363b4c-4a0e-4e0d-8eaa-78601a6be9ce` |

## Approval and Publication evidence

Approval completed 7/7 before Publication began. Publication then completed
for the same seven Products only. The publication actor is the existing
server-only service profile used by the approved RPC boundary; the reviewer
and Approval identities remain the corporate admin.

| Model | Approval ID | Publication Batch ID | Public URL |
| --- | --- | --- | --- |
| HD-1 | `04de597b-1aa6-4dc3-a645-cf023c47c055` | `6ff9b4fb-abf9-4dd2-ba36-3197de6baa9d` | `/catalog/767632362-300255468231-portativnii-avtomaticheskii-defibrillyat` |
| Овертон 6200 | `20c712d5-802e-4453-8706-6159d632c7cf` | `d899acd6-66b4-40cf-8551-1bdedc18baf9` | `/catalog/767632362-323650602021-fetalnii-monitor-overton-6200` |
| Versana Premier | `5fcf9abe-5d43-40a3-8f72-0bcc30ede4b8` | `b120e110-5c7c-4c22-b343-89481bda2f47` | `/catalog/767632362-358648454622-uzi-apparat-ge-versana-premier-black` |
| Giraffe Incubator Carestation | `fb50313c-09b3-42cd-bd32-15c07aafb0a9` | `77b5e6d9-2be1-474b-b940-7c973c359b49` | `/catalog/767632362-480491530831-transportnii-inkubator-dlya-novorozhdenn` |
| EPK-3000 DEFINA | `dbe3b580-d3ca-4c43-91c8-baf26650b5e7` | `58c56b10-f9b8-4771-9601-370c8015b335` | `/catalog/767632362-670271281172-videoendoskopicheskaya-sistema-epk-3000` |
| CARDIPIA 200 | `4391cd57-ea0e-4f37-b5fe-7c250d03ff7a` | `6b9c11cc-a593-4f57-ab3d-6fc7cefb0b30` | `/catalog/767632362-868434933208-elektrokardiograf-cardipia-200` |
| Овертон 6900 | `8efb4778-64ae-4bf9-bb6a-7c80e465eda0` | `784f1e19-41ec-4b0f-aea1-6f61b29675bb` | `/catalog/767632362-928472985221-fetalnii-monitor-materi-i-ploda-overton` |

The first invocation returned `completed`. A second independent invocation
returned `already_complete`. Approvals, Publication Batches, Published count,
projection version and projection checksum did not increase on replay.

## Production, projection and indexing result

| Metric | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 63 | 70 |
| Unpublished | 16 | 9 |
| Revisions | 70 | 70 |
| Decisions | 70 | 70 |
| Approvals | 63 | 70 |
| Publication Batches | 63 | 70 |
| Projection version | 65 | 72 |
| Sitemap Product URLs | 63 | 70 |

Final projection checksum:
`e2d948c7fd63819099b88431592a643856e50284abebc9a1cf0781c42c2de446`.

The sitemap contains exactly 70 unique Product URLs, all seven new URLs and no
internal/Auth/API routes. All 70 Product Detail routes returned HTTP 200. The
seven new projections retain canonical Russian content, SEO, three
characteristics and one or two approved media assets as recorded in the
[patch evidence](./group-c-remediation-batch-3-patch-2026-08-02.md).
Homepage, Catalog and `/request` returned HTTP 200; unsupported
`GET /api/request` returned HTTP 405.

## Exclusions and invariance

The nine remaining Products — ИДН-03, HUGER FB-53A, PRIMEDIC Defi-B, Гемос,
Гемос-ПФ, AOHUA VME-5B, Pentax EPK-i7010, the combined УНИКОС-02/03 record and
Instilar 1438 — remain draft/unpublished with lifecycle `0/0/0/0`. Read-only
Production verification returned those exact nine source identities and no
others.

The prior 63 Published Products were outside the immutable manifest. Product
content after revision creation, raw snapshots, source checksums, migrations,
ENV and DNS were unchanged. Vercel Git Fork Protection remained enabled.

## Validation

- runner scope/idempotency tests: PASS;
- full test suite: PASS, 558/558;
- lint and TypeScript: PASS;
- Turbopack and Webpack builds: PASS;
- `git diff --check`: PASS;
- secret/privacy scan: PASS;
- Production read-only transactions: rolled back;
- Production storefront/sitemap/RFQ smoke: PASS.
