# Publication Pipeline Report

## Результат MVP-056 / интеграция MVP-057

Создан отдельный fail-closed Publication Pipeline, который строит `data/public` исключительно из Review Queue после прохождения eligibility gates. Pipeline не встроен в Wave 2 и не изменяет существующие importer stages.

Ветка: `feature/publication-pipeline`, создана от `main` (`66b0f97`). Коммит и deploy не выполнялись.

## Текущий source state

На момент выполнения:

- Review Queue items: 5 480;
- `READY`: 0;
- `pending_review`: 5 480;
- immutable human review decisions: 0;
- current evidence integrity violations: 0;
- artifacts в inventory: 276.

`readyForHumanReview` из aggregate Review Queue не использован как разрешение публикации: это готовность к ручной проверке, а не завершённый Review.

## Publication KPI

| Метрика | Значение |
|---|---:|
| Published products | 0 |
| Published review items | 0 |
| Blocked | 5 480 |
| Rejected | 0 |
| Manufacturers | 0 |
| Categories | 0 |
| Knowledge entries | 0 |

Все 5 480 items блокированы причиной `not_ready`. MVP-057 сохранил это состояние: Pipeline теперь требует latest human approve, current snapshot и product policy, но не создаёт решения автоматически.

## FS510

FS510 существует как текущая статическая публичная fallback-карточка, но отсутствует в Review Queue как `READY` record. Publication Pipeline не копирует её из `data/products.ts` и не создаёт для неё synthetic evidence. До завершения Review карточка остаётся fallback и не считается записью `data/public`.

## Реализовано

- Publication types, builder, validator, summary/index builder и publisher.
- CLI build и read-only audit.
- Public product, manufacturer, category и knowledge projections.
- Детерминированные IDs, slugs, сортировка и атомарная запись.
- Проверка latest human decision, snapshot, evidence, DocumentVersion, artifact, official source, product policy, integrity и conflicts.
- Внутренний approval manifest, не раскрываемый Public UI.
- Исключение внутренних IDs и filesystem paths из Published Product.
- Published Catalog подключён к каталогу, product pages, manufacturer pages, homepage, search, sitemap и platform statistics.
- Существующий draft/static UI сохранён как fallback только при отсутствии Published Product.

## Audit result

`npm run publication:audit`:

- valid: true;
- issues: 0;
- duplicate IDs: 0;
- duplicate slugs: 0;
- orphan publications: 0;
- internal JSON references: 0;
- absolute paths: 0.

## Тестовое покрытие

Синтетические fixtures проверяют полный positive path для `READY` record без изменения production Review Queue, а также blocked, rejected, missing evidence, integrity conflict, verification conflict, slug normalization, determinism, idempotency, audit, summary indexes, public catalog fallback и UI wiring.

## Ограничения и следующий безопасный шаг

Чтобы получить первую реальную публикацию, пользователь должен вручную обработать один пилотный продукт в защищённом Reviewer Workspace. После появления достаточных approvals выполняются `review:audit`, `publication:build` и `publication:audit`. File-based decision store остаётся development/pilot backend и требует persistent replacement до multi-instance production.
