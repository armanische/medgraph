# Homepage MVP Acceptance Review v1

## 1. Executive Summary

**Verdict: CHANGES REQUIRED.**

Homepage MVP commit `96351656ceee2c6d22f956cacff286241d080336` is reproducible, limited to the approved Homepage scope, passes the complete local QA suite, and is deployed as a healthy Vercel Preview. The primary user journeys work: search, category and manufacturer entry, Catalog, Product Detail, Request flow, responsive layout, and keyboard navigation.

The implementation is not ready to merge because three approved requirements are not met:

1. a failure of one overview data source is not isolated from Hero and Search;
2. Homepage section headings do not use the approved responsive H2 scale;
3. primary mobile controls do not meet the specified 44 × 44 CSS px minimum target.

No runtime, data, migration, Supabase, Cloud Catalog, `main`, or Production changes were made during this review.

## 2. Scope

- Baseline: `2ef6a576fc19352f5971bf3ac756360220093b1c`.
- Reviewed implementation branch: `codex/homepage-mvp-implementation-v1`.
- Reviewed implementation commit: `96351656ceee2c6d22f956cacff286241d080336`.
- Review branch: `codex/homepage-mvp-acceptance-review-v1`.
- Product requirements: `docs/00-product/homepage-mvp-specification.md`.
- Design requirements: `docs/03-ux/homepage-mvp-design.md`.
- Reviewed Preview: `https://medgraph-3vgy8txch-medgraph.vercel.app`.
- Verification date: 2026-07-24, Europe/Moscow.

Verification only. The sole review change is this report.

## 3. Git Scope Verification

| Check | Result |
| --- | --- |
| Review base | Exact implementation commit `96351656ceee2c6d22f956cacff286241d080336` |
| Merge base with baseline | Exact baseline `2ef6a576fc19352f5971bf3ac756360220093b1c` |
| Implementation diff | 19 files, 2,117 insertions, 562 deletions |
| Homepage runtime | 7 files |
| Tests | 9 files |
| Specification/design/evidence docs | 3 files |
| Product Detail runtime | No changes |
| Structured Fields runtime/migrations | No changes |
| Supabase, Product Data, Cloud Catalog, ADR | No changes |
| Credentials/generated recovery artifacts | None |

The implementation is a direct descendant of Launch Baseline v1 and contains only Homepage-related runtime, tests, and approved documentation.

## 4. Specification Traceability

| Product requirement | Evidence | Result |
| --- | --- | --- |
| Exactly five blocks in approved order | DOM: Hero → Categories → Manufacturers → Why CyberMedica → Final CTA; contract tests | PASS |
| Homepage is a catalog entry, not a marketing landing page | Search-first Hero, no marketing illustration, no product carousel or extra section | PASS |
| Search accepts name, model, manufacturer, and category | Eight acceptance cases, including Cyrillic, Latin, whitespace trim, empty, and zero-result | PASS |
| Categories use real public data | 6 deterministic top categories; counts 16/10/8/7/6/4 | PASS |
| Manufacturers use real public data | 8 deterministic manufacturers; links open canonical manufacturer pages | PASS |
| Four approved advantages | Exact four approved, static, non-interactive cards | PASS |
| Final CTA hierarchy | Primary Catalog, secondary Request | PASS |
| Empty sections fail closed | Both dynamic section components return `null` on empty input | PASS |
| Hero/Search survive an overview failure | `Promise.all` at `app/page.tsx:29` rejects the entire route; global error replaces Homepage | **FAIL — IMPORTANT-001** |
| No fabricated data | No mocks, hardcode products, local JSON, or fallback entities | PASS |

**Specification result: PARTIAL PASS; corrective work required for failure isolation and mobile target sizing.**

## 5. Design Traceability

| Design requirement | Observed Preview | Result |
| --- | --- | --- |
| Single-column Hero, no illustration | Single content column and approved gradient | PASS |
| H1 48 / 40 / 34 px | 48 / 40 / 34 px | PASS |
| H2 30 / 26 / 24 px | 21.6 px at desktop, tablet, and mobile for three overview headings | **FAIL — IMPORTANT-002** |
| Search: row desktop/tablet, stack mobile | Correct at 1440, 768, and 390 px | PASS |
| Grids 3/2/1, 4/2/1, 4/2/1 | Correct at tested breakpoints | PASS |
| No horizontal overflow | None at 1440, 1280, 1024, 768, 430, 390, or 360 px | PASS |
| Main touch targets ≥44 px | Main mobile buttons/CTA links measured 42 px; input itself 24 px inside a 52 px wrapper | **FAIL — IMPORTANT-003** |
| Existing icon language only | Homepage defines a new inline magnifier instead of reusing the Catalog search glyph | MINOR-001 |
| Existing card/button/surface language | Existing `cm-*` primitives and tokens are reused | PASS |

**Design result: CHANGES REQUIRED.** Final visual composition is coherent, but measurable typography and control-size contracts are not met.

## 6. Homepage Content Review

### Hero

- One H1: `Медицинское оборудование для клиник и медицинских организаций`.
- Approved supporting copy, visible search label, Search submit, and Catalog CTA.
- No Request CTA, stats, badge, product image, or marketing illustration in Hero.
- Search is the strongest first-screen action.

### Featured Categories

- Six real categories, ordered deterministically by product count and name.
- Text-first cards; no invented image or taxonomy.
- Valid canonical Catalog query routes.

### Manufacturers

- Eight real manufacturers with country, count, and canonical route.
- Existing `ManufacturerMark` is reused; absent logos fail closed to the existing neutral mark.
- No official-partner or unverified trust claims.

### Advantages

- Exactly four approved messages.
- Numeric markers, no invented icons, no CTA, and no interactive hover lift on static cards.

### Final CTA

- Approved copy and action order.
- `Перейти в каталог` is primary; `Запросить КП` is secondary.

## 7. Search Acceptance

| Case | Result |
| --- | --- |
| Latin manufacturer: `Hamilton` | `/catalog?q=Hamilton`, 3 results |
| Latin manufacturer: `Mindray` | `/catalog?q=Mindray`, 16 results |
| Cyrillic category intent: `эндоскоп` | Catalog results rendered |
| Category name: `Аппараты ИВЛ` | Query delegated to Catalog |
| Model: `SV300` | 1 result |
| Whitespace: `  Hamilton  ` | Trimmed to `/catalog?q=Hamilton` after hydration |
| Empty/space-only submit | No navigation; field retains focus; no red error |
| Zero result | `/catalog?q=несуществующая-модель-xyz`; recoverable empty result, no runtime error |

Search uses the existing Catalog query contract and does not add autocomplete, suggestions, or a parallel result model.

## 8. Category Navigation

Three independent Homepage entries were verified:

| Category | URL | Result count | Result |
| --- | --- | ---: | --- |
| УЗИ-системы | `/catalog?category=ultrasound-systems` | 16 | PASS |
| Фетальные мониторы | `/catalog?category=fetal-monitors` | 10 | PASS |
| Аппараты ИВЛ | `/catalog?category=ventilators` | 4 | PASS |

Catalog selected state and canonical URL parameters matched the clicked Homepage card.

## 9. Manufacturer Navigation

Three independent Homepage entries were verified:

| Manufacturer | URL | Products | Result |
| --- | --- | ---: | --- |
| Mindray | `/manufacturers/mindray` | 16 | PASS |
| DIXION | `/manufacturers/dixion` | 10 | PASS |
| GE HealthCare | `/manufacturers/ge-healthcare` | 9 | PASS |

Each route displayed the canonical manufacturer page and real product links. Homepage intentionally links to Manufacturer pages, as required by the approved specification, rather than inventing manufacturer filters.

## 10. Conversion Flow

- Homepage Search → Catalog → Product Detail: PASS.
- Homepage Category → Catalog → Product Detail: PASS.
- Homepage Manufacturer → Manufacturer page → Product Detail: PASS.
- Final CTA → `/request`: HTTP 200, canonical request form present; no form submitted.
- Product Detail Request CTA preserves the product query: PASS.
- Catalog → Hamilton-T1 → Back to Catalog restored full URL, query `Hamilton`, category `ventilators`, sort `name-desc`, and captured click-time scroll position.
- No dead `href="#"`, nested controls, or alternative request workflow was found.

## 11. Responsive Review

| Viewport | Categories | Manufacturers | Advantages | Overflow | Result |
| --- | ---: | ---: | ---: | --- | --- |
| 1440 × 900 | 3 columns | 4 columns | 4 columns | None | PASS |
| 1280 × 900 | 3 | 4 | 4 | None | PASS |
| 1024 × 900 | 3 | 4 | 4 | None | PASS |
| 768 × 1024 | 2 | 2 | 2 | None | PASS |
| 430 × 932 | 1 | 1 | 1 | None | PASS with target-size finding |
| 390 × 844 | 1 | 1 | 1 | None | PASS with target-size finding |
| 360 × 800 | 1 | 1 | 1 | None | PASS with target-size finding |

Product Detail and Catalog were also verified at 390 px with one H1 and no horizontal overflow. Category description clipping is the intentional two-line card contract, not accidental overflow.

## 12. Accessibility Review

- Semantic landmarks: global banner/navigation, one main, labelled regions, and contentinfo: PASS.
- One H1 and logical H1 → H2 → H3 structure: PASS.
- Search form has `role=search`, explicit label, named input, and named submit: PASS.
- All Homepage images have meaningful alt text; decorative SVG is `aria-hidden`: PASS.
- Nested interactive elements: 0.
- Ten-step keyboard traversal reached Header, Search, submit, Catalog CTA, and section navigation in logical order.
- Every sampled focused control displayed a visible 2 px outline.
- Main mobile control target minimum: FAIL; see IMPORTANT-003.
- No browser console accessibility/runtime warnings were emitted.

## 13. Performance Review

| Signal | Result |
| --- | --- |
| Homepage server response | HTTP 200; TTFB 1.234 s; total 1.714 s on uncached read-only probe |
| Initial Homepage HTML/RSC response | 684,310 bytes |
| Baseline comparison | Request route 648,121 bytes; Homepage incremental response cost about 36 KB |
| Browser-observed assets | 12 scripts, 2 stylesheets, 2 images; no Homepage product images |
| Homepage client boundary | Search only; all other Homepage sections are server-rendered |
| Data requests | One parallel call each to Product, Manufacturer, and Category services; one pass over products; no N+1 |
| Product Detail preload on Homepage | None |
| Console/hydration errors | 0 |
| Lighthouse/LCP/CLS | N/A: no Lighthouse dependency or browser performance-entry capability is available in the approved review environment; no package was installed |

The large common server response is baseline/runtime overhead rather than a Homepage-only payload regression. No blocking performance regression was found.

## 14. Loading / Empty / Error States

- Empty Categories and Manufacturers arrays hide their complete sections: PASS.
- Zero-result Catalog search provides a recoverable public state: PASS.
- Global error boundary hides technical details and offers retry: PASS at page level.
- No artificial delay or spinner was introduced: PASS.
- The approved partial-failure contract is not implemented: `Promise.all` couples all three service calls and the existing generic full-page loader/error boundary replaces Hero/Search. This is IMPORTANT-001.
- Geometry-matched section skeletons are optional only when a streaming boundary exists; no artificial streaming boundary is required. The blocking issue is failure isolation, not absence of an artificial skeleton.

## 15. Regression Verification

### Catalog

- HTTP 200; 79 products, 25 manufacturers, 19 categories, 7 application areas.
- Search, filtering, sorting, empty state, cards, and mobile layout: PASS.
- URL/query/sort/category and click-time scroll restoration: PASS.

### Product Detail — Hamilton-T1

- HTTP 200; one H1; Summary, Description, Gallery, Manufacturer, Breadcrumbs: PASS.
- Gallery has 3 images; Lightbox opens and closes with Escape: PASS.
- Back to Catalog and Back to Top: PASS.
- Advantages and Technical Specifications remain fail-closed: PASS.
- Desktop/mobile overflow: none.

### Structured Fields

`npm run qa:structured-fields:local` PASS:

- migration count: 14;
- immutable revision and canonical hash checks;
- stale approval rejection and product identity binding;
- service-only writer and idempotent retry;
- legacy-row isolation;
- published-only projection;
- exact and idempotent rollback;
- unrelated product preservation;
- RLS and grants;
- post-test rows: 0;
- remote connections: 0.

No Structured Fields were published to Hamilton-T1.

## 16. Full QA

| Command | Result |
| --- | --- |
| `npm test` | PASS — 409/409 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `npm run qa:structured-fields:local` | PASS — 14 migrations, remote connections 0 |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

## 17. Preview Verification

- URL: `https://medgraph-3vgy8txch-medgraph.vercel.app`.
- Branch alias: `https://medgraph-git-codex-homepage-mvp-implementation-v1-medgraph.vercel.app`.
- Deployment ID: `dpl_HcJPwrDZjfpDb6ihSuJXiogn3gfX`.
- Environment: Preview.
- Status: READY.
- Created: 2026-07-24 00:36:40 MSK.
- Build source: branch `codex/homepage-mvp-implementation-v1`, commit `9635165`.
- Homepage, Catalog, Hamilton-T1, Mindray, Request: HTTP 200.
- Security/cache headers: `x-robots-tag: noindex, nofollow` on Homepage/Catalog/Product/Manufacturer; `cache-control: private, no-cache, no-store`.
- Browser console errors: 0; warnings: 0.

## 18. Findings

### BLOCKING — 0

No runtime crash, data corruption, security regression, or Preview blocker was found.

### IMPORTANT — 3

#### IMPORTANT-001 — Overview service failures can replace Hero and Search

- Invariant: Hero, Search, and the general Catalog CTA must remain available when one overview block lacks valid data.
- Evidence: `app/page.tsx:29-33` awaits products, manufacturers, and categories in one `Promise.all`; the only route fallback is the generic page-level loading/error boundary in `app/loading.tsx` and `app/error.tsx`.
- Local result: empty arrays fail closed correctly, but a rejected overview service has no section boundary and rejects the entire Homepage render.
- Impact: a transient Category or Manufacturer failure removes the primary catalog entry rather than degrading one overview section.
- Minimum corrective direction: isolate overview reads/sections so Hero/Search always render; keep public, compact section-level failure behavior where architecture supports it.

#### IMPORTANT-002 — Homepage H2 typography does not match the approved scale

- Invariant: H2 must be 30 px desktop, 26 px tablet, and 24 px mobile.
- Evidence: overview headings use `.cm-section-title` in `components/home/Categories.tsx`, `FeaturedManufacturers.tsx`, and `WhyCyberMedica.tsx`; `app/globals.css:114-120` fixes it at 1.35rem.
- Preview measurement: 21.6 px at 1440, 768, and 390 px. Final CTA alone reaches 30/24 px.
- Impact: the three main overview sections lose the approved information hierarchy and differ from the specified visual contract.
- Minimum corrective direction: apply the approved responsive H2 scale to Homepage section headings without changing global Product Detail/Catalog typography.

#### IMPORTANT-003 — Primary mobile controls miss the 44 px target minimum

- Invariant: all main actions must be at least 44 × 44 CSS px.
- Preview measurement at 430/390/360 px: Search submit, Hero Catalog CTA, section footer CTAs, and Final CTA links are 42 px high; the actual search input is 24 px high inside a 52 px visual wrapper.
- Impact: the accepted mobile accessibility and touch contract is not met, despite otherwise correct focus behavior.
- Minimum corrective direction: make the interactive element itself at least 44 px high; preserve the specified 56 px Search row and 48 px Final CTA sizing.

### MINOR — 1

#### MINOR-001 — Homepage introduces a separate inline search SVG

- Design requires reuse of the existing Catalog search icon only and prohibits a new icon family/asset.
- `components/home/Search.tsx:6-18` defines a new inline magnifier while Catalog uses its established search glyph.
- Impact is limited because the icon is familiar, decorative, and accessible; consolidate it during the corrective pass.

### ACCEPTED — 4

1. No analytics provider was added; the product specification explicitly treats KPI instrumentation as a separate task.
2. The Cloud Catalog Preview banner is environment-only, protected by Preview noindex/no-store behavior, and is not Homepage content.
3. No artificial streaming/skeleton delay was added; the design forbids it when data is server-rendered before first paint.
4. Lighthouse scores are N/A because the approved dependency set contains no Lighthouse runner; equivalent HTTP, bundle-asset, responsive, console, and architecture evidence was recorded without changing dependencies.

## 19. Verdict

**CHANGES REQUIRED**

Reason: `BLOCKING = 0`, but `IMPORTANT = 3`. The implementation is functionally stable and reproducible, yet it does not satisfy all mandatory product/design acceptance criteria.

## 20. Product Approval

**CHANGES REQUIRED**

The five-block product concept, content, navigation, and conversion path are approved. Final Product approval is withheld only for the three bounded corrective items above.

## 21. Merge Recommendation

**NOT READY FOR MERGE**

Do not merge `96351656ceee2c6d22f956cacff286241d080336` into `main` until IMPORTANT-001 through IMPORTANT-003 are corrected and re-reviewed.

## 22. Release-Readiness Recommendation

**NOT READY**

Runtime regression, security, and data checks pass, but the Homepage acceptance gate remains open.

Production invariance:

- `origin/main`: unchanged at `2ef6a576fc19352f5971bf3ac756360220093b1c`.
- `origin/production`: unchanged at `66b0f97b0d37fc6fef808833a1a90b415975d5de`.
- Production deployment: unchanged `dpl_7z3WatNfSCm3dZ1ZCdoGJZ9Ybq9E`, READY, created 2026-07-16 15:42:55 MSK.
- No Production deployment, environment change, Supabase/Cloud write, migration, publication, Product Data change, or Hamilton approval occurred.

## 23. Exact Next Task

**Homepage MVP Corrective Fix v1**

Scope only:

1. isolate overview data failures while keeping Hero/Search available;
2. implement the approved Homepage H2 scale;
3. make mobile interactive targets at least 44 px;
4. reuse the established Catalog search icon treatment;
5. repeat this acceptance gate without adding features or changing data.
