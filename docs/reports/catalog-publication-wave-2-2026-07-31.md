# Catalog Publication Wave 2 — 2026-07-31

## Status

**PASS.** Fifteen current reviewed revisions were approved and published
through the narrow server-only Wave 2 runner. The operation was limited to the
tracked immutable manifest, reused the approved lifecycle RPCs and created no
Review Decision or Product-content mutation.

## Controlled operation

| Item | Evidence |
| --- | --- |
| Production project | `clbzibuusyuajsylcbvl` |
| Canonical starting SHA | `3427baeb3c5b52fb1cb21e2271efeca8d18c7c71` |
| Runner source SHA | `8c81b6926a32e8a55bc0ee34a0157f04009ba335` |
| Production deployment | `dpl_B5EhxNf9MYboGjxHDxYdURX2NdNp` — READY |
| Operation key | `catalog-publication-wave-2-v1` |
| Manifest | `lib/operations/catalog-wave-2-manifest.ts` |
| Manifest SHA-256 | `b19fda10991a2ae81db9bf87bb1565e1dcb7e1e2eea582a97cca3097495a8204` |
| Reviewer binding | `0a5270ac-66f2-4711-9701-e0557fcff73a`, role `admin` |
| Projection completion | version `30`; `2026-07-31T15:58:07.866472Z` |

The preflight extraction ran inside `BEGIN; SET TRANSACTION READ ONLY` and
ended with explicit `ROLLBACK`. It returned exactly 23 current positive
reviewed/unpublished revisions. All had one Decision, no Approval, no
Publication Batch, matching checksum triads, SEO, media and characteristics.

## Durable lifecycle evidence

| Product | Revision | Approval | Publication Batch |
| --- | --- | --- | --- |
| Vacus 7209 | `a60c8f66-1aac-4d99-8ae9-ec2f85721b36` | `38ae5142-114d-49f7-9a99-6dc146036524` | `38be2e31-6e52-4429-a939-4e9bbad68ff2` |
| iMEC 8/10/12 | `8318e62f-2d40-4df8-b29f-619d413b4637` | `4a8d2ac3-d066-4156-88c6-7d8b3ff2e6eb` | `c7e869cf-0ee6-4210-9950-a0362ec52804` |
| Storm 5900 | `70452a0a-fd59-40e6-836f-bb39d67140a5` | `c75131c0-98ae-44fc-8773-ac3e9d7bd278` | `e6c97948-2a13-43c0-9e9f-e79fb77ad4c8` |
| Vacus 7018 | `7c895040-d904-4709-91d6-8390b437da2d` | `9ee4e84f-dafb-4e7a-a980-46395642b4c1` | `b146be5d-e36b-404f-ab33-940aeae4154f` |
| Canon Aplio i700 | `98d270f7-a5ca-4c0f-a4ba-fbaf0f161182` | `5cbbf7bd-1b11-4042-94cb-cd78e1276a92` | `33fcc062-6673-4ba7-b788-b4d4bc08b232` |
| Canon Aplio i800 | `a56a65f5-114a-4ca4-93fc-31f1b347dc3b` | `4354c5e9-1d5d-4e68-bb32-fd19d3aa2829` | `97413391-5cc4-4cc7-90d5-1509b91ac371` |
| GE Vivid iQ | `7f57e339-ad32-425b-a5c4-41abbab04c9a` | `1bb1f524-a5db-4ac3-ad1f-1365194a4974` | `69c4131a-9e94-4396-9b5b-75736f9451b7` |
| GE Vivid T9 | `bd93445a-50be-4f70-a382-93bd0a3d602a` | `3f368fbb-f1c0-4fac-b43b-42011093cc3d` | `cdec9201-1f0f-4b4d-98a3-87c7c04fe97a` |
| Mindray DC-40 | `b5e1c60b-4193-4c8b-9453-10a57ecc1ab6` | `bab3e5c6-dfe8-4427-a0f2-ab6604fa3e07` | `38762470-ed7d-4a48-8e80-4415037dd113` |
| Mindray DC-70 | `9046484b-c7dc-48af-a133-80ec15f006dc` | `f3b0f3ea-d0cc-474c-a606-ec1c3020f15a` | `4c0b6868-06a1-4668-894e-c873b78f9a80` |
| Mindray DC-80 | `3998646e-7901-404b-be6f-abadbf62052a` | `1ac54f09-2049-4936-ad38-8608997e6cdd` | `a63b1a65-e630-4376-b99b-e811d137804f` |
| Mindray M9 | `13cb5d25-dc70-4219-b911-a0c5b7f33ae7` | `239fa293-5d28-4a53-88ab-eed7919c7aa0` | `3f2439e0-9ec6-4425-b283-cebb08e67812` |
| Mindray MX8 | `86663f03-a9cb-4771-a3b8-8f169af77478` | `2b244517-f72b-459b-8b1c-28767b24b751` | `6ea2327e-87ed-474c-a858-aca4aeb238c9` |
| Mindray Resona 6 | `3d290303-c460-4efe-b615-42b53b870c9a` | `26f1993d-e811-4457-bd01-3e410f332420` | `d3b6a450-7bff-4418-985b-5f770dc7114d` |
| Mindray Resona 7 | `378a199b-84b0-465e-96f8-fa10795a02aa` | `3fd8d5c6-2dda-47a2-b30a-4627775b2274` | `b2b8c409-5244-4438-8c13-9cf62383b44d` |

Each batch has action `publish`, an exact manifest revision and Approval, and
an idempotency key `catalog-wave-2-publish-<product-id>`. The second execution
returned `already_completed`; totals and projection did not advance again.

## Counts, projection and public smoke

| State | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 13 | 28 |
| Unpublished | 66 | 51 |
| Revisions | 36 | 36 |
| Review Decisions | 36 | 36 |
| Approvals | 13 | 28 |
| Publish batches | 13 | 28 |
| Reviewed/unpublished without Approval | 23 | 8 |
| Projection version | 15 | 30 |
| Sitemap Product URLs | 13 | 28 |

`/`, `/catalog`, `/request`, `/sitemap.xml` and all fifteen new Product Detail
URLs returned HTTP 200. Catalog rendered 28 Products. Unsupported
`GET /api/request` returned 405. The sitemap contained exactly 28 Product URLs.

## Deferred Wave 3 scope and invariance

The eight current reviewed/unpublished revisions left for Wave 3 are Resona
i9, Bionet FC1400, Sonicaid Team3-I, Sonicaid Team3-A, Canon Aplio i900, GE
LOGIQ E9, Bionet CardioCare 2000 and Bionet CardioTouch 3000.

Wave 1 retains exactly ten publish batches. The original Hamilton-T1, Mindray
SV300 and Agilia SP MC lifecycle evidence was not targeted. Group B/C, Product
content, `rawSnapshot`, `sourceChecksum`, migrations, ENV and DNS were not
changed. Vercel Git Fork Protection remained enabled.
