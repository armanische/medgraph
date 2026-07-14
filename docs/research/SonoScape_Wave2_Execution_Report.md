# SonoScape Wave 2 Execution Report

**Task:** MVP-046 — Execute Wave 2 pipeline for SonoScape
**Scope:** official SonoScape sources only
**Status:** candidate-only pipeline executed; no verification or publication changes

## Executive summary

All 15 required model names were checked through official SonoScape sources and
passed through the existing Discovery, Resolver v2, Trusted Downloader,
Category Extraction Profiles, Review Queue, Wave 2 reports, Import Center and
Wave 2 Dashboard surfaces. The official products index remains a separate
discovery entry, making 16 pipeline entries in total.

Thirteen requested models have a current official product page or a current
catalogue variant. `E7` is absent from the current official catalogue. `S20` is
confirmed by SonoScape's official history, but no current product page was
found. No substitute model or inferred relationship was introduced.

Four public product brochures were found in the official SonoScape Germany
Downloads section: P60, P25/P20, E1 and X3. Resolver v2 also found SonoScape's
site-wide data-protection PDF on every product page. Trusted Downloader accepted
that file because it is an official PDF, but this report treats it as a resolver
false positive rather than product evidence.

## Models checked

| Family | Requested model | Official discovery result |
| --- | --- | --- |
| Endoscopy | HD-350 | Current official image-processor page found |
| Endoscopy | HD-500 | Current official image-processor page found |
| Endoscopy | HD-550 | Current official image-processor page found; official FDA/CE news also confirms the system |
| Trolley ultrasound | P50 | Current official P50 page found |
| Trolley ultrasound | P60 | Current official P60 page and regional brochure found; P60 Exp remains a separate model |
| Trolley ultrasound | P20 | Current official P20 page and P25/P20 regional brochure found; P20 Elite remains separate |
| Trolley ultrasound | P40 Elite | Current official product page found |
| Portable/BW ultrasound | E1 | Current official B/W product page and regional brochure found; E1 Exp remains separate |
| Portable ultrasound | E2 | Current official product page found |
| Portable ultrasound | E3 | Current official product page found; veterinary E3V evidence excluded |
| Portable ultrasound | E7 | Checked against current official catalogue; exact model not listed |
| Portable ultrasound | S8 | Official catalogue currently exposes `S8 Exp`; suffix retained in source evidence |
| Portable ultrasound | S9 | Current official product page found |
| Legacy ultrasound | S20 | Official corporate history confirms S20; no current product page found |
| Portable ultrasound | X3 | Current official product page and regional brochure found; veterinary X3V evidence excluded |

The official discovery index also exposed current models including S80 Elite,
P80 Elite, S80, P80, S70i, P70i, S60, P60 Exp, S50 Elite, P50 Elite, P20 Elite,
X11, E11, X10, E10, X5, iEndo HD-650Exp, HD-330, X-2200 series and X-2600
series. They remain discovery-only findings through the products-index entry and
were not promoted into required-model imports.

## Official sources and documents

| Model | Official product source | Product-relevant public documents | Missing public document classes |
| --- | --- | --- | --- |
| HD-350 | [Product page](https://www.sonoscape.com/en/products/endoscopy/image_processor/2018/0622/51.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, accessories, service manual |
| HD-500 | [Product page](https://www.sonoscape.com/en/products/endoscopy/image_processor/2018/0403/35.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, accessories, service manual |
| HD-550 | [Product page](https://www.sonoscape.com/en/products/endoscopy/image_processor/2019/0403/100.html) | Product page and official clinical/regulatory news only; no downloadable product PDF | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| P50 | [Product page](https://www.sonoscape.com/en/products/ultrasound/trolley_color_doppler/2018/0401/4.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| P60 | [Product page](https://www.sonoscape.com/en/products/ultrasound/trolley_color_doppler/2020/0715/113.html) | [Official regional brochure](https://www.sonoscape.de/uploadfile/2023/0427/20230427103011986.pdf) | IFU, operator manual, quick guide, software, service manual |
| P20 | [Product page](https://www.sonoscape.com/en/products/ultrasound/trolley_color_doppler/2021/0414/128.html) | [Official P25/P20 regional brochure](https://www.sonoscape.de/uploadfile/2023/0427/20230427102717409.pdf) | IFU, operator manual, quick guide, software, service manual |
| P40 Elite | [Product page](https://www.sonoscape.com/en/products/ultrasound/trolley_color_doppler/2023/0110/167.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| E1 | [Product page](https://www.sonoscape.com/en/products/ultrasound/b_w_ultrasound/2018/0402/20.html) | [Official regional brochure](https://www.sonoscape.de/uploadfile/2023/0427/20230427020028981.pdf) | IFU, operator manual, quick guide, software, service manual |
| E2 | [Product page](https://www.sonoscape.com/en/products/ultrasound/portable_color_doppler/2018/0402/13.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| E3 | [Product page](https://www.sonoscape.com/en/products/ultrasound/portable_color_doppler/2018/0402/14.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| E7 | [Official ultrasound catalogue](https://www.sonoscape.com/en/products/ultrasound/) | No exact-model document | all requested document classes |
| S8 | [S8 Exp product page](https://www.sonoscape.com/en/products/ultrasound/portable_color_doppler/2018/0402/16.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| S9 | [Product page](https://www.sonoscape.com/en/products/ultrasound/portable_color_doppler/2018/0402/15.html) | None resolved | brochure, datasheet, technical specification, IFU, operator manual, quick guide, software, service manual |
| S20 | [Official corporate history](https://www.sonoscape.com/en/about/) | No current product document | all requested document classes |
| X3 | [Product page](https://www.sonoscape.com/en/products/ultrasound/portable_color_doppler/2018/0402/12.html) | [Official regional brochure](https://www.sonoscape.de/uploadfile/2023/0427/20230427101658727.pdf) | IFU, operator manual, quick guide, software, service manual |

The public [SonoScape service page](https://www.sonoscape.com/en/service/) exposes
training agendas and describes technical support, upgrades and repair services,
but no public model-specific service manual was available.

## Trusted Downloader and artifacts

Detailed pipeline result:

- document candidates: 20;
- Resolver v2 links: 16;
- download attempts: 20;
- logical downloaded artifacts/document versions: 20;
- failed downloads: 0;
- unique content hashes: 5;
- product-relevant brochure artifacts: 4;
- repeated site-wide data-protection artifacts: 16 logical versions sharing one
  content hash.

The product-relevant artifact set is therefore the four brochures. The privacy
policy is retained in generated diagnostics because removing it would require a
resolver-logic change, which is outside this task. It must not be interpreted as
product documentation.

## Category extraction

| Model | Profiles used | Coverage | Patterns matched | Normalized units | Failed fields summary |
| --- | --- | ---: | --- | --- | --- |
| HD-350 | registry + endoscopy | 0% | none | none | all registry/endoscopy fields |
| HD-500 | registry + endoscopy | 0% | none | none | all registry/endoscopy fields |
| HD-550 | registry + endoscopy | 0% | none | none | all registry/endoscopy fields |
| E1 | registry + ultrasound | 10% | `ultrasound.doppler` | none | registry fields; 3D/4D, channels, elastography, probe ports |
| X3 | registry + ultrasound | 10% | `ultrasound.doppler` | none | registry fields; 3D/4D, channels, elastography, probe ports |
| P20 | registry + ultrasound | 0% | none | none | all registry/ultrasound fields |
| P60 | registry + ultrasound | 0% | none | none | all registry/ultrasound fields |
| P50, P40 Elite, E2, E3, E7, S8, S9, S20 | registry + ultrasound | 0% | none | none | all registry/ultrasound fields |

Average extraction coverage across the 15 requested models is **1%** after
rounding. The products-index entry uses only `registry` and has 0% coverage.
No units were normalized. Extraction created 44 candidate facts/claims; most
are document metadata, not product specifications. Two ultrasound Doppler
patterns came from the E1 and X3 brochures.

## Compatibility findings

Only explicit official statements were retained as research findings:

- the X3 brochure names the L741, 3P-A, 3C-A, 6V1 and C613 transducers and
  describes an optional connector for up to three probes;
- the official dedicated-transducers page declares family-level compatibility
  for named probes across E, X, P and S series, but this was not converted into
  exact-model relationships;
- the P50 product page states compatibility with SonoScape single-crystal
  probes without providing a complete part-number matrix;
- P40 Elite product examples name C1-6, 6V3 and S1-5 probes, but examples were
  not expanded into a universal compatibility claim;
- official HD-550 material explicitly associates the platform with 550-series
  videoscopes; no compatibility was inferred for HD-350 or HD-500 from model
  naming.

No structured compatibility records were created by analogy or family-name
inference.

## Candidate Facts → Review Items

SonoScape-only detailed totals:

- candidate facts: 44;
- candidate claims: 44;
- Review Items: 44;
- pending review: 44;
- ready for human review: 42;
- missing evidence links: 2;
- conflicts: 0;
- products/entries with Review Items: 16.

The queue remains candidate-only. No Review Decision was created or changed.

## KPI

| KPI | Detailed SonoScape result |
| --- | ---: |
| Required models checked | 15 |
| Discovery index entries | 1 |
| Pipeline entries | 16 |
| Official sources | 20 |
| Document candidates | 20 |
| Resolved links | 16 |
| Required-document gaps | 48 |
| Download attempts | 20 |
| Logical downloaded artifacts | 20 |
| Unique artifact hashes | 5 |
| Product-relevant brochures | 4 |
| Candidate facts / claims | 44 / 44 |
| Review Items | 44 |
| Ready for human review | 42 |
| Products with product-relevant downloadable evidence | 4 |
| Requested models without product-relevant downloadable evidence | 11 |
| Average extraction coverage | 1% |

## Import Center and Wave 2 Dashboard

`npm run wave2:execute -- SonoScape` produced deterministic orchestration-layer
metrics:

- products/entries: 16;
- official sources: 20;
- documents: 23;
- downloads/artifacts: 15;
- candidate facts/review items: 46;
- blocked products: 2;
- errors: 0;
- warnings: 2.

These deterministic Import Center metrics are intentionally reported separately
from the detailed discovery/download/extraction totals above. The Wave 2
Dashboard reads the updated SonoScape summary as `Completed`, progress 100%,
ready products 14 and blocked products 2. Overall planned-manufacturer progress
remains 10/10 (100%).

## Problems and missing coverage

1. SonoScape currently falls back to `DefaultProvider`; provider diagnostics
   report no configured manufacturer-specific strategy. Provider Framework was
   not changed in this task.
2. The default resolver classifies the global data-protection PDF as a document
   on every official page. This creates 16 product-irrelevant candidates.
3. Public IFUs, operator manuals, quick guides, software release notes and
   model-specific service manuals were not exposed for the requested models.
4. E7 has no exact current official catalogue entry. S20 is legacy-only in the
   current evidence set. S8 is exposed as S8 Exp and must retain that suffix.
5. Four brochures provide limited profile coverage; registry evidence and
   precise technical data remain missing.
6. Future work should improve SonoScape provider discovery and filter global
   legal PDFs through a separate resolver task, without weakening trust checks.

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
