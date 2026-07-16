# Dixion Wave 2 Execution Report

**Task:** MVP-049 — Execute Wave 2 pipeline for Dixion
**Run date:** 2026-07-14
**Scope:** official Dixion sources only; candidate-only research pipeline
**Provider:** `DefaultProvider` (`fallbackProviderUsed = true` for all 15 entries)

## Outcome

Dixion was processed through the existing Discovery → Resolver v2 → Trusted Downloader → Artifact Store → Category Extraction Profiles → Candidate Claims → Review Queue → Wave 2 reports flow. No provider, resolver, downloader, extraction, review, verification, publication, Supabase, Portal, public API, Dashboard, or orchestration logic was changed.

The evidence run contains 15 discovery entries, 28 official source bindings, 159 document candidates (46 unique URLs), 46 successful download bindings, 21 unique SHA-256 artifacts, 125 evidence-linked candidate facts/claims, and 125 review items ready for human review. All entries remain blocked from evidence completeness because registration evidence, IFU/operator manual, and technical datasheet coverage is missing.

## Product and family inventory

| Entry | Classification | Official evidence | Current/archive assessment |
| --- | --- | --- | --- |
| DIXION Remodix 9507 | model | live product page + official model PDF | current official listing |
| DIXION Vacus 7018 | model | live product page + 2025 Vacus catalogue | current official listing; existing catalog identity `portativnyi-aspirator-vacus-7018-dixion` was reviewed and must be reconciled during identity review |
| DIXION Vacus 7308 | model | live product page + 2025 Vacus catalogue | current official listing; existing catalog title was reviewed |
| DIXION 4700 | model | live product page + official model PDF | current official listing |
| Practice 3000/3100/3700 | family of separately listed models | live category + 2025 Practice catalogue | current family discovery entry; no configuration-level fact transfer |
| Storm D8/D6/D5/D3 | family of modular monitor models | live category + official family PDF | current family entry; station, modules, stands, sensors, and cables remain accessories/options |
| Convelar | family | live category + 2024 catalogue | single/double dome and mounting forms are configurations |
| Altafor Plus 1310/1320/1330/1340/1345 | family of separately listed models | live category + official family PDF | argon module, tools, and electrodes are options/accessories |
| Instilar 1428/1438/1486/1487/1488 | family of separately listed pumps | live category + official family PDF | current family discovery entry |
| Babyguard 1120 | model | live product page + model PDF | current official listing |
| XHZ phototherapy | family | live neonatal category + 2025 catalogue | XHZ-90L/P/Q/S and XHZ-200 remain model/configuration-level candidates |
| Intensive Care Bed CGD | family | live product page + official family PDF | bed accessories/configurations are not separate products |
| Heart PAD | model | live product page + official PDF | current official listing |
| Endoscopy portfolio | family/category entry | live official category only | blocked: no public model card or model-specific PDF was exposed |
| Dixion products index | discovery index, not a product | official 2026 catalogue page | discovery-only entry |

The live category pages also expose older/undated Aeros ventilators, legacy Storm variants, other Babyguard models, beds, and radiology systems. They were not marked current solely because a page remains reachable. No discontinued status was invented. A separate archive/current lifecycle review is required before adding those entries as current models.

## Official sources and documents

Only `dixion.ru` sources were accepted. Primary entry points were:

- `https://dixion.ru/catalog/catalogs/`
- live official product/category pages for each entry;
- official PDFs under `https://dixion.ru/upload/`.

Document classification was conservative:

| Classification | Candidate bindings | Successful download bindings |
| --- | ---: | ---: |
| brochure | 104 | 14 |
| unknown | 55 | 32 |
| IFU | 0 | 0 |
| operator manual | 0 | 0 |
| technical specification/datasheet | 0 | 0 |
| service manual | 0 | 0 |
| registration document | 0 | 0 |

Resolver v2 found 146 resolved links. The high binding count reflects the same official catalogue links appearing on multiple product/category pages; it is not a count of unique documents.

## Trusted download and Artifact Store

| Metric | Result |
| --- | ---: |
| Attempted document bindings | 159 |
| Successful download bindings/document versions | 46 |
| Unique successful source URLs | 21 |
| Unique SHA-256 artifacts | 21 |
| Failed downloads | 113 |
| Skipped by trust tier/unsafe URL | 0 |

Failure reasons were: HTML rejected as a document (75), timeouts (9), fetch failures (17), terminated responses (5), HTTP 404 (3), JPEG rejected (3), and PNG rejected (1). Successful artifacts passed MIME and PDF magic-byte validation. Repeated family documents were deduplicated by content hash.

## Extraction and Review Queue

| Entry | Profiles used | Coverage | Pattern/unit result | Facts / claims / review / ready |
| --- | --- | ---: | --- | ---: |
| 4700 | registry, ventilator | 15% | NIV 2; screen 9; neonatal 1; inch 9 | 20 / 20 / 20 / 20 |
| Altafor Plus family | registry | 0% | none | 6 / 6 / 6 / 6 |
| Babyguard 1120 | registry | 33% | registration-number pattern 1 | 7 / 7 / 7 / 7 |
| Convelar family | registry, lighting | 0% | none | 2 / 2 / 2 / 2 |
| Endoscopy portfolio | registry, endoscopy | 0% | none | 2 / 2 / 2 / 2 |
| Heart PAD | registry | 0% | none | 6 / 6 / 6 / 6 |
| Instilar family | registry, ultrasound | 0% | none | 4 / 4 / 4 / 4 |
| Intensive Care Bed CGD | registry | 0% | none | 6 / 6 / 6 / 6 |
| XHZ family | registry | 0% | none | 4 / 4 / 4 / 4 |
| Practice family | registry, anesthesia | 10% | screen 9; neonatal 1; inch 9 | 14 / 14 / 14 / 14 |
| products index | registry | 33% | registration-number pattern 1 | 21 / 21 / 21 / 21 |
| Remodix 9507 | registry | 0% | none | 6 / 6 / 6 / 6 |
| Storm family | registry, patient-monitor | 13% | screen 9; inch 9 | 11 / 11 / 11 / 11 |
| Vacus 7018 | registry | 0% | none | 8 / 8 / 8 / 8 |
| Vacus 7308 | registry | 0% | none | 8 / 8 / 8 / 8 |

Average coverage is **7%**. Failed fields are chiefly registry manufacturer/model/registration number plus category fields not found in extracted brochure text. The neonatal Russian category label did not select the neonatal profile, and `Инфузионное` selected the existing ultrasound matcher through its `узи` substring. Both are existing profile-selection limitations; profiles were not changed in this task.

Every candidate fact and claim has a document version, source URL, locator/evidence reference, and flows into a pending Review Item. No Review Decision was created. “Ready” means structurally ready for a human reviewer, not verified or publishable.

## Compatibility

No compatibility claim was created. The downloaded evidence did not yield an explicit model-to-accessory/component compatibility statement with a usable locator. Family membership, shared connectors, accessories shown on category pages, central stations, modules, sensors, cables, breathing circuits, consumables, and software references were not propagated by analogy.

## Missing evidence and blocked entries

All 15 entries lack the pipeline's required registration certificate, IFU/operator manual, and datasheet classification. The endoscopy entry is additionally blocked at family/category level because no public model-specific document was exposed. Public service manuals, software documentation, safety notices, quick guides, and explicit compatibility matrices were not found.

## Evidence-level KPI

| KPI | Result |
| --- | ---: |
| Products/entries | 15 |
| Official source bindings | 28 |
| Unique official source URLs | 27 |
| Document candidates | 159 |
| Unique document URLs | 46 |
| Download attempts | 159 |
| Successful downloads/document versions | 46 |
| Unique artifacts | 21 |
| Candidate facts | 125 |
| Candidate claims | 125 |
| Review items | 125 |
| Ready for human review | 125 |
| Evidence-blocked entries | 15 |
| Failed downloads | 113 |
| Average extraction coverage | 7% |

## Deterministic Wave 2 orchestration metrics

These are synthetic/deterministic execution-layer metrics and must not be read as evidence counts:

| KPI | Result |
| --- | ---: |
| Products discovered | 15 |
| Official sources | 28 |
| Documents found | 28 |
| Downloads | 18 |
| Artifacts | 18 |
| Candidate facts | 35 |
| Review items | 35 |
| Blocked products | 2 |
| Errors / warnings | 0 / 2 |

## Safety

- `publicationCreated = false`
- `verifiedClaimsCreated = 0`
- `supabaseWrites = false`
- `verificationChanged = false`
- `reviewDecisionsChanged = false`

## Recommendations

1. Acquire official model-level IFU/operator manuals, technical datasheets, and registration evidence before any verification work.
2. Reconcile the Wave 2 Vacus 7018/7308 discovery entries with pre-existing catalog identities during human identity review.
3. Review the resolver's broad catalogue-link inheritance so product pages do not inherit unrelated brochure candidates.
4. Treat the 7% extraction coverage as a triage signal, not completeness.
5. Review the existing Russian neonatal matcher and the `Инфузионное`/ultrasound false-positive in a separate extraction-profile task.

