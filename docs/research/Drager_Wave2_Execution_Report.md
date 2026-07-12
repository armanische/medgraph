# Dräger Wave 2 Execution Report

**Task:** MVP-040 — Wave 2 Sprint 4 — Dräger Full Import  
**Scope:** official Dräger sources only  
**Status:** candidate-only research pipeline executed; no verification or publication changes

## Executive summary

The 14 required Dräger models were represented by official Dräger product pages and passed through the existing Discovery, Resolver v2, Trusted Downloader, Category Extraction Profiles and Review Queue pipeline. The official products index was retained as a non-product discovery entry point.

Resolver v2 found 846 document candidates for ten models. The unusually high count is caused by Dräger product pages exposing large shared download/knowledge sections. Trusted Downloader rejected 845 of those Dräger candidates (predominantly HTTP 403 responses) and created one trusted PDF artifact. This is a correct fail-closed outcome: resolver confidence did not bypass artifact validation.

The single downloaded document was a general anaesthesia knowledge PDF linked from the Atlan A300 page, not a product manual. It produced three candidate facts/claims and three pending Review Items. It does not establish publication readiness.

## Models discovered

| Model | Official product page | Lifecycle / result |
| --- | --- | --- |
| Evita Infinity V500 | `draeger.com/en_uk/Products/Evita-Infinity-V500-ventilator` | Official discontinued-product page; document candidates found, downloads blocked |
| Evita V600 | `draeger.com/en_uk/Products/evita-v600` | Current official page; document candidates found, downloads blocked |
| Evita V800 | `draeger.com/en_uk/Products/evita-v800` | Current official page; document candidates found, downloads blocked |
| Savina 300 | `draeger.com/en_uk/Products/Savina-300-Select` | Current family represented by Savina 300 Select; document candidates found, downloads blocked |
| Babylog VN500 | `draeger.com/en_uk/Products/Babylog-VN500` | Official discontinued-product page; document candidates found, downloads blocked |
| Babylog VN800 | `draeger.com/en_neeur/Products/Babylog-VN800` | Current official page; document candidates found, downloads blocked |
| Perseus A500 | `draeger.com/en_uk/Products/Perseus-A500` | Official page; document candidates found, downloads blocked |
| Fabius Plus | `draeger.com/en_uk/Products/Fabius-Plus` | Official legacy URL recorded; resolver found no document links |
| Atlan A350 | `draeger.com/en_uk/Products/Atlan-A350-A350-XL` | Official family page; document candidates found, downloads blocked |
| Atlan A300 | `draeger.com/en_uk/Products/Atlan-A300-A300-XL` | Official family page; 91 candidates, one artifact downloaded |
| Vista 120 | `draeger.com/en_uk/Products/Vista-120` | Official page; document candidates found, downloads blocked |
| Infinity Delta | `draeger.com/en_uk/Products/Infinity-Delta` | Official legacy URL recorded; resolver found no document links |
| Infinity M540 | `draeger.com/en_uk/Products/Infinity-M540` | Official URL recorded; resolver found no document links |
| Infinity C500 | `draeger.com/en_uk/Products/Infinity-C500` | Official URL recorded; resolver found no document links |

Additional official models/families exposed during discovery: Babylog VN600, Savina 300 Select, Infinity C700 and Vista 300. They are recorded as follow-up discoveries and were not silently converted into compatibility claims or separate imported products in this sprint.

## Official documents and trusted status

| Model | Brochure | Operator manual | IFU | Technical data | Accessories | Software | Compatibility | Download / artifact status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Evita Infinity V500 | found | absent | found/link | product information found | shared catalogue found | option material found | found | 107 candidates; 0 artifacts; blocked (403) |
| Evita V600 | found | found | found/link | product information found | catalogue found | SW2n material found | found | 98 candidates; 0 artifacts; blocked (403) |
| Evita V800 | found | found | found/link | product information found | catalogue found | SW2n material found | found | 98 candidates; 0 artifacts; blocked (403) |
| Savina 300 | found | absent | found/link | product information found | shared catalogue found | absent | found | 100 candidates; 0 artifacts; blocked (403) |
| Babylog VN500 | found | absent | found/link | product information found | neonatal material found | option material found | found | 89 candidates; 0 artifacts; blocked (403) |
| Babylog VN800 | found | found | found/link | product information found | neonatal catalogue found | linked analytics offering | found | 21 candidates; 0 artifacts; blocked (403) |
| Perseus A500 | found | absent | found/link | product information found | shared catalogue found | absent | found | 81 candidates; 0 artifacts; blocked (403) |
| Fabius Plus | absent | absent | absent | absent | absent | absent | compatibility reference found externally | 0 candidates; no artifact |
| Atlan A350 | found | absent | found/link | product information found | shared catalogue found | absent | found | 91 candidates; 0 artifacts; blocked (403) |
| Atlan A300 | found | absent | found/link | product information found | shared catalogue found | absent | found | 91 candidates; 1 downloaded artifact; 90 blocked |
| Vista 120 | found | absent | found/link | product information found | shared catalogue found | absent | found | 70 candidates; 0 artifacts; blocked (403) |
| Infinity Delta | absent | absent | absent | absent | absent | absent | absent | 0 candidates; no artifact |
| Infinity M540 | absent | absent | absent | absent | absent | absent | product-family compatibility found | 0 candidates; no artifact |
| Infinity C500 | absent | absent | absent | absent | absent | absent | product-family compatibility found | 0 candidates; no artifact |

`found/link` means Resolver v2 found an official Dräger link or documentation-service entry. It does not mean Trusted Downloader created an artifact. IFU links routed through the Dräger Technical Documentation Service remained blocked and were not treated as downloaded IFUs.

Document candidate classification across the 14 models: 845 total product candidates (846 including no documents for the discovery index), including 23 brochures, 10 IFU links, three operator/user manuals and 809 links classified as unknown/general Dräger material. The resolver's broad shared-section capture is the main quality issue for the next manufacturer sprint.

## Category extraction coverage

| Model | Profiles used | Coverage | Patterns matched | Normalized units | Failed fields |
| --- | --- | ---: | --- | --- | --- |
| Atlan A300 | `registry`, `anesthesia` | 0% | none | none | registry: manufacturer, model, registration number; anesthesia: modes, weight, screen, neonatal, pediatric, oxygen |
| Atlan A350 | `registry`, `anesthesia` | 0% | none | none | same profile fields; no artifact |
| Perseus A500 | `registry`, `anesthesia` | 0% | none | none | same profile fields; no artifact |
| Fabius Plus | `registry`, `anesthesia` | 0% | none | none | same profile fields; no artifact |
| Evita Infinity V500 | `registry`, `ventilator` | 0% | none | none | registry fields plus adult, battery runtime, modes, neonatal, NIV, oxygen, pediatric, screen, turbine, weight |
| Evita V600 | `registry`, `ventilator` | 0% | none | none | same ventilator fields; no artifact |
| Evita V800 | `registry`, `ventilator` | 0% | none | none | same ventilator fields; no artifact |
| Savina 300 | `registry`, `ventilator` | 0% | none | none | same ventilator fields; no artifact |
| Babylog VN500 | `registry`, `ventilator` | 0% | none | none | same ventilator fields; no artifact |
| Babylog VN800 | `registry`, `ventilator` | 0% | none | none | same ventilator fields; no artifact |
| Vista 120 | `registry` | 0% | none | none | manufacturer, model, registration number |
| Infinity Delta | `registry` | 0% | none | none | manufacturer, model, registration number |
| Infinity M540 | `registry` | 0% | none | none | manufacturer, model, registration number |
| Infinity C500 | `registry` | 0% | none | none | manufacturer, model, registration number |

Average Dräger extraction coverage is **0%**. The Atlan A300 artifact produced three generic candidate facts (document title, document type and the technical term “Tidal Volume”), but none matched a category-profile coverage field. No units were normalized.

## Compatibility findings

Only explicit Dräger documentary statements were recorded:

- Dräger's flow-sensor product information explicitly lists model-specific compatibility across Evita V500/V600/V800, Babylog VN500/VN600/VN800, Savina family, Perseus A500, Atlan A300/A350 and Fabius family.
- The Atlan family assembly instructions explicitly list supported monitor combinations including Infinity M500/M540, IACS C500/C700 and Vista 120/120S.
- A Dräger Declaration of Compatibility explicitly includes Perseus A500, Fabius Plus, Atlan A300 and Atlan A350 for the named mask/accessory scope.
- Babylog VN800's official page explicitly states compatibility of named neonatal accessories with Babylog VN500.

These are research findings only. No compatibility relationship was inferred by family resemblance, and no verified compatibility claim was created.

## Candidate Facts → Review Items → Reviewer Workspace

For the Dräger-only generated product reports:

- extracted candidate facts: 3;
- candidate claims: 3;
- Review Items: 3;
- pending: 3;
- ready for human review: 2;
- missing evidence: 1;
- review decisions changed: 0.

The global Reviewer Workspace was rebuilt by the existing command and contains 549 pending items, 459 ready for human review and ten products with review items. The Dräger contribution is limited to Atlan A300; the remaining totals are pre-existing manufacturer data.

## KPI

| KPI | Detailed Dräger result |
| --- | ---: |
| Products discovered | 14 models + 1 discovery index |
| Official sources | 15 |
| Document candidates | 846 (845 product-linked + index result 0) |
| Resolved documents | 846 |
| Download attempts | 846 |
| Downloads | 1 |
| Artifacts | 1 |
| Extracted candidate facts | 3 |
| Candidate claims | 3 |
| Review items | 3 |
| Ready for review | 2 |
| Blocked / no trusted artifact | 13 models |
| Average extraction coverage | 0% |

The Import Center aggregate report was updated by `npm run wave2:execute -- Drager`. Its report-layer totals are: 15 products/entries, 15 official sources, 32 documents, 21 downloads/artifacts, 52 candidate facts/review items and two blocked products. These are deterministic Wave 2 orchestration metrics, not the detailed Trusted Downloader counts above.

## Problems and recommendations for Philips

1. Scope resolver links to the product's own download cards before following shared knowledge/download sections; Dräger produced 809 unknown/general candidates.
2. Deduplicate shared official URLs globally before download, while preserving per-product evidence linkage.
3. Capture document-card titles and types before following links; generic “Download PDF” titles weaken classification.
4. Treat documentation-service/IFU links as blocked until a stable public artifact is returned; do not count the link as an artifact.
5. Add explicit HTTP 403 diagnostics and bounded retry/backoff reporting to the Philips run.
6. Seed a small set of direct, product-specific brochure/technical-data URLs for Philips, while still letting Resolver v2 discover additions.
7. Keep product-page compatibility statements separate from downloadable compatibility matrices and require exact model references.
8. Report detailed pipeline KPI and deterministic Import Center KPI separately to avoid implying that synthetic aggregate downloads are real artifacts.

## Safety confirmation

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No Publication, Verification, Supabase, public API, Portal or UI code was changed. Review Items remain candidate-only and no reviewer decision was applied.
