# Homepage MVP Corrective Fix v1

Date: 2026-07-24

Scope: acceptance-review findings only

Base review: `b247d72c9eb70d85533279a409fb7596f58d9f86`

## 1. Findings Summary

| Finding | Severity | Corrective result |
| --- | --- | --- |
| Overview failures could replace Hero and Search | IMPORTANT | Categories and Manufacturers now settle and degrade independently |
| Homepage H2 scale differed from the approved contract | IMPORTANT | All four Homepage H2 use 24/26/30 px at mobile/tablet/desktop |
| Mobile controls could render below 44 × 44 px | IMPORTANT | Explicit 44 px minimum applied to Homepage interactive controls |
| Search used a separate inline SVG | MINOR | Search now reuses the existing Catalog search mark |

No additional product feature, section, data source, or architecture change is included.

## 2. Corrective Changes

- Added a Homepage-only settling helper over the existing Storefront service calls.
- Kept the approved five-section order and single Search client boundary.
- Added focused contract tests for failure isolation, heading scale, touch targets, and Search icon reuse.
- Updated existing Homepage source contracts only where nullable section data is now intentional.

ProductService, CatalogRepository, Cloud Domain Model, Catalog, Product Detail, Structured Fields, migrations, ADR, Product Data, and Cloud Catalog are unchanged.

## 3. Error Isolation

`productService`, `categoryService`, and `manufacturerService` are still the only Homepage data sources. Their reads are settled independently before presentation:

- Categories failure: Categories shows a compact public fallback; Manufacturers remains available.
- Manufacturers failure: Manufacturers shows a compact public fallback; Categories remains available.
- Both overview failures: both sections show independent fallbacks; Hero, Search, Why CyberMedica, and Final CTA remain available.
- Products failure: count-dependent overview sections fail closed locally; the primary catalog entry remains usable.
- Partial success: each successful section continues to render its valid public data.
- Successful empty array: the corresponding section remains fully omitted as specified.
- Retry: the local fallback uses a native GET form to reload `/`; the safe destination link remains available.

No technical error, endpoint, environment value, or stack trace is exposed.

## 4. Typography

Every Homepage H2 now uses the approved responsive scale without changing H1 or global typography:

- Mobile `<640 px`: 24 px.
- Tablet `640–1023 px`: 26 px.
- Desktop `≥1024 px`: 30 px.

The change is local to Homepage components and does not alter Catalog or Product Detail tokens.

## 5. Touch Targets

Explicit minimum heights preserve at least 44 px for:

- Hero Catalog CTA;
- Search input and submit;
- Categories and Manufacturers header/footer actions;
- section-level retry and safe-destination actions;
- both Final CTA actions.

Category and Manufacturer cards already exceed 44 × 44 px. Existing hover and focus-visible behavior is retained.

## 6. Search Icon

The Homepage-specific inline SVG was removed. Homepage Search now reuses the same `⌕` mark as Catalog Search. Submit handling, empty-query focus behavior, URL encoding, and `/catalog?q=…` navigation are unchanged.

## 7. Regression Verification

- Catalog service boundary and list UX contracts: PASS.
- Product Detail presentation and navigation contracts: PASS.
- Recovery navigation, complete URL/query restoration, and scroll restoration contracts: PASS.
- Structured Fields schema/writer/projection contract tests within `npm test`: PASS.
- No runtime or data-layer file outside Homepage scope changed.

The optional disposable-database Structured Fields harness was not part of the required QA and could not start because its pinned local container image was absent. It did not pull an image, connect remotely, or perform a write.

## 8. QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 415/415 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `git diff --check` | PASS |
| Focused corrective contracts | PASS — 17/17 |

## 9. Preview Verification

The automatic Vercel Preview is created only after the immutable corrective commit is pushed. The release gate covers Homepage, Catalog, Product Detail, Search, Back navigation, desktop 1440 px, tablet 768 px, mobile 390 px, overflow, heading sizes, touch targets, and browser console errors.

Deployment URL, ID, status, and observed results are recorded in the task handoff after the Preview is READY; they are intentionally not written back into the deployed commit.

## 10. Remaining Findings

At the local QA boundary:

- IMPORTANT remaining: 0.
- MINOR remaining: 0.
- New findings introduced: 0.

Final status remains gated by the automatic Preview verification and the independent Homepage MVP Acceptance Review v2.
