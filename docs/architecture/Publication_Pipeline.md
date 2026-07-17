# Publication Pipeline

> Historical architecture. RFC-017 retired the executable Publication CLI and
> removed its barrel entry point. The retained Builder, Publisher, Validator,
> Summary, Candidates, and types are migration dependencies for Review and Wave
> 2; they are not a supported operational publication workflow.

## Назначение

Publication Pipeline — отдельная граница между внутренней Review Queue и публичным каталогом CyberMedica. Он не является частью Wave 2 и не читает Discovery, Documents, Extraction или Wave 2 summary как источник публичных утверждений.

Единственный источник содержимого публикации — Review Queue. Artifact inventory и evidence-integrity report используются только как fail-closed проверки целостности; они не добавляют факты в Published Product.

## Поток данных

```text
Review Queue product reports
        + immutable human review decisions
        + artifact inventory (integrity gate)
        + evidence integrity violations (integrity gate)
                    |
                    v
          Publication eligibility
                    |
                    v
          Public record projection
                    |
                    v
                data/public
                    |
                    v
               Public UI
```

Publication не пишет в `data/research`, Verification, Review Queue, Supabase или Wave 2.

## Eligibility

Review item публикуется только при одновременном выполнении условий:

1. Последний immutable human decision равен `approve`, а его next review status — `approved`.
2. Decision snapshot совпадает с текущим Review Item; stale approval блокируется.
3. Есть хотя бы один evidence ID.
4. Есть DocumentVersion, присутствующий в Review Queue `sourceDocumentSummary`.
5. Для каждого DocumentVersion есть пригодный artifact в artifact inventory.
6. Artifact не orphan, не пустой, не HTML masquerading, не invalid PDF, а SHA соответствует content-addressed path.
7. Есть корректный HTTP(S) source URL.
8. Для продукта, review item, evidence и DocumentVersion нет integrity violation.
9. Item eligibility и product-level publication policy разрешают публикацию, unresolved conflict отсутствует.
10. Product находится в явном scope первой публикации.

Любое нарушение блокирует конкретный review item. Product создаётся только когда у него остаётся хотя бы один eligible item и валидны manufacturer, category, name и slug.

## Public record

`PublishedProduct` содержит только публичную проекцию:

- стабильные public `id` и `slug`;
- manufacturer, model, category, name и public description;
- reviewed specifications;
- документально подтверждённую compatibility;
- public documents без checksum;
- official sources;
- `updatedAt`, coverage и status.

Review item IDs, claim IDs, Evidence IDs, DocumentVersion IDs, artifact paths, review comments/notes, SHA hashes и пути к внутренним JSON в record не переносятся. Validator использует allowlist полей public schema v2 и отклоняет неизвестные или внутренние поля.

`verificationLevel: reviewed` означает прохождение Review, но не создаёт Verified Claim и не меняет Verification semantics.

## Структура каталога

```text
data/public/
  products/<slug>.json
  manufacturers/<slug>.json
  categories/<slug>.json
  knowledge/<slug>.json
  summary.generated.json
  publication-manifest.internal.json
```

`summary.generated.json` — детерминированный UI bundle и индекс. Внутренний manifest связывает publication только с approval decision IDs и не читается Public UI. Файлы в каталогах являются каноническими представлениями отдельных records.

## Retired CLI

RFC-017 удалил команды `publication:build`, `publication:audit` и
`publication:candidates`. Не запускайте retained implementation files напрямую:
они сохраняются временно только из-за Review/Wave 2 coupling, описанного в
`docs/publication-builder-audit.md`.

Human Review продолжается через `/internal/reviewer`, `review:summary` и
`review:audit`. Решения reviewer не публикуют и не изменяют Storefront catalog.

## Детерминированность

Stable public IDs основаны только на публичной identity, массивы сортируются, `generatedAt` является версией pipeline, а `updatedAt` берётся из детерминированных review timestamps. Artifact checksum в public output не переносится. Одинаковый input создаёт байт-в-байт одинаковый output.

## Storefront boundary

Public UI использует только Storefront Data Layer. `data/public` и retained
Publication modules не являются источником публичных Storefront-маршрутов.

## Ограничения

- Текущая Review Queue не имеет human approvals; `readyForHumanReview` означает только готовность к работе рецензента.
- Pipeline не выполняет network validation URL; audit проверяет их структуру и связь document/source.
- Publication не создаёт review decisions и не повышает записи до READY.
- MVP-058 ограничивает production publication scope первыми пятью продуктами; расширение scope требует явного изменения списка кандидатов.
- Полноценная история версий публикации и rollback storage не добавлялись в MVP-056.
