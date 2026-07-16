# Human Review Pilot Report

Дата: 2026-07-16  
Ветка: `feature/publication-pipeline`

## Результат

Подготовлен human-only workflow для реальной Review Queue из 5 480 items. Реальные decisions не создавались: все items остаются `pending_review`, publication-ready products — 0, Published products — 0. Это обязательное безопасное состояние до действий пользователя.

Пилотная выборка ограничена пятью продуктами с реальными review reports и evidence/artifact context:

| Производитель | Product slug |
| --- | --- |
| Ambu | `wave2-ambu-vivasight-2-dlt` |
| Hamilton | `wave2-hamilton-h900` |
| Dräger | `wave2-drager-babylog-vn800` |
| Philips | `wave2-philips-intellivue-mx400` |
| GE HealthCare | `wave2-ge-carescape-b450` |

FS510 отсутствует в текущей Review Queue и поэтому не добавлялся искусственно и не может быть опубликован через этот workflow.

## Что проверено

- Реальные reports загружаются в единственный `/internal/reviewer` workspace.
- Item view показывает normalized/raw value, evidence, official URL, DocumentVersion, artifact, locator, profile, confidence, warnings и историю.
- Product view показывает counts, coverage, evidence completeness, documents, compatibility и readiness reasons.
- Решения сохраняются append-only; idempotent retry не создаёт duplicate; stale snapshot/status отклоняются.
- Product становится ready только после достаточного набора human approvals и deterministic policy.
- Publication использует decision + snapshot, а не старый queue status.
- Development fixture изолирован явным флагом и публикуется только во временный test catalog.

## KPI до ручного review

| Метрика | Значение |
| --- | ---: |
| Total Review Items | 5 480 |
| Pending | 5 480 |
| In review | 0 |
| Approved | 0 |
| Rejected | 0 |
| Needs changes | 0 |
| Conflicted | 0 |
| Publication ready | 0 |
| Published | 0 |
| Real decisions | 0 |

## Ограничения

File store не рассчитан на ephemeral или concurrent multi-instance production runtime. Internal env gate не заменяет authentication. Пилот требует ручного review; массового approve и автоматической публикации нет. Для production нужны persistent decision backend, authenticated reviewer identity/roles и external access boundary.

