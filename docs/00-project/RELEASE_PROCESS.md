# Процесс релизов CyberMedica

> Нормативная основа: [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

**Статус:** действующий регламент  
**Дата:** 21 июля 2026 года

## 1. Release state machine

    Запланировано
        -> В работе
        -> Реализовано локально
        -> Локально проверено
        -> Развернуто на staging
        -> Проверено
        -> Принято
        -> Production

Переход подтверждается evidence. Объявление статуса без evidence недействительно.

## 2. Release gates

### Local gate

- полный QA;
- domain audits;
- clean scope;
- release report;
- отсутствие secrets.

### Staging gate

- immutable Preview URL;
- correct data source;
- UI/API/security QA;
- noindex и no-store, где применимо;
- product owner acceptance.

### Production gate

- принятый commit/artifact;
- production env review;
- migration plan и backup при data changes;
- rollback owner и previous deployment;
- smoke checklist;
- явное разрешение deploy.

## 3. Data release

Порядок:

    pre-audit -> dry-run -> review -> explicit apply -> post-audit

После apply проверяются counts, checksum, duplicates, FK, orphans, RLS и public writes. Production data migration не совмещается с экспериментальным UI deploy без отдельного решения.

## 4. Rollback

Rollback определяет:

- application rollback;
- data rollback/forward fix;
- критерий активации;
- ответственного;
- проверки после отката;
- сохранение audit evidence.

## 5. Release report

Отчёт фиксирует scope, changed files, QA, staging URL, data/environment state, known limitations, rollback и итоговый статус. Release report не заменяет ADR или PROJECT_GUIDE.
