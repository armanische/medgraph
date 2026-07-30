# Third Product Selection — 2026-07-30

## Decision

The read-only Production audit covered all 77 unpublished Products. No Product
is currently safe to select for the third publication under the approved hard
exclusions: every one has the structural `missing_model` flag. Therefore no
third Product is selected and no revision, review, approval or publication is
authorized by this report.

## Production audit summary

| Check across 77 unpublished Products | Result |
| --- | ---: |
| Stable source UID present | 77/77 |
| Source checksum present | 77/77 |
| Canonical `ru` description rows = 1 | 77/77 |
| Manufacturer, category and application area present | 77/77 |
| Characteristics | 3 for 77/77 |
| Media | 1–4 for 77/77 |
| SEO title and description present | 0/77 |
| `missing_model` structural flag | 77/77 |
| Unresolved critical import errors | 0/77 |
| Editorial warnings | 77/77 (`missing_registration`, `missing_documents`) |

The source UID, slug and checksum are stable provenance fields. The null model
field and `missing_model` flag are not inferred away from a title; they remain a
publication blocker until resolved through the normal editorial workflow.

## Scoring method

Scores use the requested 100-point rubric. Canonical Russian content, stable
provenance and three characteristics receive full points where observed. Media
receives 15 points for at least two media items and 10 for one item. SEO receives
0 while both SEO fields are absent. Structural readiness receives 0 while
`missing_model` remains true. Commercial priority is a curation judgement based
on launch-category diversity and recognizable equipment, not a verified Product
fact.

## Shortlist of five blocked candidates

| Product | Model | Manufacturer | Production Product ID | Source UID | Slug | Source checksum | Canonical ru | SEO | Media | Characteristics | Structural blockers | Warnings | Score | Effort | Commercial priority |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- | ---: | ---: | --- | --- | ---: | --- | --- |
| Портативный монитор пациента BeneVision N1 | — | Mindray | `f61a0496-0434-41ab-8ca3-0f79c19ab0aa` | `159912360691` | `767632362-159912360691-portativnii-monitor-patsienta-benevision` | `191a5ecdae83c75852f637378b4b2a7bab9bb200b261d37079c17048db5bc73c` | 1 | absent | 4 | 3 | `missing_model` | `missing_registration`, `missing_documents` | 75 | S* | High |
| Шприцевой насос Fresenius Kabi Agilia SP MC | — | Fresenius Kabi | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` | `865619140091` | `767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia` | `521684120f9b21884e5cc05d11ae84de5d3692695ac2b228c8cc044f5b07ec19` | 1 | absent | 2 | 3 | `missing_model` | `missing_registration`, `missing_documents` | 75 | S* | High |
| Видеоэндоскопическая система Olympus CV-190 PLUS EVIS EXERA III | — | Olympus | `4e1a370b-4e53-4ee6-b590-823d1ad0e087` | `304432044232` | `767632362-304432044232-videoendoskopicheskaya-sistema-olympus-c` | `bb2cbbdc8e43fd472e59086f2d53f4c65b86d5943796f8bd972af4a373144eb1` | 1 | absent | 2 | 3 | `missing_model` | `missing_registration`, `missing_documents` | 75 | S* | High |
| Экспертный узи-аппарат Logiq E9 GE | — | GE HealthCare | `c8e51a0f-e969-4740-9f21-4af1110d2a46` | `975456539101` | `767632362-975456539101-ekspertnii-uzi-apparat-logiq-e9-ge` | `1e2e927e501576715462b7911ae794912513c67014260f17501cc8955be9d104` | 1 | absent | 1 | 3 | `missing_model` | `missing_registration`, `missing_documents` | 70 | S* | High |
| Узи-аппарат Canon Aplio i700 | — | Canon Medical | `66b45c69-47b9-4371-ae81-8aff1f3e5685` | `730259716752` | `767632362-730259716752-uzi-apparat-canon-aplio-i700` | `8b2f9025d986bd0e9729b70f7ed2f4ae9483de436a50339e0abf344689c3fe14` | 1 | absent | 1 | 3 | `missing_model` | `missing_registration`, `missing_documents` | 70 | S* | High |

`S*` means approximately up to two hours after the model field is resolved;
the current blocker makes the item ineligible for immediate review/publication.

## Third Product for Publication

**Not selected.** Selecting any of the five would violate the hard exclusion
against a structural blocker. The first safe next step is a normal content
preparation task that resolves `missing_model` for one chosen candidate from an
authoritative source, then regenerates SEO from confirmed facts. Only after that
can the abbreviated lifecycle be run:

```text
model/content patch → immutable revision → Human Review → Approval → Publication
```

No source research, media substitution, regulatory interpretation, revision,
review, approval or publication was executed in this audit.

## Invariance

After the audit: Products 79, Published 2, Unpublished 77; Hamilton-T1 and
Mindray SV300 remained unchanged; no new revision, decision, approval or batch
was created; Product writes = 0; sitemap Product URLs = 2; ENV, DNS and
migrations were unchanged; RFQ records were unchanged.

## Launch-blocking status

The missing model field is the only common structural blocker observed. The
registration and document gaps are warnings, not blockers, under Publication
Policy v2. This report does not weaken the structural contract.
