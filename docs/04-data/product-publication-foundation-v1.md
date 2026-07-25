# Product Publication Foundation v1

**Дата:** 25 июля 2026 года

**Scope:** базовая Cloud Product publication; без Storefront, UI и remote apply

**Architecture status:** ADR-006 Proposed

## 1. Product Publication Architecture

Publication Foundation закрывает разрыв между импортированным Cloud Product и
будущей published-only Storefront projection:

```text
Import record
  -> Product (draft / Imported)
  -> immutable Product publication revision
  -> Review item + exact revision-bound approval
  -> service-only transactional publication
  -> Product (published + active batch)
  -> future published-only repository
```

`ProductService`, `CatalogRepository`, публичные маршруты и Storefront runtime не
изменены. Structured Product Detail fields остаются отдельным additive contour
ADR-005 и не публикуются базовым Product writer.

Компоненты foundation:

| Компонент | Ответственность |
| --- | --- |
| `product_publication_revisions` | immutable candidate, identity и checksums |
| `product_publication_approvals` | exact revision-bound approval |
| `product_publication_batches` | append-only publish/archive/rollback journal |
| Product state guard | разрешённые transitions и content lock |
| `cloud_api.*_v1` | единственный service-only mutation boundary |
| `lib/product-publication` | строгий server-only typed adapter |

## 2. Publication Workflow

1. Import создаёт или обновляет Product в существующем `draft` state и сохраняет
   `import_products.existing_product_id`.
2. Service создаёт publication revision с idempotency key. Database проверяет
   quality/dependencies, фиксирует identity и payload и переводит Product в
   `in_review`.
3. Reviewer/Admin approval через service boundary повторно сверяет текущий
   Product с immutable revision и записывает точное решение.
4. Publish writer снова проверяет Product, approval, hashes и dependencies,
   создаёт batch и атомарно переводит Product в `published`.
5. Archive создаёт отдельный batch и переводит текущий published Product в
   `archived`.
6. Rollback допускается только для текущего action, создаёт новый audit batch и
   восстанавливает exact `previous_state`.

Ни один шаг не выполняется migration, build или deploy автоматически.

## 3. Publication State Machine

| Product state | Бизнес-смысл | Разрешённый следующий state | Кто меняет |
| --- | --- | --- | --- |
| `draft` | Imported; ещё не в publication review | `in_review` | revision RPC |
| `in_review` | immutable revision ожидает решение | `approved` | approval RPC |
| `approved` | exact revision approved | `published` | publish RPC |
| `published` | публично допустимый Product с active batch | `archived` | archive RPC |
| `archived` | Product снят с публичной выдачи | нет обычного forward transition | новый workflow |

Контролируемый rollback разрешает `archived -> published` и
`published -> approved` только по текущему batch. Любой неизвестный статус,
прямая попытка перейти через state или `published` без active batch отклоняются.

## 4. Publication Rules

До revision, approval и publication выполняются fail-closed gates:

- Product существует и имеет воспроизводимый import record;
- `catalog_quality_status = READY`;
- manufacturer существует и опубликован;
- category существует, опубликована и assignable;
- заполнена model;
- существует хотя бы одна application area, все связанные области опубликованы;
- отсутствуют unresolved `import_blocking_errors`;
- review item не blocked/rejected/archived;
- audit actor существует; publication actions разрешены только `admin`/`service`;
- approval относится к точной immutable revision и checksum;
- current identity/payload byte-for-byte совпадают с approved revision.

Нарушение любого условия останавливает statement. Partial Product state, batch
или audit row не сохраняется.

## 5. Publication Transaction Design

Каждый mutation RPC является PostgreSQL transaction boundary и использует:

- `pg_advisory_xact_lock` по Product;
- `SELECT ... FOR UPDATE` для актуального Product/action;
- unique idempotency key;
- immutable candidate и approval hashes;
- database trigger, разрешающий state transition только текущему writer action;
- append-only batch и `audit_log` в той же transaction.

Exact retry возвращает исходный batch/revision/approval. Повтор revision после
того, как Product перешёл дальше по lifecycle, не откатывает его state.

## 6. Publication Audit Design

Revision сохраняет:

- Product identity (`id`, source UID/checksum, snapshot/import version);
- canonical base payload;
- schema/revision number;
- identity, candidate и combined checksums;
- actor и время создания.

Approval сохраняет reviewer, rationale, review decision, revision и checksums.
Каждый action batch сохраняет actor, source, idempotency key, previous/result
state, revision/approval link и время. `audit_log` дополняет evidence; revision,
approval и batch запрещено изменять или удалять.

## 7. Rollback Strategy

Rollback:

- принимает конкретный текущий publication batch;
- блокирует Product и отклоняет out-of-order target;
- сверяет current state с `result_state` target batch;
- восстанавливает только поля из exact `previous_state`;
- создаёт новый immutable `rollback` batch и audit row;
- не удаляет Product, import, revision, decisions, approval или previous batches;
- является идемпотентным для exact idempotency key.

Schema rollback не выполняется destructive-командой. При необходимости он
оформляется отдельной reviewed forward migration.

## 8. Service-only API

Typed server adapter экспортирует:

- `createProductPublicationRevision`;
- `approveProductPublicationRevision`;
- `publishProduct`;
- `archiveProduct`;
- `rollbackProductPublication`.

Adapter принимает только существующий `SupabaseServerClient` с
`access = service_role`, валидирует input/output Zod-схемами и не экспортируется
из Storefront. Публичный API route не создан.

## 9. Automated Validation

Disposable local PostgreSQL/Supabase fixture применяет полный forward migration
chain и проверяет:

- successful review/approval/publication lifecycle;
- exact retry revision, approval, publish и rollback;
- unapproved Product rejection;
- missing/unpublished dependencies;
- stale approved payload;
- forced late failure with transaction rollback;
- direct state bypass and post-approval content mutation rejection;
- archive and exact rollback;
- append-only evidence;
- RLS/grants and unknown-status fail-closed behavior;
- zero committed fixture rows after transactional cleanup.

Команда: `npm run qa:product-publication:local`. Она использует только локальный
Docker image и не читает Supabase credentials.

## 10. Boundaries and next gates

- Migration не применена к staging или Production.
- Ни один существующий Product не approved/published этой задачей.
- `CloudPublishedCatalogRepository` не реализован.
- ADR-006 должен пройти independent code/security review, после чего требуется
  отдельное разрешение на controlled staging migration и synthetic test.
- После принятия ADR и staging gate можно проектировать published-only read
  source без изменения `CatalogRepository` или `ProductService` contracts.
