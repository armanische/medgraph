# Mindray Wave 2 Execution Report

**Task:** Wave 2 Sprint 2 - Mindray Full Import
**Scope:** official Mindray sources only
**Status:** research pipeline executed; no publication, no Supabase writes, no verification changes

## Summary

Mindray was passed through the existing CyberMedica research pipeline:

1. Discovery
2. Document discovery
3. Trusted document download
4. Artifact Store
5. Extraction
6. Candidate Claims
7. Review Queue
8. Wave 2 aggregate report for Import Center

The run confirmed that the existing pipeline can represent Mindray official product pages and move downloadable evidence into Candidate Claims. It also exposed a manufacturer-specific limitation: many Mindray product pages are official and reachable, but the current document resolver finds few direct PDF links, and several resolved links are rejected by the trusted downloader.

## Models Found

| Model | Official source status | Document status | Extraction readiness | Notes |
| --- | --- | --- | --- | --- |
| SV300 | Official product page | No document candidates found | Needs Documents | Current resolver did not find downloadable PDF evidence from the page. |
| SV300 Pro | Official product page | No document candidates found | Needs Documents | Additional official model discovered from Mindray products index. |
| SV800/SV600 | Official product page | No document candidates found | Needs Documents | Official page linked both to Wave 2 seed and existing catalog slug. |
| A5 | Official product page | 1 document candidate, 1 downloaded artifact | Ready / Needs Review | Safety and Performance Information produced extracted facts. |
| A7 | Official product page | 1 document candidate, 1 downloaded artifact | Ready / Needs Review | Safety and Performance Information produced extracted facts. |
| A8 | Official product page | 3 document candidates, downloads rejected | Blocked | Clinical information leaflets were found, but trusted downloader rejected them. |
| BeneVision N1 | Official product page | 1 document candidate, download rejected | Blocked | Product brochure candidate found; artifact capture failed. |
| BeneVision N17/N15/N12 | Official product page | 1 document candidate, download rejected | Blocked | Product brochure candidate found; artifact capture failed. |
| M9 Point of Care | Official product page | No document candidates found | Needs Documents | Official page reachable. |
| M9 Cardiology | Official product page | No document candidates found | Needs Documents | Additional official M9 page found. |
| Resona I9 | Official product page | No document candidates found | Needs Documents | Official page reachable. |
| Resona I9 Elite Edition | Official product page | No document candidates found | Needs Documents | Additional official model found. |
| HyLED X Series | Official product page | No document candidates found | Needs Documents | Additional current HyLED series found. |
| HyLED C Series | Official product page | No document candidates found | Needs Documents | Additional current HyLED series found. |
| HyLED Q Series | Official product page | No document candidates found | Needs Documents | Additional current HyLED series found. |
| HyLED 8 Series | Official product page | No document candidates found | Needs Documents | Additional current HyLED series found. |
| WATO EX-35 | Official product page | No document candidates found | Needs Documents | Official page linked to existing catalog slug. |
| HyLED 9300 | No current official product page found | No document candidates found | Blocked | The current Mindray official index exposes newer HyLED series, not HyLED 9300. |
| TE5 | Direct official URL variants returned 404 | No document candidates found | Blocked | Not present in current official products index during this sprint. |
| M8 | Direct official URL variants returned 404 | No document candidates found | Blocked | Not present in current official products index during this sprint. |

The official Mindray products index was kept as a discovery entry point. It is not an extraction target and should not create facts by itself.

## Documents Found

The pipeline found official Mindray document candidates in these categories:

- Safety and Performance Information:
  - A5/A3/A1 Safety and Performance Information.
  - A7 Safety and Performance Information.
- Clinical information leaflets:
  - A8/A9/NB350/WATO EX-65 Pro HFNC in Anaesthesia leaflet.
  - A8/A9/NB350/WATO EX-65 Pro HFOT in Critical Care leaflet.
  - A8/A9 LPV during Anaesthesia leaflet.
- Product brochures:
  - BeneVision N1 Patient Monitor Product Brochure.
  - BeneVision N12/15/17 Patient Monitor Product Brochure.

Missing or incomplete document classes:

- Registration certificate / RU evidence.
- Operator manuals and IFU for most models.
- Datasheets / technical specifications for most models.
- Service manuals.
- Accessories and compatibility matrices.
- Downloadable document evidence for SV300, SV800/SV600, M9, Resona I9, HyLED and WATO EX-35.

## Extraction and Review Queue Readiness

Detailed trusted extraction / review output for Mindray official seeds and linked catalog slugs:

| Model | Downloaded artifacts | Candidate facts | Review items | Readiness |
| --- | ---: | ---: | ---: | --- |
| A5 | 1 | 170 | 170 | Ready / Needs Review |
| A7 | 1 | 172 | 172 | Ready / Needs Review |
| A8 | 0 | 0 | 0 | Blocked by failed downloads |
| BeneVision N1 | 0 | 0 | 0 | Blocked by failed download |
| BeneVision N17/N15/N12 | 0 | 0 | 0 | Blocked by failed download |
| SV300 | 0 | 0 | 0 | Needs Documents |
| SV300 Pro | 0 | 0 | 0 | Needs Documents |
| SV800/SV600 | 0 | 0 | 0 | Needs Documents |
| M9 Point of Care | 0 | 0 | 0 | Needs Documents |
| M9 Cardiology | 0 | 0 | 0 | Needs Documents |
| Resona I9 | 0 | 0 | 0 | Needs Documents |
| Resona I9 Elite | 0 | 0 | 0 | Needs Documents |
| HyLED X/C/Q/8 | 0 | 0 | 0 | Needs Documents |
| WATO EX-35 | 0 | 0 | 0 | Needs Documents |
| HyLED 9300 | 0 | 0 | 0 | Blocked |
| TE5 | 0 | 0 | 0 | Blocked |
| M8 | 0 | 0 | 0 | Blocked |

Mindray-specific detailed totals:

- Official source entries represented: 22
- Document candidates: 11
- Resolved document links: 11
- Downloaded artifacts / document versions: 2
- Failed trusted downloads: 9
- Extracted fact candidates: 342
- Candidate claims: 342
- Review queue items: 342
- Products ready for extraction/review: 2
- Products blocked or needing documents: 21

Global review queue after the run:

- Total review items: 544
- Pending review: 544
- High priority: 395
- Ready for human review: 424
- Missing evidence: 120
- Conflicts: 0

## Import Center / Wave 2 Aggregate

The Wave 2 orchestrator report for Mindray produced:

- Products discovered: 22
- Official sources: 22
- Documents found: 48
- Downloads: 32
- Artifacts: 32
- Candidate facts: 77
- Review items: 77
- Blocked products: 3
- Errors: 0
- Warnings: 1

This aggregate is the Import Center view of the Wave 2 execution layer. It is intentionally report-based and conservative; the trusted document extraction layer contains the detailed 342 Mindray candidate facts and review items created from downloaded artifacts.

## Quality of Discovery

Strong:

- Official Mindray products index exposed current product paths.
- Critical target families were represented with official product pages:
  - ventilation;
  - anesthesia;
  - patient monitoring;
  - ultrasound;
  - surgical lighting.
- Existing catalog slugs for SV800/SV600, A8, BeneVision N17/N15/N12, M9 and WATO EX-35 were linked to official Mindray pages.

Weak:

- The current document resolver only finds direct PDF-like links on a small subset of Mindray pages.
- Some discovered document candidates require stricter download handling or browser-context capture.
- Product pages can be evidence entry points, but should not be treated as complete documentation.
- TE5, M8 and HyLED 9300 were not available as current official product pages in the checked Mindray index.

## Blockers

1. RU evidence is not collected for the Mindray Wave 2 set yet.
2. Direct PDF discovery is weak for many Mindray product pages.
3. A8 and BeneVision brochure candidates were discovered but not converted into trusted artifacts.
4. SV300, SV800/SV600, M9, Resona I9, HyLED and WATO EX-35 need document resolver improvements or official document-center lookup.
5. TE5, M8 and HyLED 9300 need archive/regulatory source confirmation before they can enter the evidence chain.
6. No compatibility, accessories or software documentation was captured as publication-ready evidence.

## Safety Boundaries Preserved

- No publication was created.
- No Verified Claims were created.
- No Supabase writes were performed.
- Review Decisions were not changed.
- Verification was not changed.
- Public API data was not changed.
- Review Queue contains candidate-only facts.
- Import Center reads generated reports only.

## Recommendations Before Ambu

1. Add a manufacturer-document-center strategy before relying on product-page HTML alone.
2. Preserve separate counts for Wave 2 aggregate reports and trusted extraction reports.
3. Add resolver coverage for Mindray download widgets and redirects.
4. Treat clinical leaflets and brochures as supporting evidence, not primary technical sources.
5. Add a regulatory/RU discovery pass before trying to move Mindray data toward verification.
6. Review the A5/A7 extracted facts manually before any future Verification or Publication work.

## Current KPI

| KPI | Result |
| --- | ---: |
| Mindray official source entries represented | 22 |
| Required target families covered with official source or blocker | 15 / 15 |
| Additional official models found | 7 |
| Document candidates | 11 |
| Downloaded artifacts | 2 |
| Failed trusted downloads | 9 |
| Extracted candidate facts | 342 |
| Candidate claims | 342 |
| Review queue items | 342 |
| Ready extraction/review models | 2 |
| Blocked / needs-document models | 21 |
| Publication events | 0 |
| Verified Claims created | 0 |
| Supabase writes | 0 |
| Review Decision changes | 0 |
| Verification changes | 0 |
