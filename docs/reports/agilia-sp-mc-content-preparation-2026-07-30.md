# Fresenius Kabi Agilia SP MC Content Preparation — 2026-07-30

## Executive summary

**Result: PASS for model resolution and controlled content preparation.** One
successful Production Catalog Admin mutation was applied to the exact Agilia
SP MC Product through the approved
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` contract. The Product
and canonical Russian description were updated atomically, the model was set,
SEO was added, and unsupported promotional source copy was removed from active
content.

No immutable revision, Human Review, Approval, Publication, migration,
deployment, ENV, DNS or Storefront change was performed. Agilia SP MC remains
draft/unpublished and is absent from the public sitemap.

## Scope and stable identity

| Field | Value |
| --- | --- |
| Branch | `codex/agilia-sp-mc-content-preparation-v1` |
| Base | `37a6dc073dda3e2f6f62eb81ce016dbff1a77e43` |
| Production project | `clbzibuusyuajsylcbvl` |
| Product ID | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` |
| Stable source UID | `865619140091` |
| Slug | `767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia` |
| Source checksum | `521684120f9b21884e5cc05d11ae84de5d3692695ac2b228c8cc044f5b07ec19` |
| Manufacturer | Fresenius Kabi (`f39d17bc-5a89-4fd5-a18c-7ef590be7a04`) |
| Category | Шприцевые инфузионные насосы (`bf351287-33fb-4a81-a6ef-f5107a8ba7bd`) |
| Application area | Реанимация (`530cb096-54d1-4342-be66-494fa8aa0161`) |
| Source type | `immutable_source_snapshot_v1` |
| Pre-patch `updatedAt` | `2026-07-28T21:18:16.645683+00:00` |
| Post-patch `updatedAt` | `2026-07-30T17:08:46.558553+00:00` |

The Product ID, source UID, slug and source checksum each resolved to the same
single Production row. No second Product had the same stable identity.

## Authoritative evidence

| Field or claim | Source | Evidence location | Confidence |
| --- | --- | --- | --- |
| Model | [Fresenius Kabi Agilia SP MC IFU](https://eifu.fresenius-kabi.com/medtech/agilia/15636-1_IFU_Agilia_SP_MC_Eng.pdf) | scope and model name, page 8 | High |
| Product type | same IFU | syringe pump / Agilia SP range, pages 8 and 12 | High |
| Intended use | same IFU | adults, paediatric and neonatal patients; intermittent or continuous delivery, page 8 | High |
| Compatible syringes | same IFU | 5, 10, 20, 30 and 50–60 mL, pages 8 and 104 | High |
| Flow range | same IFU | settings table, up to 0.1–1200 mL/h depending on syringe size/mode, page 103 | High |
| Display/interface | same IFU | screen size 70 × 35 mm, page 118 | High |
| Alarms | [official Fresenius Kabi product page](https://www.fresenius-kabi.com/br/produtos/dispositivos-medicos/bombas-de-infusao/agilia-sp-mc) | visual/audible alarms and occlusion monitoring | High; regional configuration caveat retained |
| Battery/autonomy | IFU | internal Li-ion battery; runtime depends on Wi-Fi/configuration, pages 115–116 | Medium; autonomy value not placed in active content |
| Dimensions/weight | IFU | 135 × 345 × 170 mm; approximately 2.1 kg, page 118 | High |
| Registration | [Roszdravnadzor record](https://elk.roszdravnadzor.gov.ru/widget/med-product/143142) and [official certificate/application](https://elk.roszdravnadzor.gov.ru/public-gateway/med-product/api/v1/files/download-by-path-public?id=8375182&path=med_product%2Fmed_products_new_res_files%2F1560834003.27938-62403.pdf) | РЗН 2019/8267; variant II explicitly lists Agilia SP MC | High |

The active content does not claim TIVA, TCI, PCA, Agilia VP, volumetric-pump or
Injectomat functionality. A contamination scan of the Product and
characteristics returned zero such active terms.

## Regulatory mapping

Roszdravnadzor registration `РЗН 2019/8267`, first registered on 2019-04-05
and shown as active in the current register history, covers “Насос инфузионный
шприцевой Agilia SP, с принадлежностями”; variant II explicitly names
“Насос инфузионный шприцевой Agilia SP MC”. The manufacturer is Fresenius Kabi
AG, Germany. The register lists manufacturing locations in Germany and France.

The existing Catalog Admin patch contract cannot create a
`product_registration_links` row. Therefore the verified registration is
recorded as evidence here, while `missing_registration` remains an explicit
editorial warning in Production. No unapproved direct table write was used.

## Controlled patch

### Before

- title: `Шприцевой насос Fresenius Kabi Agilia SP MC`;
- model: null;
- `missing_model`: true;
- SEO title/description: absent;
- active descriptions: imported promotional copy with unqualified claims;
- canonical `ru` rows: 1;
- Product state: draft/unpublished.

### After

- title: `Шприцевой инфузионный насос Fresenius Kabi Agilia SP MC`;
- model: `Agilia SP MC`;
- `missing_model`: false;
- SEO title: `Agilia SP MC — шприцевой насос Fresenius Kabi | CyberMedica`;
- SEO description: `Fresenius Kabi Agilia SP MC — программируемый шприцевой насос для контролируемого введения растворов и препаратов.`;
- short/full Russian descriptions are source-grounded and synchronized;
- active occurrences of the removed promotional/foreign-model terms: 0;
- Product state: draft/unpublished.

The full description records intended use, patient populations, syringe sizes,
flow-setting boundary, power, dimensions and configuration caveats from the
official IFU. It does not assert a battery runtime or optional software/module
availability for the specific unit.

The first invocation was rejected before mutation with SQLSTATE `40001`: a
client-side timestamp serialization had truncated the six-digit Production
timestamp to milliseconds. A read-only guard confirmed that the durable row and
all lifecycle totals were unchanged. The successful invocation used the exact
fresh token `2026-07-28T21:18:16.645683+00:00`. Exactly one Product mutation was
committed; there was no retry after the successful call.

## Characteristics and media

| Check | Result |
| --- | --- |
| Characteristics | 3 existing legacy rows; unchanged |
| Public stable keys in candidate | `legacy:raw-001`, `legacy:raw-002`, `legacy:raw-003` |
| Media | 2 existing imported PNG records; unchanged |
| Primary / gallery ordering | 0 / 10 |
| Broken URLs | 0 |
| Duplicate file hashes | 0 |
| Model match | both assets visibly identify `agilia SP MC` |

The characteristic rows remain the imported category, Product type and
manufacturer-country baseline. The Russian register confirms Fresenius Kabi AG
as a German manufacturer and lists manufacturing locations in both Germany and
France; no claim about a specific unit's manufacturing site was added by this
patch. No new technical characteristic rows were invented or written through an
unsupported path.

## Fingerprints and immutable provenance

| Artifact | Before | After |
| --- | --- | --- |
| Product row | `e941440c6fdf8876a7279e33b3e6dbfc663cbfe49c78d556cab6874d446ad869` | `107b6b72cb6231b49465256d0b0a8dbbacce34481403b1c2f01733dea2bb7503` |
| Canonical descriptions | `14898b238cffa57a3b9da691c54f039d6174dac07872714571418792655b5057` | `e936b6fc9d3821e645ad4855fe148762bc03f4c0c8ff3216c74043780135c1fe` |
| Media | `3762b673269f0289c3cbcfc332080072a510076b5d4d42cad949209bcc6b2e28` | unchanged |
| Characteristics | `3dae45623237d3fb6949a25a212409050c2453bf09bce685e21c1377674d7d7e` | unchanged |
| Immutable source snapshot | `1d226687bc63e14fb5f4d663a818008b5ad15a2c9a56649a514f1c1df598b6d6` | unchanged |
| Product source checksum | `521684120f9b21884e5cc05d11ae84de5d3692695ac2b228c8cc044f5b07ec19` | unchanged |

Only the approved active Product/SEO/description fields changed. The immutable
source snapshot, source checksum, media, characteristics, category,
manufacturer and application-area relation did not change.

## Revision readiness preflight

The dependency predicate was executed in a transaction that was explicitly
rolled back. The revision writer was not called.

| Check | Result |
| --- | --- |
| Stable identity | PASS |
| Model present | PASS — `Agilia SP MC` |
| Canonical `ru` | PASS — exactly 1 synchronized row |
| Catalog quality | `READY` |
| Structural blockers | 0 |
| Unresolved critical import errors | 0 |
| Published manufacturer/category/application area | PASS |
| SEO | title and description present |
| Candidate characteristics | 3 |
| Candidate media | 2 |
| Candidate application areas | 1 |
| Candidate documents/registrations | 0/0, warnings retained |
| Candidate payload checksum | `d14d6199641cec398e2d9ab48e86583fcab1575bd904e03d4fa4d7c0d8060747` |
| Immutable payload fingerprint | `3a00677a295110252d1f963c4296b099de78c36af4ea152d6e655944dedf0472` |
| Product identity checksum | `7e17a8f60997dc9fae5843ef4857e6e634fbd6741baa6ff5e034842c956a9d7e` |
| Deterministic candidate reads | 10/10; one distinct checksum |
| Agilia revision/decision/approval/batch | 0/0/0/0 |

Editorial warnings remain `missing_registration` and `missing_documents`.
Under Publication Policy v2 they do not weaken structural integrity and do not
block creation of an immutable revision. The verified registration can be
linked later through an approved registration workflow; this task did not
invent one.

## Production invariance

- Products: 79; Published: 2; Unpublished: 77;
- total revisions/decisions/approvals/batches: 2/2/2/2;
- Hamilton-T1 fingerprint remained
  `a6fdf82892c015b59e04badd0890aeb5bc209f7baaf78f1a42aba30e6a07d9f8`;
- Mindray SV300 fingerprint remained
  `e856e8e0ac01bcd3658cc40f3d9f7e776f516be90e27fd85f19501afce0adb58`;
- the remaining 76 Products retained aggregate fingerprint
  `8a7977d29516c00d19da9d7275fed0b609b4a82105ad1643aa281926070c2b24`;
- the sitemap still contains exactly Hamilton-T1 and Mindray SV300 Product
  URLs; the Agilia slug is absent;
- migrations, Projection, Storefront, ProductService, Repository, ENV, DNS and
  RFQ records were unchanged.

## Validation

- Catalog Admin and candidate contract unit tests: 10/10 PASS;
- Catalog Admin description-sync disposable DB suite: PASS, 26 migrations;
- publication candidate owner/completeness disposable DB suite: PASS;
- dependency predicate: PASS with transaction rollback;
- Production candidate determinism: 10/10 PASS;
- media URL/file audit: PASS;
- unpublished sitemap leak scan: PASS.

## Next operation

The next separately authorized task may create one immutable Product
Publication revision from the recorded candidate checksum and then stop for
Human Review. This report does not authorize or perform that operation.

