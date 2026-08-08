# EndoMarket Business/Content Corrective v2 — Stage evidence

Date: 2026-08-08

Branch: `codex/endomarket-catalog-integration-stage-v1`

Implementation commit: `1dbf7da1b6b920b9d497fcf5a7876538f997a45b`

Validated Preview: `https://medgraph-h9n3ptdbl-medgraph.vercel.app`

Deployment: `dpl_4hQ2aH5WKmiUoiXMLRSV1xipKRqu` (`READY`, Preview)

## Source of truth

The corrective uses the supplied files without generating replacement marketing
copy:

- `endomarket-business-content-corrective-v2.json` — SHA-256
  `8b939de5d70330d980a2d876c1f66ea7c5e50d280e0138868f2406301add085f`;
- `endomarket-text-replacements-v2.csv` — SHA-256
  `4868e52643aa6604a3c8bf83a7ac50304d14d8d7b8596ddb8a500e3a48d6b123`;
- `cybermedica-endomarket-business-content-spec-v2.md` — implementation
  contract transcribed from the supplied specification.

JSON and CSV reconcile across all 42 draft Products. A second corrective run is
idempotent.

## Applied corrective

- Exact Stage scope: **42** new draft Products and **9** bindings to existing
  catalog identities; no duplicate Product was created.
- All supplied Product names, models, Russian descriptions, SEO text,
  application areas, characteristics and feature lists were applied from the
  corrective package.
- **12** Product Detail feature sections are hidden because their approved
  feature list is empty.
- Product cards no longer render technical characteristics. Application areas
  are separate tags with a maximum of two visible tags and `+N` overflow.
- Product Detail renders separate application tags, hides unknown-country
  placeholders, preserves the commercial badges and uses `Ключевые
  особенности` only when approved features exist.
- The homepage uses the exact eight-item approved priority and includes only
  Products with a clean local hero image: SonoScape EG-500, SonoScape EC-500T,
  SonoScape EB-500, Medinova BR-1231, ENDO CLEAN-1000, ENDO CLEAN-2000, EC-5BD
  and iLivTouch.
- The approved homepage subtitle and service wording are exact.

## Media

- watermark assignments removed: **87**;
- watermark files removed: **67**;
- exact or obvious clean-image duplicates removed: **0**;
- remaining clean media assignments: **84**;
- remaining unique clean assets: **65**;
- Products without safe source media: **7**, retained with the neutral
  fail-closed fallback and excluded from homepage featured selection.

All removed responsive variants were visually verified as carrying an EM or
EndoMarket watermark. A clean variant was retained wherever available. No
external EndoMarket image URL is used at runtime.

## Validation

- corrective contract and focused UI tests: **45/45 PASS**;
- full repository tests: **602/602 PASS** (the sandbox run passed 601 tests and
  the single loopback-listener case passed in the approved network boundary);
- ESLint: **PASS**, zero warnings;
- TypeScript: **PASS**;
- Next.js Turbopack build: **PASS**;
- Next.js Webpack build: **PASS**;
- resilient published-catalog gate: **6/6 PASS**;
- Stage smoke: **PASS** in Chromium 1440, Chromium 1280, Chromium tablet 820,
  WebKit 390×844 and WebKit 844×390;
- homepage, catalog, manufacturer, search, request and ten Product Detail
  routes: **PASS**;
- `GET /api/request`: **405**;
- horizontal overflow, browser runtime errors, legacy markers and pseudo-feature
  text: **none**;
- catalog ProductCard technical-characteristic blocks: **none**;
- runtime watermark asset references: **none**.

## Visual evidence

- [desktop homepage](evidence/endomarket-business-content-corrective-v2-2026-08-08/homepage-desktop-1440.png)
- [desktop catalog](evidence/endomarket-business-content-corrective-v2-2026-08-08/catalog-desktop-1280.png)
- [commercial ProductCard](evidence/endomarket-business-content-corrective-v2-2026-08-08/product-card-commercial-badges.png)
- [desktop Product Detail](evidence/endomarket-business-content-corrective-v2-2026-08-08/product-detail-desktop.png)
- [service wording](evidence/endomarket-business-content-corrective-v2-2026-08-08/service-benefit-desktop.png)
- [mobile catalog 390×844](evidence/endomarket-business-content-corrective-v2-2026-08-08/catalog-mobile-390x844.png)
- [mobile Product Detail 390×844](evidence/endomarket-business-content-corrective-v2-2026-08-08/product-detail-mobile-390x844.png)

## Invariance

- Production writes: **0**;
- Production deployment changed: **No**;
- no `main` or `production` push;
- no Product/lifecycle/Supabase/migration/ENV/DNS change.
