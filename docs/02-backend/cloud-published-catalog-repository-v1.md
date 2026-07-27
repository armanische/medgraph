# Cloud Published Catalog Repository v1

> Нормативная основа: [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md),
> [ADR-002](../00-project/ADR/ADR-002-storefront-repository-boundary.md) и
> [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md).

**Статус:** реализовано и проверено локально; ожидает independent review и Preview

**Версия:** 1.0

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

Service key не передаётся в Client Components, payload, errors или logs. Он
используется только общим `createSupabaseServerClient` для одного RPC. Из-за
существующих `generateStaticParams` Supabase ENV и published RPC должны быть
доступны как во время Vercel build, так и в runtime.

## 4. Transport и validation

Repository выполняет один `POST` без аргументов:

    /rest/v1/rpc/cloud_published_storefront_catalog_v1
    Accept-Profile: cloud_api
    Content-Profile: cloud_api

Request имеет timeout 10 секунд и `cache: no-store` через общий Supabase
server client. Table reads, Preview RPC и write operations отсутствуют.

До mapping payload проходит
`parsePublishedCatalogProjection()` из `lib/published-catalog/contracts.ts`.
Strict Zod contract проверяет top-level schema, `schemaVersion`, `generatedAt`,
summary counts, public identifiers, references, Products, media, documents,
registrations, Structured Fields, enum и nullable values. Extra internal field
отклоняет snapshot целиком. Internal clock `version` намеренно не входит в
public RPC; public clock представлен deterministic `generatedAt`.

## 5. Mapping

Mapper создаёт только существующие Storefront `Product`, `Manufacturer`,
`Category` и `CatalogSummary`:

- Product status всегда `active`, потому что RPC contract допускает только
  explicitly published Product;
- manufacturer/category internal reference IDs заменяются public slug IDs;
- key features и specifications сохраняют утверждённый порядок;
- media и documents используют только HTTPS values, прошедшие validation;
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

Это осознанный performance trade-off до появления измеренного Production
traffic. Pagination и новый invalidation layer в v1 не вводятся.

## 8. Error contract

Fail-closed error boundary различает только server-side codes:
`configuration`, `transport`, `invalid_payload`. Public message одинаков:
`Published catalog is unavailable.`

В ошибку не включаются URL, Authorization headers, credential values, raw RPC
body, SQL и internal publication metadata. Timeout, permission failure,
malformed JSON, schema mismatch и invalid nested child не возвращают частичный
Storefront catalog.

## 9. Staging verification

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

## 10. Ограничения

- v1 не добавляет cross-request cache или pagination;
- public projection пока не содержит related/compatibility/featured contract;
- image hostname должен оставаться совместимым с утверждённым Next.js media
  allowlist;
- Production ENV и Production Catalog publication настраиваются отдельным gate;
- runtime artifact не готов к merge до independent review и staging Preview.
