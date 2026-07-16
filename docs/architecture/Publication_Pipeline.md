# Publication Pipeline

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

Любое нарушение блокирует конкретный review item. Product создаётся только когда у него остаётся хотя бы один eligible item и валидны manufacturer, category, name и slug.

## Public record

`PublishedProduct` содержит только публичную проекцию:

- стабильные public `id` и `slug`;
- manufacturer, model, category, name и summary;
- reviewed facts;
- документально подтверждённую compatibility;
- официальные documents и sources;
- publication timestamp, coverage и status.

Review item IDs, claim IDs, Evidence IDs, DocumentVersion IDs, artifact paths и пути к внутренним JSON в record не переносятся.

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

## CLI

```text
npm run publication:build
npm run publication:audit
```

`publication:build` сначала строит модель в памяти и валидирует её, затем атомарно заменяет файлы `data/public`. `publication:audit` ничего не пишет: он заново вычисляет ожидаемый каталог из текущей Review Queue и сравнивает его с `data/public`.

Audit проверяет duplicate IDs/slugs, orphan records, несогласованность summary и файлов, missing public evidence chain, структурно битые URL, внутренние JSON references и абсолютные пути.

## Детерминированность

IDs основаны на SHA-256 публичной identity, массивы сортируются, `generatedAt` является версией pipeline, а `publishedAt` берётся из детерминированных review timestamps. Одинаковый input создаёт байт-в-байт одинаковый output.

## Public UI и fallback

Public UI сначала ищет запись в Published Catalog. Если её нет, используется существующая draft/static fallback-карточка. Published record всегда перекрывает fallback с тем же slug. Candidate facts из fallback не становятся опубликованными.

## Ограничения

- Текущая Review Queue не имеет human approvals; `readyForHumanReview` означает только готовность к работе рецензента.
- Pipeline не выполняет network validation URL; audit проверяет их структуру и связь document/source.
- Publication не создаёт review decisions и не повышает записи до READY.
- Полноценная история версий публикации и rollback storage не добавлялись в MVP-056.
