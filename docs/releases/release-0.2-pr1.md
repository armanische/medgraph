# CyberMedica — Release 0.2 PR1

**Статус:** реализовано и проверено
**Дата:** 21 июля 2026 года
**Release Plan:** `docs/product/release-plan-v0.2.md`
**Scope:** PX-C01 + PX-C04
**Baseline:** Catalog Baseline v1

## 1. Цель PR

PR1 вводит единый public presentation contract для Storefront и определяет fail-closed отображение отсутствующих данных и media.

В PR не входят задачи следующих этапов: глобальная очистка Preview vocabulary, изменение Compare policy, новый Hero, trust layer, RFQ redesign, Header/Footer или accessibility pass.

## 2. Precheck

### Зависимости

Проверены существующие Storefront-модели и quality contract:

- `Product.catalogQualityStatus`;
- `isProductCommerciallyReady()`;
- Storefront Manufacturer и Category references;
- Cloud Preview unknown reference sentinels;
- существующие Storefront routes и client/server boundaries.

Новая presentation-функция является чистой и детерминированной. Она не читает Cloud, JSON или ENV и не выполняет mutations.

### Catalog Baseline v1 до реализации

`npm run catalog:baseline:audit` — **PASS**.

| Метрика | Значение |
| --- | ---: |
| Checksum | `e757f5d2e0664f8a235c799dfe30d209d6bd607e165a9ebc0e0338d2ccbd894b` |
| Products | 79 |
| Manufacturers | 25 |
| Categories | 19 |
| Application areas | 7 |
| READY | 76 |
| REQUIRES_EDITOR_REVIEW | 3 |
| Published | 0 |

### Production safety

- `CATALOG_DATA_SOURCE` остаётся `static` по умолчанию.
- Существующий guard запрещает `cloud_preview` при `VERCEL_ENV=production`.
- PR не меняет ENV, Vercel, Supabase, API, schema, routes или deployment configuration.
- Cloud audit выполнялся read-only; write operations отсутствовали.

## 3. Что реализовано

### 3.1. Shared Product Presentation Contract

Создан `lib/storefront/product-presentation.ts`.

Контракт предоставляет:

- состояния `commercial_ready` и `information_incomplete`;
- `canRequestQuote` и `canCompare`;
- единый публичный status label;
- безопасные manufacturer/category/country/model labels;
- neutral media и registration fallbacks;
- исключение известных generated placeholder descriptions;
- флаги видимости optional sections;
- сохранение исходного Product без мутации.

### 3.2. Fail-closed actions

Для READY товара доступны коммерческие действия.

Для товара с любым из условий ниже RFQ и Compare закрыты:

- `catalogQualityStatus = REQUIRES_EDITOR_REVIEW`;
- unresolved manufacturer;
- unresolved category;
- отсутствующая модель.

Presentation output не содержит quality reason, internal reference sentinel или Review metadata.

### 3.3. Missing data policy

Используются единые нейтральные значения:

- «Производитель не указан»;
- «Категория не указана»;
- «Страна не указана»;
- «Модель не указана»;
- «Регистрационные данные отсутствуют»;
- «Изображение отсутствует».

Synthetic copy вроде «Описание добавляется» не выводится. Исходное значение при этом не изменяется.

### 3.4. Optional sections

Product Page показывает только поддержанные существующими данными секции:

- Описание;
- Преимущества;
- Технические характеристики;
- Комплектация;
- Документы;
- Совместимость;
- Связанные товары.

Быстрые ссылки формируются по тому же presentation contract и не ведут к отсутствующей секции.

### 3.5. Public surfaces

Общий контракт подключён к:

- Homepage featured products;
- Homepage search results;
- Catalog cards;
- Product Page;
- Manufacturer product cards;
- Global Search results.

## 4. Изменения UI

- READY Product Page получает публичный статус «Доступно для запроса».
- Incomplete Product Page получает статус «Информация неполная» и не показывает product-level RFQ/Compare.
- Catalog и search не показывают internal fallback identifiers.
- Отсутствующее media получает постоянный нейтральный placeholder.
- Synthetic description не занимает место в карточке.
- Пустые optional sections и их quick links не рендерятся.
- Полные READY-карточки сохраняют существующую структуру и коммерческие действия.

Product Data, layout architecture, SEO routes и business logic не изменялись.

## 5. Скриншоты

### Catalog — READY cards

![Catalog после PR1](../screenshots/release-0.2-pr1/catalog-ready.png)

Путь: `docs/screenshots/release-0.2-pr1/catalog-ready.png`

### Product Page — READY presentation

![Product Page после PR1](../screenshots/release-0.2-pr1/product-ready.png)

Путь: `docs/screenshots/release-0.2-pr1/product-ready.png`

Incomplete state проверен автоматизированными fixtures. Локальный static dataset содержит только две READY-карточки, поэтому отдельный incomplete screenshot не создавался путём изменения данных.

## 6. Тесты

Создан `tests/importers/product-presentation-v1.test.ts`.

Покрытие:

1. READY получает полный commercial action contract.
2. REQUIRES_EDITOR_REVIEW fail-closed.
3. Missing manufacturer/category/model fail-closed.
4. Presentation не раскрывает quality reasons и Cloud sentinel IDs.
5. Missing identity/media используют единые public fallbacks.
6. Generated placeholder descriptions скрываются без изменения source object.
7. Optional sections зависят только от существующих данных.
8. Все затронутые public surfaces используют shared contract.

Обновлены существующие source-contract tests для нового presentation boundary.

## 7. QA

| Проверка | Результат |
| --- | --- |
| Targeted Product Presentation tests | PASS, 13/13 |
| `npm test` | PASS, 496/496 |
| `npm run lint` | PASS, 0 warnings/errors |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build -- --webpack` | PASS, 31 static generation steps |
| `git diff --check` | PASS |
| Catalog Baseline audit before | PASS |
| Catalog Baseline audit after | PASS |
| Browser QA: `/catalog` | PASS |
| Browser QA: `/catalog/fs510` | PASS |
| Browser console errors | 0 |

Повторный baseline audit подтвердил исходный checksum, 79 товаров, READY 76, REQUIRES_EDITOR_REVIEW 3 и Published 0.

## 8. Изменённые файлы PR1

### Runtime

- `lib/storefront/product-presentation.ts`;
- `app/page.tsx`;
- `app/catalog/[slug]/page.tsx`;
- `app/manufacturers/[slug]/page.tsx`;
- `components/catalog/CatalogExplorer.tsx`;
- `components/home/FeaturedProducts.tsx`;
- `components/home/Search.tsx`;
- `components/search/SearchExperience.tsx`.

### Tests

- `tests/importers/product-presentation-v1.test.ts`;
- `tests/importers/catalog-data-quality-v1.test.ts`;
- `tests/importers/catalog-storefront.test.ts`;
- `tests/importers/cloud-storefront-preview-v1.test.ts`;
- `tests/importers/product-detail-storefront.test.ts`;
- `tests/importers/storefront-ux-polish.test.ts`.

### Documentation and QA assets

- `docs/releases/release-0.2-pr1.md`;
- `docs/screenshots/release-0.2-pr1/catalog-ready.png`;
- `docs/screenshots/release-0.2-pr1/product-ready.png`.

## 9. Что осталось

Следующие задачи не включены и не должны считаться частично реализованными:

- PR2: PX-C02 — полная sanitation public vocabulary;
- PR3: PX-C03 — окончательная activate-or-hide Compare policy;
- PR4+: Homepage value proposition, featured discovery, trust layer;
- Product Trust Block и RFQ handoff;
- Header/Footer и Breadcrumbs;
- recovery, WCAG и responsive release passes.

## 10. Риски и наблюдения

| Риск/наблюдение | Статус | Действие |
| --- | --- | --- |
| Presentation зависит от canonical Catalog Quality status | Принято | Baseline audit и unit fixtures защищают contract |
| Static products не содержат incomplete UI example | Принято | Incomplete state покрыт unit tests; Cloud data не изменялись ради screenshot |
| Dev console сообщает LCP warning для FS510 image | Не относится к PR1 | Перенести в performance/loading backlog; не расширять PR1 |
| Compare остаётся видимым для READY static products | Ожидаемо | Решение входит только в PR3/PX-C03 |
| Worktree содержит предыдущие staged/unstaged изменения | Высокий Git-риск | Не включать их в commit и не выполнять reset/clean/stash |

## 11. Готовность к следующему PR

Функционально PR1 готов: implementation, tests, build, browser QA и baseline audit прошли.

PR2 можно начинать после безопасного формирования отдельного PR1 commit. Текущий worktree содержит незакоммиченные зависимости и пользовательские изменения, существовавшие до PR1. Поэтому commit допустим только при гарантированном отделении PR1 от этого состояния; включение целых уже изменённых файлов без такой гарантии запрещено.
