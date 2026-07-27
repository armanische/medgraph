# Published Catalog Projection Corrective Fix v4

> Нормативная основа: [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md),
> [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md) и
> [Published Catalog Projection v1](../04-data/published-catalog-projection-v1.md).

**Статус:** LOCAL READY FOR INDEPENDENT RE-REVIEW v5

**Дата:** 27 июля 2026 года

**Branch:** `codex/published-catalog-projection-corrective-v4`

**Base:** `b7d5a12bbf6babc86c0b5b11e923c6d048a40834`

**Runtime commit:** `87d7f1f79da4d7ba318e99fc46d6367480c6f0fa`

**Scope:** caller-proof projection finalization и exact initialization retry;
без Storefront, Product Data и remote apply

## 1. Findings summary

Independent Re-Review v4 отклонил Corrective v3 из-за одного High и одного
Medium finding:

| Finding | Corrective v4 |
| --- | --- |
| H1: caller мог сбросить authoritative GUC guard и получить второе clock advancement | GUC удалён из correctness boundary; закрытая transactional `xid8` evidence резервирует один абсолютный clock slot |
| M1: exact retry initialization конфликтовал с immutable evidence | explicit initializer различает first initialization, exact retry и mismatch; exact retry возвращает существующий result без write |

Storage ownership, publication binding, malformed isolation, deterministic read
payload и public grants не изменялись.

## 2. Additive migration

- migration:
  `supabase/migrations/202607270002_published_catalog_projection_corrective_v4.sql`;
- SHA-256:
  `aae4a78dfe6f353f994e02bf1e2781a581ec97bf09fd391278ec51bd6c5637f2`;
- migration chain: `21/21` checksum-pinned files;
- предыдущие migrations не изменены;
- Product Data backfill, approval, publication и environment-specific SQL
  отсутствуют.

## 3. Caller-proof terminal-state contract

1. Первый tracked statement захватывает singleton clock `FOR UPDATE`.
2. Internal before-statement trigger получает `pg_current_xact_id()` как
   PostgreSQL `xid8`; caller не передаёт transaction identity.
3. Private `cloud.published_catalog_projection_transactions_v4` фиксирует entry
   checksum, version и `generatedAt` один раз.
4. Private event queue хранит только dirty generation конкретной transaction.
5. Первый payload-changing reconciliation резервирует абсолютный slot
   `entry_version + 1`; net-zero сохраняет `entry_version`.
6. `clock_slot_reserved` и `terminal_finalized` находятся в закрытой таблице,
   которую runtime roles не могут читать или изменять.
7. `SET CONSTRAINTS ... IMMEDIATE` может вызвать раннее reconciliation, но не
   создаёт второй slot.
8. После возврата constraints в deferred новая mutation увеличивает generation
   и может только согласовать final checksum того же slot.
9. Повтор finalizer той же generation является no-op.
10. Clock state записывается абсолютными entry-derived значениями, а не
    инкрементом текущего caller-visible state.
11. GUC не читается и не записывается migration v4; его reset/set не влияет на
    результат.
12. Savepoint rollback откатывает созданные после savepoint generation/event и
    data mutations.
13. Full rollback удаляет transaction evidence, events и clock mutation вместе.
14. `xid8` включает epoch и не принимает caller token; persistent primary key
    исключает повторное создание state той же transaction.
15. Singleton lock задаёт глобальный commit order concurrent tracked writers.

PostgreSQL не предоставляет unforceable user-defined commit trigger. Поэтому
`terminal_finalized` означает закрытый clock slot, а не запрет последующего
внутреннего reconciliation после новой generation: ранняя constraint evaluation
и последующая mutation остаются в одном slot и дают максимум одно committed
advancement.

## 4. Trigger/finalizer state matrix

| Phase | Internal state | Caller writable | Persistent | Rollback behavior | Repeat behavior |
| --- | --- | :---: | :---: | --- | --- |
| Before first dirty write | v4 transaction row отсутствует | Нет | Нет | Нечего откатывать | N/A |
| Entry captured | `xid8`, entry checksum/version/time, generation `0` | Нет | Transactional | Full rollback удаляет row | Та же transaction переиспользует row |
| Dirty transaction | generation увеличена, deferred event создан | Нет | Transactional | Savepoint/full rollback откатывает generation/event/data | Только новая generation требует reconciliation |
| Early constraint evaluation | один slot reserved; final checksum согласован; обработанные events удалены | Нет | До commit — uncommitted | Rollback восстанавливает entry state либо удаляет row | Та же generation — no-op |
| Terminal finalized | `terminal_finalized=true`, один absolute slot, latest reconciled generation | Нет | До commit — uncommitted | Full rollback удаляет всё | Без новой generation — no-op; новая generation обновляет только тот же slot |
| Commit | один clock result и closed transaction evidence; pending events `0` | Нет | Да | N/A | Второго advancement для этого `xid8` нет |
| Rollback | state/events отсутствуют | Нет | Нет | Transactional state removed | N/A |

V3 statement/finalizer triggers удалены additive migration. V4 содержит 38
always before/after triggers для 19 public-impact tables и один always deferred
event finalizer. Bulk и cascading operations coalesced по generation и одному
transaction slot.

## 5. Initialization contract

`cloud.initialize_published_catalog_projection_v4(expected_checksum)`:

- блокирует private singleton initialization state;
- сверяет expected checksum с текущим public payload и existing v3 baseline;
- при first initialization создаёт одну immutable v4 evidence и помечает state;
- exact retry сверяет state, payload и evidence, затем возвращает тот же JSON
  result без `INSERT`, `UPDATE` или нового audit record;
- mismatched/changed checksum, missing/corrupt evidence или contradictory state
  отклоняются fail-closed без silent repair;
- concurrent calls сериализуются singleton row lock и получают один logical
  result при одной evidence row;
- caller может передать только preflight checksum, но не version, timestamp,
  evidence ID, actor, transaction ID или terminal flag.

Legacy `initialize_published_catalog_projection_v3()` также заменён closed
exact-retry validation, чтобы повтор после Corrective v4 не конфликтовал с
immutable v3 evidence.

Controlled staging procedure остаётся отдельным gate: проверить target,
`21/21` manifest, current public checksum и initialization pre-state; затем
вызвать internal initializer с exact checksum в одной контролируемой session.
Remote execution в этой задаче не выполнялся.

## 6. Security and grants

- `anon`, `authenticated`, `service_role`: no table privileges на v4 state,
  event, initialization state и evidence;
- runtime roles: no `EXECUTE` на enqueue, marker, finalizer и initializer;
- helper functions: `SECURITY DEFINER`, fixed `search_path`, без dynamic SQL;
- transaction identity: internal `pg_current_xact_id()`, не caller input;
- clock version/time/checksum и audit principal не принимаются аргументами;
- public RPC остаётся read-only service-only boundary;
- internal state не входит в public projection payload;
- credential scan и conflict-marker scan: PASS.

Privilege regression audit подтвердил: v3 triggers `0`, v4 tracked triggers
`38`, finalizer/initialization immutable guards `ENABLE ALWAYS`, private state
owner `supabase_admin`, runtime table/helper access отсутствует.

## 7. Local test evidence

| Проверка | Результат |
| --- | --- |
| Exact reproduced GUC-reset path: два `archive_product_v1`, `IMMEDIATE` → `DEFERRED`, GUC set/reset | PASS; version delta `1`, final checksum совпадает |
| Три tracked writer statements | PASS; один slot, generation/reconciled `3` |
| Repeated finalizer без новой generation | PASS; no-op |
| Net-zero transaction после ранней evaluation | PASS; exact entry version/time/checksum |
| Savepoint rollback | PASS |
| Full rollback | PASS; transaction evidence отсутствует |
| Concurrent distinct commits | PASS; delta `2`, оба изменения сохранены |
| Concurrent identical commits | PASS; delta `1` |
| First initialization + exact retry | PASS; одинаковый result, evidence rows `1` |
| Concurrent initialization | PASS; два caller result согласованы, evidence rows `1` |
| Changed checksum retry | PASS; fail-closed, evidence неизменна |
| Missing/corrupt evidence | PASS; fail-closed, no silent repair |
| Unauthorized initialization/finalizer/table access | PASS; denied |
| Ownership removal/restore и чужой/unbound/deleted Storage Object | PASS |
| Publish/archive/rollback, stale revision, wrong approval/batch | PASS |
| Malformed Product и child isolation | PASS |
| Draft/archived/approved-only leakage | PASS; hidden |
| Internal metadata leakage | PASS; absent |
| 100 stable reads / after change / after removal | PASS; stable payload/hash/version/time per state |

Standard QA:

- `npm test`: `434/434 PASS`;
- `npm run lint`: PASS;
- `npx tsc --noEmit --pretty false`: PASS;
- `npm run build`: PASS (approved byte-identical runtime tree, Turbopack);
- `npm run build -- --webpack`: PASS (approved byte-identical runtime tree);
- `npm run qa:product-publication:local`: PASS;
- `npm run qa:structured-fields:local`: PASS;
- `npm run qa:published-catalog:local`: PASS;
- `git diff --check`: PASS.

The feature worktree reuses a dependency symlink outside Turbopack root, so both
production builds were executed in the clean dependency-owning approved-base
worktree. `app/`, `components/`, `lib/`, Next config and package manifests are
byte-identical to this branch; Corrective v4 changes only SQL/tests/QA.

All database tests used disposable local PostgreSQL only. Fixtures and matching
containers after cleanup: `0`. Remote connections, remote writes, staging and
Production migrations: `0`.

## 8. Performance evidence

Five warm full reads on the same host and equivalent synthetic evidence:

| Visible Products | v4 median | Comparable v3 median | Change |
| ---: | ---: | ---: | ---: |
| 79 | 11.756 ms | 23.042 ms | −49.0% |
| 1 000 | 63.060 ms | 246.702 ms | −74.4% |
| 10 000 | 586.361 ms | 580.463 ms | +1.0% |

The read RPC was not changed. The 79-Product result is within the required
maximum 25% regression (there is no regression).

Write capacity sample used 10 000 total evidence rows with 79 visible Products,
which is deliberately more pessimistic than the launch baseline:

| Scenario | Raw local psql stages | Clock result |
| --- | --- | --- |
| One public change | statement 27.398 ms; commit 78.181 ms | one slot |
| Two writer calls | statements 27.286 + 0.567 ms; commit 312.257 ms | one slot |
| Ten statements | first 457.337 ms; next nine 0.100–0.230 ms; commit 469.724 ms | one slot |
| GUC/constraint path | first 462.773 ms; immediate evaluation 463.249 ms; second 0.199 ms; commit 463.456 ms | one slot, correct final checksum |
| Net-zero | first 459.009 ms; reverse 0.192 ms; commit 463.090 ms | entry clock restored |

Stage timings overlap transaction work and must not be summed as an end-to-end
SLO. They demonstrate that repeated events of the same generation are O(1)
no-ops and no second persistent finalization is created. Initialization exact
retry performs validation only and does not rewrite state/evidence.

## 9. Compatibility and limitations

Unchanged:

- `CatalogRepository`;
- `ProductService`;
- Storefront runtime and public RPC payload;
- UI and routing;
- Product Data and Cloud Catalog;
- Product/document storage ownership contract;
- Product Publication lifecycle and Structured Fields contract.

Known limits:

- full-snapshot checksum reconciliation remains O(public catalog size);
- singleton clock lock serializes tracked writers;
- one closed evidence row is retained per committed tracked transaction;
- evidence retention/partitioning and a write-heavy/10 000-Product architecture
  require a separate capacity task before declaring such a Production SLO;
- `terminal_finalized` closes the version slot, while later dirty generations in
  the same transaction may reconcile its uncommitted checksum;
- no remote migration or production-like staging latency was measured.

These limits do not block the current 79-Product independent re-review gate but
must not be interpreted as an unlimited-scale guarantee.

## 10. Restrictions and readiness

- Independent review: **PENDING — required next gate**.
- Controlled staging migration: **NOT AUTHORIZED**.
- CloudPublishedCatalogRepository: **NOT AUTHORIZED**.
- Storefront connection: **NOT AUTHORIZED / unchanged**.
- Push: **NOT PERFORMED; separate permission required**.
- Merge in `main`: **NOT PERFORMED**.
- ADR-006: remains **`Proposed`**.
- Production, staging, Supabase, Product Data and Cloud Catalog: unchanged.

Exact next task: `Independent Published Catalog Projection Re-Review v5`.
