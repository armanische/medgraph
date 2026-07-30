# Agilia SP MC Publication — 2026-07-30

## Canonical identity

| Field | Value |
| --- | --- |
| Product | Шприцевой инфузионный насос Fresenius Kabi Agilia SP MC |
| Model | Agilia SP MC |
| Manufacturer | Fresenius Kabi |
| Production Product ID | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` |
| Source UID | `865619140091` |
| Source checksum | `521684120f9b21884e5cc05d11ae84de5d3692695ac2b228c8cc044f5b07ec19` |
| Stable slug | `767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia` |

## Immutable publication evidence

| Evidence | ID / value |
| --- | --- |
| Revision | `e09f69c9-fbc5-4f6e-a240-05372e959510` |
| Review Item | `a656c3aa-47e8-4985-8d3a-c3af0478829c` |
| Review Decision | `cf368fda-42db-4504-8107-0c67bd14caa7` |
| Reviewer | `0a5270ac-66f2-4711-9701-e0557fcff73a` (`admin`) |
| Decision | `approve` |
| Approval | `be59cc6f-8c2e-4227-a221-b1f6e6913b3b` |
| Publication Batch | `25f14744-dc76-40fc-ae64-678f516a7826` |
| Publication timestamp | `2026-07-30T18:24:36.919Z` |
| Candidate payload checksum | `d14d6199641cec398e2d9ab48e86583fcab1575bd904e03d4fa4d7c0d8060747` |
| Immutable payload checksum | `3a00677a295110252d1f963c4296b099de78c36af4ea152d6e655944dedf0472` |
| Product identity checksum | `7e17a8f60997dc9fae5843ef4857e6e634fbd6741baa6ff5e034842c956a9d7e` |

The authenticated Human Review created exactly one immutable positive Decision.
Approval consumed that exact Decision. The publication batch contains exactly
one Product, Agilia SP MC, and uses publication version 1.

## Published projection verification

- Production Products: 79; Published: 3; Unpublished: 76.
- Projection version: 5; generated at `2026-07-30T18:24:37.043504+00:00`.
- Projection checksum: `e72d6a5ffa54fa3cf6df3fba5966ea02132abb1189a93f0aaab5280218f4d938`.
- Product URL: `/catalog/767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia`.
- SEO title and description: present.
- Canonical Russian description: present.
- Characteristics: 3; media: 2.
- Model and manufacturer: `Agilia SP MC` / `Fresenius Kabi`.
- Cross-model markers `TIVA`, `TCI`, `PCA` and `volumetric`: 0 occurrences.

## Public smoke

- Catalog: HTTP 200; Agilia is visible.
- Agilia Product Detail: HTTP 200 with the exact title, model, manufacturer,
  three projected characteristic labels and no internal publication metadata.
- `/request`: HTTP 200.
- `GET /api/request`: HTTP 405 (expected unsupported method).
- Sitemap: HTTP 200, exactly three Product URLs: Hamilton-T1, Mindray SV300 and
  Agilia SP MC. The other 76 Products are absent.

## Invariance and warnings

Hamilton-T1 remains bound to publication batch
`16c78699-6041-45d8-9c18-2da57c72159d`; Mindray SV300 remains bound to batch
`e07ed5cd-a3ff-4e55-a0fb-3bcf887fed39`. No other Product was included in the
Agilia batch. The retained Agilia warnings are `missing_registration` and
`missing_documents`; both are non-blocking under Publication Policy v2.

No credentials, cookies, tokens, service keys or connection strings are stored
in this report.
