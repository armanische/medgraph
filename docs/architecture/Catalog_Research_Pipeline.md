# Catalog Research Pipeline

**Статус:** MVP-007 v1  
**Область:** локальное формирование кандидатных данных каталога

## Назначение

Pipeline превращает seed-list медицинских изделий в набор данных, готовый к
последующей ручной проверке. Он не является частью Verification или
Publication.

## Поток данных

```text
PDF Catalog
→ Seed Item
→ ManufacturerResolver
→ SourceFinder / ResearchProvider
→ SourceRanker
→ SourceCandidate
→ DocumentFinder / DocumentCandidate
→ Downloader
→ Raw immutable artifact
→ Document parser / CandidateCharacteristic
→ EvidenceCandidate
→ CandidateClaim
→ ConflictDetector
→ MissingInformationDetector
→ ReportBuilder
→ Draft Product
→ Human Review
```

## Seed-list

PDF определяет только позиции, исходное название и раздел каталога. Тексты PDF
не являются Evidence и не используются для создания характеристик.

## Независимое исследование

`ResearchProvider` обнаруживает внешние URL. Реализация provider-neutral:
источник поиска можно заменить без изменения downloader, extractor, Claim
builder или UI-модели.

Если внешний поиск недоступен, допускается ручной файл
`data/research/source-seeds.manual.json`. Он содержит только official URL seeds
и создаёт кандидатные источники/документы. Такой seed не является Evidence и не
меняет статус Verification.

Поисковый результат является только `SourceCandidate`. Сниппет не является
фактом.

`ManufacturerResolver` возвращает кандидатов. При нескольких вариантах
фиксируется ambiguity; случайный выбор запрещён. `SourceRanker` применяет
воспроизводимый приоритет официальных производителей, регуляторов, IFU,
datasheet, научных публикаций и официальных дистрибьюторов.

## Документы

`DocumentDownloader` принимает только публичный HTTPS URL. Документ сохраняется
в content-addressed storage и не перезаписывается. Неуспешная загрузка
фиксируется warning и не останавливает обработку остальных товаров.

Каждый скачанный SHA регистрируется через
`tmp/catalog-research/import-manifest.json`. Повторный SHA не создаёт новую
DocumentVersion.

## Характеристики

`CharacteristicExtractor` работает с текстом конкретного документа. Каждая
характеристика содержит источник, исходный фрагмент, locator, метод извлечения,
confidence и обязательный статус `unverified`.

MVP-007 не использует OCR или LLM.

## Candidate Claims

`CandidateClaimBuilder` создаёт только предложения для будущей редакционной
работы. Каждый Candidate Claim имеет минимум один EvidenceCandidate,
`verificationStatus: unverified` и `autoPublish: false`.

Candidate Claim не является Claim Revision.

## Конфликты и неполные данные

Разные значения одной характеристики сохраняются как `Conflict` со статусом
`needs_review`. Движок не выбирает значение автоматически.

`MissingInformationDetector` формирует перечень отсутствующих характеристик
для следующего исследовательского прохода и reviewer.

## Review readiness

Product research report содержит:

- missing critical fields;
- blocking issues;
- source quality score;
- readiness score;
- review priority;
- `reviewStatus: pending`.

Эти поля предназначены для будущей Review Queue и не заменяют решение reviewer.

## Запреты

Pipeline не имеет права:

- писать в Supabase или `public_api`;
- создавать Verified Claims;
- создавать Publication;
- использовать PDF-каталог как Evidence;
- автоматически повышать confidence до статуса проверки;
- скрывать отсутствие источников;
- создавать медицинские рекомендации.
