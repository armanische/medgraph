# Published Catalog Projection Corrective Fix v3

> Нормативная основа: [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md),
> [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md) и
> [Published Catalog Projection v1](../04-data/published-catalog-projection-v1.md).

**Статус:** LOCAL READY FOR INDEPENDENT RE-REVIEW

**Дата:** 27 июля 2026 года

**Scope:** transaction-final projection clock, controlled baseline initialization
и write-capacity boundary; без Storefront, Product Data и remote apply

## 1. Review findings

Independent Re-Review v3 отклонил Corrective v2 из-за одного High и двух Medium
findings:

| Finding | Corrective v3 |
| --- | --- |
| H1: statement-level intermediate states двигали clock | Один entry checksum и один deferred transaction-final comparison |
| M1: existing baseline оставался uninitialized | Atomic baseline checksum initialization + immutable evidence |
| M2: full snapshot умножался на число statements | Не более entry/final calculation на transaction |

Product/document storage ownership не изменялся. Его source migration и SHA-256
остались прежними.

## 2. Additive migration

- migration:
  `supabase/migrations/202607270001_published_catalog_projection_corrective_v3.sql`;
- SHA-256:
  `0838fd15d9e484ac76dde4417ce528a1dbae6f40b0ca4d023a777c97aed0b79d`;
- migration chain: `20/20` checksum-pinned files;
- предыдущие 19 migrations не изменены;
- Product Data backfill, approval, publication и environment-specific SQL
  отсутствуют.

## 3. Transaction-final clock

При первой tracked mutation transaction:

1. получает `FOR UPDATE` lock singleton clock row;
2. проверяет state checksum против текущего public payload;
3. создаёт одну private queue row по `pg_current_xact_id()`;
4. последующие statements только увеличивают statement count;
5. deferred constraint trigger перед commit рассчитывает final checksum;
6. version и `changed_at` меняются один раз, только если entry и final checksum
   различаются;
7. queue row удаляется в той же transaction.

Это обеспечивает:

- net-zero transaction: `0` clock events;
- несколько public statements: `1` clock event;
- hidden-only transaction: `0` clock events;
- exact retry: `0` clock events;
- rollback: `0` persisted queue/state changes;
- concurrent distinct commits: deterministic serialization без event loss;
- concurrent identical commits: одно advancement.

`SET CONSTRAINTS ALL IMMEDIATE` до завершения tracked mutation отклоняется
fail-closed. После ранней финализации новая tracked mutation в той же transaction
также запрещена.

## 4. Controlled initialization

Migration в одной PostgreSQL transaction:

1. блокирует existing singleton state;
2. вычисляет текущий public payload checksum;
3. при uninitialized state сохраняет deterministic existing `generatedAt` и
   checksum без изменения version;
4. при already-initialized state требует exact checksum match;
5. создаёт одну immutable initialization evidence row.

Initialization tables/functions закрыты от `anon`, `authenticated` и
`service_role`. Evidence нельзя UPDATE, DELETE или TRUNCATE даже в replica-mode
integrity fixture.

## 5. Trigger and security boundary

- 38 Corrective v2 triggers удаляются только новой forward migration;
- 38 Corrective v3 tracked triggers покрывают `INSERT`, `UPDATE`, `DELETE` и
  `TRUNCATE` на тех же 19 dependency tables;
- public RPC и ownership SQL не меняются;
- queue/state/initialization tables имеют RLS и no runtime grants;
- enqueue/mark/finalize/bootstrap helpers не имеют runtime `EXECUTE`;
- SECURITY DEFINER functions используют fixed `search_path`;
- dynamic SQL отсутствует;
- projection read остаётся side-effect free.

## 6. Capacity boundary

Corrective v2 выполнял full projection до и после каждого tracked statement.
Corrective v3 выполняет entry calculation один раз и final calculation один раз
на transaction независимо от числа statements.

Singleton lock намеренно сериализует tracked writers для корректного global
commit order. Это сохраняет launch baseline 79 Products, но full-snapshot
projection и write-heavy workload на 10 000 Products остаются отдельным
capacity risk, а не Production SLO.

Локальный 79-Product benchmark: warm full reads `5.554 ms` и `5.468 ms`;
transaction из десяти tracked no-op statements — `103.458 ms`, при этом clock
выполнил один entry и один final calculation, а не двадцать statement-level
calculations.

## 7. Local evidence

- clean chain: `20/20` migrations;
- migration SHA-256 manifest: PASS;
- Product Publication local integration: PASS;
- Structured Fields local integration: PASS;
- Published Catalog local integration: PASS;
- net-zero committed transaction: PASS;
- multi-statement single advancement: PASS;
- hidden/exact retry/rollback: PASS;
- distinct and identical concurrency: PASS;
- bootstrap and immutable evidence (`UPDATE`/`DELETE`/`TRUNCATE`, including
  replica-mode): PASS;
- pre-v3 published-baseline simulation: payload и `generatedAt` сохранены,
  version `0`, checksum совпадает, initialization mode
  `initialized_existing_baseline`, evidence rows `1`;
- privilege/RLS/trigger audit: PASS;
- ownership and malformed isolation regression: PASS;
- `npm test`: PASS;
- lint: PASS;
- TypeScript: PASS;
- production builds: PASS;
- `git diff --check`: PASS.

Все database tests используют только disposable local PostgreSQL. Remote
connections, remote migrations, Supabase writes и publication равны нулю.

## 8. Restrictions and readiness

- Controlled staging migration: **NOT AUTHORIZED / PENDING RE-REVIEW**.
- CloudPublishedCatalogRepository: **NOT AUTHORIZED / PENDING RE-REVIEW**.
- Storefront runtime: unchanged.
- Product Data and Cloud Catalog: unchanged.
- Product/document ownership: unchanged.
- ADR-006: remains `Proposed`.
- Production: unchanged.

Следующий обязательный gate:
`Independent Published Catalog Projection Re-Review v4`.
