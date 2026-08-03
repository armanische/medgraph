# Published Product Characteristics Wave 1 Preparation — 2026-08-03

## Verdict

**Preparation and controlled execution PASS.** Exactly 15
published Products received an authoritative, configuration-aware proposed
package of seven new structured characteristics each. The consolidated preview
contains 105 new rows, zero duplicate per-Product keys and no mutation payload.

The original stop was resolved by the exact-scope
`cloud_api.catalog_admin_patch_product_characteristics_v1` boundary. All 15
packages are now stored as deterministic authoring drafts; 105 new rows are
ready for revision creation. Public revisions and lifecycle remain unchanged.

## Corporate and Production preflight

| Check | Result |
| --- | --- |
| Git author / committer | `cybermedica <cybermedicaooo@gmail.com>` |
| Vercel account / team | `cybermedicaooo@gmail.com` / `medgraph` |
| Corporate Supabase session | exact email, UUID `7e90a993-8b30-4e0d-aff4-a257d5a4a179`, role `admin` |
| Legacy identity | not used |
| `gitForkProtection` | `true` |
| Production catalog health | `healthy`; live transport healthy; fallback inactive |
| Projection | version `73`; checksum prefix `23f7f2b73d7c`; 71 Products |
| Product Detail smoke | exact 15/15 HTTP 200 on canonical host |
| Sitemap | 71 unique Product URLs |
| Writes | Product `0`; lifecycle `0`; migration `0` |

Vercel correctly withholds sensitive Production values from local environment
materialization. The task therefore used the existing sanitized audit artifact,
immutable lifecycle manifests, canonical health endpoint, sitemap and public
Product Detail responses. No credential value was printed or persisted in the
report.

## Exact scope and package totals

| № | Product | Product ID | Source UID | Current revision / batch | Characteristics |
| ---: | --- | --- | --- | --- | ---: |
| 1 | Hamilton-T1 | `e66a1165-030b-4aa4-a400-959f1ac70fe3` | `330695211247` | `8d48a2b5-0842-4796-803f-4e4daf6f6e17` / `16c78699-6041-45d8-9c18-2da57c72159d` | 3 → 10 |
| 2 | Mindray SV300 | `00e3f62b-797b-40ff-bf9f-9d1750828ca4` | `401374530532` | `8088bdda-cad1-4341-8780-528ba2338565` / `e07ed5cd-a3ff-4e55-a0fb-3bcf887fed39` | 3 → 10 |
| 3 | Mindray BeneVision N1 | `f61a0496-0434-41ab-8ca3-0f79c19ab0aa` | `159912360691` | `df13433f-7461-40fd-9c9c-e026254f9ec4` / `20ac794f-5ff2-4401-8ab9-b1e4de875f0d` | 3 → 10 |
| 4 | Mindray BeneHeart D3 | `224ee705-5dea-429f-ab10-1ef9153e94fc` | `725867191732` | `c811034f-cb9d-44ac-8cf7-b2f6cb223c1e` / `f16d51c4-1713-4482-a169-2d1a2bef9087` | 3 → 10 |
| 5 | Fresenius Kabi Agilia SP MC | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` | `865619140091` | `e09f69c9-fbc5-4f6e-a240-05372e959510` / `25f14744-dc76-40fc-ae64-678f516a7826` | 3 → 10 |
| 6 | Mindray BeneFusion SP5 | `76840838-c759-40eb-a1ef-e329e9091714` | `724985486041` | `676523c3-90bf-4a31-98d1-bd7c6af34c9f` / `4acb582a-3cbb-4506-8fa4-187c77dd4498` | 3 → 10 |
| 7 | GE HealthCare Versana Essential | `c6ba9c45-f6e8-4b2f-9f32-38335ee52bfe` | `256598838332` | `a84e9afe-0245-429a-ba4a-acc9926d49d0` / `c53b80b6-37fe-453e-8a55-3d746f1d46eb` | 3 → 10 |
| 8 | PENTAX Medical EPK-i5000 | `48f7d071-c8e4-4bc9-96c4-fc12672ca183` | `446510199362` | `685637b7-471a-4b8e-bd85-95633f6caf03` / `7ef6e613-aeb9-4c86-88fa-872af8c3e1c8` | 3 → 10 |
| 9 | Olympus EVIS EXERA III CV-190 | `4e1a370b-4e53-4ee6-b590-823d1ad0e087` | `304432044232` | `c629b5d2-7b13-4fda-9da6-d004b579fb18` / `ef18e2cb-9cf0-430d-9776-727d49607762` | 3 → 10 |
| 10 | B. Braun Dialog+ | `ae1e448d-f266-4d5d-9d42-e2c22a2d54c8` | `601909099101` | `acae1207-9d59-4ad9-94d8-1716a6655812` / `c53e516e-f48d-435f-92c0-d9b9027f132e` | 3 → 10 |
| 11 | Longfian JAY-10 | `7866179e-e753-411b-8e9e-409b109b66d2` | `608519946332` | `a7fef268-87c8-44b4-bb38-265befedaed1` / `0eea66bd-669f-40d5-b9a7-d4a295fa6ac4` | 3 → 10 |
| 12 | Bionet FC1400 | `e34f16f0-723c-4710-aab3-fb03d9fd9b84` | `989433020341` | `71dfcfcd-8562-4252-92f7-fabcdf424bb9` / `9061e868-646d-430a-bfc7-40c15773e892` | 3 → 10 |
| 13 | Bionet CardioTouch 3000 | `dc511122-9b03-4a91-83c6-eb08e27a7b74` | `507218946101` | `558e5395-cf03-47a2-8c6e-4346f1fc651b` / `a1d24714-c41b-40ff-b54b-57418d40708a` | 3 → 10 |
| 14 | DIXION BabyGuard I-1120 | `760b9466-dcb6-4fd5-a821-eb4bf8203e77` | `574929514601` | `c4c4cc16-1631-4289-9437-7a908c4b53ed` / `1bbe9c1f-b93f-47cc-88ab-add703b99d20` | 3 → 10 |
| 15 | GE HealthCare OEC 9900 Elite | `79b6082c-b63e-4c8e-9769-36383747b57b` | `571191341342` | `12cd2d90-98ad-4cce-a8b8-350f3a0ee4e2` / `bfe572a3-39ec-442c-a4fa-55ea29f89f43` | 3 → 10 |

## Evidence packages

Every proposed row carries its own source URL, evidence location, confidence,
optional flag and configuration dependency in the machine-readable preview.
Primary packages use Hamilton Medical, Mindray, Fresenius Kabi, GE HealthCare,
PENTAX Medical, Olympus, B. Braun, Longfian, Bionet and DIXION manufacturer
materials. The Agilia package additionally retains its regulator link. No
supplier-only page is a sole source.

The following contamination controls are explicit:

- BeneFusion SP5 excludes TCI, DTCI and TIVA; network and DERS features are
  marked configuration-dependent;
- EPK-i5000 excludes EPK-i7010 claims;
- CV-190 remains CV-190, not CV-190 PLUS;
- JAY-10 excludes JAY-5, JAY-20 and JAY-10FW-specific identity;
- BabyGuard oxygen control and scales remain optional;
- OEC 9900 Elite detector, workstation and DICOM details remain tied to the
  concrete configuration.

## Preview

- Path: `/tmp/product-characteristics-wave-1-patch-preview-2026-08-03.json`
- SHA-256: `1a46847aaa4859ede519070af5b890190f9d6ba4eaed77de04e14f57248d9978`
- Scope: 15 unique Product IDs and 15 unique source UIDs.
- Proposed technical rows: 105.
- Duplicate keys within Product: 0.
- Evidence-bearing rows: 105/105.
- Mutation payloads: absent by design.

`expectedUpdatedAt`, raw snapshot hash and source checksum are intentionally not
invented in a non-executable preview. Fresh exact tokens must be obtained by a
future approved boundary immediately before any write. No old token is safe to
reuse.

## Required next operation

Create immutable revision number 2 for the exact 15 digest-bound candidates
through a separate corporate, server-only revision runner, then stop for Human
Review. The patch operation must not be repeated with a changed manifest.

## Validation

- Full repository suite after contract rollout: 590/590 PASS with the
  loopback-dependent transport test run inside its approved local boundary.
- Production WebKit smoke: PASS for iPhone Safari portrait, iPhone Chrome
  landscape and desktop Safari/WebKit across `/`, `/catalog`, `/request`, one
  stable Product Detail and `/internal/login` (15 route/profile checks).
- Preview schema, scope, characteristic-key uniqueness and evidence checks:
  PASS.
- Canonical link, unpublished-leak, legacy-domain, personal-email,
  secret/privacy and `git diff --check` scans: PASS.
- Turbopack and Webpack Production builds: PASS.
