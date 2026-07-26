# Published Catalog Projection Corrective Fix v2

**Дата:** 26 июля 2026 года

**Branch:** `codex/published-catalog-projection-corrective-v2`

**Base:** `b59f676d51bef5501007f954959575606f15b1b7`

**Статус:** READY FOR INDEPENDENT RE-REVIEW; NOT PUSHED; NOT MERGED

## 1. Scope

Исправлены только два finding Independent Published Catalog Projection
Re-Review v2:

- H1: removal/hiding public content менял payload без продвижения
  `generatedAt`;
- M1: public Storage Object не имел доказанной entity-level связи с Product.

`CatalogRepository`, `ProductService`, Storefront runtime, UI, routing,
Product Data, publication lifecycle и публичный projection schema не менялись.

## 2. Monotonic projection clock

Выбран `Public Projection Version State` — закрытая singleton row:

- `version`: monotonic sequence;
- `changed_at`: последнее committed public payload change;
- `payload_checksum`: checksum public JSON без `generatedAt`;
- `initialized`: совместимый bootstrap marker.

Tracked statement guards захватывают before/after public checksums. AFTER guard
сначала блокирует singleton row, затем повторно читает итоговую projection,
поэтому concurrent commits сериализуются, а concurrent identical outcome не
создаёт ложное событие. Clock меняется только при отличающемся public checksum.

Свойства контракта:

- payload change и state update находятся в одной PostgreSQL transaction;
- rollback mutation откатывает state update;
- `changed_at` выбирается server-side и всегда больше предыдущего минимум на
  одну микросекунду;
- hidden-only write, internal timestamp-only write и exact retry не меняют
  version/clock;
- public read получает singleton clock за O(1), без scan audit/event history;
- internal version/checksum не входят в public payload.

Clock продвигают только фактически изменившие JSON операции над published
Product, mandatory references, application-area membership, publication
evidence/bindings, unresolved blockers, published Structured Fields, public
document ownership и public Storage Object dependencies. Триггер может
наблюдать internal write, но checksum comparison не создаёт event, если public
payload до и после одинаков.

## 3. Removal semantics

Локально доказано продвижение clock для:

- Product archive;
- Product publication rollback;
- unresolved blocking error;
- public document → private;
- document deletion;
- HTTPS → HTTP;
- Product/document ownership removal;
- visible Structured Field evidence invalidation/removal.

Доказано отсутствие продвижения для hidden Storage Object mutation, exact
retry, visible-row timestamp-only churn и rolled-back transaction.

## 4. Product/storage ownership

Document возвращается только при одновременном доказательстве:

1. immutable approved Product revision содержит `storageObjectId` и exact
   document attributes;
2. `product_documents` связывает тот же Product с тем же Storage Object;
3. relation опубликована и совпадает по title, document type, language и
   `is_official`;
4. Storage Object public, not deleted, rights-safe и имеет HTTPS URL.

Relation в approved candidate доказывает принадлежность в review/publication
contract; текущая exact relation доказывает, что ownership остаётся активным.
Storage другого Product и unbound public object исключаются fail-closed без
исключения всего Product.

## 5. Bootstrap and backfill

Migration не выполняет data backfill и не публикует Products. До первого
реального public change RPC сохраняет legacy deterministic source clock.
Первый payload-changing committed write атомарно инициализирует singleton clock
значением строго больше прежнего public/source clock и сохраняет current public
checksum.

Перед controlled staging migration необходим отдельный разрешённый gate:

1. проверить project ref и 19-file checksum manifest;
2. снять read-only backup/evidence;
3. проверить существующий published baseline и Product/document ownership gaps;
4. выполнить dry-run, предлагающий только corrective v2 migration;
5. применить migration без backfill;
6. проверить stable reads и первую controlled synthetic public transition;
7. не подключать Storefront до независимого re-review.

## 6. Security and grants

Disposable local database подтвердила:

- wrapper: `SECURITY DEFINER`, `STABLE`, service-role-only;
- `anon` EXECUTE: false;
- `authenticated` EXECUTE: false;
- internal capture helper service-role EXECUTE: false;
- clock state SELECT/WRITE для anon/authenticated/service_role: false;
- clock state RLS: enabled;
- owner: `supabase_admin`;
- 38 tracked before/after triggers: `ENABLE ALWAYS`;
- fixed `search_path`; dynamic SQL отсутствует;
- internal clock/ownership/publication metadata в JSON отсутствуют.

## 7. Test evidence

### Standard QA

- `npm test`: 432/432 PASS;
- `npm run lint`: PASS;
- `npx tsc --noEmit --pretty false`: PASS;
- `npm run build`: PASS (Turbopack; sandbox bind limitation повторно проверен
  вне sandbox);
- `npm run build -- --webpack`: PASS;
- `git diff --check`: PASS;
- conflict-marker scan: 0;
- credential-value candidates: 0.

### Database QA

- clean chain from zero: 19/19 PASS;
- application after prior 18 migrations: PASS;
- migration manifest SHA-256 validation: PASS;
- Product Publication integration: PASS;
- Structured Fields integration: PASS;
- Published Projection integration: PASS;
- clock tests 1–12: PASS;
- ownership tests 13–18: PASS;
- concurrent committed public changes: version delta 2, event loss 0;
- 100 stable reads: one JSON hash and one `generatedAt`;
- RLS/grants/internal metadata: PASS;
- transactional fixture cleanup: 0 retained rows;
- disposable containers after QA: 0.

### Performance

Five warm sequential full-snapshot reads on local PostgreSQL 17.6.1:

| Products | Median | Bytes | Re-review baseline | Delta |
| ---: | ---: | ---: | ---: | ---: |
| 79 | 6.434 ms | 49,031 | 5.789 ms | +11.1% |
| 1,000 | 82.265 ms | 603,431 | 80.805 ms | +1.8% |
| 10,000 | 587.134 ms | 6,039,430 | 537.738 ms | +9.2% |

79 Products остаются ниже разрешённого 25% regression threshold. Existing
10,000-Product full-snapshot capacity limitation не изменялась.

## 8. Migration integrity

- file:
  `supabase/migrations/202607260004_published_catalog_projection_corrective_v2.sql`;
- SHA-256:
  `26f7dd90e65665ade5729dc5e0934fe7b8f15979cdaaee1c92cc859d66d6162d`;
- additive and forward-only;
- prior migrations `202607260002` и `202607260003` не изменены;
- destructive DDL, backfill, approval, publication и environment-specific
  target отсутствуют.

## 9. Remote and release invariance

- remote connections: 0;
- remote writes: 0;
- staging migrations: 0;
- Production migrations/deployments: 0;
- Supabase/Cloud Catalog/Product Data changes: 0;
- push: не выполнялся;
- merge в `main`: не выполнялся;
- ADR-006: `Proposed` до controlled staging migration и следующего независимого
  review.

## 10. Known limitations

- projection остаётся full snapshot; pagination/caching не входит в scope;
- singleton сериализует public-changing writes. Это намеренный consistency
  boundary; при текущей publication частоте он безопаснее потерянных events;
- ownership contract использует существующую Product Document relation, а не
  новую media subsystem;
- remote baseline и ownership gaps должны быть проверены отдельным read-only
  staging preflight;
- artifact не готов к staging, Storefront integration или merge до следующего
  independent re-review.
