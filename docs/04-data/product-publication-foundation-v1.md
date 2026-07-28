# Product Publication Foundation v1

**Дата:** 26 июля 2026 года

**Scope:** базовая Cloud Product publication; без Storefront, UI и remote apply

**Architecture status:** ADR-006 Proposed

## 1. Product Publication Architecture

Publication Foundation закрывает разрыв между импортированным Cloud Product и
будущей published-only Storefront projection:

```text
Import record
  -> Product (draft / Imported)
  -> immutable Product publication revision
  -> authenticated immutable Review decision
  -> service consumption + exact revision-bound approval
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
| Product current evidence pointers | canonical current revision и approval |
| Product state guard | разрешённые transitions и content lock |
| dependency guards | persistent reference integrity после publication |
| `cloud_api.*_v1` | authenticated review + service-only mutation boundary |
| `lib/product-publication` | строгий server-only typed adapter |

## 2. Publication Workflow

1. Import создаёт или обновляет Product в существующем `draft` state и сохраняет
   `import_products.existing_product_id`.
2. Service создаёт publication revision с idempotency key. Actor выводится из
   trusted service context; caller не передаёт UUID. Database проверяет
   quality/dependencies, фиксирует identity и payload и переводит Product в
   `in_review`.
3. Authenticated Reviewer/Admin записывает immutable review decision. Reviewer
   определяется только через `auth.uid()` и доверенный `user_profiles` role.
4. Service approval consumption принимает ID существующего decision, повторно
   сверяет текущий Product с immutable revision и создаёт approval. Reviewer UUID
   и rationale не принимаются от service caller.
5. Publish writer снова проверяет canonical current revision/current approval,
   hashes и dependencies,
   создаёт batch и атомарно переводит Product в `published`.
6. Archive создаёт отдельный batch и переводит текущий published Product в
   `archived`.
7. Rollback допускается только для текущего action, создаёт новый audit batch и
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
- существует ровно один trusted Product publication service principal;
- authenticated reviewer identity соответствует `auth.uid()` и profile role;
- approval потребляет существующий immutable review decision;
- approval относится к точной immutable revision и checksum;
- revision и approval совпадают с current evidence pointers Product;
- current identity/payload byte-for-byte совпадают с approved revision.

Нарушение любого условия останавливает statement. Partial Product state, batch
или audit row не сохраняется.

## 5. Publication Transaction Design

Каждый mutation RPC является PostgreSQL transaction boundary и использует:

- `pg_advisory_xact_lock` по Product;
- `SELECT ... FOR UPDATE` для актуального Product/action;
- deterministic `FOR SHARE` locks для manufacturer, category, application areas
  и связей Product;
- unique idempotency key;
- immutable candidate и approval hashes;
- database trigger, разрешающий state transition только текущему writer action;
- append-only batch и `audit_log` в той же transaction.

Reference guards запрещают unpublish/archive mandatory reference и изменение
Product/application-area link, пока зависимый Product опубликован. Поэтому
publication contract сохраняется не только в момент writer transaction.

Exact retry возвращает исходный batch/revision/approval. Concurrent exact
approval сериализуется до lookup и возвращает один approval. Повтор revision после
того, как Product перешёл дальше по lifecycle, не откатывает его state.

## 6. Publication Audit Design

Revision сохраняет:

- Product identity (`id`, source UID/checksum, snapshot/import version);
- canonical base payload;
- schema/revision number;
- identity, candidate и combined checksums;
- actor и время создания.

Approval сохраняет trusted reviewer, rationale, pre-existing review decision,
revision и checksums.
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

Service adapter не принимает `actorId`, `reviewerId` или approval rationale.
`approveProductPublicationRevision` принимает только current revision и immutable
`reviewDecisionId`. Authenticated decision RPC не является Storefront API.

## 9. Automated Validation

Disposable local PostgreSQL/Supabase fixture применяет полный forward migration
chain и проверяет:

- successful review/approval/publication lifecycle;
- spoofed reviewer rejection и trusted audit identity;
- stale approved revision replay rejection;
- persistent dependency guards после publication;
- current revision supersession и review lifecycle reset;
- two-session concurrent approval idempotency;
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

## 10. Independent Review Corrective Findings

| Finding | Corrective invariant |
| --- | --- |
| H1 Trusted Approval Identity | Human decision создаётся authenticated RPC с `auth.uid()`; service consumption не принимает identity; service actions используют database-resolved service principal. |
| H2 Persistent Dependency Integrity | Publish блокирует mandatory reference rows; reference/link guards запрещают последующий contract drift для published Product. |
| H3 Current Approved Revision | Product current revision/current approval pointers supersede старое evidence; batch trigger разрешает publish только current pair. |
| M1 Relational integrity | Product, current evidence и active publish batch проверяются database triggers. |
| M2 Concurrent approval | Advisory/Product locks берутся до approval lookup; exact concurrent retry возвращает один approval. |
| M3 Review lifecycle | Новая immutable revision всегда переводит shared review item в `in_review` и очищает `reviewed_at`. |

Forward-only corrective migration:
`202607260001_product_publication_foundation_corrective_v1.sql`.

## 11. Boundaries and next gates

- Migration не применена к staging или Production.
- Ни один существующий Product не approved/published этой задачей.
- `CloudPublishedCatalogRepository` не реализован.
- ADR-006 должен пройти independent code/security review, после чего требуется
  отдельное разрешение на controlled staging migration и synthetic test.
- После принятия ADR и staging gate можно проектировать published-only read
  source без изменения `CatalogRepository` или `ProductService` contracts.

## 12. Candidate payload completeness corrective

Additive migration
`202607290001_publication_candidate_payload_completeness_corrective_v1.sql`
extends the existing immutable v1 candidate with canonical Product SEO and the
complete active publishable characteristic array. It does not change the hash
algorithm, lifecycle RPCs, revision schema or Storefront projection.

The characteristic contract uses namespaced natural identities (`legacy:key`
or `structured:structured_item_id`) and deterministic presentation ordering;
environment-local characteristic UUIDs and volatile/internal provenance are
excluded. Existing review, approval and publication stale checks automatically
consume the expanded checksum because they all recompute the same canonical
helper. The full contract is documented in
`product-publication-candidate-payload-v1.md`.

Additive migration
`202607290002_publication_candidate_function_owner_alignment_v1.sql`
explicitly normalizes the internal candidate helper owner to the authoritative
`postgres` role. It changes ownership only; the security-invoker mode, fixed
search path, function body, candidate checksum and closed runtime ACL remain
unchanged.
