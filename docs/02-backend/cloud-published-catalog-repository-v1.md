# Cloud Published Catalog Repository v1

> Нормативная основа: [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md),
> [ADR-002](../00-project/ADR/ADR-002-storefront-repository-boundary.md) и
> [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md).

**Статус:** corrective v1 реализован и проверен локально; ожидает Independent Adapter Re-Review v2

**Версия:** 1.1

**Дата:** 27 июля 2026 года

**Scope:** published-only Storefront read adapter; без UI, Product Data и publication writes

## 1. Назначение

`CloudPublishedCatalogRepository` — Production-safe реализация существующего
`CatalogRepository`. Она не вводит новый service/domain contract и не меняет
`ProductService`:

    Public Server Route
      -> Storefront Service
      -> CatalogRepository
      -> CloudPublishedCatalogRepository
      -> cloud_api.cloud_published_storefront_catalog_v1()
      -> strict runtime validation
      -> Storefront Domain Model

Adapter находится в
`lib/storefront/cloud-published-catalog-repository.ts`. Mapper и безопасная
response boundary находятся рядом в `lib/storefront/`.

## 2. Data-source contract

| Source | Local/Preview | Vercel Production | Назначение |
| --- | --- | --- | --- |
| `static` | разрешён | разрешён | explicit filesystem fallback/local fixture |
| `cloud_preview` | разрешён | запрещён guard-ом | visual review draft-данных staging |
| `cloud_published` | разрешён явно | разрешён | published-only Cloud projection |

Значение по умолчанию остаётся `static`. Неизвестное значение отклоняется.
Ошибка `cloud_published` не переключает runtime на static или cloud_preview.
Rollback источника является отдельным контролируемым ENV change, а не скрытым
fallback внутри request.

## 3. ENV contract

| Variable | Required for `cloud_published` | Exposure | Purpose |
| --- | --- | --- | --- |
| `CATALOG_DATA_SOURCE=cloud_published` | да | server configuration | explicit source selection |
| `NEXT_PUBLIC_SUPABASE_URL` | да | public-name variable, читается server adapter | Supabase origin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да для текущего shared server env validator | public Supabase credential | validator compatibility; не используется вместо service role |
| `SUPABASE_SERVICE_ROLE_KEY` | да | строго server-only | execute approved service-only read RPC |
| `VERCEL_ENV` | предоставляется Vercel | server configuration | запрещает cloud_preview в Production |
| `CYBERMEDICA_ALLOW_LOCAL_SUPABASE_ORIGIN=1` | только synthetic local QA | server-only test flag | разрешает HTTP loopback, но только вне Vercel |

Service key не передаётся в Client Components, payload, errors или logs. Он
используется только общим `createSupabaseServerClient` для одного RPC.
`NEXT_PUBLIC_SUPABASE_URL` для Next artifact задаётся во время build и должен
совпадать с разрешённым runtime origin. Published RPC во время build не
вызывается: sitemap и dynamic slug routes читают snapshot только в runtime.

Для `cloud_published` принимается только canonical origin
`https://<20-char-project-ref>.supabase.co`: HTTPS, без credentials, port,
path, query и hash. Arbitrary/custom hosts, localhost, loopback, private IP,
suffix-confusion, trailing-dot, punycode и encoded host отклоняются. Local
loopback доступен только через test flag выше и всегда запрещён при
`VERCEL=1` или заданном `VERCEL_ENV`.

## 4. Transport и validation

Repository выполняет один `POST` без аргументов:

    /rest/v1/rpc/cloud_published_storefront_catalog_v1
    Accept-Profile: cloud_api
    Content-Profile: cloud_api

Request имеет timeout 10 секунд, `cache: no-store` и `redirect: error` через
общий Supabase server client. Target URL повторно проверяется на same-origin.
301/302/307/308 не follow-ятся, поэтому `Authorization` и `apikey` не могут
попасть на redirect target. Table reads, Preview RPC и write operations
отсутствуют.

Response body читается streaming reader-ом с hard limit 8 MiB decoded bytes.
`Content-Length` используется для раннего fail-closed отказа, но фактический
счётчик байтов применяется всегда. JSON parse и mapping начинаются только после
успешного bounded read; partial или oversized payload не достигает mapper.

До mapping payload проходит
`parsePublishedCatalogProjection()` из `lib/published-catalog/contracts.ts`.
Strict Zod contract проверяет top-level schema, `schemaVersion`, `generatedAt`,
summary counts, public identifiers, references, Products, media, documents,
registrations, Structured Fields, enum и nullable values. Snapshot-level pass
дополнительно запрещает duplicate id/slug для Product, Manufacturer, Category
и Application Area, broken/duplicate references и несовпадающее embedded
Application Area name. Slug schema остаётся lowercase, поэтому case-collision
не проходит routing contract. Extra internal field отклоняет snapshot целиком.

Media URL проходит единый allowlist из `lib/public-media-policy.ts`; этот же
список компилируется в Next `images.remotePatterns` и CSP. На Launch разрешён
только `https://static.tildacdn.com` без credentials и custom port. Unknown
HTTPS host отклоняется до `next/image`.

## 5. Mapping

Mapper создаёт только существующие Storefront `Product`, `Manufacturer`,
`Category` и `CatalogSummary`:

- Product status всегда `active`, потому что RPC contract допускает только
  explicitly published Product;
- manufacturer/category internal reference IDs заменяются public slug IDs;
- key features и specifications сохраняют утверждённый порядок;
- media использует только approved renderable origin, documents — validated
  public HTTPS URLs;
- `preview_draft`, review metadata, approval/batch IDs и staging markers
  отсутствуют;
- featured, compatibility и related products остаются fail-closed, пока этих
  полей нет в public projection.

## 6. Empty published catalog

Snapshot с `products=[]` валиден и не запускает fallback:

- Homepage Hero остаётся доступным, а equipment showcase скрывается;
- Catalog показывает существующий empty state;
- Product lookup возвращает `null`/not found;
- category/manufacturer overview не падает;
- sitemap не создаёт Product URLs;
- static и Preview Products не появляются.

## 7. Cache contract

v1 использует conservative cache policy:

- между HTTP requests — `no-store`;
- внутри одного React server request — request-scoped `React.cache` для одного
  transport/validation/mapping pass;
- Preview и Published loaders являются разными functions и не разделяют cache;
- cross-request TTL отсутствует, поэтому archive/removal не удерживается stale
  application cache.

Sitemap является runtime-dynamic и сначала получает один
`loadCloudPublishedCatalog()` snapshot, затем строит Product, Manufacturer и
static routes из него. Он не выполняет три service/RPC reads. Отдельные HTTP
requests по-прежнему независимы и могут читать новый snapshot; persistent cache
или ISR не добавлены.

Это осознанный performance trade-off до появления измеренного Production
traffic. Pagination и новый invalidation layer в v1 не вводятся.

## 8. Error contract

Fail-closed error boundary различает только server-side codes:
`configuration`, `transport`, `invalid_payload`, `payload_too_large`. Public message одинаков:
`Published catalog is unavailable.`

Production repository обязательно передаёт официальный Next.js
`unstable_rethrow` в response boundary до любой классификации ошибки. Поэтому
Next control-flow exceptions сохраняются без string matching, а реальные
transport/payload failures остаются санитизированными.

В ошибку не включаются URL, Authorization headers, credential values, raw RPC
body, SQL и internal publication metadata. Timeout, permission failure,
malformed JSON, schema mismatch и invalid nested child не возвращают частичный
Storefront catalog.

## 9. Rendering contract

- sitemap: `force-dynamic`, один runtime snapshot, zero Product URLs при empty;
- Product и Manufacturer slug routes: runtime dynamic; `generateStaticParams`
  возвращает `[]` для `cloud_published`, поэтому новые published slugs не
  требуют rebuild;
- route metadata и page body используют request-level memoized loader;
- static и cloud_preview source behavior не смешивается с Published loader;
- build с `cloud_published` выполняет zero RPC и не требует доступности RPC;
- temporary runtime RPC failure fail-closed возвращает safe error UI/response и
  не классифицируется как Next control-flow error.

## 10. Staging verification

После отдельного разрешения controlled Preview использует staging project
`gjlpkqdhlzbfnzzoxlsk` и `CATALOG_DATA_SOURCE=cloud_published`.

Порядок проверки:

1. проверить immutable commit и Preview ENV без вывода значений;
2. подтвердить read-only RPC и ожидаемые counts `0/25/19/7`;
3. проверить Homepage, Catalog, Manufacturer routes, sitemap и not-found;
4. подтвердить отсутствие draft/static fallback и browser credentials;
5. проверить noindex, console и server logs;
6. зафиксировать deployment evidence.

Проверка не публикует Products и не выполняет Supabase writes/migrations.

## 11. Ограничения

- v1 не добавляет cross-request cache или pagination;
- public projection пока не содержит related/compatibility/featured contract;
- Launch media allowlist содержит один явно утверждённый host; расширение
  требует изменения единого policy и отдельного review;
- 8 MiB является hard launch boundary, а не pagination mechanism;
- cross-request cache отсутствует: один отдельный HTTP request может выполнить
  один полный snapshot RPC;
- `NEXT_PUBLIC_SUPABASE_URL` является build-time частью Next artifact;
- Production ENV и Production Catalog publication настраиваются отдельным gate;
- runtime artifact не готов к merge до Independent Adapter Re-Review v2 и
  отдельно разрешённого staging Preview.
