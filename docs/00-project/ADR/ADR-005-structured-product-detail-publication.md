# ADR-005 — Review-gated Structured Product Detail publication

**Статус:** Proposed

**Дата:** 23 июля 2026 года

**Владельцы:** владелец продукта и технический руководитель CyberMedica

## Context

Storefront Domain Model уже поддерживает `keyFeatures` и specifications, но
Cloud Preview не имеет отдельного хранилища преимуществ, а импортированные
`product_characteristics` содержат legacy metadata, не являющиеся техническими
характеристиками. Runtime HTML fallback нарушил бы fail-closed и provenance
rules. Существующие Cloud entities уже моделируют product-level publication
candidate, manual review decisions, events and audit log, но не имеют
reversible batch для structured Product Detail fields.

## Decision

- Использовать `publication_candidates`, `review_items`, `review_decisions`,
  `publication_events` и `audit_log` как канонический review/publication contour.
- До review создавать immutable `product_detail_candidate_revision`, которая
  фиксирует canonical payload, product identity/version snapshot, schema version
  и рассчитанные на database boundary SHA-256 checksums.
- Привязывать candidate-level approval и каждое field decision к точной revision,
  payload checksum и product identity checksum. Новая revision не наследует
  решения старой.
- Хранить преимущества атомарно в `product_key_features`.
- Расширить `product_characteristics` управляемым origin/namespace и stable
  structured item identity. Legacy и structured rows могут иметь одинаковый
  display key, но не используют общий conflict target.
- Требовать точное последнее approve-decision для каждой публикуемой записи.
- Публиковать service-only транзакцией с idempotency key, payload checksum,
  per-product lock и publication batch.
- Проецировать в Storefront только approved, published, non-archived rows.
- Для каждого batch сохранять полный before/after mutation log. Rollback
  удаляет только rows, созданные этим batch, полностью восстанавливает ранее
  изменённые managed rows и не удаляет review, provenance, batch или audit
  history.

## Alternatives

1. Извлекать данные из legacy HTML во время runtime — отклонено: результат
   непроверяем и не имеет review/provenance gate.
2. Хранить массив преимуществ в `products` — отклонено: теряются атомарные
   решения, ordering и provenance.
3. Создать отдельную таблицу технических характеристик — отклонено: существующая
   `product_characteristics` подходит после явного managed namespace и partial
   identity constraints.
4. Создать параллельную review subsystem — отклонено: существующие candidate и
   decision entities уже обеспечивают необходимую ответственность.

## Consequences

- Legacy metadata больше не может попасть в новый structured Product Detail
  projection как technical specification.
- Candidate schema, immutable revision, canonical hash и field paths становятся
  versioned contract.
- Publication требует manual field decisions и service role.
- ProductService и публичная Domain Model не меняются.
- Репозиторий должен восстановить отсутствующие prerequisite Cloud Foundation
  migrations до воспроизводимого clean-database migration test.

## Security and data impact

- Browser/client write surface не создаётся.
- RPC revoke/grant разрешает вызов только `service_role`.
- RLS policy не раскрывает unpublished/unapproved structured rows.
- Public projection не содержит provenance, reviewer identity, candidate IDs
  или publication batch IDs.
- Исторический v1 writer, не принимающий revision id, теряет service-role
  execute grant после forward-only corrective migration.
- Миграции не содержат backfill и не изменяют Product Data при применении.

## Migration and rollback

Миграции применяются только после отдельного разрешения и staging schema audit.
Historical migrations не редактируются; integrity contract добавляется
forward-only migration. Каждая controlled publication хранит полный previous
state и mutation log. Rollback восстанавливает предыдущий batch только для
одного товара; global destructive rollback и out-of-order rollback запрещены.

ADR остаётся `Proposed` до независимого re-review corrective migration,
revision/approval contract, RLS/grants и exact rollback tests.

## References

- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md)
- [ADR-001 — Cloud First](./ADR-001-cloud-first-source-of-truth.md)
- [ADR-002 — Storefront repository boundary](./ADR-002-storefront-repository-boundary.md)
- [Structured Product Detail Fields v1 report](../../reports/structured-product-detail-fields-v1.md)
