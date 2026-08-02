# Storefront Smoke Baseline — 2026-08-02

Canonical origin: `https://cyber-medica.ru`

| Surface | Expected | Verified |
| --- | ---: | ---: |
| Homepage | HTTP 200, visible server shell and featured carousel | PASS |
| Featured carousel | 8 exact Published Products | PASS |
| Featured Product Detail links | 8/8 HTTP 200 | PASS |
| Catalog | HTTP 200 | PASS |
| Request page | HTTP 200 | PASS |
| Request API GET | HTTP 405 | PASS |
| Sitemap Product URLs | 71 | 71 |
| Catalog health | healthy, fallback inactive | PASS |
| WebKit | 3 profiles × 5 routes, no blank screen/runtime error | PASS |
| Responsive carousel | iPhone 1+preview; tablet 2; desktop 4 | PASS |
| Page horizontal overflow | none | PASS |

The baseline uses the corporate synthetic identity label
`cybermedicaooo@gmail.com`. It contains no credentials or private Product
payload. Production data and lifecycle were read-only throughout verification.
