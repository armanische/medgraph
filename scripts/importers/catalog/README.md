# Catalog Seed and Research Pipeline

Pipeline создаёт локальные draft-карточки медицинских изделий. Он не обращается
к Supabase, Knowledge Factory, Projection, Publication или Verification.

## Запуск

```bash
npm run import:catalog-seed -- "Каталог Кибермедика.pdf"
npm run research:catalog-products
npm run research:product -- "Hamilton C1"
```

Имя PDF разрешается относительно текущей директории и `~/Downloads`. Для
извлечения текста используется Poppler `pdftotext`, а при его отсутствии —
Python с `pypdf`. Нестандартный путь передаётся через `PDFTOTEXT_PATH` или
`PYTHON_PATH`.

Для гарантированного offline-запуска:

```bash
CATALOG_RESEARCH_PROVIDER=none npm run research:catalog-products
```

## Разделение этапов

```text
PDF seed-list
→ ManufacturerResolver
→ независимый ResearchProvider / SourceFinder
→ SourceRanker
→ SourceCandidate
→ DocumentFinder / DocumentCandidate
→ immutable artifact по SHA-256
→ unverified characteristic
→ EvidenceCandidate
→ CandidateClaim
→ Conflict / Missing Characteristics
→ human review later
```

PDF используется только для списка позиций, исходного названия, раздела и
черновых brand/model candidates. Описания и характеристики из PDF не
переносятся.

Поисковые сниппеты используются только для обнаружения URL. Они никогда не
становятся характеристиками или Evidence.

## Допустимые источники

Приоритет:

1. официальный сайт производителя;
2. IFU, datasheet, brochure или manual производителя;
3. официальный реестр: Росздравнадзор, FDA, EUDAMED;
4. официальный дистрибьютор;
5. научная публикация.

Маркетплейсы, анонимные SEO-каталоги и небезопасные URL отбрасываются.

Если внешний поиск недоступен, pipeline может использовать ручные official
source seeds из `data/research/source-seeds.manual.json`:

```json
{
  "products": [
    {
      "slug": "apparat-ivl-hamilton-c1",
      "officialSources": [
        {
          "url": "https://manufacturer.example/product.pdf",
          "sourceType": "datasheet",
          "publisher": "Manufacturer"
        }
      ]
    }
  ]
}
```

Ручной URL создаёт только `SourceCandidate` / `DocumentCandidate`; он не
становится проверенным фактом без human review.

## Документы и артефакты

Публичные документы скачиваются существующим streaming downloader:

- только HTTPS;
- без авторизации и CAPTCHA;
- с ограничением размера;
- с MIME и PDF magic-byte validation;
- с retry только для временных ошибок;
- без перезаписи;
- content-addressed storage по SHA-256.

```text
tmp/catalog-research/artifacts/sha256/<prefix>/<sha256>.<ext>
```

Редирект на другой host отклоняется. Это сознательно консервативное ограничение.

## Извлечение

MVP-007 v1 использует только rule-based extraction из текста скачанного документа
или явно переданного provider fixture. Для PDF применяется `pdftotext` либо
`pypdf`, если они доступны.

OCR и LLM не используются. Характеристика создаётся только при наличии
`sourceUrl`, `sourceTitle`, исходного фрагмента и locator. Все характеристики
имеют `unverified` и `needsReview: true`.

Каждый Candidate Claim:

- имеет EvidenceCandidate;
- имеет `status: candidate`;
- имеет `verificationStatus: unverified`;
- имеет `autoPublish: false`.

## Статусы

- `needs_source` — независимый источник не найден;
- `partially_researched` — источники есть, но критические данные неполны;
- `research_ready` — набор кандидатов сформирован для human review;
- `blocked` — исследование заблокировано технической или provenance-проблемой;
- `reviewStatus: pending` — карточка подготовлена для будущей Review Queue.

## Результаты

- `data/catalog-seed.generated.json`;
- `data/catalog-products.generated.json`;
- `data/catalog-import-report.generated.json`;
- `data/catalog-research-report.generated.json`;
- `data/research/products/<slug>.research.json`.

Aggregate report показывает полноту источников, документов, характеристик,
Candidate Claims и готовность к human review.

Скачанные документы и версии регистрируются в:

```text
tmp/catalog-research/import-manifest.json
```

Повторный запуск с тем же SHA не создаёт новый artifact или DocumentVersion.
Различающиеся значения одной характеристики сохраняются как Conflict и не
разрешаются автоматически.

## Действия человека

Reviewer должен:

1. подтвердить идентичность изделия и документа;
2. проверить publisher и версию документа;
3. проверить rawText и locator каждой характеристики;
4. разрешить конфликты источников;
5. только затем создавать Claim Revision в отдельном редакционном процессе.

Research pipeline никогда не выполняет auto-verification или publication.

## Не реализовано

- OCR;
- LLM extraction;
- автоматическое разрешение конфликтов;
- полноценная Review Queue;
- запись в Knowledge Factory;
- юридическая экспертиза условий распространения каждого документа.
