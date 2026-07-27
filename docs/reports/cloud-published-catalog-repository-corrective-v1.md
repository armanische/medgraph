# CloudPublishedCatalogRepository Corrective Fix v1

**Дата:** 27 июля 2026 года

**Branch:** `codex/cloud-published-catalog-repository-corrective-v1`

**Base:** `9a062e49611412aaf9ce0ea23e4b9685042060b4`

**Runtime commit:** `2e716f5d0c2ef1b83045dc403d8c48d2bd590a0a`

**Статус:** READY FOR INDEPENDENT ADAPTER RE-REVIEW V2

## 1. Scope

Corrective закрывает H1, H2 и M1–M4 из Independent
CloudPublishedCatalogRepository Review v1. `CatalogRepository`,
`ProductService`, Storefront Domain Model, UI, Product Data, projection RPC,
Supabase schema и migrations не изменены.

## 2. Safety contract

- service-role transport принимает только canonical Supabase project origin;
- absolute cross-origin request target запрещён, redirects используют `error`;
- Next.js control-flow проходит через `unstable_rethrow` до sanitation;
- response ограничен 8 MiB фактических decoded bytes;
- ambiguous snapshot identities и relations отклоняются fail-closed;
- media validator и Next image/CSP используют один hostname policy;
- sitemap строится из одного coherent runtime snapshot;
- Published dynamic slugs не требуют build-time Cloud read или rebuild.

## 3. Automated QA

| Проверка | Результат |
| --- | --- |
| `npm test` | PASS — 451/451 |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next 16.2.9 webpack |
| `git diff --check` | PASS |
| Redirect 301/302/307/308, same/cross origin | PASS — 0 target requests, 0 forwarded credentials |
| Empty/non-empty `cloud_published` build | PASS — Turbopack + webpack, 0 build RPC |
| Empty/non-empty runtime smoke | PASS |
| Sitemap runtime read | PASS — exactly 1 RPC |
| Client bundle credential scan | PASS — 0 matches in `.next/static` |
| Conflict-marker scan | PASS |

Runtime smoke проверил `/`, `/catalog`, `/manufacturers`, `/search`,
`/sitemap.xml`, новый Product slug и Manufacturer slug. Каждый проверенный
runtime request выполнял один read-only synthetic RPC. Empty Product lookup
показал fail-closed not-found UI; sitemap не содержал Product URL.

## 4. Performance evidence

Измерения выполнены локально на synthetic validated payload, один cold/warm
process pass; это engineering guardrail, не Production benchmark.

| Products | Bytes | Read + parse + validate | Map | Sitemap | Total |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 740 | 10.81 ms | 0.07 ms | 0.07 ms | 10.95 ms |
| 79 | 35,381 | 1.53 ms | 0.21 ms | 0.08 ms | 1.82 ms |
| 1,000 | 445,130 | 5.02 ms | 0.72 ms | 1.80 ms | 7.55 ms |
| 10,000 | 4,495,672 | 28.84 ms | 4.99 ms | 6.13 ms | 39.97 ms |

Exact 8 MiB bounded read + parse + validate: 9.38 ms. One byte over the
configured limit fails before mapping.

## 5. Isolation and invariance

- remote connections: 0;
- staging/Production connections: 0;
- Supabase/Cloud writes: 0;
- migrations: 0;
- publication/initialization: 0;
- deployments: 0;
- disposable repository fixtures: 0 (test harnesses remained outside Git);
- Preview/static fallback in Published adapter: absent;
- Production: untouched;
- merge into `main`: not performed;
- push: not performed.

## 6. Known limitations

- no persistent/cross-request cache; each independent request may read a full
  snapshot;
- 8 MiB is a hard launch ceiling; pagination remains future work only if
  measured growth requires it;
- media hosts remain explicit and intentionally limited to one Launch origin;
- accepted Next artifact must be built with the same approved Supabase origin
  used at runtime;
- artifact remains blocked from staging Preview and merge until independent
  re-review grants approval.

## 7. Next gate

`Independent CloudPublishedCatalogRepository Re-Review v2`.
