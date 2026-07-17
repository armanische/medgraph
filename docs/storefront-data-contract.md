# CyberMedica Storefront Data Contract

## Назначение

Storefront data layer отделяет публичную витрину от Research, Review, Evidence,
Verification и Publication. На первом этапе каталог хранится в Git как набор JSON,
но публичное приложение в будущем должно обращаться только к `CatalogRepository`.

```text
Server Component
      ↓
Product / Manufacturer / Category / Search Service
      ↓
CatalogRepository
      ↓
Filesystem adapter → позднее Supabase или CMS adapter
```

`CatalogRepository` — server-only boundary. React-компонент получает готовую
публичную модель и не знает, используется ли JSON, база данных или CMS.

## Сущности и связи

- `Manufacturer` содержит публичное описание производителя.
- `Category` образует каталог; `parentId` позволяет добавить иерархию.
- `Product` принадлежит одному производителю и одной категории.
- `ProductSpecification`, `ProductMedia` и `ProductDocument` принадлежат товару.
- `ProductCompatibility.compatibleProductId` может ссылаться на другой товар.
  Для внешнего изделия допускается `null` с обязательными публичными `label` и `note`.
- `relatedProductIds` содержит только ID существующих товаров.

## Публичные статусы

- Product: `active`, `on_request`, `discontinued`, `hidden`.
- Manufacturer: `active`, `hidden`.
- Category: `active`, `hidden`.

`active` и `on_request` входят в активную публичную выдачу. `hidden` и
`discontinued` не возвращаются `getActiveProducts()` и `searchProducts()`.

## Ограничения

1. Все файлы проходят строгую Zod-валидацию.
2. ID и slug уникальны в пределах типа сущности.
3. Все связи должны разрешаться внутри каталога.
4. Временные цены и остатки в контракт не входят.
5. Основной коммерческий сценарий — статус `on_request` и CTA «Запросить КП».
6. В контракте отсутствуют внутренние Research, Review, Evidence, Verification и
   Publication metadata.
7. Документы и изображения задаются публичными URL. Artifact paths запрещены.
8. `catalog-summary.json` проверяется против фактического состава каталогов.

## Пример товара

```json
{
  "id": "product-example-100",
  "slug": "example-100",
  "manufacturerId": "manufacturer-example",
  "categoryId": "category-example",
  "name": "Example 100",
  "model": "100",
  "shortDescription": "Краткое описание товара.",
  "description": "Полное публичное описание товара.",
  "status": "on_request",
  "featured": false,
  "applicationAreas": ["Диагностика"],
  "keyFeatures": ["Компактное исполнение"],
  "specifications": [
    {
      "group": "Габариты",
      "label": "Масса",
      "value": "5",
      "unit": "кг",
      "position": 10
    }
  ],
  "media": [],
  "documents": [],
  "compatibility": [],
  "relatedProductIds": [],
  "createdAt": "2026-07-17T00:00:00.000Z",
  "updatedAt": "2026-07-17T00:00:00.000Z"
}
```

## Расширение схемы

Новое поле добавляется только при наличии публичного storefront-сценария:

1. описать семантику и обязательность поля;
2. обновить TypeScript type и Zod schema одновременно;
3. решить, как поле заполняется в Git, CMS и Supabase;
4. обновить все существующие JSON;
5. добавить positive и negative tests;
6. повысить `schemaVersion`, если изменение несовместимо;
7. не переносить внутренние pipeline-сущности ради удобства импорта.

Для CMS или Supabase создаётся новый adapter `CatalogRepository`. Сервисный слой и
публичные компоненты не должны изменяться.
