# Published Catalog Projection v1

> Нормативная основа: [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md),
> [ADR-001](../00-project/ADR/ADR-001-cloud-first-source-of-truth.md),
> [ADR-002](../00-project/ADR/ADR-002-storefront-repository-boundary.md) и
> [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md).

**Статус:** реализовано и проверено локально; не применено к staging/Production

**Версия:** 1.1 (Corrective v1)

**Дата:** 26 июля 2026 года

**Scope:** published-only read projection; без Storefront adapter и runtime switch

## 1. Назначение

`Published Catalog Projection v1` — Production-safe read boundary между
review-gated Product Publication Foundation и будущим
`CloudPublishedCatalogRepository`. Проекция не публикует данные и не меняет
Product state. Она доказывает public visibility в каждом read и возвращает
только публичный payload.

    Product Publication Foundation
      -> immutable current revision
      -> exact current approval
      -> active publish batch
      -> published mandatory dependencies
      -> cloud_api.cloud_published_storefront_catalog_v1()
      -> strict TypeScript validation
      -> future CloudPublishedCatalogRepository

Cloud Preview RPC и его `preview_draft` semantics не используются.

## 2. Артефакты

- migration:
  `supabase/migrations/202607260002_published_catalog_projection_v1.sql`;
- migration SHA-256:
  `a1c16479913dafb602640019fd8ae7e73391f191552f0f3282b8453557e41e48`;
- additive corrective migration:
  `supabase/migrations/202607260003_published_catalog_projection_corrective_v1.sql`;
- corrective migration SHA-256:
  `6052daa0c727b8272c5071e4e414b65e8ee6e6474e9e46917ccecd079098b7cd`;
- RPC: `cloud_api.cloud_published_storefront_catalog_v1()`;
- typed contract: `lib/published-catalog/contracts.ts`;
- integration fixture:
  `supabase/tests/006_published_catalog_projection.sql`;
- local gate: `npm run qa:published-catalog:local`.

Обе migrations additive-only. Corrective v1 заменяет реализацию того же
internal read function, добавляет закрытые type-check helpers и trigger clock
для public storage dependency. Она не содержит backfill, approval,
publication, Product mutation или remote target.

## 3. Product visibility contract

Product включается только при одновременном выполнении всех условий:

1. `publication_status = published`, `review_state = published`, Product не
   archived и имеет `published_at`;
2. current revision принадлежит Product и проходит повторную SHA-256 проверку;
3. current approval относится к той же revision, review item, payload и Product
   identity;
4. immutable review decision является `approve` точного candidate payload;
5. active batch является `publish`, относится к тем же Product/revision/approval,
   совпадает по payload checksum и publication version;
6. batch result указывает на этот active batch и состояние `published`;
7. manufacturer опубликован и не archived;
8. category опубликована, assignable и не archived;
9. есть хотя бы одна application area; approved revision и текущие links
   совпадают, каждая area опубликована и не archived;
10. `catalog_quality_status = READY`, title/model/slug не пусты;
11. отсутствуют unresolved import blocking errors.

Любое несовпадение исключает Product целиком. Projection никогда не выводит
`approved` как public и не восстанавливает состояние предположением.

## 4. Public content source и child visibility

Base Product content читается из exact immutable `candidate_payload`, связанного
с active publish batch. Это не позволяет новому draft/media/document row после
публикации незаметно попасть в public payload.

| Дочерняя сущность | Public visibility |
| --- | --- |
| Description | exact immutable Product revision; пустое значение становится `null` |
| Application areas | exact revision membership + current published reference |
| Media | exact immutable revision, `https://`, role `primary`/`gallery` |
| Documents | exact immutable revision, status `published`, independently public storage dependency, safe rights, HTTPS URL |
| Registration | exact immutable revision; допустимый status; source URL fail-closed как `null`, потому что URL не входит в approved base revision v1 |
| Key features | independently published Structured Fields batch + exact revision, approval, decision and persisted row |
| Specifications | тот же Structured Fields contract; только `technical_specification`, approved и active rows |

Legacy characteristics, unpublished Structured Fields, private/restricted
storage и child rows из Preview live state не выводятся.

Public document URL использует минимальный independent-dependency contract:
immutable Product revision фиксирует `storageObjectId`, а `storage_objects`
разрешает URL только при `access_status = public`, отсутствии `deleted_at`,
допустимом `rights_status` и HTTPS. Изменение URL, checksum, visibility, rights
или object identity атомарно двигает `storage_objects.updated_at`; timestamp
видимого storage object входит в тот же snapshot `generatedAt`. Поэтому URL не
может измениться в payload как silent mutation. Потеря public contract
fail-close исключает документ, но не независимо опубликованный Product.

Malformed JSON обрабатывается единообразно до cast:

- invalid mandatory Product field или application-area membership исключает
  только Product;
- invalid optional media, document, registration или Structured Field child
  исключает только child;
- соседний валидный Product остаётся доступен;
- unknown enum, отрицательный/out-of-range integer, неверный boolean, scalar
  вместо array/object и `null` не вызывают data-dependent SQL exception.

## 5. Public payload contract

Top-level payload содержит:

- `schemaVersion`;
- deterministic `generatedAt`, вычисленный по exact set публично видимых
  Product, references, Structured Fields и public document storage dependencies;
- `products`;
- published manufacturers;
- published assignable categories;
- published application areas;
- публичные counts.

Product использует только slug-based stable identifiers и public status
`active`. Projection не возвращает внутренние UUID, review/import states,
provenance, checksums, actor/reviewer IDs, publication/approval/batch IDs,
internal notes или staging markers.

`lib/published-catalog/contracts.ts` выполняет strict schema validation,
referential validation и сверку summary counts. Extra internal field или status
`preview_draft` отклоняет payload.

## 6. Security model

Выбран server-side service-only RPC:

- `anon`: no `EXECUTE`;
- `authenticated`: no `EXECUTE`;
- `service_role`: только `EXECUTE` wrapper RPC;
- internal function недоступна напрямую ни одной runtime-role;
- function `SECURITY DEFINER`, `STABLE`, с фиксированным `search_path`;
- аргументы и dynamic SQL отсутствуют;
- write statements и table write grants не добавляются;
- единый PostgreSQL statement использует согласованный MVCC snapshot.

Anon/RLS вариант отклонён для v1. Существующие Product RLS predicates проверяют
только mutable status и недостаточны для revision/approval/batch binding.
Публичный `SECURITY DEFINER` RPC расширил бы attack surface без необходимости:
Storefront repository уже является server-side boundary.

Service role не считается фильтром безопасности: все published-only условия
явно enforced внутри SQL projection, а strict TypeScript validation является
второй fail-closed границей.

## 7. Deterministic ordering

- Products: public `slug`;
- manufacturers/categories/application areas: public `slug`;
- application areas Product: public `slug`;
- media: `sortOrder`, URL;
- documents: title, immutable storage identifier;
- registrations: registration number, immutable record identifier;
- Structured Fields: approved sort order и stable structured item key.

Порядок не выражает `popular`, `featured`, `recommended`, `newest` или иной
неподтверждённый merchandising смысл.

## 8. Query and scale assessment

Projection выполняется одним server-side RPC; сетевого N+1 нет. Supporting
indexes покрывают:

- published Product scan по stable slug;
- Product-to-import lookup;
- unresolved blocking error lookup.

Существующие PK/unique/partial indexes покрывают references, application areas,
publication evidence, media/documents и Structured Fields.

| Масштаб | Оценка |
| --- | --- |
| 79 Products | median 5.154 ms, 49 031 bytes; +10.0% к reviewed 4.686 ms baseline |
| 1 000 Products | median 49.281 ms, 603 431 bytes; +14.9% к reviewed 42.887 ms baseline |
| 10 000 Products | median 526.878 ms, 6 039 430 bytes; +14.8% к reviewed 459.018 ms baseline |

Sample выполнен пятью последовательными full JSON reads после warm-up на
локальном PostgreSQL 17.6.1 с checksum-pinned schema и synthetic published
evidence. 79-Product regression ниже допустимого порога 25%. Контракт остаётся
линейным; на 10 000 Products full snapshot всё ещё является зафиксированным
memory/network capacity risk, а не Production SLO.

Изменять `CatalogRepository` или преждевременно добавлять pagination в этой
задаче запрещено. Поэтому 10 000 — зафиксированный capacity risk, а не
утверждение о Production SLO. Текущий approved baseline равен 79 Products.

## 9. Local evidence

Clean local Supabase PostgreSQL применяет 18 checksum-pinned migrations.
Transactional fixture подтверждает:

- published baseline `2 Products / 1 manufacturer / 1 category / 1 area`;
- draft, in-review, approved-without-publish и archived Products скрыты;
- stale identity, invalid approval и invalid active batch скрыты;
- unpublished mandatory dependency и unresolved blocker скрывают Product;
- published Structured Fields отображаются, unpublished child state — нет;
- private document и insecure media не раскрываются;
- internal metadata отсутствует;
- public document URL и `generatedAt` меняются вместе в одном public dependency
  contract;
- malformed integer, boolean и nested object fail-close изолированы без потери
  валидного соседнего Product;
- невидимый unbound Structured Field с датой 2099 не двигает clock, а видимая
  строка входит одновременно в payload и clock;
- 100 последовательных reads возвращают идентичный JSON и read не меняет table
  counts;
- после `ROLLBACK` disposable fixture counts равны нулю;
- remote connections/writes равны нулю.

## 10. Integration point and limitations

Будущий `CloudPublishedCatalogRepository` должен:

1. вызывать только `cloud_api.cloud_published_storefront_catalog_v1()` с
   server-only credentials;
2. сразу выполнять `parsePublishedCatalogProjection`;
3. fail-close весь read при schema error;
4. адаптировать публичный projection payload к существующей Storefront Domain
   Model без изменения `CatalogRepository` и `ProductService`;
5. не fallback на Cloud Preview или client-side filtering.

Ограничения v1:

- registration source URL намеренно `null`: поле не связано с immutable Product
  revision v1;
- full snapshot pagination/caching не входит в scope;
- migration не применена удалённо;
- ADR-006 остаётся `Proposed` до отдельного controlled staging migration gate.

## 11. Rollback

Runtime rollback не требуется, потому что Storefront пока не подключён к RPC.
Schema rollback выполняется только отдельной forward migration, которая отзывает
EXECUTE, удаляет wrapper/internal function и затем supporting indexes. Migration
v1 не изменяет Product Data, поэтому data rollback отсутствует.
