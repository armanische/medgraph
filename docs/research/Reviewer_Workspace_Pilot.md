# Reviewer Workspace Pilot

Дата: 2026-07-09

## Pilot Scope

MVP-033 проверяет профессиональный reviewer workflow без публикации данных.

В pilot входят:

- Hamilton T1: 8 фактов;
- FS510: 3 факта.

## Что появилось

- Internal route `/internal/reviewer`.
- Левая очередь изделий.
- Центральный список Candidate Facts.
- Правая панель Document Preview.
- Локальный Decision Draft.
- History для каждого факта.
- Filters и Bulk View.
- Верхняя статистика.

## Mock Actions

Reviewer может выбрать:

- Approve;
- Reject;
- Need more evidence;
- Conflict.

Эти действия не сохраняются и не переходят в Verification/Publication. Это draft-состояние для проверки UX.

## Pilot Findings

Удобно:

- Reviewer видит продукт, факт, источник и документ на одном экране.
- Фильтр High быстро выделяет рискованные факты.
- Needs evidence показывает слабые места evidence chain.
- Conflict отделяется от обычного pending review.

Ограничения:

- Document Preview пока mock, без PDF rendering.
- Draft decisions не сохраняются после перезагрузки.
- Нет reviewer identity и audit log.
- Нет связи с настоящим decision processing command.

## Safety Notes

- Данные не публикуются.
- Verified Claims не создаются.
- Supabase не используется.
- API не вызывается.
- Candidate generation не изменяется.
- Portal не читает Reviewer Workspace.

## Next Steps

- Подключить generated review reports как источник.
- Добавить persisted manual draft file.
- Добавить PDF locator preview.
- Добавить reviewer authentication.
- Подготовить отдельный экспорт для Verification process.
