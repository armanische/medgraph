# Homepage MVP Corrective Fix v2

**Date:** 2026-07-24

**Branch:** `codex/homepage-mvp-corrective-fix-v2`

**Review source:** `docs/reports/homepage-mvp-acceptance-review-v2.md`

**Scope:** only the one IMPORTANT and two MINOR findings authorized by Homepage MVP Acceptance Review v2.

## 1. Review Findings

| Finding | Severity | File | Runtime impact | Corrective plan |
| --- | --- | --- | --- | --- |
| Visible Header controls are below 44 × 44 CSS px | IMPORTANT | `components/layout/Header.tsx` | Mobile logo, Request, Catalog, Manufacturers and Search expose undersized targets | Increase only the interactive surfaces to a 44px minimum without changing routes, labels or behavior |
| Mobile section footer actions remain visible from `sm` upward | MINOR | `components/home/Categories.tsx`, `components/home/FeaturedManufacturers.tsx` | Tablet and desktop show duplicate all-items actions | Apply a local important responsive hide; do not change the global button primitive |
| Search submit and Final CTA controls use 44px instead of the approved 48px | MINOR | `components/home/Search.tsx`, `components/home/CTA.tsx` | Visual rhythm differs from Design v1 | Apply a local 48px minimum while retaining the 56px Search row from `sm` upward |

No additional improvement or refactor was included.

## 2. Corrective Changes

- Header interactive surfaces now have an explicit 44px minimum. Navigation destinations, labels, search behavior and Header structure are unchanged.
- Category and Manufacturer mobile footer actions use `sm:!hidden`, which wins against the unlayered `cm-button-secondary` display declaration without changing that shared primitive.
- Homepage Search submit now has a 48px mobile minimum and retains its 56px tablet/desktop height.
- Both Final CTA actions now have the approved 48px minimum at every breakpoint.
- The existing Homepage corrective contract test now guards the exact 44px and 48px requirements and the local responsive hide.

Local production CSS contains all three required rules:

- `min-height: 44px` for Header targets;
- `min-height: 48px !important` for Search and Final CTA;
- `display: none !important` for `sm:!hidden`.

## 3. Regression Verification

| Invariant | Result |
| --- | --- |
| Homepage five-section flow and Search-first order | PASS — composition files and routes are unchanged |
| Categories and Manufacturers data/error behavior | PASS — only responsive display classes changed |
| Final CTA routes and priority | PASS — labels, order and `href` values are unchanged |
| Product Detail | PASS — no Product Detail file in the diff; full contracts pass |
| Catalog | PASS — no Catalog file in the diff; navigation and recovery contracts pass |
| Structured Fields | PASS — no contract, mapper, writer, RPC or migration file in the diff; full contracts pass |
| URL, query, filter, sort and scroll restoration | PASS — recovery implementation is unchanged; catalog recovery contracts pass |

Computed local production-build measurements:

| Viewport | Header targets | Search submit | Final CTA | All-items actions | Overflow | H1 |
| --- | --- | --- | --- | --- | ---: | ---: |
| 430 × 932 | all 44px | 48px | both 48px | one per section | 0 | 1 |
| 390 × 844 | all 44px | 48px | both 48px | one per section | 0 | 1 |
| 360 × 800 | all 44px | 48px | both 48px | one per section | 0 | 1 |
| 768 × 1024 | all 44px | 56px | both 48px | one per section | 0 | 1 |
| 1440 × 900 | all 44px | 56px | both 48px | one per section | 0 | 1 |

At mobile widths the single all-items action is the full-width footer action. From `sm` upward it is the compact section-header action. Local browser console warnings/errors: 0.

## 4. QA

| Command | Result |
| --- | --- |
| `npm test` | PASS — 415/415 |
| Focused Homepage corrective test | PASS — 6/6 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `git diff --check` | PASS |

## 5. Preview Verification

The automatic Git-based Vercel Preview is created only after the atomic commit is pushed. Its immutable URL, deployment ID, exact commit, responsive measurements, Homepage → Catalog → Product → Back flow and console result are recorded in the final task handoff. This report intentionally does not require a second evidence-only runtime commit.

Preview acceptance checklist:

- Homepage, Catalog and a real Product Detail return HTTP 200;
- Search and Back preserve the existing Catalog recovery contract;
- 1440, 768 and 390px layouts have no horizontal overflow;
- Header targets are at least 44px;
- Search and Final CTA exact heights match Design v1;
- Category and Manufacturer all-items actions are not duplicated;
- browser console errors remain 0.

## 6. Remaining Findings

**Local corrective findings remaining: 0.**

Final READY status remains gated by the automatic Preview verification described above.
