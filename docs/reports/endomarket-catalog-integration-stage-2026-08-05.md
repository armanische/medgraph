# EndoMarket catalog integration — Stage evidence

Date: 2026-08-05

Branch: `codex/endomarket-catalog-integration-stage-v1`

Base: `19236f7cf18fa332fa58d023acd337908b1b89a9`

## Scope

- normalized equipment rows: **51**;
- new deterministic Stage drafts: **42**;
- existing Product bindings, with no duplicate Product created: **9**;
- excluded instruments/endoscopy consumables: **76**;
- excluded chemical consumables: **3**;
- Production Product/lifecycle writes: **0**.

The supplied XLSX/JSON/CSV package was reconciled byte-for-byte with its iCloud
copy. Input SHA-256 values are recorded in the generated audit. JSON remains the
machine-readable source; XLSX and CSV are control views.

## Architecture and presentation

The snapshot is enabled only for the exact Vercel Preview branch through the
existing `cloud_preview` repository. Production explicitly fails closed. No new
public API, route structure, database migration or parallel catalog was added.

All and only EndoMarket-linked Products carry typed presentation metadata for
`В наличии`, `Рассрочка 0%` and `До 12 месяцев без удорожания`. Canonical
ProductCard, Search, Manufacturer, featured-carousel and Product Detail surfaces
consume that metadata. The homepage benefits grid contains the approved
partner-service statement.

## Data mapping

Existing identities are reused for SonoScape, Olympus and PENTAX Medical.
Stage-only reference rows cover Medinova, ERBE, BOWA, iLivTouch, MET and ZERTS;
no Production Manufacturer write occurs.

| Existing category | Products |
| --- | ---: |
| Эндоскопические системы | 48 |
| Медицинская мебель | 2 |
| Ультразвуковые системы | 1 |

The nine bound duplicates are SonoScape HD-350/500/550, Olympus CV-190 EXERA
III, CV-170 OPTERA and AXEON, plus PENTAX EPK-i7010 OPTIVISTA, EPK-i5000 and
EPK-3000 DEFINA.

## Media

- clean assignments after Business/Content Corrective v2: **84**;
- unique clean content-addressed files: **65**;
- removed watermark assignments/files: **87/67**;
- removed exact or obvious clean duplicates: **0**;
- Products with source media: **44**;
- neutral missing-image fallback: **7** Products;
- manifest rows missing alt or hero/gallery role: **0**;
- external runtime EndoMarket image URLs: **0**.

Seven exact-model source pages did not expose attributable media: Medinova
19-inch HD, 24-inch Full HD, 27-inch Full HD and 55-inch 4K, SonoScape EC-430T,
ZERTS with one electromechanical drive, and the existing PENTAX EPK-i5000
binding. No neighbouring-model image was substituted.

The complete v2 evidence is recorded in [Business/Content Corrective v2](endomarket-business-content-corrective-v2-2026-08-08.md).

## Validation

- targeted Stage/Cloud Preview/UI tests: **26/26 PASS**;
- full repository suite: **597/597 PASS**;
- ESLint: **PASS, zero warnings**;
- standalone TypeScript: **PASS**;
- Next.js Turbopack build: **PASS, 81 routes**;
- Next.js Webpack build: **PASS, 81 routes**;
- resilient catalog gate: **6/6 PASS**;
- Chromium/WebKit Stage smoke: **PASS** for 1440, 1280, tablet 820, iPhone
  portrait and iPhone landscape, including ten Product Detail routes;
- `GET /api/request`: **405**;
- horizontal page overflow and browser runtime errors: **none**.

Production-specific homepage/carousel scripts assume the immutable 71-Product
projection. Their contracts remain covered by the full suite; the new
`qa:endomarket-stage` script supplies equivalent runtime coverage for the
51-row Preview snapshot.

## Evidence

- [desktop homepage](evidence/endomarket-stage-2026-08-05/homepage-desktop-1440.png)
- [desktop catalog](evidence/endomarket-stage-2026-08-05/catalog-desktop-1280.png)
- [commercial ProductCard](evidence/endomarket-stage-2026-08-05/product-card-commercial-badges.png)
- [desktop Product Detail](evidence/endomarket-stage-2026-08-05/product-detail-desktop.png)
- [service benefit](evidence/endomarket-stage-2026-08-05/service-benefit-desktop.png)
- [mobile catalog](evidence/endomarket-stage-2026-08-05/catalog-mobile-390x844.png)
- [mobile Product Detail](evidence/endomarket-stage-2026-08-05/product-detail-mobile-390x844.png)

Production deployment, `main`, `production`, DNS, ENV, Auth, Supabase and all
publication lifecycle records remain unchanged.
