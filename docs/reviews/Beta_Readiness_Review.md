# CyberMedica Beta Readiness Review

Date: 2026-07-09

Scope: Public Beta readiness audit across Homepage, Search, Catalog, Product
Pages, Knowledge, Compare and Request flow.

Non-goals: no architecture changes, no Import Pipeline changes, no Discovery
changes, no Review Queue changes, no Verification/Publication changes, no
Supabase changes, no API changes and no business-logic changes.

## Executive Summary

| Area | Score | Assessment |
| --- | ---: | --- |
| UX | 82% | Clear core journey, but the catalog/review distinction still needs better public framing. |
| UI | 84% | Mature visual system; minor inconsistency remains in cards, badges and table density. |
| Architecture | 91% | Strong safety boundaries and documentation; beta risk is mostly product-surface maturity. |
| Performance | 78% | Build is healthy; local images/PDFs and client-side widgets require monitoring. |
| Search | 76% | Deterministic MVP works, but index size, filters and typo tolerance are not beta-grade yet. |
| Comparison | 72% | Useful expert prototype, but currently fixed to Hamilton T1 vs C1 and table is heavy on mobile. |
| SEO | 79% | Metadata, robots and sitemap exist; Search/Compare were added to sitemap during this audit. |
| Accessibility | 81% | Labels and focus states are generally present; table/mobile keyboard review remains needed. |
| Code Quality | 83% | Good modularity; some duplicated card/status patterns and tracked-looking platform junk need cleanup. |
| Documentation | 88% | Architecture docs are unusually strong; public beta checklist should be consolidated. |

Overall readiness for Public Beta: **81%**.

CyberMedica is close to a credible Public Beta for a controlled audience. The
product already communicates a serious medical-data platform: evidence
boundaries are documented, request flow is business-like, and the new Search and
Compare prototypes show the intended direction. The main beta risks are not core
architecture, but public-surface clarity: users may still encounter internal
concepts, small mock/prototype seams, limited real data and incomplete navigation
between the new modules.

## Main Strengths

- Strong safety model: Importers, Candidate Claims, Review Queue, Verification
  and Publication remain separated.
- Homepage, Catalog and Request flow now feel coherent and professional.
- Request errors are human-readable and avoid webhook/config leakage.
- `/search` and `/compare` introduce important product workflows without
  touching protected pipelines.
- Documentation covers architecture, evidence, review, decisions, search,
  comparison and real-data enrichment.
- Test suite is healthy and covers safety boundaries.

## Main Risks

- Public users can still see wording that feels internal or unfinished in some
  places: draft catalog states, readiness metrics, mock/report language.
- Search and Compare look product-facing but are still thin pilot surfaces.
- `/admin` exists as a route and must stay hidden in production; beta operations
  need explicit env review.
- Product coverage is limited: one published FS510-style record plus draft and
  pilot data can make the platform feel smaller than the UI promises.
- Mobile behavior of wide comparison tables needs visual QA.

## Audit Notes

### UX Journey

Flow reviewed:

Homepage -> Search -> Catalog -> Product card -> Compare -> Request.

The journey is understandable and commercially plausible. The strongest path is
Homepage -> Request. Search -> Compare is promising but currently prototype-like
because results point to a small pilot index and Compare is fixed to Hamilton T1
vs Hamilton C1.

### UI Consistency

The visual system is mostly stable:

- shared `cm-card`, `cm-field`, `cm-button-*`, `cm-label`;
- consistent canvas/surface/rule tokens;
- professional radius and shadow language.

Remaining inconsistencies:

- Compare table uses denser custom layout than Catalog/Product cards;
- Search badges and Catalog statuses use similar colors for different semantic
  meanings;
- some feature modules duplicate card/badge patterns instead of shared UI
  primitives;
- mobile table density requires manual QA.

### Information Architecture

Navigation includes Catalog, Knowledge, Manufacturers, Request and Search entry.
Search and Compare now exist as product workflows, but Compare is not yet
discoverable from the main navigation. That is acceptable for MVP, but before
Public Beta the intended path to Compare should be clear.

### Terminology

Most customer-facing copy is Russian and business-like. During this audit minor
English/internal labels in Search and Compare were corrected. Remaining risk:
draft catalog and internal review language can still bleed into public
perception if users land on `/catalog/[slug]` without context.

### Search

Current search supports:

- manufacturer;
- model;
- category;
- registration number;
- SKU/article-like fields;
- aliases;
- synonyms;
- abbreviations.

Ranking is deterministic and tested. Limitations: small in-memory index, no
filters, no typo tolerance, no keyboard-layout tolerance and no evidence snippet
preview.

### Comparison

Current comparison supports:

- aligned characteristics;
- missing data;
- unit mismatch detection;
- status mismatch detection;
- source/document/version visibility.

Limitations: fixed product pair, no product picker, no evidence excerpts, no
unit conversion and heavy horizontal table on mobile.

### Catalog

Catalog is useful as an expert workbench, but still exposes readiness and
research concepts that may feel operational rather than commercial. Statuses are
clearer than earlier MVPs, but the “draft vs verified” distinction needs a more
customer-friendly explanation.

### Product / Knowledge Pages

FS510 fallback is calm and non-technical. Published product card has strong
provenance and request CTA. Draft catalog product page is transparent but can
feel unfinished because it shows source quality, candidate-derived counts and
research warnings.

### Performance

Build output is healthy. Risks:

- large local PDFs exist under `public/products/fs510/`;
- product hero image is reasonable but should be checked in Lighthouse;
- Search and Compare add client code but remain small;
- no Lighthouse run was performed in this audit.

### Accessibility

Strengths:

- global `:focus-visible`;
- labels and `sr-only` labels on search/filter fields;
- semantic tables in Compare;
- request form has native labels and validation.

Risks:

- wide Compare table keyboard scrolling on mobile;
- status badges rely partly on color;
- some clickable cards may need stronger accessible names;
- external document links need consistent visible affordance.

### SEO

Metadata, robots and sitemap exist. Robots strategy remains safe:

- default preview: `Disallow: /`;
- `CYBERMEDICA_ALLOW_INDEXING=1`: allow indexing.

During this audit, `/search` and `/compare` were added to sitemap. Remaining SEO
work includes OG image strategy, better page descriptions for draft catalog
items and public beta canonical review.

### Code Quality

The codebase is clean enough for beta. Remaining issues are mostly product
surface debt:

- repeated badge/card/status snippets;
- `.DS_Store` files present on disk and should be excluded/removed if not
  intentionally ignored;
- admin prototype route exists and must remain env-gated;
- Search and Compare mock/report layers should be clearly separated from final
  data surfaces.

### Documentation

Architecture docs are extensive and mostly consistent. The main need is a single
beta launch checklist linking SEO, deployment, robots, admin flags, data
coverage, Search, Compare and request flow.

## Backlog

### Critical

#### C1. Lock production env gates before Public Beta

- Description: `/admin` and `/internal/review-queue` exist and rely on env flags
  for production hiding.
- Impact: accidental exposure would damage trust and reveal internal workflow.
- Recommendation: add deployment checklist verification for
  `CYBERMEDICA_ENABLE_ADMIN`, `CYBERMEDICA_ENABLE_INTERNAL_REVIEW` and
  `CYBERMEDICA_ALLOW_INDEXING`.
- Estimate: 0.5 day.

#### C2. Clarify public data status across Catalog, Search and Compare

- Description: Search/Compare include publication-ready pilot data while Catalog
  contains draft research records.
- Impact: users may mistake prepared or draft data for fully verified public
  medical knowledge.
- Recommendation: add consistent public-facing status vocabulary and microcopy:
  “Опубликовано”, “Готовится к проверке”, “Требуются документы”, “Нет
  подтверждённых данных”.
- Estimate: 1 day.

### High

#### H1. Expand real published product coverage

- Description: Public surface still relies heavily on one FS510 published record
  and pilot/mock Hamilton compare records.
- Impact: product may feel like a polished prototype rather than a market-ready
  platform.
- Recommendation: prepare at least 10-20 product cards with consistent public
  status and evidence links before wider beta.
- Estimate: 3-5 days.

#### H2. Add Compare discovery path

- Description: `/compare` exists but is not discoverable from main navigation or
  product pages.
- Impact: users may miss an important product workflow.
- Recommendation: add a controlled navigation entry or product-page CTA once
  product selection exists.
- Estimate: 0.5-1 day.

#### H3. Improve Compare mobile behavior

- Description: the comparison table is wide and horizontally scrollable.
- Impact: mobile users may struggle to inspect source/document columns.
- Recommendation: add mobile stacked rows or a compact evidence drawer.
- Estimate: 1-2 days.

#### H4. Add Search filters and typo tolerance

- Description: deterministic search works but has no filters or typo handling.
- Impact: beta users may fail to find products due to spelling, layout or
  category ambiguity.
- Recommendation: add manufacturer/category/status filters and conservative typo
  normalization.
- Estimate: 2-3 days.

#### H5. Consolidate status badges

- Description: status colors and labels differ slightly across Catalog, Search,
  Compare and Product pages.
- Impact: users can misread readiness vs verification vs publication.
- Recommendation: create shared public status component and glossary.
- Estimate: 1 day.

#### H6. Run Lighthouse on beta routes

- Description: no Lighthouse run was completed during this audit.
- Impact: performance/accessibility/SEO regressions may be missed before launch.
- Recommendation: run Lighthouse for `/`, `/search`, `/catalog`, `/compare`,
  `/products/fs510`, `/request`.
- Estimate: 0.5 day.

#### H7. Clean public terminology on draft product pages

- Description: draft pages expose source quality, candidate counts and research
  warnings.
- Impact: commercial users may see operational language instead of expert
  confidence.
- Recommendation: translate operational details into “документы”, “источники”,
  “факты на проверке” and hide raw pipeline phrasing.
- Estimate: 1 day.

#### H8. Create beta launch checklist

- Description: production, SEO, data, request and internal-route checks are
  spread across docs.
- Impact: launch can miss a critical flag or data-state condition.
- Recommendation: create a single Public Beta checklist.
- Estimate: 0.5 day.

### Medium

#### M1. Add breadcrumbs to Search and Compare

- Description: Search and Compare pages have no breadcrumb trail.
- Impact: users have fewer orientation cues.
- Recommendation: add simple breadcrumb nav consistent with product pages.
- Estimate: 0.5 day.

#### M2. Add evidence preview to Search results

- Description: Search results show matched fields but not source/evidence
  context.
- Impact: expert users cannot quickly judge why a result is relevant.
- Recommendation: show safe public source summary for published records.
- Estimate: 1-2 days.

#### M3. Add product picker to Compare

- Description: Compare is fixed to Hamilton T1 vs Hamilton C1.
- Impact: workflow feels demo-like.
- Recommendation: add deterministic product selector over allowed comparison
  index.
- Estimate: 2 days.

#### M4. Replace duplicated UI snippets with shared components

- Description: Badge/card/status patterns are repeated in modules.
- Impact: future polish will drift.
- Recommendation: extend existing `components/ui` primitives.
- Estimate: 1-2 days.

#### M5. Add empty-state consistency pass

- Description: empty states are generally good but vary in tone and density.
- Impact: product feels less unified.
- Recommendation: define one empty-state pattern for “no data”, “not found” and
  “not yet checked”.
- Estimate: 0.5-1 day.

#### M6. Add keyboard QA for wide tables and card grids

- Description: focus states exist, but horizontal table and clickable cards need
  manual keyboard review.
- Impact: accessibility regressions may remain hidden.
- Recommendation: test Tab/Shift+Tab/Enter on key routes and document fixes.
- Estimate: 0.5 day.

#### M7. Review external document link behavior

- Description: document links open PDFs directly and external source links open
  new tabs.
- Impact: users may lose context or download large PDFs unexpectedly.
- Recommendation: add consistent labels for PDF/external links and file sizes
  where known.
- Estimate: 1 day.

#### M8. Improve SEO descriptions for generated catalog pages

- Description: catalog product metadata uses a generic description.
- Impact: search snippets may be weak after indexing is enabled.
- Recommendation: include product title/manufacturer/category in metadata.
- Estimate: 0.5 day.

#### M9. Add public beta analytics plan

- Description: no analytics/data collection strategy is documented.
- Impact: beta feedback will be anecdotal.
- Recommendation: define privacy-safe events for search, request CTA and product
  views.
- Estimate: 1 day.

#### M10. Separate pilot/mock data naming from public UI

- Description: docs/code correctly call some data mock/report, but UI should not
  surface prototype language.
- Impact: trust risk if users see “pilot” semantics.
- Recommendation: keep mock naming in code/docs only; use public “подготовленные
  данные” language.
- Estimate: 0.5 day.

### Low

#### L1. Remove `.DS_Store` files from workspace/public folders

- Description: `.DS_Store` files are present on disk.
- Impact: low if ignored, but untidy for beta packaging.
- Recommendation: ensure they are gitignored and remove local copies.
- Estimate: 0.25 day.

#### L2. Reduce mixed English labels in docs/UI over time

- Description: internal docs naturally use English types; UI should remain
  Russian.
- Impact: low, but affects premium feel if it leaks.
- Recommendation: add UI copy scan before launch.
- Estimate: 0.5 day.

#### L3. Normalize card radius in newer modules

- Description: Search/Compare use local card/table styling alongside global
  tokens.
- Impact: small visual drift.
- Recommendation: align with `cm-card` and shared badge primitives.
- Estimate: 0.5 day.

#### L4. Add hover/focus visual QA screenshots

- Description: automated checks pass, but hover/focus polish is visual.
- Impact: small usability polish risk.
- Recommendation: capture desktop/mobile screenshots for key routes.
- Estimate: 0.5 day.

#### L5. Add “last updated” consistency policy

- Description: multiple modules show dates from different sources.
- Impact: users may not know whether date means data, document or page update.
- Recommendation: document and standardize labels.
- Estimate: 0.5 day.

#### L6. Improve sitemap priority tuning after beta data grows

- Description: priorities are reasonable but provisional.
- Impact: low until indexing is enabled.
- Recommendation: revisit after public data coverage expands.
- Estimate: 0.25 day.

#### L7. Add a compact print/export idea to Compare backlog

- Description: procurement users may want offline comparison.
- Impact: low for first beta, useful later.
- Recommendation: plan PDF/CSV export after product picker.
- Estimate: 1-2 days.

#### L8. Consolidate docs index

- Description: documentation is broad and valuable, but discoverability is
  uneven.
- Impact: new contributors may spend time finding the right source.
- Recommendation: create `docs/README.md` linking architecture, production,
  research and roadmap docs.
- Estimate: 0.5 day.

## Small Fixes Applied During Audit

- Replaced public Compare eyebrow `CyberMedica · Compare` with Russian
  `CyberMedica · Сравнение`.
- Replaced public Search eyebrow `CyberMedica · Search` with
  `CyberMedica · Поиск`.
- Replaced visible `Candidate Claims` wording on Compare with
  `Кандидатные факты`.
- Replaced visible `AI` / `Verification` wording on Search with Russian
  customer-facing copy.
- Replaced visible Compare `confidence` label with `надежность`.
- Added `/search` and `/compare` to `app/sitemap.ts`.

## Pre-Beta Recommendation

Public Beta is reasonable after Critical items are checked and at least High
items H1, H3, H4, H5 and H6 are addressed or explicitly accepted as beta limits.
The safest beta positioning is a controlled expert preview: “CyberMedica shows
verified records, draft research states and pilot workflows with clear data
status labels.”

