# Philips Wave 2 Execution Report

**Task:** MVP-043 — Philips Wave 2 Full Import  
**Scope:** official Philips sources only  
**Status:** candidate-only pipeline executed; no verification or publication changes

## Executive summary

All 15 required Philips models were represented by official Philips product or document pages and passed through the existing Discovery, Manufacturer Provider, Resolver v2, Trusted Downloader, Category Extraction Profiles, Review Queue and Import Center layers. The Philips healthcare products index was retained as a non-product discovery entry point.

Resolver v2 produced 371 official document candidates, including seven direct seeded documents and 364 resolved links. Trusted Downloader accepted 33 artifacts and rejected 338 candidates. Extraction created 301 Philips candidate facts/claims and 301 Review Items, of which 222 are ready for human review. No candidate was verified or published.

## Models discovered

| Model | Official source | Lifecycle / result |
| --- | --- | --- |
| IntelliVue MX400 | Philips HC866060 product URL | Current/official candidate; brochure and shared family IFU downloaded |
| IntelliVue MX450 | Philips HC866062 product page | Current official page; family brochure and IFU downloaded |
| IntelliVue MX500 | Philips HC866064 product page | Current official page; family brochure and IFU downloaded |
| IntelliVue MX550 | Philips HC866066 product URL | Current/official candidate; brochure and IFU downloaded |
| IntelliVue MX700 | Philips HC865241 product URL | Official product candidate; MX700/MX800 brochure downloaded |
| IntelliVue MX750 | Philips HC866471 product URL | Official product candidate; brochures and EcoPassport downloaded |
| Efficia CM10 | Official Philips accessories/compatibility page | Exact model documented; standalone current product page not confirmed; no artifact |
| Efficia CM12 | Official Philips accessories/compatibility page | Exact model documented; standalone current product page not confirmed; no artifact |
| Affiniti 50 | Philips HC795208 product page | Current official page; four supporting artifacts |
| Affiniti 70 | Philips HC795210 product page | Current official page; four supporting artifacts |
| EPIQ 5 | Philips HC795118 Circular Edition page | Current refurbished-system page; three brochures downloaded |
| EPIQ 7 | Philips HC795200W page | Official page states product is no longer available; no artifact downloaded |
| Lumify | Philips HC795005 product page | Current official page; brochure, compatibility list and user manual downloaded |
| Azurion 7 | Philips HCNCVD005 Azurion 7 M20 page | Current official page; four product/accessory artifacts |
| HeartStart FR3 | Official Philips technical reference manual | Current standalone product page not confirmed; technical manual downloaded |

Additional official current families/models exposed during research: IntelliVue MX800 and MX850, EPIQ Elite and EPIQ CVx, Affiniti 30 and Affiniti CVx, Flash Ultrasound System 5100 POC, and Azurion 7 M20 with FlexArm. They are follow-up discoveries, not inferred replacements for the required models.

## Official documents and trusted status

| Model | Candidates / resolved | Downloads / artifacts | Found document classes | Missing or blocked |
| --- | ---: | ---: | --- | --- |
| IntelliVue MX400 | 27 / 26 | 3 / 3 | Product brochure, supporting brochure, IFU | Remaining 24 blocked; registration evidence absent |
| IntelliVue MX450 | 26 / 25 | 2 / 2 | MX450/MX500 brochure, IFU | Remaining 24 blocked; registration evidence absent |
| IntelliVue MX500 | 26 / 25 | 2 / 2 | MX450/MX500 brochure, IFU | Remaining 24 blocked; registration evidence absent |
| IntelliVue MX550 | 26 / 25 | 2 / 2 | Product brochure, IFU | Remaining 24 blocked; registration evidence absent |
| IntelliVue MX700 | 25 / 25 | 1 / 1 | MX700/MX800 brochure | 24 blocked; public IFU/operator manual not captured |
| IntelliVue MX750 | 27 / 27 | 3 / 3 | Product brochures, EcoPassport | 24 blocked; public IFU/operator manual not captured |
| Efficia CM10 | 24 / 24 | 0 / 0 | Official accessories/compatibility page only | All document downloads blocked; product manual absent |
| Efficia CM12 | 24 / 24 | 0 / 0 | Official accessories/compatibility page only | All document downloads blocked; product manual absent |
| Affiniti 50 | 28 / 28 | 4 / 4 | Security brochure and clinical flyers | 24 blocked; public operator manual/IFU not captured |
| Affiniti 70 | 29 / 28 | 4 / 4 | Security brochure and clinical flyers | 25 blocked; public operator manual/IFU not captured |
| EPIQ 5 | 27 / 27 | 3 / 3 | Three product/clinical brochures | 24 blocked; public operator manual/IFU not captured |
| EPIQ 7 | 25 / 25 | 0 / 0 | Official discontinued-product page and document candidates | All downloads blocked |
| Lumify | 28 / 27 | 4 / 4 | Android/iOS brochures, device compatibility list, user manual | 24 blocked; some support/software links not artifacts |
| Azurion 7 M20 | 28 / 28 | 4 / 4 | Product, accessories and workspots brochures; environmental overview | 24 blocked; public operator manual/IFU not captured |
| HeartStart FR3 | 1 / 0 | 1 / 1 | Technical Reference Manual | Product brochure/current product page not confirmed |

Aggregate detailed download status: 371 attempts, 33 successful downloads/artifacts and 338 failed/blocked candidates. Philips Customer Services Portal references were treated as discovery/navigation only; no authorization was attempted.

## Category extraction coverage

| Model | Profiles | Coverage | Principal matched patterns | Normalized units | Principal failed fields |
| --- | --- | ---: | --- | --- | --- |
| MX400 | registry + patient-monitor | 188% | model, power, battery, measurement ranges, interfaces, compatibility, accessories, parameters, screen, modules | inch: 1 | registration number, battery runtime |
| MX450 | registry + patient-monitor | 171% | power, battery, measurement ranges, interfaces, compatibility, accessories, parameters, screen, modules | inch: 1 | manufacturer, model, registration number, battery runtime |
| MX500 | registry + patient-monitor | 171% | same family patterns as MX450 | inch: 1 | manufacturer, model, registration number, battery runtime |
| MX550 | registry + patient-monitor | 171% | same family patterns as MX450 | inch: 1 | manufacturer, model, registration number, battery runtime |
| MX700 | registry + patient-monitor | 0% | none | none | all registry and patient-monitor expected fields |
| MX750 | registry + patient-monitor | 0% | none | none | all registry and patient-monitor expected fields |
| Efficia CM10 | registry + patient-monitor | 0% | none | none | all expected fields; no artifact |
| Efficia CM12 | registry + patient-monitor | 0% | none | none | all expected fields; no artifact |
| Affiniti 50 | registry + ultrasound | 20% | Doppler, 3D/4D | none | registry fields; channels, elastography, probe ports |
| Affiniti 70 | registry + ultrasound | 20% | Doppler, 3D/4D | none | registry fields; channels, elastography, probe ports |
| EPIQ 5 | registry + ultrasound | 30% | Doppler, elastography, 3D/4D | none | registry fields; channels, probe ports |
| EPIQ 7 | registry + ultrasound | 0% | none | none | all expected fields; no artifact |
| Lumify | registry + ultrasound | 27% | display and Doppler | none | registry fields; 3D/4D, channels, elastography, probe ports |
| Azurion 7 | registry | 33% | generic weight | kg: 1 | manufacturer, model, registration number |
| HeartStart FR3 | registry | 67% | battery and warnings | none | manufacturer, model, registration number |

Average product coverage is **60%**. Coverage above 100% is possible in the existing profile implementation when repeated matches exceed the number of expected fields; it is a triage metric, not publication completeness. No profile logic was changed in this sprint.

## Compatibility findings

Only explicit official Philips statements were retained:

- the IntelliVue MX400/MX450/MX500/MX550 IFU is explicitly shared across those four models and instructs users to follow accessory-specific instructions;
- the MX450/MX500 page explicitly refers to the Philips IntelliBridge EC10 external-device compatibility list for device compatibility;
- the downloaded Lumify Device Compatibility List documents supported smart devices; the product page separately identifies S4-1, C5-2 and L12-4 transducers;
- official Efficia accessory pages explicitly list CM10 and CM12 equipment numbers for named ECG lead sets/cables;
- Philips ultrasound DICOM/IHE statements explicitly group EPIQ 5/7 with Affiniti 50/70 for named software releases;
- the Azurion 7 page explicitly names compatible integrated applications such as IntraSight and Philips Interventional Hemodynamic systems;
- the HeartStart Data Messenger page explicitly lists FR3 support, while the FR3 technical manual documents supported Philips software interfaces.

No compatibility was created by family analogy, and no Verified Claim or compatibility record was written.

## Candidate Facts → Review Items → Reviewer Workspace

Philips-only totals:

- extracted candidate facts: 301;
- candidate claims: 301;
- Review Items: 301;
- pending: 301;
- ready for human review: 222;
- missing evidence: 79;
- conflicts: 0;
- products with Review Items: 12.

The global Reviewer Workspace after rebuilding contains 4,902 pending items, 3,448 ready for human review and 29 products with Review Items. The difference is pre-existing manufacturer data and is not part of the Philips KPI.

## KPI

| KPI | Detailed Philips result |
| --- | ---: |
| Products discovered | 15 models + 1 discovery index |
| Official pages/sources | 16 |
| Document candidates | 371 |
| Resolved documents | 364 |
| Download attempts | 371 |
| Downloads | 33 |
| Artifacts | 33 |
| Candidate facts | 301 |
| Candidate claims | 301 |
| Review Items | 301 |
| Ready for review | 222 |
| Products blocked/no artifact | 3 (Efficia CM10, Efficia CM12, EPIQ 7) |
| Average extraction coverage | 60% |

## Import Center aggregate

`npm run wave2:execute -- Philips` updated the deterministic Import Center reports with:

- products/entries: 16;
- official sources: 16;
- documents: 35;
- downloads/artifacts: 23;
- candidate facts/review items: 46;
- blocked products: 2;
- errors: 0; warnings: 1.

These orchestration-layer metrics are intentionally reported separately from the real Trusted Downloader and extraction totals above.

## Problems and recommendations

1. Most product pages expose 24 shared links that fail trusted download; provider/resolver scoping should prefer product-local documentation cards.
2. Customer Services Portal is detectable but gated; keep it unsupported without credentials or authorization bypass.
3. Obtain public operator manuals/IFUs for MX700/MX750, Efficia, Affiniti, EPIQ and Azurion through stable official artifact URLs.
4. Add official regulatory/RU evidence as a separate source pass before verification.
5. Review repeated-match coverage above 100% in a future profile-metrics task; do not reinterpret it during manufacturer import.
6. Treat DICOM/IHE statements as software interoperability evidence, not general device compatibility.
7. Separate current, discontinued and Circular Edition products in future lifecycle reporting.

## Safety confirmation

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No Verification, Publication, Candidate Claim semantics, Review Queue logic, Supabase, public API, Portal or UI implementation was changed. No commit was created.
