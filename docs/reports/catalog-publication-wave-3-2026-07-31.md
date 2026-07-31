# Catalog Publication Wave 3 — 2026-07-31

## Status

**PASS.** The final eight current reviewed Group A revisions were approved and
published through the narrow server-only Wave 3 runner. No repeated Human
Review, Product-content mutation, migration, ENV or DNS change occurred.

## Controlled operation

| Item | Evidence |
| --- | --- |
| Production project | `clbzibuusyuajsylcbvl` |
| Canonical starting SHA | `4e4a1e703d30ce90aa2a4b07cfc6dc3bb6525784` |
| Runner source SHA | `cb1fed0a8fe751795060c182fe6627e7ebfb0b08` |
| Production deployment | `dpl_37wkKZsTywCPro89QFaeXe4P4zqm` — READY / Current |
| Operation key | `catalog-publication-wave-3-v1` |
| Manifest | `lib/operations/catalog-wave-3-manifest.ts` |
| Manifest SHA-256 | `7444e7872b109d4ad86ffe69cc6c04cb9623d56cc574dc6effe82e9197df13a1` |
| Manifest size | 8 unique Products, revisions, Review Items and Decisions |
| Reviewer binding | `0a5270ac-66f2-4711-9701-e0557fcff73a`, role `admin` |
| Projection completion | version `38`; checksum `e9b626ea496aee194ed8039079cfa9ad66626b97e5cd371598393babdc32764b` |

The manifest digest is SHA-256 over canonical JSON containing `version`,
`createdAt`, `operationKey`, `productCount` and the ordered entries. The
preflight extraction used `BEGIN; SET TRANSACTION READ ONLY`, returned exactly
eight current reviewed/unpublished revisions, and ended with explicit
`ROLLBACK`. Each revision had one positive Decision from the expected reviewer,
zero Approval, zero Publication Batch and an unchanged checksum triad.

Approval uses the existing exact-revision database uniqueness contract. The
publication idempotency keys are `catalog-wave-3-publish-<product-id>`; neither
Wave 1 nor Wave 2 keys or digests were reused.

## Durable lifecycle evidence

| Product | Revision | Approval | Publication Batch |
| --- | --- | --- | --- |
| Mindray Resona i9 | `134311f6-1c57-4f71-8ec9-638741d48545` | `16b45932-65e0-46b4-bac2-38691c97fbde` | `3a087dee-083e-4fca-8e08-a5de78fdac35` |
| Bionet FC1400 | `71dfcfcd-8562-4252-92f7-fabcdf424bb9` | `476074f4-f5fe-449d-8672-dfb64f5a95a4` | `9061e868-646d-430a-bfc7-40c15773e892` |
| Sonicaid Team3-I | `4df1af38-0e00-4736-a55f-a29f671cd907` | `e119be83-466d-4e8b-bfa0-47b34912d7d2` | `fb10d468-58ec-4bf7-b605-987bb7d1f9f5` |
| Sonicaid Team3-A | `d627f1c9-21b2-4a20-b8d3-56371fbabe75` | `924c72e5-bf07-49a0-a65a-4becf8aeb908` | `030c91b1-335e-41cf-b25d-cb34faefacfe` |
| Canon Aplio i900 | `7d7d063c-e646-4a17-ba19-4a7598338a08` | `dd74fd57-46ec-4fb0-ae2e-f07804281d1b` | `6c8e5b92-9b3e-489d-bcee-883fe97fb851` |
| GE LOGIQ E9 | `bc95867b-5de7-4b9f-b73e-d4b29003a130` | `d4b8e3c1-835b-4856-8c2d-e8108ca9f867` | `21bc7e21-0acf-48f8-8795-f0cd78a3d425` |
| Bionet CardioCare 2000 | `a7ac7070-73a7-4570-b7a8-427a4c86e36a` | `996e248f-a598-4381-a859-1d030282e83b` | `222cb159-73a2-4840-a7c7-76261d1114c1` |
| Bionet CardioTouch 3000 | `558e5395-cf03-47a2-8c6e-4346f1fc651b` | `ea4e7a44-5c83-484f-8fb3-59a6f05077e6` | `a1d24714-c41b-40ff-b54b-57418d40708a` |

The runner performed all eight Approvals before Publication. Sequential
execution stayed below the approved maximum concurrency of two. A second exact
operation returned `already_completed`; Approval, batch, Published and
projection state did not advance.

## Counts and projection

| State | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 28 | 36 |
| Unpublished | 51 | 43 |
| Revisions | 36 | 36 |
| Review Decisions | 36 | 36 |
| Approvals | 28 | 36 |
| Publish batches | 28 | 36 |
| Reviewed/unpublished without Approval | 8 | 0 |
| Projection version | 30 | 38 |
| Sitemap Product URLs | 28 | 36 |

Projection checksum after the operation is
`e9b626ea496aee194ed8039079cfa9ad66626b97e5cd371598393babdc32764b`.
Wave 1 and Wave 2 retain exactly 10 and 15 tracked publish batches; Wave 3 has
exactly 8.

## Public URLs and smoke

- `/catalog/767632362-431878286472-uzi-apparat-mindray-resona-i9`
- `/catalog/767632362-989433020341-fetalnii-monitor-bionet-fc-1400`
- `/catalog/767632362-582183013252-fetalnii-monitor-sonicaid-team-3-i`
- `/catalog/767632362-772750235332-fetalnii-monitor-sonicaid-team-3-a`
- `/catalog/767632362-937994862401-ekspertnii-uzi-apparat-canon-aplio-i900`
- `/catalog/767632362-975456539101-ekspertnii-uzi-apparat-logiq-e9-ge`
- `/catalog/767632362-619316683987-elektrokardiograf-bionet-cardiocare-2000`
- `/catalog/767632362-507218946101-elektrokardiograf-bionet-cardiotouch-300`

All eight Product Detail routes returned HTTP 200 and rendered the exact title,
manufacturer, canonical URL, SEO title/description, three characteristics,
one or two media items and an RFQ action. Catalog returned HTTP 200 and rendered
36 unique Product links. Sitemap returned 36 unique Product URLs, contained all
eight Wave 3 URLs and no internal/Auth/API route. `/request` returned 200 and
unsupported `GET /api/request` returned 405.

## Invariance

Revisions and Decisions remained 36. The existing 28 published Products were
outside the manifest and remain published. Group B (7) and Group C (36) remain
the 43 unpublished Products. The runner has no Product-content write path, so
canonical content, `rawSnapshot`, `sourceChecksum`, migrations, ENV and DNS
were unchanged. Vercel Git Fork Protection remained enabled.

