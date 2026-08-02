# Group C Remediation Batch 3 Content Preparation — 2026-08-02

## Outcome

Seven of ten frozen Batch 3 identities received a minimal source-grounded
Russian content package. No registration number was written. The warnings
`MISSING_REGISTRATION` and `MISSING_DOCUMENTS` remain explicit and non-blocking.

| Source UID | Canonical model | Primary evidence | Media | Claims retained / removed / rewritten |
| --- | --- | --- | --- | ---: |
| `300255468231` | HD-1 | [DIXION official product page](https://dixion.ru/goods/bifazniy-defibrillyator-monitor-Dixion-HD-1.html) | PASS (2) | 0 / 4 / 4 |
| `323650602021` | Овертон 6200 | [DIXION official product page](https://dixion.ru/goods/fetalniy-monitor-Overtone-6200.html) | PASS (2) | 0 / 3 / 4 |
| `358648454622` | Versana Premier | [GE HealthCare official product page](https://www.gehealthcare.com/en-us/products/ultrasound/versana/versana-premier) | PASS (1; marking visible) | 0 / 3 / 3 |
| `480491530831` | Giraffe Incubator Carestation | [GE HealthCare official product page](https://www.gehealthcare.com/middle-east/products/maternal-infant-care/giraffe-incubator-carestation) | PASS (1) | 0 / 3 / 3 |
| `670271281172` | EPK-3000 DEFINA | [PENTAX Medical official product page](https://www.pentaxmedical.com/jp-ja/products/video-processors/defina) | PASS (2; exact processor marking) | 0 / 3 / 4 |
| `868434933208` | CARDIPIA 200 | [TRISMED manufacturer storefront](https://trismed.gobizkorea.com/mini/site/miniSiteMain.do?domn_id=trismed) | PASS (1; exact marking) | 0 / 4 / 3 |
| `928472985221` | Овертон 6900 | [DIXION official product page](https://dixion.ru/goods/fetalniy-monitor-Overtone-6900.html) | PASS (1) | 0 / 3 / 4 |

## Product-specific exclusions

- `ИДН-03` (`363181290312`) — the accessible official Roszdravnadzor record
  supports [ИДН-02](https://elk.roszdravnadzor.gov.ru/widget/med-product/180625),
  not the imported `ИДН-03` identity. Status: REVIEW, no patch.
- `HUGER FB-53A` (`632825146024`) — the second existing asset visibly depicts a
  different rigid instrument, so the complete media set is FAIL. No patch.
- `PRIMEDIC Defi-B` (`754023648801`) — both images visibly match Defi-B and the
  [PRIMEDIC history](https://hk.primedic.com/en/pages/about) supports the model,
  but Production is bound to Mindray and has no PRIMEDIC/Metrax manufacturer
  reference usable by the approved atomic patch. No patch.

The immutable preview is
`/tmp/group-c-remediation-batch-3-patch-preview-2026-08-02.json`, SHA-256
`cf90e9cf9068e27bf15dabf0b33c2e1b82a5b658c594dd3747556c3fc0bce035`,
permissions `0600`.
