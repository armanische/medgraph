# Процесс разработки CyberMedica

> Нормативная основа: [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

**Статус:** действующий регламент  
**Дата:** 21 июля 2026 года

## 1. Preflight

Перед работой:

1. проверить branch, status и последние commits;
2. не затрагивать чужие staged/untracked changes;
3. определить environment, release и data source;
4. прочитать применимые ADR и domain docs;
5. зафиксировать scope, forbidden changes и acceptance criteria;
6. определить необходимость staging, Cloud write и ADR.

## 2. Реализация

- Один PR — одна независимая цель.
- Изменение следует существующим services/repositories.
- Product Data и immutable inputs не меняются presentation-задачей.
- Write tooling имеет explicit apply и environment guard.
- Secrets не попадают в source, logs, screenshots или build artifact.
- Generated data не редактируется вручную, если существует generator.

## 3. Базовый Local QA

    npm test
    npm run lint
    npx tsc --noEmit --pretty false
    npm run build
    git diff --check

При наличии staged files дополнительно:

    git diff --cached --check

Domain gates добавляются по scope: baseline audit, schema audit, health check, import verification, visual QA, accessibility или bundle tracing.

## 4. Работа с Git

- Не использовать reset, restore, clean или stash без разрешения.
- Не создавать commit из смешанного рабочего дерева.
- Не включать пользовательские staged files в чужой PR.
- Commit message описывает одну поставленную цель.
- Merge, push и deploy требуют явного разрешения.

## 5. Code review checklist

- boundary соблюдён;
- нет скрытых data writes;
- errors fail closed;
- public schema не раскрывает internals;
- env validation понятна;
- tests проверяют positive и negative cases;
- docs отражают фактическое состояние;
- rollback возможен;
- diff не содержит unrelated changes.

## 6. Staging QA

Runtime change проверяется на immutable Preview deployment. Отчёт содержит URL, commit/artifact, environment summary без secrets, сценарии, screenshots, API status и security checks.

Local success не заменяет staging acceptance.
