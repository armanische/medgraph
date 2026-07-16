# First Published Products — MVP-058

Дата: 2026-07-16  
Ветка: `feature/publication-first-products`

## Результат

Publication Pipeline подготовлен к первой ручной production-публикации пяти продуктов без обхода Human Review. Selection является дополнительным fail-closed gate: продукт должен одновременно находиться в scope и иметь достаточные latest human approvals с актуальными snapshots, valid evidence, DocumentVersion, artifact и official source.

Ни один approval не создавался автоматически. На момент реализации real decisions отсутствуют, поэтому production catalog остаётся пустым.

## Scope и readiness

| Продукт | Review Items | Approved | Pending | Eligible |
| --- | ---: | ---: | ---: | --- |
| Philips IntelliVue MX400 | 48 | 0 | 48 | нет |
| GE HealthCare CARESCAPE B450 | 5 | 0 | 5 | нет |
| Hamilton H900 | 23 | 0 | 23 | нет |
| Dräger Babylog VN800 | 129 | 0 | 129 | нет |
| Ambu VivaSight 2 DLT | 5 | 0 | 5 | нет |

Итого: 210 items, 0 approved, 0 eligible products. Readiness доступен через `npm run publication:candidates`; команда read-only и указывает `/internal/reviewer` как единственное место принятия решений.

## Public schema v2

Product record содержит public ID/slug и только безопасную проекцию: name/model, manufacturer, category, description, specifications, compatibility, documents без checksum, official sources, `updatedAt`, coverage и status.

Запрещены Review/Evidence/DocumentVersion IDs, artifact paths, internal JSON, comments, notes и SHA hashes. Schema validator проверяет allowlist ключей, структуру documents/specifications/sources, URL и timestamp до записи файлов.

## Fail-closed behavior

- Последний decision выбирается детерминированно по `reviewedAt` и decision ID.
- Невалидный decision timestamp блокирует item как `invalid_decision`.
- Latest decision должен быть `approve` с next status `approved`.
- Более новый reject/conflict отменяет eligibility старого approval.
- Stale snapshot блокирует item и не может удовлетворить product policy.
- Product вне first-publication scope получает `not_selected`.
- Publication build не пишет в Review Decision store.

## Текущее безопасное состояние

`Published products = 0`. Пустой каталог является ожидаемым результатом до ручного review. UI уже читает Published Catalog и автоматически покажет безопасные карточки после успешных `publication:build` и `publication:audit`; для неопубликованных записей сохраняется fallback.
