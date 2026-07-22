# ADR-004 — Разделение `main` и Production branch

**Статус:** Accepted
**Дата:** 22 июля 2026 года
**Владельцы:** владелец продукта и технический руководитель CyberMedica

## Context

Vercel использовал `main` как Production branch. Поэтому обычное обновление основной интеграционной ветки автоматически создавало Production deployment и блокировало безопасное продвижение проверенных Launch Critical изменений.

CyberMedica требует независимых контуров разработки, staging-приёмки и Production promotion.

## Decision

- `main` является канонической интеграционной веткой разработки;
- feature-ветки создаются от актуального `main` и возвращаются в `main` после Local и Staging gates;
- каждый push в `main` создаёт Preview deployment;
- `production` является единственной Vercel Production branch;
- Production deployment создаётся только после явного controlled promotion принятого commit из `main` в `production`;
- история не переписывается, force push в `main` и `production` запрещён.

## Alternatives

1. Оставить `main` Production branch — отклонено: обычная интеграция продолжает автоматически затрагивать Production.
2. Использовать ручные CLI production deploy — отклонено как основной workflow: связь Git commit и deployed artifact становится менее очевидной.
3. Отключить Git integration — отклонено: теряются автоматические immutable Preview deployments.

## Consequences

- `main` становится безопасной общей базой Launch Critical разработки;
- Preview остаётся обязательным acceptance gate до Production;
- обновление `production` становится отдельным auditable release action;
- release report обязан фиксировать source commit, promotion commit, Production deployment и rollback target.

## Security and data impact

- Production ENV и domains остаются привязаны только к Production environment;
- изменение branch tracking не меняет Cloud Catalog, Supabase schema или данные;
- staging credentials не переносятся в Production;
- promotion не разрешает migrations или data writes без отдельного плана.

## Migration and rollback

1. Создать `production` на последнем текущем Production commit.
2. Изменить Vercel Production branch с `main` на `production`.
3. Подтвердить отсутствие нового Production deployment.
4. Обновить `main` проверенным integration artifact и подтвердить Preview deployment.

Rollback инфраструктурного решения: вернуть Vercel Branch Tracking на предыдущую ветку только по отдельному разрешению, не перемещая Production domains на непроверенный deployment.

## References

- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md)
- [RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- [ADR-003 — Staging acceptance gate](./ADR-003-staging-acceptance-gate.md)
