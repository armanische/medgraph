# CloudPublishedCatalogRepository Corrective Fix v2

**Дата:** 27 июля 2026 года

**Branch:** `codex/cloud-published-catalog-repository-corrective-v2`

**Approved base:** `d4ace4f60fb88b3ccb1834eb27ce8a9830775611`

**Runtime commit:** `37cac1d`

**Статус:** READY FOR INDEPENDENT ADAPTER RE-REVIEW V3

## 1. Findings Summary

Corrective закрывает только два finding из Independent
CloudPublishedCatalogRepository Re-Review v2:

- H1: Published service-role transport привязан к exact server-only Supabase
  URL/project-ref pair и читает её только в runtime;
- M1: Storefront source selector загружает выбранный adapter отдельным
  server-only dynamic import без fallback.

Закрытые ранее redirect, credential forwarding, Next control-flow, relational
validation, media, 8 MiB reader, coherent sitemap, empty catalog и no-write
контракты сохранены.

## 2. Server-only Environment Contract

Published adapter использует только:

| Variable | Contract |
| --- | --- |
| `CYBERMEDICA_SUPABASE_URL` | runtime-only exact project origin |
| `CYBERMEDICA_SUPABASE_PROJECT_REF` | runtime-only exact 20-character project ref |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime-only credential, доступный transport только после binding validation |

`NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` не участвуют в
Published service-role transport. Отдельная browser-safe конфигурация может
отличаться и не влияет на target Published RPC.

## 3. Exact Project Binding

Cloud URL принимается только при выполнении всех условий:

- `hostname === `${projectRef}.supabase.co``;
- protocol `https:`;
- port, username, password, query и hash отсутствуют;
- pathname равен `/`;
- ref — ровно 20 lowercase ASCII letters/digits;
- percent encoding, trailing dot, prefix/suffix confusion и другой valid
  Supabase project отклоняются.

Validation выполняется до создания request. Mismatch преобразуется в safe
repository error `configuration`. В public response и server error отсутствуют
URL, ref, key, headers и raw ENV. Project binding основан на server-only
configuration pair и deployment policy; недокументированные JWT claims не
используются.

Local QA разрешает только loopback, fixed ref `localdevelopment0001`, explicit
`CYBERMEDICA_ALLOW_LOCAL_SUPABASE_ORIGIN=1` и отсутствие Vercel environment.

## 4. Build/Runtime Isolation

Выбран Option A: runtime-only server configuration.

| Scenario | Result | Upstream evidence |
| --- | --- | --- |
| build A -> runtime B | PASS, 7/7 routes HTTP 200 | 7 requests только к B, все с runtime key B; A requests = 0 |
| build без server ENV -> runtime B | PASS, Product route HTTP 200 | request только к B |
| build A -> runtime A | PASS, Catalog HTTP 200/empty state | 1 request к A с runtime key A |
| runtime URL/ref mismatch | PASS, safe HTTP 500 | requests = 0; credential headers sent = 0 |

Synthetic build A URL и key не обнаружены ни во всём `.next`, ни в
`.next/static`. Runtime HTML/RSC/sitemap не содержали build/runtime origin,
project identity или key.

## 5. Source-specific Adapter Isolation

`catalog-repository-factory.server.ts` выполняет один dynamic import для
`cloud_published`, `cloud_preview` или `static`. Неизвестный runtime value
отклоняется. `catch`, fallback и static imports concrete repositories в
Storefront barrel отсутствуют.

Webpack evidence для `cloud_published`:

- Published RPC находится в отдельном Published chunk;
- этот chunk содержит 0 Preview RPC, `preview_draft`, Preview repository и
  filesystem repository identifiers;
- Preview RPC находится в отдельном lazy chunk;
- traced start и шесть Published routes не загрузили Preview implementation
  chunk или filesystem implementation chunk;
- `.next/static` содержит 0 Preview RPC/banner identifiers.

`cloud_preview` regression build в `VERCEL_ENV=preview` прошёл и сделал два
Preview RPC к synthetic fixture. Production guard, unknown source rejection и
отсутствие fallback подтверждены automated tests. Static source сохранил
обычный production build.

## 6. Build Matrix

Каждый `cloud_published` build завершился с exit 0 и build RPC count 0. Upstream
response scenario намеренно не влияет на build, потому что Published reads
выполняются только в runtime.

| Upstream scenario | Turbopack | webpack | Build RPC |
| --- | --- | --- | ---: |
| empty | PASS | PASS | 0 |
| non-empty | PASS | PASS | 0 |
| unavailable | PASS | PASS | 0 |
| invalid | PASS | PASS | 0 |
| oversized | PASS | PASS | 0 |

Dynamic Product/Manufacturer routes были проверены после build на runtime
non-empty snapshot; новый Product и Manufacturer slugs вернули HTTP 200.

## 7. Regression Evidence

| Contract | Result |
| --- | --- |
| Redirect 301/302/303/307/308, same/cross origin | PASS; target requests 0, forwarded Authorization/apikey 0 |
| Exact URL/ref cases, missing ENV, NEXT_PUBLIC mismatch | PASS |
| Duplicate IDs/slugs and broken references | PASS, fail-closed |
| Application Area relation/name mismatch | PASS, fail-closed |
| Media allowlist | PASS; only `static.tildacdn.com`, HTTP/unknown host rejected |
| 8 MiB actual decoded byte limit | PASS |
| Sitemap coherent snapshot | PASS; one runtime RPC |
| Empty catalog | PASS; no static/Preview fallback |
| Next `unstable_rethrow` and error sanitation | PASS |
| Read-only/no-write assertion | PASS |
| Client bundle ENV/credential/Preview scan | PASS, 0 matches |
| Diff credential scan | PASS, 0 credential matches |
| Conflict-marker scan | PASS, 0 markers |

## 8. Standard QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 459/459 |
| focused H1/M1/adapter regression suite | PASS — 30/30 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `git diff --check` | PASS |

## 9. Scope and Invariance

Unchanged:

- `CatalogRepository` interface;
- `ProductService`;
- Storefront Domain Model;
- UI and URL paths;
- Product Data and Cloud Catalog;
- Published Projection RPC;
- Supabase schema and all migrations;
- ADR-006 status;
- Production.

`app/sitemap.ts` получил только import-boundary change для прямого доступа к
Published loader после удаления concrete repository exports из общего barrel;
route behavior и URL contract не изменены.

Remote connections: 0. Staging/Production connections and writes: 0.
Supabase writes: 0. Migrations: 0. Publication: 0. Deployments: 0. Push: not
performed. Merge into `main`: not performed. Disposable fixtures after QA: 0.

## 10. Known Limitations

- Project identity не извлекается криптографически из service-role token;
  безопасная привязка требует атомарной deployment policy для URL/ref/key.
- Next artifact может содержать отдельные неисполняемые lazy chunks других
  sources; selected Published execution path их не загружает.
- Сохраняются ранее принятые 8 MiB ceiling, отсутствие pagination и
  cross-request cache.
- Artifact не разрешён для staging Preview, merge или Production до успешного
  Independent Adapter Re-Review v3 и отдельных разрешений следующих gates.

## 11. Next Gate

`Independent CloudPublishedCatalogRepository Re-Review v3`.
