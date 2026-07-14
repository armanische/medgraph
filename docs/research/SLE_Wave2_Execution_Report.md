# SLE Wave 2 Execution Report

**Task:** MVP-048 — Execute Wave 2 pipeline for SLE
**Scope:** official SLE, Inspiration Healthcare Group and official current-partner sources only
**Status:** candidate-only pipeline executed; no verification, review decision or publication changes

## Executive summary

The required SLE catalogue was checked through the current brand owner,
Inspiration Healthcare Group/SLE Ltd, plus official GE HealthCare India pages
where GE identifies itself as SLE's regional partner. Eleven model or
configuration entries and one official products-index entry passed through the
existing Discovery, Resolver v2, Trusted Downloader, Category Extraction
Profiles, Review Queue, Wave 2 reports, Import Center and Wave 2 Dashboard.

The task names `SLE 6000 HFO`, `SLE 6000 NIV`, `SLE 6000 NCPAP` and
`SLE 6000 Oxygen Therapy`. Official evidence shows that HFOV/HFO, NIV, nCPAP
and High Flow Oxygen Therapy are modes or licensed modules. They were not
created as standalone products. The official `SLE6000H`, `SLE6000C` and
`SLE6000N` configurations were represented separately because the manufacturer
explicitly publishes them as variants of the SLE6000 range.

Twenty-eight document candidates were classified conservatively. Trusted
Downloader completed 28 attempts, accepted six logical document versions and
rejected 22. The accepted set contains five unique hashes. One GE compressor
brochure is a resolver false positive and one SLE2000 brochure is represented
twice logically with the same content hash. Four unique hashes are relevant to
the scoped SLE product/accessory evidence.

## Models, configurations, modes and archive status

| Requested item | Classification | Official finding |
| --- | --- | --- |
| SLE 6000 | Current model family | Current SLE6000 product page, brochure, datasheet and IFU found |
| SLE 6000 HFO | Mode check mapped to configuration | HFOV/HFO is a mode/module; `SLE6000H` is the official current configuration |
| SLE 6000 NIV | Mode check mapped to configuration | NIV is a mode; `SLE6000N` is the official non-invasive configuration |
| SLE 6000 NCPAP | Mode | nCPAP is standard/optional depending on H/C/N configuration; no separate product created |
| SLE 6000 Oxygen Therapy | Mode/module | High Flow Oxygen Therapy is standard/optional by configuration; no separate product created |
| SLE 5000 | End-of-life | Official product page remains online; FY25 annual report identifies it as discontinued/end-of-life |
| SLE 4000 | Legacy product page | Official page and manual selector remain online; current commercial status was not inferred |
| SLE 2000 | Legacy, regional | Official GE HealthCare India page states market-dependent availability |
| SLE 1000 | End-of-life | Official page remains online; FY25 annual report identifies it as discontinued/end-of-life |
| SLE 3600 | Archive check | No exact current catalogue entry or public official archive document found |
| SLE 2100 | Archive check | No exact current catalogue entry or public official archive document found |
| SLE 1500 | Current model | Current official product page and product/accessory brochures found |
| SLE6000C | Additional current configuration | Added as discovery because the official range defines it independently |

## Official pages

- [SLE6000](https://inspirationhealthcaregroup.com/product/sle6000/)
- [SLE6000H/C/N range](https://inspirationhealthcaregroup.com/sle6000h-sle6000c-sle6000n/)
- [SLE6000C](https://inspirationhealthcaregroup.com/product/sle6000c/)
- [SLE6000N](https://inspirationhealthcaregroup.com/product/sle6000n/)
- [SLE5000](https://inspirationhealthcaregroup.com/product/sle5000/)
- [SLE4000](https://inspirationhealthcaregroup.com/product/sle4000/)
- [SLE2000 — official GE partner page](https://www.gehealthcare.com/en-in/products/ventilators/sle2000)
- [SLE1000](https://inspirationhealthcaregroup.com/product/sle1000/)
- [SLE1500](https://inspirationhealthcaregroup.com/product/sle1500/)
- [Current neonatal catalogue](https://inspirationhealthcaregroup.com/areas-of-care/acute-care/neonatal/)

The owner site exposes an official manual archive and version selectors. Direct
public manual URLs were used only when an exact official file was found. No
authentication, Partner Net access, robots restriction or service-training
access control was bypassed.

## Document candidates

| Class | Candidates | Notes |
| --- | ---: | --- |
| brochure | 8 | Product, family and accessory brochures |
| datasheet | 3 | SLE6000, SLE6000C and SLE6000N technical specifications |
| ifu | 5 | SLE6000 family manual references and reusable flow-sensor IFU |
| unknown | 12 | Configuration/quick-guide files and conservative resolver results |
| **Total** | **28** | Six were resolver-discovered; the remainder came from official manual seeds |

Documents with unconfirmed automated type remain `unknown` with warnings. The
pipeline was not changed to force a classification from filenames containing
encoded spaces.

## Trusted Downloader and artifacts

| Metric | Result |
| --- | ---: |
| Download attempts | 28 |
| Successful logical downloads | 6 |
| Failed/blocked | 22 |
| Document versions | 6 |
| Unique SHA-256 hashes | 5 |
| Unique product/accessory-relevant hashes | 4 |

Accepted evidence:

1. SLE1500-compatible SLE Essential High Flow Nasal Cannula brochure;
2. SLE2000 official GE partner brochure, represented twice logically with one
   content hash because both manual seed and resolver found the same URL;
3. SLE5000 official GE partner brochure;
4. SLE6000H/C/N `What's included` compatibility/configuration matrix;
5. a GE SLE500 compressor brochure discovered from the SLE2000 page — retained
   in diagnostics as a resolver false positive and excluded from product KPI.

The 22 failures consist primarily of HTTP 403 responses from public
Inspiration Healthcare file URLs. Four GE navigation URLs were rejected because
their response MIME/content was HTML rather than PDF. Trusted Downloader MIME,
magic-byte, size, hashing and version rules were not weakened.

## Category extraction

All model entries used `registry`, `ventilator` and `neonatal`; the products
index used `registry` only.

| Entry | Coverage | Facts / claims | Patterns matched | Normalized units |
| --- | ---: | ---: | --- | --- |
| SLE2000 | 21% | 27 / 27 | display ×4, modes ×2, neonatal ×2, pediatric ×2 | none |
| SLE5000 | 13% | 15 / 15 | modes ×2, neonatal ×2, alarms ×1 | none |
| SLE6000N | 3% | 3 / 3 | NIV ×1 | none |
| SLE1500 | 0% | 2 / 2 | none; document metadata only | none |
| SLE6000, SLE6000H, SLE6000C, SLE4000, SLE1000, SLE3600, SLE2100 | 0% | 0 / 0 | none | none |
| Products index | 0% | 0 / 0 | none | none |

Average extraction coverage is **3%**. No units were normalized. Every
candidate fact retains a source URL, document version, document hash and
locator/evidence reference. Failed fields are recorded per profile; the main
gaps are registry identity, weight, screen, battery, oxygen ranges, pressure
ranges, flow, tidal volume, gas supply, power, humidity and temperature.

The high-value SLE6000 technical documents were found but blocked at download
time, so their page text was not converted into candidate facts. Product-page
marketing text and mode names were not used as evidence substitutes.

## Candidate Claims and Review Queue

| Metric | Result |
| --- | ---: |
| Extracted candidate facts | 47 |
| Candidate claims | 47 |
| Review Items | 47 |
| Pending review | 47 |
| High-priority items | 19 |
| Ready for human review | 29 |
| Missing-evidence references | 18 |
| Conflicts | 0 |
| Entries with Review Items | 4 |

Review Items retain evidence IDs, document version IDs, source URLs, priority
and missing-evidence reasons. No item was automatically approved. The SLE2000
totals include duplicate-document and compressor false-positive metadata and
must be reviewed before any product-level use.

## Compatibility findings

Only explicit official statements were retained:

- the SLE6000 H/C/N matrix defines which ventilation modes, OxyGenie, SpO2,
  EtCO2, IntelliBridge and RS232 features are standard, optional or unavailable
  for each configuration;
- SLE6000 documentation names SLE Miniflow, SLE1000 generator, Infant Flow and
  First Breath interfaces for specific nCPAP modes;
- the SLE Miniflow page explicitly scopes NIPPV, NIPPV Tr and nHFOV use to the
  SLE6000 family;
- the reusable and single-use flow-sensor evidence explicitly names SLE4000,
  SLE5000 and SLE6000;
- the MR850 official owner page explicitly names SLE1000, SLE2000, SLE4000,
  SLE5000 and SLE6000 circuit integration;
- the SLE Essential cannula brochure explicitly names SLE6000H, SLE6000C,
  SLE6000N and SLE1500;
- Medicart and SD30 trolley pages explicitly name supported SLE4000, SLE5000
  and SLE6000 equipment.

Family-level evidence was not copied automatically to every configuration. No
compatibility was inferred from connectors, common purpose, dealer catalogues
or legacy naming, and no structured compatibility record was created by
analogy.

## Evidence-level KPI

| KPI | Result |
| --- | ---: |
| Required items checked | 12 |
| Standalone/configuration model entries | 11 |
| Products-index entries | 1 |
| Official sources | 35 |
| Document candidates | 28 |
| Resolver links | 6 |
| Missing required-document tasks | 28 |
| Download attempts | 28 |
| Logical downloads / versions | 6 / 6 |
| Failed or blocked downloads | 22 |
| Unique hashes | 5 |
| Product/accessory-relevant unique hashes | 4 |
| Candidate facts / claims | 47 / 47 |
| Review Items | 47 |
| Ready for human review | 29 |
| Average extraction coverage | 3% |

## Wave 2 orchestration and Dashboard metrics

`npm run wave2:execute -- SLE` completed all deterministic stages with separate
orchestration-layer metrics:

| Metric | Orchestration result |
| --- | ---: |
| Products/entries | 12 |
| Official sources | 35 |
| Documents | 35 |
| Downloads | 23 |
| Artifacts | 23 |
| Candidate facts | 35 |
| Review Items | 35 |
| Blocked products | 2 |
| Errors | 0 |
| Warnings | 1 |

These numbers are deterministic orchestration estimates and intentionally do
not replace evidence-level downloader/extraction totals. The read-only Dashboard
resolves SLE as `Completed`, 100% progress, 10 ready entries, 2 blocked entries
and one warning.

## Blocked models and missing documents

- **SLE6000, SLE6000H and SLE6000C:** official brochure/datasheet/manual/quick
  guide URLs found, but all attempted artifacts returned HTTP 403.
- **SLE4000:** official flow-sensor IFU returned HTTP 403; the dynamic manual
  selector did not expose a stable public English manual URL.
- **SLE1000:** official page found, but no downloadable product artifact reached
  extraction; product is end-of-life.
- **SLE3600 and SLE2100:** no exact current catalogue entry or official public
  archive document found.
- **SLE1500:** product brochure returned HTTP 403; only the compatible cannula
  brochure downloaded.
- **SLE6000N:** only the family configuration matrix downloaded; its brochure,
  datasheet, manual and quick guide were blocked by HTTP 403.

The products-index entry is also not extraction-ready. SLE2000 and SLE5000 have
downloaded product brochures, but still lack registry evidence and complete
manual/technical coverage.

## Main risks and recommendations before Dixion

1. Owner-site HTTP 403 behavior creates a large gap between discoverable
   official documents and downloadable artifacts. Keep this visible as blocked,
   without weakening Trusted Downloader.
2. Resolver navigation from GE pages can surface product-irrelevant PDFs and
   HTML routes. Review relevance separately from transport validity.
3. Duplicate URLs can create multiple logical document versions sharing one
   hash. Import reporting should continue to expose both logical and unique
   artifact counts.
4. Current, end-of-life, legacy and unconfirmed archive products must remain
   separate states. Do not treat an online legacy page as proof of current sale.
5. For Dixion, establish current official domains, regional aliases and archive
   boundaries before adding model seeds. Record ambiguous model names as
   discovery-only entries and prefer direct official documents with stable URLs.

## Safety confirmation

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No Verification, Publication, Candidate Claim semantics, Review Decisions,
Supabase, public API, Portal, Provider Framework, Resolver, Downloader,
Extraction Profile, Dashboard, Execution Orchestrator or Review Queue logic was
changed. No commit was created.
