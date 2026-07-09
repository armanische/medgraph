# Reviewer Workspace v2

Дата: 2026-07-09

## Назначение

Reviewer Workspace v2 — внутренний read/write-like prototype для ручной проверки кандидатных фактов. Он показывает очередь изделий, candidate facts, документы, evidence, history и локальные draft decisions.

Это не CMS, не Publication UI и не Verification pipeline.

## Route

`/internal/reviewer`

Доступ:

- в development открыт;
- в production доступен только при `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1`;
- страница имеет `robots: noindex`.

## Панели

### Левая колонка

Очередь изделий:

- Hamilton T1;
- FS510;
- количество фактов;
- priority;
- статус;
- ready/pending counters.

### Центральная область

Список Candidate Facts:

- характеристика;
- значение;
- источник;
- document version;
- evidence;
- последнее обновление;
- статус;
- priority.

### Правая панель

Document Preview:

- document title;
- version;
- hash;
- page;
- locator;
- source URL.

Decision Draft:

- Approve;
- Reject;
- Need more evidence;
- Conflict.

History:

- creation;
- review;
- decision draft.

## Filters

Поддерживаются фильтры:

- Все;
- Pending;
- High;
- Conflict;
- Needs evidence.

Bulk View показывает все факты выбранного изделия сразу.

## Safety Boundaries

Reviewer Workspace v2 никогда не должен:

- создавать Verified Claims;
- создавать Publication;
- писать в Supabase;
- писать в API;
- изменять Candidate generation;
- менять Import Pipeline;
- менять Discovery;
- менять public Portal.

Draft decision остаётся только локальным состоянием интерфейса и не является решением Verification.

## Data Layer

Текущий MVP использует mock/report layer в `lib/review/workspace.ts`.

Причины:

- безопасно проверить UX reviewer-а;
- не затрагивать Supabase schema;
- не смешивать draft decisions с verified/publication data;
- подготовить будущий contract для настоящего Review UI.

## Future Work

Следующий этап:

- связать workspace с generated review reports;
- добавить persisted manual decision files;
- добавить reviewer authentication;
- добавить audit trail;
- добавить документный viewer с PDF locator;
- добавить экспорт decisions для отдельного Verification process.
