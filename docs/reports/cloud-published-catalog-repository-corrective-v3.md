# CloudPublishedCatalogRepository Corrective Fix v3

**Дата:** 27 июля 2026 года

**Branch:** `codex/cloud-published-catalog-repository-corrective-v3`

**Approved base:** `0be7b683db0221ad3fbf2a986d1f8ae2e3f4c0b6`

**Runtime commit:** `378b314`

**Статус:** READY FOR TARGETED INDEPENDENT ADAPTER RE-REVIEW V4

## 1. Findings Summary

Corrective закрывает только два finding из Independent
CloudPublishedCatalogRepository Re-Review v3:

- H1: URL/ref consistency дополнена immutable environment-specific allowlist;
- M1: Published sitemap helper загружается динамически только после выбора
  `cloud_published`.

Закрытые redirect, credential forwarding, Next control-flow, strict validation,
media, 8 MiB reader, coherent sitemap, empty catalog, no-write и no-fallback
контракты не перерабатывались.

## 2. Environment-specific Allowlist

Allowlist находится в server code и не принимает approved ref из внешней
конфигурации:

| Runtime environment | Единственный approved ref |
| --- | --- |
| `VERCEL_ENV=production` | `clbzibuusyuajsylcbvl` |
| `VERCEL_ENV=preview` | `gjlpkqdhlzbfnzzoxlsk` |
| local development/test | `gjlpkqdhlzbfnzzoxlsk` |

После allowlist выполняется exact URL/ref binding: HTTPS, canonical hostname,
без credentials, port, path, query и hash. `NEXT_PUBLIC_*`, request URL, query,
cookie и headers не участвуют в выборе approved ref.

Missing `VERCEL_ENV` разрешён только вне Vercel при
`NODE_ENV=development|test`. `VERCEL=1` без `VERCEL_ENV`, unknown environment и
non-local `NODE_ENV=production` отклоняются. Special local QA ref
`localdevelopment0001` требует `NODE_ENV=test`, explicit
`CYBERMEDICA_ALLOW_LOCAL_SUPABASE_ORIGIN=1`, отсутствие `VERCEL_ENV` и
отсутствие Vercel runtime. Preview/Production не могут включить это исключение.

## 3. Rejection Evidence

Automated matrix проверяет Production/Preview/local, cross-environment pair,
matching third-project pair, malformed/mismatched URL/ref и отсутствующие ENV.
Согласованная произвольная пара
`abcdefghijklmnopqrst` + соответствующий Supabase hostname отклоняется во всех
трёх environment modes.

Для пяти representative rejected configurations instrumented transport дал:

- requests: `0`;
- requests with `Authorization`/`apikey`: `0`;
- safe errors: `SupabaseEnvironmentError` до client creation.

Built runtime с Production environment и согласованной staging URL/ref pair
вернул safe HTTP 500 для sitemap; trace не содержал ни одного RPC call, а log
содержал только публично безопасный `configuration` code/message без URL, ref
или key.

## 4. Build/Runtime Binding

| Build configuration | Runtime configuration | Result |
| --- | --- | --- |
| no Published server ENV | Production | PASS; Published RPC только к Production runtime host/key |
| staging URL/ref/key A | Production URL/ref/key B | PASS; Production host, `credentialsMatch=true` |
| Production URL/ref/key A | staging verification URL/ref/key B | PASS; staging host, `credentialsMatch=true` |

Оба synthetic build-time key marker дали `0` matches во всём `.next`.
Published server ENV/key names и synthetic markers дали `0` matches в
`.next/static`. Runtime использовал только значения текущего process; build
origin/key не использовались.

## 5. Bidirectional Sitemap Source Trace

Webpack trace одного и того же artifact:

| Runtime source | Concrete implementation chunk | Opposite chunks | Sitemap RPC calls |
| --- | --- | --- | --- |
| `cloud_published` | Published `697` | Preview `745`: 0; filesystem `565`: 0 | Published: 1; Preview: 0 |
| `cloud_preview` | Preview `745` | Published `697`: 0; filesystem `565`: 0 | Published: 0; Preview: 0 |
| `static` | filesystem `565` | Published `697`: 0; Preview `745`: 0 | Published: 0; Preview: 0 |

Chunk numbers являются evidence конкретного webpack build, а не стабильным
API. Source-level test дополнительно подтверждает порядок branch → dynamic
import и fail-closed dynamic import error. `cloud_preview` sitemap по
существующему noindex contract возвращает пустой список и не вызывает Preview
RPC; concrete Preview repository при этом является единственным выбранным
adapter.

Operational isolation означает отсутствие concrete opposite adapter в
selected execution trace, opposite RPC, mapper execution, fallback и draft
leakage. Harmless Preview literals в unrelated shared chunks и неисполняемые
lazy chunks полного build artifact не входят в security boundary.

## 6. Regression Evidence

| Contract | Result |
| --- | --- |
| Redirect 301/302/303/307/308 | PASS; forwarding target requests и credential headers = 0 |
| Next `unstable_rethrow` | PASS |
| Strict payload/relational validation | PASS |
| Media allowlist | PASS |
| Actual decoded 8 MiB limit | PASS |
| One coherent sitemap snapshot | PASS |
| Empty published catalog | PASS, без fallback |
| Production `cloud_preview` guard | PASS |
| Unknown source/dynamic import error | PASS, без fallback |
| Read-only/no-write assertion | PASS |
| Protected Storefront contracts | byte-identical base |

## 7. Standard QA

| Check | Result |
| --- | --- |
| `npm test` | PASS — 468/468 |
| focused adapter/security regression suite | PASS — 33/33 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `CATALOG_DATA_SOURCE=cloud_published npm run build` | PASS — Next.js 16.2.9 Turbopack |
| `CATALOG_DATA_SOURCE=cloud_published npm run build -- --webpack` | PASS — Next.js 16.2.9 webpack |
| `git diff --check` | PASS |
| credential-pattern scan of changed files | PASS — 0 matches |
| client bundle server ENV/credential scan | PASS — 0 matches |
| conflict-marker scan | PASS — 0 matches |

Первый sandboxed test/build запуск получил только local `listen EPERM`; те же
команды с разрешёнными loopback test workers прошли полностью.

## 8. Scope and Invariance

Без изменений:

- `CatalogRepository`;
- `ProductService`;
- Storefront Domain Model;
- UI и URL routing behavior;
- Product Data и Cloud Catalog;
- Published Projection RPC;
- Supabase schema и все migrations;
- ADR-006 Accepted;
- Production.

Remote connections: 0. Remote writes: 0. Supabase migrations: 0. Publication:
0. Deployments: 0. Push: not performed. Merge into `main`: not performed.
После QA активных disposable local servers: 0.

## 9. Known Limitations

- Identity allowlist не проверяет недокументированные JWT claims; безопасность
  обеспечивают compiled ref map, exact origin binding и atomic environment
  configuration.
- Полный Next artifact может содержать неисполняемые lazy chunks других source
  и harmless literals shared layout/framework code. Гарантируется selected
  execution trace, а не textual absence всего artifact.
- Сохраняются принятые 8 MiB ceiling, отсутствие pagination и cross-request
  cache.
- Artifact не разрешён для Published-source staging Preview, merge или
  Production до targeted Independent Adapter Re-Review v4 и отдельных
  последующих разрешений.

## 10. Next Gate

`Independent CloudPublishedCatalogRepository Re-Review v4`.
