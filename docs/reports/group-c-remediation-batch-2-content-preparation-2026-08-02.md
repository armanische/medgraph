# Group C Remediation Batch 2 Content Preparation — 2026-08-02

## Outcome

Fifteen Low-risk, High-confidence identities were selected. Thirteen received
a minimal Russian public-content package; two were stopped before mutation
because their existing base characteristics are cross-contaminated and cannot
be repaired through the approved Catalog Admin contract.

Imported marketing and neighbouring-model claims were reset rather than
carried forward: 0 claims were retained verbatim, 39 claim groups were removed,
and 52 neutral source-grounded statements were written. No registration number
was asserted. `MISSING_REGISTRATION` and `MISSING_DOCUMENTS` remain explicit,
non-blocking warnings for all 13 prepared Products.

## Authoritative model evidence and media

| Source UID | Model | Primary evidence | Exclusions | Media | Claims retained / removed / rewritten |
| --- | --- | --- | --- | --- | ---: |
| `122386402842` | АПДН-01 | [Rostec/UOMZ announcement](https://rostec.ru/media/pressrelease/1436/) | Other neonatal respiratory systems | PASS (2) | 0 / 3 / 4 |
| `198869594712` | ЭК12Т-01-«Р-Д»/260 | [NPP Monitor product page](https://www.monitor-ltd.ru/elektrokardiograf-ek12t-01-260) | Other ЭК12Т executions | PASS (2) | 0 / 3 / 4 |
| `259394139301` | CM1200A | [Comen official brochure](https://comen-ru.com/wp-content/uploads/2025/02/ru-cm1200a-v1.0.pdf) | CM1200/CM1200B/CM1200C | PASS (1) | 0 / 3 / 4 |
| `279448521542` | КРТ | [Electron official X-ray systems](https://electronxray.com/products/equipment/rentgenografiya/teleupravlyaemye-rentgenodiagnosticheskie-kompleksy/) | Unrelated RF/X-ray systems | PASS (1) | 0 / 3 / 4 |
| `344327759482` | Corometrics 259cx | [GE HealthCare labor and delivery](https://www.gehealthcare.com/en-gb/products/clinical-accessories/labor-and-delivery) | Other Corometrics monitors | PASS (1) | 0 / 3 / 4 |
| `403689762041` | AXEON | [Olympus official AXEON announcement](https://www.olympus.co.jp/jp/news/2012a/nr120321axeonj.html) | Other Olympus systems | PASS (1) | 0 / 3 / 4 |
| `420215548801` | FB-15V | [AccessGUDID device record](https://accessgudid.nlm.nih.gov/devices/04961333232666) | Other PENTAX bronchoscopes | PASS (2) | 0 / 3 / 4 |
| `485427737755` | ДФР-02 | [Roszdravnadzor official record](https://elk.roszdravnadzor.gov.ru/widget/med-product/144610) | Other defibrillator models | PASS (1) | 0 / 3 / 4 |
| `513492182572` | FG-29V | [AccessGUDID device record](https://accessgudid.nlm.nih.gov/devices/04961333228584) | Other PENTAX gastroscopes | PASS (3) | 0 / 3 / 4 |
| `571191341342` | OEC 9900 Elite | [GE HealthCare service record](https://services.gehealthcare.com/gehcstorefront/p/00-885698-01) | Other OEC and Discovery systems | PASS (1) | 0 / 3 / 4 |
| `694791065122` | УНИКОС-01 | [Roszdravnadzor official record](https://elk.roszdravnadzor.gov.ru/widget/med-product/193050) | УНИКОС-02/03 | PASS (1) | 0 / 3 / 4 |
| `860641516881` | ИДН-02 | [Roszdravnadzor official record](https://elk.roszdravnadzor.gov.ru/widget/med-product/180625) | ИДН-03 and other executions | PASS (1) | 0 / 3 / 4 |
| `939922758055` | FB-18RBS | [PMDA official device record](https://www.pmda.go.jp/PmdaSearch/kikiDetail/ResultDataSetPDF/710098_220ABBZX00150000_A_01_15) | FB-15V and other bronchoscopes | PASS (2) | 0 / 3 / 4 |
| `576228046022` | Гемос-ПФ | [Biotech-M official product family](https://www.gemos.ru/products/) | Гемос type metadata is currently swapped | PASS (1), not patched | Not applied |
| `757604699272` | Гемос | [Biotech-M official product family](https://www.gemos.ru/products/) | Гемос-ПФ type metadata is currently swapped | PASS (1), not patched | Not applied |

Every inspected imported image returned HTTP 200. The audit used the approved
contradiction rule: a small or unreadable model label is not itself a blocker;
an explicit different model, manufacturer or equipment type is. No explicit
media contradiction was found in the 15 selected rows.

## Content contract

Each of the 13 eligible packages contains one canonical `ru` description,
neutral short and full descriptions, exact model, canonical public title, SEO
title and description, the existing three base characteristics, and preserved
approved media. Optional capabilities were not represented as standard.

The immutable patch preview is
`/tmp/group-c-remediation-batch-2-patch-preview-2026-08-02.json` with SHA-256
`a551cb866c522ddc473bda86019d25f4af8b82d9dae9d547eb3744373e79b044`
and permissions `0600`.
