# Architecture Decision Records

> Нормативная основа: [PROJECT_GUIDE.md](../PROJECT_GUIDE.md).

## Назначение

ADR фиксирует значимое решение, рассмотренные альтернативы и последствия. Реестр не используется для обычных implementation details.

## Статусы

- Proposed;
- Accepted;
- Rejected;
- Deprecated;
- Superseded by ADR-NNN.

## Именование

Формат: ADR-NNN-kebab-case-title.md. Номер не переиспользуется.

## Обязательная структура

1. Title, status, date, owners.
2. Context.
3. Decision.
4. Alternatives.
5. Consequences.
6. Security/data impact.
7. Migration and rollback.
8. References.

Accepted ADR не переписывается при смене решения. Создаётся новый ADR, а старый получает ссылку Superseded.

## Реестр

| ADR | Решение | Статус |
| --- | --- | --- |
| [ADR-001](./ADR-001-cloud-first-source-of-truth.md) | Supabase как operational Source of Truth | Accepted |
| [ADR-002](./ADR-002-storefront-repository-boundary.md) | Storefront Services и repository boundary | Accepted |
| [ADR-003](./ADR-003-staging-acceptance-gate.md) | Staging как обязательная среда приёмки | Accepted |
| [ADR-004](./ADR-004-main-production-branch-separation.md) | Разделение интеграционной и Production-веток | Accepted |
| [ADR-005](./ADR-005-structured-product-detail-publication.md) | Review-gated publication structured Product Detail fields | Proposed |
