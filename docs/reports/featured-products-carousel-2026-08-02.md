# Featured Products Carousel — 2026-08-02

## Outcome

The homepage static four-card equipment grid was replaced with a responsive,
clickable carousel backed by the existing Published Catalog loader. The change
does not add a second catalog request: the server selects the approved entries
from the same `productService.getActiveProducts()` result already protected by
the validated last-known-good snapshot.

Production rollout deployment: `dpl_GDN3Tq6D4djtKgwtANKvHtQppY8J`.

## Exact published scope

| Product | Production Product ID | Canonical slug |
| --- | --- | --- |
| Hamilton-T1 | `e66a1165-030b-4aa4-a400-959f1ac70fe3` | `767632362-330695211247-apparat-ivl-hamilton-t1` |
| Mindray SV300 | `00e3f62b-797b-40ff-bf9f-9d1750828ca4` | `767632362-401374530532-apparat-ivl-mindray-sv300` |
| Fresenius Kabi Agilia SP MC | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` | `767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia` |
| Mindray BeneHeart D3 | `224ee705-5dea-429f-ab10-1ef9153e94fc` | `767632362-725867191732-defibrillyator-monitor-mnogofunktsionaln` |
| GE HealthCare Versana Premier | `cb139c6c-5cbc-4dc0-aa80-3114856d3dd1` | `767632362-358648454622-uzi-apparat-ge-versana-premier-black` |
| GE HealthCare OEC 9900 Elite | `79b6082c-b63e-4c8e-9769-36383747b57b` | `767632362-571191341342-rentgenohirurgicheskii-apparat-tipa-s-du` |
| B. Braun Dialog+ | `ae1e448d-f266-4d5d-9d42-e2c22a2d54c8` | `767632362-601909099101-gemodializnii-apparat-iskusstvennaya-poc` |
| PENTAX Medical EPK-i5000 | `48f7d071-c8e4-4bc9-96c4-fc12672ca183` | `767632362-446510199362-videoendoskopicheskaya-sistema-pentax-ep` |

The projection mapper intentionally exposes each canonical slug as the public
Storefront `Product.id`; the selector therefore resolves by canonical slug
while retaining the Production UUID in this auditable binding table. A missing
or non-public entry is omitted and is never replaced with an arbitrary Product.

## Interaction and presentation

- desktop: four complete cards with previous/next controls;
- tablet: two complete cards with controls and native touch scrolling;
- mobile: one complete card plus a preview of the next card;
- native horizontal scroll and CSS scroll snap provide the swipe path;
- Arrow Left/Arrow Right and 44 px controls provide non-drag alternatives;
- reduced-motion preference disables smooth movement;
- the full card is one canonical Product Detail link, with no nested controls;
- stable image aspect ratio, first-card eager load, subsequent lazy loading and
  a neutral missing-image state prevent layout collapse;
- the track is contained and does not create page-level horizontal overflow.

## Data and resilience

The carousel uses only `cloud_published` through the existing Storefront
service and resilient catalog transport. It performs no browser fetch and has
no effect hook, polling loop or independent cache. A missing catalog response
produces a small server-rendered fallback; it cannot crash the homepage shell.
The deployment captured a validated 71-Product last-known-good snapshot at
projection version 73. Post-deployment catalog health was `healthy` with
`fallbackActive=false`.

## Validation

| Check | Result |
| --- | --- |
| Full automated suite | PASS — 577/577 |
| Carousel contract tests | PASS |
| ESLint | PASS |
| TypeScript | PASS |
| Next.js Turbopack build | PASS |
| Next.js Webpack build | PASS |
| Responsive WebKit carousel gate | PASS — iPhone/tablet/desktop |
| General WebKit route smoke | PASS — 3 profiles × 5 routes |
| Canonical Product links | PASS — 8/8 HTTP 200 |
| Page horizontal overflow | NONE |
| Published catalog synthetic | PASS — 71 Product URLs |
| Catalog health | healthy; live source; fallback inactive |
| RFQ | `/request` 200; `GET /api/request` 405 |
| Secret/privacy and unpublished URL scan | PASS |

## Visual evidence

- [Before — desktop](../screenshots/featured-products-before-desktop-2026-08-02.png)
- [Before — mobile](../screenshots/featured-products-before-mobile-2026-08-02.png)
- [After — desktop](../screenshots/featured-products-after-desktop-2026-08-02.png)
- [After — tablet](../screenshots/featured-products-after-tablet-2026-08-02.png)
- [After — mobile](../screenshots/featured-products-after-mobile-2026-08-02.png)

## Production invariance

Products remain `79`; Published/Unpublished remain `71/8`; lifecycle remains
`71/71/71/71`; projection remains version 73; sitemap remains 71 Product URLs.
No Product, lifecycle, raw snapshot, source checksum, migration, ENV or DNS
write was performed. The eight deferred Products remain draft/unpublished and
do not appear in the carousel or sitemap. `gitForkProtection` remains enabled.
