# Homepage MVP Implementation v1

Date: 2026-07-24

Branch: `codex/homepage-mvp-implementation-v1`

Baseline: `2ef6a576fc19352f5971bf3ac756360220093b1c`

Status: **LOCAL READY — PREVIEW AUTHORIZATION PENDING**

## Scope

Homepage MVP is implemented from the approved product and design specifications:

- `docs/00-product/homepage-mvp-specification.md`;
- `docs/03-ux/homepage-mvp-design.md`.

The runtime contains exactly the five approved Homepage blocks, in this order:

1. Search-first Hero;
2. Featured Categories;
3. Manufacturers;
4. Why CyberMedica;
5. Final CTA.

No additional Homepage sections, marketing illustration, featured-product carousel, or new base UI primitive were introduced.

## Specification decisions

The approved documents are treated as the source of truth. Therefore the Hero contains Search as its primary action and one supporting Catalog CTA. The request-quote action appears in the Final CTA. This follows the approved information architecture and avoids three competing Hero actions.

## Implementation

### Data boundary

- Homepage reads the existing Cloud Catalog through the current services.
- Products, manufacturers, and categories are loaded once and in parallel.
- Category and manufacturer counts are derived in one pass without N+1 requests.
- The Homepage does not request Product Detail payloads.
- Featured output is capped at six categories and eight manufacturers, as specified.

### Rendering boundary

- Homepage and all content sections remain server components.
- Search is the only new client boundary required for query submission.
- Search submits a trimmed query to `/catalog?q=...` using the existing Catalog URL contract.
- Empty Search submission remains on the Homepage and returns focus to the input.

### Responsive layout

- Categories: desktop 3, tablet 2, mobile 1.
- Manufacturers: desktop 4, tablet 2, mobile 1.
- Advantages: desktop 4, tablet 2, mobile 1.
- Search and Final CTA actions stack on mobile.
- Existing typography, spacing, card, button, focus, radius, shadow, and layout primitives are reused.

## Automated QA

| Check | Result |
|---|---|
| `npm test` | PASS — 409/409 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 / Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 / webpack |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

Five focused Homepage MVP contract tests were added. Existing Homepage-era contracts were aligned with the approved MVP specification; Product Detail and Structured Fields contracts continue to pass.

## Local production browser QA

The production build was started locally with the read-only `cloud_preview` data source. No write operation was executed.

### Homepage

- exactly five main sections: PASS;
- one H1: PASS;
- Hero Search: PASS;
- Hero Catalog CTA: PASS;
- Categories loaded from Cloud Catalog: PASS, 6 cards;
- Manufacturers loaded from Cloud Catalog: PASS, 8 cards;
- four approved advantage cards: PASS;
- Final CTA with Catalog and Request Quote actions: PASS;
- runtime error UI: absent;
- browser console errors: 0.

### Responsive

| Viewport | Grid result | Horizontal overflow | Result |
|---|---|---:|---|
| 1440 px | categories 3, manufacturers 4, advantages 4 | 0 | PASS |
| 768 px | categories 2, manufacturers 2, advantages 2 | 0 | PASS |
| 390 px | categories 1, manufacturers 1, advantages 1 | 0 | PASS |

At 390 px, Search and Final CTA actions stack vertically as specified.

### End-to-end storefront path

Verified flow:

`Homepage → Search “Hamilton” → /catalog?q=Hamilton → Hamilton-T1 → Back to Catalog`

Results:

- Homepage search query reached Catalog unchanged: PASS;
- Catalog loaded Cloud summary: 79 products, 25 manufacturers, 19 categories, 7 application areas;
- Hamilton query returned 3 products;
- Hamilton-T1 Product Detail opened successfully;
- Gallery, Product Detail H1, Summary, Description, Manufacturer, and Back to Catalog remained available;
- Back to Catalog restored `/catalog?q=Hamilton` and the visible query value;
- console errors across the flow: 0.

### HTTP smoke

All read-only local production routes returned HTTP 200:

- `/`;
- `/catalog`;
- `/catalog/767632362-330695211247-apparat-ivl-hamilton-t1`;
- `/manufacturers`;
- `/request`.

## Scope invariance

Unchanged:

- Product Detail runtime and UX;
- Structured Fields runtime;
- Cloud Domain Model;
- ProductService and CatalogRepository contracts;
- Cloud Catalog and Product Data;
- Supabase schema and data;
- migrations and ADRs;
- Production branch and Production deployment.

No Supabase write, migration, import, publication, commit, push, or deployment was performed.

## Preview status

Remote Preview was not created because this task explicitly forbids automatic commit, and the project workflow requires Commit → Push → automatic Vercel Preview. A separate authorization for atomic commit and push is required before Preview QA can be completed.

## Readiness

- Local implementation: READY.
- Automated QA: PASS.
- Local production browser QA: PASS.
- Remote Preview QA: PENDING AUTHORIZATION.
- Production: UNTOUCHED.

Exact next task after authorized Preview acceptance: **Homepage MVP Acceptance Review v1**.
