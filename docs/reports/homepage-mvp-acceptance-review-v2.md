# Homepage MVP Acceptance Review v2

**Date:** 2026-07-24

**Review branch:** `codex/homepage-mvp-acceptance-review-v2`

**Reviewed commit:** `64e5029310135fb462346ec8d99db30a1da5eb63`

**Preview:** `https://medgraph-icur1bjvg-medgraph.vercel.app`

**Deployment:** `dpl_2xHADcwzxQQtnj9Zt4cobMrwsaS9`

## 1. Executive Summary

**Verdict: CHANGES REQUIRED.**

The corrective implementation is reproducible and the exact Preview is healthy. Error isolation, the responsive H2 scale, and the original Search icon finding are independently verified. Full local QA passes with 415/415 tests, both Next.js builders, and the disposable Structured Fields integration harness with 14 migrations and zero remote connections.

One original IMPORTANT acceptance invariant is still not satisfied. At 430, 390, and 360 px, visible global Header controls on the Homepage remain below the required 44 × 44 CSS px target minimum. The measured heights are 34.3 px for the logo link, 42 px for `Запросить КП`, 32.5 px for the mobile Catalog and Manufacturer links, and 40 px for mobile Search. Because the v2 gate explicitly includes visible Header controls, IMPORTANT-003 is **FAIL**.

Two new non-blocking Design findings were also recorded: mobile-only section footer actions remain visible on tablet/desktop because the global button primitive overrides `sm:hidden`, and Search/Final CTA controls use 44 px where Design v1 specifies 48 px. No implementation was changed during this review.

| Classification | Count |
| --- | ---: |
| BLOCKING | 0 |
| IMPORTANT | 1 |
| MINOR | 2 |
| ACCEPTED | 4 |

## 2. Scope

The review was performed in a separate worktree created from the exact corrective commit. Scope was limited to:

- Git ancestry and corrective diff;
- the normative Product and Design specifications;
- local failure-isolation and regression contracts;
- the exact automatic Vercel Preview;
- read-only Homepage, Catalog, Product Detail, Manufacturer, Request, responsive, accessibility, performance, and security checks.

No runtime, UI, tests, Specification, Design, Product Detail, Catalog, Structured Fields, migrations, Product Data, Cloud Catalog, Supabase, `main`, `production`, or Vercel environment was changed. No form was submitted and no remote write was made.

## 3. Git Scope Verification

| Check | Result |
| --- | --- |
| Review base | PASS — HEAD is `64e5029310135fb462346ec8d99db30a1da5eb63` |
| `origin/main` | Unchanged at `2ef6a576fc19352f5971bf3ac756360220093b1c` |
| `origin/production` | Unchanged at `66b0f97b0d37fc6fef808833a1a90b415975d5de` |
| Working tree before report | Clean |
| Corrective ancestry | Linear: `b247d72` → `53fa3af` → `64e5029` |
| Published history | Not rewritten; CSS override correction is a separate minimal commit |
| Corrective diff | 13 files, 773 insertions, 117 deletions |
| Product Detail / Structured Fields / migrations | Absent from corrective diff |
| Product Data / Cloud Catalog | Absent from corrective diff |
| Credentials / generated artifacts | No matching secrets, data directories, build output, or credential assignments |

The corrective report accurately describes the implementation diff. Its statement that Homepage controls received explicit 44 px minimums is accurate for the Homepage content components; it does not establish compliance for the visible global Header, which is outside that diff but explicitly inside the v2 acceptance measurement.

## 4. Findings v1 Re-Review Matrix

| Finding v1 | Corrective evidence | Runtime evidence | Result |
| --- | --- | --- | --- |
| IMPORTANT-001 — overview failures replace Hero/Search | `loadHomepageOverviewSources()` settles the three reads independently; nullable Categories and Manufacturers have local fail-closed states | Seven local scenarios pass, including simultaneous failure and retry success | **PASS** |
| IMPORTANT-002 — H2 scale differs from 30/26/24 | All four section H2 use `text-2xl sm:text-[26px] lg:text-[30px]` | Computed styles are 30 px at 1440/1280/1024, 26 px at 768, and 24 px at 430/390/360; no clipping | **PASS** |
| IMPORTANT-003 — mobile controls below 44 px | Homepage content controls have explicit 44 px minimums | Main controls are at least 44 px, but visible Header controls measure 32.5–42 px on all three required mobile widths | **FAIL** |
| MINOR-001 — separate Search SVG | Homepage Search uses the same `⌕` symbol as Catalog and contains no SVG | Symbol is decorative, aligned, non-focusable, and Search keeps its label and behavior | **PASS** |

Original findings result: **IMPORTANT 2/3 PASS, 1/3 FAIL; MINOR 1/1 PASS.**

## 5. Specification Traceability

| Requirement | Evidence | Result |
| --- | --- | --- |
| Homepage is an entry into Catalog | Search, Hero Catalog CTA, Categories, and Final CTA use public Catalog routes | PASS |
| Homepage → Catalog → Product Detail → Request | End-to-end Preview flow reaches a product-specific Request URL and returns safely | PASS |
| Exactly five approved sections | Hero, Categories, Manufacturers, Advantages, Final CTA in normative order | PASS |
| Search-first Hero | One H1, supporting copy, visible label, Search before secondary Catalog CTA | PASS |
| Six categories | Six active, count-ranked categories from Storefront services | PASS |
| Eight manufacturers | Eight active, count-ranked manufacturers from Storefront services | PASS |
| Four advantages | Exactly four approved static benefit cards | PASS |
| Final CTA | Catalog primary, Request secondary, both working | PASS |
| No Popular Products | No product cards on Homepage | PASS |
| No Application Areas block | No standalone Application Areas section | PASS |
| Fail-closed overview rendering | Independent error states; empty arrays hide the corresponding section; no fabricated cards | PASS |
| Desktop/tablet/mobile contract | Grids and overflow pass; visible Header targets fail the mandatory 44 px minimum | PARTIAL |
| KPI/analytics contract | Metrics and safe event vocabulary remain specified; implementation is intentionally a separate task and no provider was introduced | NOT APPLICABLE |
| Product Detail / Structured Fields / Cloud Catalog invariance | No related files in corrective or review diff; regression QA passes | PASS |

**Specification result: PARTIAL** because its mandatory minimum target-size invariant is not satisfied.

## 6. Design Traceability

| Design area | Runtime result |
| --- | --- |
| Five-section order | PASS |
| Hero and Search-first hierarchy | PASS |
| No marketing illustration | PASS |
| Category grid 3/2/1 | PASS |
| Manufacturer grid 4/2/1 | PASS |
| Advantage grid 4/2/1 | PASS |
| Existing `cm-*` cards, buttons, colors, spacing | PASS |
| Final CTA visual priority | PASS |
| H2 30/26/24 | PASS |
| Hover/focus/active | PASS for sampled cards and controls; keyboard focus uses a visible 2 px outline |
| Loading | NOT APPLICABLE — no artificial streaming boundary or delay is required |
| Empty and recoverable section states | PASS through local fixtures/contracts |
| Mobile Header target sizes | FAIL — see IMPORTANT-001 |
| Responsive all-items actions | PARTIAL — desktop/tablet show both header link and mobile full-width button |
| Exact Search and Final CTA heights | PARTIAL — 44 px where Design specifies 48 px |

**Design result: PARTIAL.** Core composition and grids comply, but the mandatory target-size rule and two responsive dimensions do not.

## 7. Error Isolation Results

The existing safe loader contract was exercised without remote data changes.

| Scenario | Hero / Search / Final CTA | Overview result | Result |
| --- | --- | --- | --- |
| Categories failure | Remain unconditional in page composition | Categories `null`, Manufacturers preserved | PASS |
| Manufacturers failure | Remain unconditional | Manufacturers `null`, Categories preserved | PASS |
| Categories + Manufacturers failure | Remain unconditional | Both local fallbacks; no page-level rejection | PASS |
| Categories empty | Remain unconditional | Categories section omitted | PASS |
| Manufacturers empty | Remain unconditional | Manufacturers section omitted | PASS |
| Partial data | Remain unconditional | Successful sources preserved independently | PASS |
| Retry success | Native GET retry; first result `null`, second result valid | Recovery succeeds without fabricated data | PASS |

Focused corrective tests: **6/6 PASS**. Independent scenario assertions: **7/7 PASS**. No technical error details or false entities are rendered.

## 8. Typography Results

| Viewport | Expected H2 | Computed H2 | Line-height / clipping | Result |
| --- | ---: | ---: | --- | --- |
| 1440 × 900 | 30 px | 30 px | 36 px / none | PASS |
| 1280 × 800 | 30 px | 30 px | 36 px / none | PASS |
| 1024 × 768 | 30 px | 30 px | 36 px / none | PASS |
| 768 × 1024 | 26 px | 26 px | 31.2 px / none | PASS |
| 430 × 932 | 24 px | 24 px | 28.8 px / none | PASS |
| 390 × 844 | 24 px | 24 px | 28.8 px / none | PASS |
| 360 × 800 | 24 px | 24 px | 28.8 px / none | PASS |

All four Homepage H2 follow the same scale. H1 remains unchanged, and wrapped headings are content-driven rather than clipped.

## 9. Mobile Touch Target Results

Homepage content targets meet the 44 px accessibility floor at 430, 390, and 360 px:

- Search input: 44 px;
- Search submit: 44 px;
- Hero Catalog CTA: 44 px;
- Category and Manufacturer cards: at least 96/124 px high;
- section footer links: 44 px;
- Final CTA actions: 44 px.

Visible Header targets do not:

| Header control | Computed height at 430/390/360 | Expected | Result |
| --- | ---: | ---: | --- |
| Homepage logo link | 34.3 px | ≥44 px | FAIL |
| `Запросить КП` | 42 px | ≥44 px | FAIL |
| Mobile `Каталог` | 32.5 px | ≥44 px | FAIL |
| Mobile `Производители` | 32.5 px | ≥44 px | FAIL |
| Mobile `Поиск` | 40 px | ≥44 px | FAIL |

No overlap or horizontal overflow was observed. Focus remains visible, but target geometry is an explicit acceptance invariant. **Mobile touch target result: FAIL.**

## 10. Search Icon Result

**PASS.** Homepage and Catalog use the existing `⌕` symbol. Homepage Search defines no new SVG or asset. The symbol is `aria-hidden`, creates no focus target, and does not supply the accessible name; the visible label and semantic search landmark do. Routing and empty-query behavior are unchanged.

## 11. Search Acceptance

| Scenario | URL / behavior | Result count | Result |
| --- | --- | ---: | --- |
| `Hamilton` | `/catalog?q=Hamilton` | 3 | PASS |
| `Mindray` | `/catalog?q=Mindray` | 16 | PASS |
| `эндоскоп` | encoded Cyrillic query | 8 | PASS |
| Empty | Remains on Homepage; searchbox receives focus | N/A | PASS |
| `  Hamilton  ` | Trimmed to `/catalog?q=Hamilton` | 3 | PASS |
| `УЗИ` | encoded Cyrillic query | 19 | PASS |
| `DIXION` | `/catalog?q=DIXION` | 10 | PASS |
| `zzzz-no-result` | Query preserved; recoverable empty state | 0 | PASS |

Catalog Search displays the exact normalized query. Product Detail → Back restores `q=Hamilton` and the input value. No console warning or error was recorded.

## 12. Category Navigation

| Category | URL | Selected result count | Result |
| --- | --- | ---: | --- |
| УЗИ-системы | `?category=ultrasound-systems` | 16 | PASS |
| Фетальные мониторы | `?category=fetal-monitors` | 10 | PASS |
| Эндоскопические системы | `?category=endoscopy-systems` | 8 | PASS |

For the endoscopy flow, Catalog → Product Detail → Back restored the category URL, selected option, and exact scroll position **760 → 760** when the visible card was activated without automation-induced auto-scroll.

## 13. Manufacturer Navigation

| Manufacturer | Canonical URL | Products rendered | Result |
| --- | --- | ---: | --- |
| Mindray | `/manufacturers/mindray` | 16 | PASS |
| DIXION | `/manufacturers/dixion` | 10 | PASS |
| GE HealthCare | `/manufacturers/ge-healthcare` | 9 | PASS |

This matches the normative contract: Homepage manufacturer cards lead to canonical Manufacturer pages rather than inventing a Catalog filter route. From DIXION, a real Product Detail opened and browser Back restored `/manufacturers/dixion`, all 10 products, and scroll position **520 → 520**.

## 14. Conversion Flow

The read-only conversion scenario passes:

1. Homepage Search → `/catalog?q=Hamilton`;
2. Catalog → Hamilton-T1 Product Detail;
3. Product Request entry → `/request?product=Аппарат ИВЛ Hamilton-T1`;
4. Request page exposes the existing form and one H1;
5. browser Back returns to Hamilton-T1;
6. Product `Назад к каталогу` returns to the preserved Catalog query.

Header Request and Final CTA both lead to `/request`; Product Detail adds the public product value. Runtime DOM contains no `href="#"`, nested interactive controls, or dead Homepage action. No Request form was submitted.

## 15. Responsive Review

| Viewport | Grid contract | H2 | Overflow | Cards/text | Result |
| --- | --- | --- | ---: | --- | --- |
| 1440 × 900 | 3 / 4 / 4 | 30 px | 0 | No clipping | PARTIAL |
| 1280 × 800 | 3 / 4 / 4 | 30 px | 0 | No clipping | PARTIAL |
| 1024 × 768 | 3 / 4 / 4 | 30 px | 0 | No clipping | PARTIAL |
| 768 × 1024 | 2 / 2 / 2 | 26 px | 0 | No clipping | PARTIAL |
| 430 × 932 | 1 / 1 / 1 | 24 px | 0 | No clipping | FAIL |
| 390 × 844 | 1 / 1 / 1 | 24 px | 0 | No clipping | FAIL |
| 360 × 800 | 1 / 1 / 1 | 24 px | 0 | No clipping | FAIL |

Grid and overflow contracts pass. Desktop/tablet are PARTIAL because both `Все категории/производители →` header links and mobile full-width equivalents are visible. The cause is CSS cascade: unlayered `.cm-button-secondary { display: inline-flex; }` overrides the responsive `sm:hidden` utility. Mobile fails the Header touch gate. Header does not overlap Hero content.

## 16. Accessibility Review

| Check | Result |
| --- | --- |
| One H1 | PASS |
| Sequential H1/H2/H3 hierarchy | PASS |
| Main, banner, navigation, search landmarks | PASS |
| Search visible label and accessible name | PASS |
| Image alt text | PASS — no missing alt |
| Decorative Search icon | PASS — `aria-hidden` |
| Nested interactive elements | PASS — 0 |
| Content without hover | PASS |
| Keyboard order / focus | PASS for sampled flow; submit receives visible 2 px outline |
| Reduced motion | PASS — inherited global `prefers-reduced-motion` rule |
| Target sizes | **FAIL** — visible Header controls below 44 px |

**Accessibility result: FAIL** because the target-size requirement remains IMPORTANT even though semantics and keyboard behavior pass.

## 17. Performance Review

| Signal | Result |
| --- | --- |
| Homepage HTML status | HTTP 200 |
| HTML/RSC response | 684,936 bytes |
| Browser-observed assets | 11 scripts, 2 stylesheets, 1 currently loaded image, 9 inline SVGs; 14 external assets total |
| Client boundaries | Homepage Search only |
| Data reads | Three parallel Storefront service reads, then in-memory count/rank passes; no N+1 |
| Product Detail preload | None from Homepage |
| New runtime dependency / Search SVG | None |
| Console warnings/errors | 0 / 0 after Homepage → Catalog → Product → Gallery/Lightbox → Request flow |
| Hydration/runtime error UI | 0 |
| Transferred JS size | Not exposed by the protected browser asset capability; no tool installed |
| CLS / numeric LCP | Not exposed by the approved browser capability; no tool installed |
| Visual LCP candidate | Hero H1; no observed late section displacement or horizontal shift |

Response size remains within the previously reviewed baseline range (v1: 684,310 bytes). No corrective performance regression was found. **Performance result: PASS with documented metric limitations.**

## 18. Regression Verification

### Catalog

- HTTP 200;
- 79 products, 25 manufacturers, 19 categories, 7 application areas;
- Search, filters, sort, cards, empty state: PASS;
- exact combined state `/catalog?manufacturer=mindray&sort=name-desc&q=Mindray`: 16 results;
- Product Detail → Back restored query, Manufacturer, name-desc sort, URL, and scroll **620 → 620**.

### Product Detail — Hamilton-T1

- one H1, Summary paragraph, Description, Manufacturer, Breadcrumbs: PASS;
- Gallery and three images: PASS;
- Lightbox opens and Escape closes it: PASS;
- Back to Catalog and Back to Top: PASS;
- Advantages heading absent: fail-closed PASS;
- Technical Specifications heading absent: fail-closed PASS;
- desktop 1440 and mobile 390: overflow 0.

### Structured Fields

`npm run qa:structured-fields:local` PASS in a disposable local PostgreSQL container:

- migration count: 14;
- immutable revision, canonical hash, revision-bound approval, stale approval rejection, product identity binding;
- service-only writer, exact idempotent retry, legacy isolation, published-only projection;
- exact and idempotent rollback, unrelated-product preservation, RLS and grants;
- residual rows: events 0, batches 0, features 0, products 0, revisions 0, approvals 0;
- remote connections: 0.

No Hamilton approval, publication, migration, Supabase write, or Cloud Catalog change occurred.

**Regression result: PASS.**

## 19. Full QA

| Command | Result |
| --- | --- |
| `npm test` | PASS — 415/415 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack; required local port permission outside the filesystem sandbox |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `npm run qa:structured-fields:local` | PASS — 14 migrations, residual state 0, remote connections 0 |
| Focused corrective tests | PASS — 6/6 |
| Independent error scenarios | PASS — 7/7 |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

## 20. Preview Verification

| Property | Verified value |
| --- | --- |
| URL | `https://medgraph-icur1bjvg-medgraph.vercel.app` |
| Deployment ID | `dpl_2xHADcwzxQQtnj9Zt4cobMrwsaS9` |
| Status | READY |
| Environment | Preview |
| Branch | `codex/homepage-mvp-corrective-fix-v1` |
| Commit | `64e5029310135fb462346ec8d99db30a1da5eb63` (`64e5029` in Vercel log) |
| Created | 2026-07-24 01:57:05 MSK |
| Branch alias | `https://medgraph-git-codex-homepage-mvp-corrective-fix-v1-medgraph.vercel.app` |
| Homepage headers | HTTP 200; `private, no-cache, no-store`; `x-robots-tag: noindex, nofollow` |
| Browser console | 0 warnings, 0 errors after exercised end-to-end flow |

Production invariance:

- `origin/production` remains `66b0f97b0d37fc6fef808833a1a90b415975d5de`;
- Production deployment remains `dpl_7z3WatNfSCm3dZ1ZCdoGJZ9Ybq9E`, READY, created 2026-07-16 15:42:55 MSK;
- no Production deployment, environment update, migration, Supabase write, Cloud Catalog write, or Product Data change occurred.

**Preview verification result: PASS.**

## 21. Findings

### BLOCKING — 0

No crash, data-integrity problem, deployment mismatch, or verification blocker was found.

### IMPORTANT — 1

#### IMPORTANT-001 — Visible mobile Header controls remain below 44 × 44 px

- **Requirement:** Homepage Acceptance Review v2 IMPORTANT-003; Product Specification §11/Acceptance Criteria; Design §13.6.
- **Viewport:** 430 × 932, 390 × 844, and 360 × 800.
- **Actual:** logo 34.3 px, Request 42 px, Catalog/Manufacturers 32.5 px, Search 40 px high.
- **Expected:** every visible interactive target at least 44 × 44 CSS px.
- **Source:** `components/layout/Header.tsx:93-147`; base button sizing in `app/globals.css:151-169`.
- **Risk:** mobile users receive undersized primary navigation and commercial controls; the original accessibility finding is not fully closed.
- **Minimum correction:** expand the clickable Header surfaces to at least 44 px without changing routes, labels, layout architecture, or Homepage sections; verify 430/390/360 computed boxes.

### MINOR — 2

#### MINOR-001 — Mobile-only section footer actions are duplicated on tablet/desktop

- **Requirement:** Design responsive table and Catalog Entry behavior.
- **Viewport:** 768, 1024, 1280, and 1440 px.
- **Actual:** both compact header links and full-width mobile `Все категории` / `Все производители` buttons are visible.
- **Expected:** header action at tablet/desktop; full-width footer action only on mobile.
- **Source:** `components/home/Categories.tsx:32-38,83-88`, `components/home/FeaturedManufacturers.tsx:34-40,86-91`; `.cm-button-secondary` display rule at `app/globals.css:151-169` wins over `sm:hidden`.
- **Risk:** duplicated navigation weakens hierarchy and adds unnecessary section height, but routes remain correct.
- **Minimum correction:** resolve display specificity locally so the mobile action is truly hidden from `sm` upward; do not alter the button primitive globally.

#### MINOR-002 — Search and Final CTA exact heights are below Design v1 dimensions

- **Requirement:** Design §5 mobile Search submit 48 px; §9 both Final CTA controls minimum 48 px.
- **Viewport:** Search mobile 430/390/360; Final CTA all measured viewports.
- **Actual:** 44 px.
- **Expected:** 48 px.
- **Source:** `components/home/Search.tsx:51-56`, `components/home/CTA.tsx:27-31`.
- **Risk:** accessibility minimum passes, but the approved visual rhythm is not exact.
- **Minimum correction:** use the specified 48 px local minimums while preserving the 56 px desktop/tablet Search row and current routes.

### ACCEPTED — 4

1. Analytics implementation is a separate approved task; no provider or sensitive query telemetry was introduced.
2. The Cloud Catalog Preview banner is environment-only and protected by Preview noindex/no-store behavior.
3. No artificial skeleton delay was added because Homepage has no real streaming boundary; empty/error behavior remains defined.
4. Numeric CLS/LCP and transferred JS are unavailable from the approved protected-browser capability; equivalent HTTP, asset, architecture, layout, console, and regression evidence was recorded without installing tools.

## 22. Verdict

**CHANGES REQUIRED**

Reason: one original IMPORTANT finding is not fully resolved. Under the explicit verdict rules, any unresolved original finding requires CHANGES REQUIRED even though BLOCKING = 0, local QA is green, and the Preview deployment is correct.

## 23. Product Approval

**CHANGES REQUIRED**

The Homepage product flow works, but mobile Header target sizing must be corrected before acceptance.

## 24. Merge Recommendation

**NOT READY FOR MERGE**

Do not merge `codex/homepage-mvp-corrective-fix-v1` into `main` until IMPORTANT-001 is fixed and independently rechecked. The two MINOR findings may be included only if the corrective task explicitly authorizes them; no opportunistic refactor is recommended.

## 25. Release-Readiness Recommendation

**NOT READY**

The corrective Preview remains safe for review, but it is not the approved Homepage launch baseline.

## 26. Exact Next Task

**Homepage MVP Corrective Fix v2**

Required primary scope: make all visible mobile Header interactive targets at least 44 × 44 CSS px and re-run 430/390/360 computed-box verification. The two documented MINOR findings should only be changed if explicitly included in the next task authorization.
