# Comen Wave 2 Execution Report

**Task:** MVP-047 — Execute Wave 2 pipeline for Comen
**Scope:** official Comen sources only
**Status:** candidate-only pipeline executed; no verification or publication changes

## Executive summary

All 14 required model names were checked against official Comen global,
regional and Chinese sources and passed through the existing Discovery,
Resolver v2, Trusted Downloader, Category Extraction Profiles, Review Queue,
Wave 2 reports, Import Center and Wave 2 Dashboard data flow. The official
products index remains a separate discovery entry, making 15 pipeline entries.

The current catalogue directly supports N Series (N10/N12/N15 family), K12 Pro,
eCenter-CMS and the NC family. Official legacy pages were found for C30, C60 and
STAR8000. N17, C50, CMS8000, CMS9000, H8 and L8 were checked but are not named
in the current global catalogue evidence used by this run. They remain
discovery-only entries and were not treated as current products.

No public brochure, datasheet, IFU, operator manual, quick guide, software,
accessories document or service manual was linked from the checked official
pages. Resolver v2 returned the same `/RDC/mediaVideo` page for NC8 and
STAR8000; it is an unclassified media endpoint rather than product
documentation. Trusted Downloader attempted both candidates, recorded both as
failed, and created no artifacts. Consequently no candidate facts, claims or
Review Items were created by the detailed evidence pipeline.

## Models checked

| Requested model | Official discovery result |
| --- | --- |
| N10 | Current official N Series page; N10 transport configuration explicitly described |
| N12 | Current official N Series family evidence |
| N15 | Current official N Series family evidence |
| N17 | Not named in the current official patient-monitoring catalogue; discovery-only |
| C30 | Official Spanish legacy product page found |
| C50 | Not named in the current global catalogue; discovery-only |
| C60 | Official Spanish legacy neonatal-monitor page found |
| STAR8000 | Official Chinese product page found; 8000E/F/H family named |
| NC8 | Official Chinese NC Series catalogue explicitly lists NC8/10/12 |
| CMS8000 | Requested legacy name not explicitly named on current eCenter-CMS page |
| CMS9000 | Requested legacy name not explicitly named on current eCenter-CMS page |
| H8 | No exact current official catalogue entry found; discovery-only |
| L8 | No exact current official catalogue entry found; current catalogue exposes L9 and L5 |
| K12 | Current official family evidence resolves the designation to `K12 Pro` |

Additional current official models visible during discovery include K Pro
Series, K22 Pro, K1, NMPro Series, ND Series, NC6/NC7, NC5, NC3, CF5/CF8,
H300/H301 and H1200. They were retained as catalogue-level discovery findings
and were not promoted into model imports.

## Official sources and document status

| Model | Official source | Product document status |
| --- | --- | --- |
| N10, N12, N15 | [N Series](https://en.comen.com/products/NSeries) | Product page found; public PDF classes absent |
| N17, C50 | [Patient Monitoring catalogue](https://en.comen.com/products/category/PatientMonitoring) | Exact model not found; all requested document classes absent |
| C30 | [Official regional page](https://es.comen.com/pages/C30.html) | Product page found; public PDF classes absent |
| C60 | [Official regional page](https://es.comen.com/pages/C60.html) | Product page found; public PDF classes absent |
| STAR8000 | [Official Chinese page](https://www.comen.com/products/STAR8000) | Product page found; resolver media candidate failed and is not a document |
| NC8 | [Official NC Series catalogue](https://www.comen.com/products/category/NCSeries) | Family listing found; resolver media candidate failed and is not a document |
| CMS8000, CMS9000 | [eCenter-CMS](https://en.comen.com/products/ECenterCMS) | Current CMS page found, exact legacy names and public PDFs absent |
| H8, L8 | [Official products catalogue](https://en.comen.com/products) | Exact models and public documents absent |
| K12 Pro | [K Pro Series](https://en.comen.com/products/KPro) | Product family page found; public PDF classes absent |

Document class status for every requested model:

- brochure: absent from public official page links;
- datasheet / technical specification: absent;
- IFU / operator manual / quick guide: absent;
- clinical information: present only as product-page narrative, not a resolved
  downloadable document;
- software: absent;
- accessories: present only as limited page statements for some models, not a
  resolved accessories document;
- compatibility: present only as explicit page statements listed below;
- public service documentation: absent.

## Trusted Downloader and artifacts

Detailed evidence-pipeline result:

- document candidates: 2;
- resolver links: 2;
- download attempts: 2;
- successful downloads: 0;
- failed downloads: 2;
- downloaded artifacts/document versions: 0;
- artifact hashes: 0.

Both candidates point to `https://www.comen.com/RDC/mediaVideo`, are classified
as `unknown`, and returned an unsuccessful response. They are preserved in
generated diagnostics but are not counted as found product documents.

## Category extraction

| Models / entry | Profiles used | Coverage | Patterns matched | Normalized units | Failed fields |
| --- | --- | ---: | --- | --- | --- |
| N10, N12, N15, N17, C30, C50, C60, NC8, STAR8000, K12 Pro | registry + patient-monitor | 0% | none | none | all registry and patient-monitor fields |
| L8 | registry + lighting | 0% | none | none | all registry and lighting fields |
| CMS8000, CMS9000, H8, products index | registry | 0% | none | none | all registry fields |

Average extraction coverage is **0%**. This is expected: no trusted document
artifact reached text extraction. No values or units were synthesized from
product-page prose.

## Compatibility findings

Only explicit official page statements were retained as research findings:

- the C30 page explicitly states that C30 can connect to C70/C90 and operate as
  a plug-in multi-parameter module;
- the N Series page explicitly states central display through eCenter-CMS and
  HL7 V2.6 data exchange;
- the K Pro page explicitly describes central monitoring, HL7/HIS connectivity
  and Klink integration with anesthesia machines, ventilators and infusion
  systems.

No structured compatibility claim was created because no downloadable trusted
document artifact reached extraction. No compatibility was inferred for
CMS8000/CMS9000, N17, C50, H8 or L8, and no family-name analogy was used.

## Candidate Facts → Review Items

Detailed Comen-only evidence totals:

- candidate facts: 0;
- candidate claims: 0;
- Review Items: 0;
- ready for human review: 0;
- conflicts: 0.

The Reviewer Workspace therefore has no new Comen evidence-backed items. No
Review Decision was created or changed.

## KPI

| KPI | Detailed Comen result |
| --- | ---: |
| Required models checked | 14 |
| Discovery index entries | 1 |
| Pipeline entries | 15 |
| Official sources | 15 |
| Document candidates | 2 |
| Resolved links | 2 |
| Required-document gaps | 45 |
| Download attempts | 2 |
| Successful downloads | 0 |
| Artifacts | 0 |
| Candidate facts / claims | 0 / 0 |
| Review Items | 0 |
| Ready for human review | 0 |
| Models without product-relevant downloadable evidence | 14 |
| Average extraction coverage | 0% |

## Import Center and Wave 2 Dashboard

`npm run wave2:execute -- Comen` completed all six deterministic orchestration
stages and produced the following orchestration-layer metrics:

- products/entries: 15;
- official sources: 15;
- documents: 22;
- downloads/artifacts: 15/15;
- candidate facts/review items: 44/44;
- blocked products: 2;
- errors: 0;
- warnings: 2.

These deterministic orchestration metrics are reported separately from the
detailed resolver/downloader/extraction totals above. The detailed reports are
the source of truth for evidence availability: they show zero successful
downloads, zero artifacts and zero extracted facts. The updated Comen summary
is available to the existing Import Center and read-only Wave 2 Dashboard. The
Dashboard resolves Comen as `Completed`, 100% progress, 13 ready entries and 2
blocked entries, with a valid link to this execution report.

## Problems, missing coverage and recommendations

1. Public official product pages do not expose model-specific downloadable
   manuals or brochures for the requested set.
2. The default resolver treats the Chinese site's media navigation endpoint as
   a possible document. Trusted Downloader safely rejects it, but diagnostics
   remain noisy.
3. Several requested names appear to be legacy or ambiguous and are absent from
   the current catalogue: N17, C50, CMS8000, CMS9000, H8 and L8.
4. K12 should retain the official `K12 Pro` designation. STAR8000 evidence must
   retain its explicit 8000E/F/H family qualifiers.
5. A future, separately scoped provider improvement could discover an official
   Comen document library or customer portal if one becomes public. This task
   did not change Provider Framework or resolver logic.

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
Extraction Profile, Dashboard or Execution Orchestrator logic was changed. No
commit was created.
