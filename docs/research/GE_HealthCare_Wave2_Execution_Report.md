# GE HealthCare Wave 2 Execution Report

**Task:** MVP-044 — GE HealthCare Wave 2 Full Import
**Scope:** official GE HealthCare sources only
**Status:** candidate-only pipeline executed; no verification or publication changes

## Executive summary

All 19 required models were represented by official GE HealthCare product/family pages and passed through the existing Discovery, Manufacturer Provider, Resolver v2, Trusted Downloader, Category Extraction Profiles, Review Queue and Import Center layers. The official products index was retained as a non-product discovery entry point.

Resolver v2 exposed a GE-specific shared-library problem: nine product pages expanded into 7,921 candidates, most unrelated site-wide support/library metadata. The complete resolver result remains visible in discovery reports. Trusted Downloader was invoked through its existing scoped API on 60 product-relevant official candidates only; it accepted 53 artifacts and rejected seven. Extraction created 242 candidate facts/claims and 242 Review Items.

## Models discovered

| Family | Models checked | Official source result |
| --- | --- | --- |
| LOGIQ P | P9, P10 | Official P Series page represented both models; current URL returned no resolved document candidates |
| LOGIQ E | E10, E10s | Official E10 Series page; ten trusted artifacts per model |
| LOGIQ Fortis | Fortis | Official product URL recorded; no resolved documents from current URL |
| Versana | Active, Balance, Premier | Official model pages; eight trusted artifacts per model |
| Vivid | T8, T9, S70N, E95 | Official URL candidates returned 404 in this regional pass; no artifacts |
| Venue | Fit, Go | Venue family/current pages confirmed; Venue Go produced three artifacts, Venue Fit current URL produced none |
| CARESCAPE | B450, B650, B850 | Official product pages/family evidence; shared Bx50 manual downloaded for all three |
| Anesthesia | Aisys CS², Aespire View | Aisys current page produced three artifacts; Aespire page returned 404 and its direct guide download was blocked |

Additional official current models/families found: LOGIQ Totus, LOGIQ E11/E20, Venue Sprint, CARESCAPE ONE and the broader Venue/LOGIQ current portfolios. They remain follow-up discoveries and were not used as analogues for required models.

## Trusted documents

| Model | Discovery candidates / resolved | Downloaded / artifacts | Status |
| --- | ---: | ---: | --- |
| LOGIQ P9 | 0 / 0 | 0 / 0 | Needs documents |
| LOGIQ P10 | 0 / 0 | 0 / 0 | Needs documents |
| LOGIQ E10 | 876 / 876 | 10 / 10 | Product brochure and product-relevant specifications/support PDFs downloaded |
| LOGIQ E10s | 876 / 876 | 10 / 10 | Same official E10 Series evidence set |
| LOGIQ Fortis | 0 / 0 | 0 / 0 | Needs documents |
| Versana Active | 878 / 878 | 8 / 8 | Brochure and product-relevant PDFs downloaded; one scoped failure |
| Versana Balance | 878 / 878 | 8 / 8 | Brochure and product-relevant PDFs downloaded; one scoped failure |
| Versana Premier | 878 / 878 | 8 / 8 | Brochures, datasheet and product-relevant PDFs; one scoped failure |
| Vivid T8 | 0 / 0 | 0 / 0 | Regional product URL 404; blocked |
| Vivid T9 | 0 / 0 | 0 / 0 | Regional product URL 404; blocked |
| Vivid S70N | 0 / 0 | 0 / 0 | Regional product URL 404; blocked |
| Vivid E95 | 0 / 0 | 0 / 0 | Regional product URL 404; blocked |
| Venue Fit | 0 / 0 | 0 / 0 | Official family evidence exists, but current seeded URL yielded no documents |
| Venue Go | 884 / 884 | 3 / 3 | Venue Go brochure and product-relevant PDFs; two scoped failures |
| CARESCAPE B450 | 882 / 881 | 1 / 1 | Shared B450/B650/B850 user manual downloaded |
| CARESCAPE B650 | 1 / 0 | 1 / 1 | Shared Bx50 user manual downloaded |
| CARESCAPE B850 | 1 / 0 | 1 / 1 | Shared Bx50 user manual downloaded |
| Aisys CS² | 885 / 885 | 3 / 3 | Product brochure and anesthesia service/support materials; one scoped failure |
| Aespire View | 1 / 0 | 0 / 0 | Direct official participant/operator guide blocked; product URL 404 |

Document classes found across official pages include brochures, datasheets, user/operator manuals, technical/site-planning material, software/interoperability resources, accessories, cybersecurity/service material and clinical/support documents. Registration evidence and stable public IFUs remain incomplete.

## Category extraction

| Model | Profiles | Coverage | Matched patterns / normalized units | Failed fields summary |
| --- | --- | ---: | --- | --- |
| LOGIQ P9/P10/Fortis | registry + ultrasound | 0% | none | all registry and ultrasound fields |
| LOGIQ E10 | registry + ultrasound | 64% | weight, interfaces, Doppler, elastography, 3D/4D; kg | registry fields, channels, probe ports |
| LOGIQ E10s | registry + ultrasound | 64% | same E10 family matches; kg | registry fields, channels, probe ports |
| Versana Active | registry + ultrasound | 47% | weight, Doppler, 3D/4D, elastography; kg | registry fields, channels, probe ports |
| Versana Balance | registry + ultrasound | 30% | Doppler, 3D/4D, elastography | registry fields, channels, probe ports |
| Versana Premier | registry + ultrasound | 57% | battery, Doppler, 3D/4D, channels, elastography | registry fields, probe ports |
| Vivid T8/T9/S70N/E95 | registry + ultrasound | 0% | none | all expected fields |
| Venue Fit | registry + ultrasound | 0% | none | all expected fields |
| Venue Go | registry + ultrasound | 27% | weight, Doppler; kg | registry fields, 3D/4D, channels, elastography, probe ports |
| CARESCAPE B450/B650/B850 | registry + patient-monitor | 17% each | model | manufacturer, registration number and patient-monitor fields |
| Aisys CS² | registry + anesthesia | 15% | adult, pediatric and neonatal | registry fields and remaining anesthesia fields |
| Aespire View | registry + anesthesia | 0% | none | all expected fields |

Average extraction coverage across 19 models is **19%**. Profiles used: `registry`, `ultrasound`, `patient-monitor` and `anesthesia`. Normalized units: `kg` on LOGIQ E10/E10s, Versana Active and Venue Go.

## Compatibility findings

Only explicit official statements were retained:

- the CARESCAPE B450 page/manual documents operation with CARESCAPE ONE, CARESCAPE PDM, E-PSM/P modules and named CARESCAPE network systems;
- the shared Bx50 manual explicitly covers B450, B650 and B850, but does not imply interchangeability of all accessories;
- GE ultrasound IHE statements explicitly identify LOGIQ E10/E10s/Fortis and LOGIQ P10/P9 releases for named interoperability profiles;
- official Venue family material provides a side-by-side Venue/Venue Go/Venue Fit/Venue Sprint configuration comparison and named probe connectivity;
- Versana and LOGIQ brochures identify supported probes/features only within their documented model scope;
- Aisys CS² materials document named anesthesia features/options; no Aespire compatibility was inferred.

No compatibility relationship was generated from naming or family similarity.

## Candidate Facts → Review Items → Reviewer Workspace

GE-only totals:

- candidate facts: 242;
- candidate claims: 242;
- Review Items: 242;
- ready for human review: 172;
- missing evidence: 70;
- conflicts: 0;
- products with Review Items: 10.

The global Reviewer Workspace after rebuilding contains 5,144 pending items and 3,620 ready for human review. Non-GE items are pre-existing manufacturer data.

## KPI

| KPI | Detailed GE result |
| --- | ---: |
| Products discovered | 19 models + 1 discovery index |
| Official sources | 20 |
| Document candidates | 7,921 |
| Resolved documents | 7,917 |
| Product-relevant download attempts | 60 |
| Downloads | 53 |
| Artifacts | 53 |
| Candidate facts | 242 |
| Review Items | 242 |
| Ready for review | 172 |
| Blocked/no-artifact products | 9 |
| Average extraction coverage | 19% |

The 7,921 discovery candidates are deliberately not presented as 7,921 relevant product documents. The scoped Trusted Downloader pass retained only exact product/family evidence while preserving the full resolver diagnostics.

## Import Center aggregate

`npm run wave2:execute -- GE` produced:

- products/entries: 20;
- official sources: 20;
- documents: 43;
- downloads/artifacts: 28;
- candidate facts/review items: 70;
- blocked products: 2;
- errors: 0; warnings: 1.

These are deterministic orchestration-layer metrics and are reported separately from real discovery/download/extraction totals.

## Problems and recommendations

1. GE page metadata exposes site-wide libraries: resolver output must be interpreted using product-local scoping before download.
2. Correct regional/current URLs are still needed for Vivid T8/T9/S70N/E95, LOGIQ P Series, LOGIQ Fortis, Venue Fit and Aespire View.
3. Many downloaded metadata PDFs have weak generic titles; classification needs product-card context in a future resolver task.
4. Add stable official IFU/operator manual and cybersecurity URLs for each current model.
5. Keep shared-family manuals linked to each product, but never infer accessory interchangeability.
6. Add regulatory/RU evidence separately before verification.

## Safety confirmation

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No Verification, Publication, Review Queue logic, Candidate Claim semantics, Supabase, public API, Portal, UI, import architecture or Provider Framework code was changed. No commit was created.
