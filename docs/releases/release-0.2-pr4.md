# Release 0.2 PR4 — Product Detail Page Redesign

**Статус:** реализовано и проверено 21 июля 2026 года
**Scope:** presentation layer публичной страницы `/catalog/[slug]` и общий Storefront Footer
**Data contract:** существующие Storefront Services и Product Presentation Contract

## Результат

Product Detail Page переведена из набора разрозненных панелей в компактную коммерческую композицию: единый product hero, последовательные контентные секции и fail-closed отображение доступных данных. Product Data, Cloud Catalog, Catalog Baseline, Import Pipeline, Review State, Publication и production configuration не изменялись.

## Что изменено

- Hero использует адаптивную сетку 40/60 на desktop, 45/55 на tablet и одну колонку на mobile.
- Изображение стало крупнее внутри `contain`-контейнера; сохранены галерея, alt-тексты, пропорции и нейтральный placeholder.
- Заголовок уменьшен, краткое описание очищается до plain text и ограничивается четырьмя строками.
- Производитель является доступной ссылкой на публичную страницу производителя.
- В hero выводятся только реально присутствующие manufacturer, model, country, category и registration.
- RFQ отображается только для READY; incomplete-карточки не получают RFQ, Compare или недоступные действия.
- Локальная навигация появляется только при наличии более одного реального раздела и содержит только существующие секции.
- Описание занимает полный контейнер секции, а читаемая колонка ограничена `56rem` (примерно 896 px).
- Последовательные секции используют лёгкие разделители вместо набора крупных dashboard-карточек.
- Footer стал компактнее и больше не показывает build preview, версию или служебную дату обновления.

## Удалённое дублирование статусов

READY-карточка не показывает служебный статус. Incomplete-карточка показывает ровно одну нейтральную плашку **«Информация о товаре уточняется»**. Отдельное поле «Статус», внутренние status codes, повторные fallback-строки и перечни отсутствующих полей не выводятся.

## Скрываемые metadata и optional sections

Пустые manufacturer, model, country, category и registration полностью исключаются из hero. Без данных также не создаются контейнеры для:

- технических характеристик;
- документов;
- комплектации;
- преимуществ;
- связанных товаров;
- совместимости;
- сравнения.

Техническая таблица дополнительно исключает карточные metadata: категорию, тип товара, страну, производителя, модель, артикул и регистрационное удостоверение. Раздел появляется только при наличии хотя бы одной реальной технической характеристики.

## Imported description

Presentation sanitizer сохраняет исходное содержание, но удаляет executable/unsupported markup и HTML attributes, пустые абзацы и элементы списков, соседние дублирующиеся заголовки. Тег `b` нормализуется в `strong`, вложенный bold упрощается. Компонент описания задаёт контролируемую типографику для абзацев, заголовков, списков, таблиц, цитат и ссылок без изменения Product Data.

## Responsive QA

Проверены реальные Cloud Preview карточки на ширинах 1440, 1280, 1024, 768, 390 и 375 px.

| Ширина | Композиция | Горизонтальный scroll | Результат |
| --- | --- | --- | --- |
| 1440 | 40/60 | нет | PASS |
| 1280 | 40/60 | нет | PASS |
| 1024 | 40/60 | нет | PASS |
| 768 | 45/55 | нет | PASS |
| 390 | одна колонка | нет | PASS |
| 375 | одна колонка | нет | PASS |

READY case: **Аппарат ИВЛ Hamilton-T1** — один hero RFQ, без служебного статуса.
Incomplete case: **Аппарат для гемосорбции «Гемос»** — одна нейтральная плашка, hero RFQ = 0, Compare = 0.

## Accessibility QA

- На странице остаётся один `h1`; секции используют последовательные `h2`/`h3`.
- Галерея сохраняет содержательные alt-тексты и `aria-label` на ссылках открытия изображений.
- Manufacturer и document links имеют видимые focus states.
- CTA остаётся семантической ссылкой и появляется только при допустимом действии.
- Локальная навигация имеет `aria-label` и keyboard focus indicator.
- Footer использует более контрастный публичный текст и компактную, но читаемую типографику.

## Screenshots

1. [READY Product Page — desktop](../screenshots/release-0.2-pr4/ready-product-desktop.png)
2. [Incomplete Product Page — desktop](../screenshots/release-0.2-pr4/incomplete-product-desktop.png)
3. [Product Page — tablet 768](../screenshots/release-0.2-pr4/ready-product-tablet-768.png)
4. [Product Page — mobile 390](../screenshots/release-0.2-pr4/ready-product-mobile-390.png)
5. [Compact Storefront Footer](../screenshots/release-0.2-pr4/compact-footer.png)
6. [Product Page с реальными характеристиками](../screenshots/release-0.2-pr4/product-with-real-specifications.png)
7. [Product Page без характеристик](../screenshots/release-0.2-pr4/product-without-specifications.png)

Cloud Catalog Baseline содержит только характеристики-метаданные, поэтому после корректной фильтрации его Product Pages не показывают technical specifications. Положительный кейс реальных specs проверен на статической Storefront-карточке FS510 с тем же публичным Product contract; отрицательный кейс — на Cloud-карточке «Гемос».

## Automated QA

| Проверка | Результат |
| --- | --- |
| `npm test` | PASS — 513/513 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next.js 16.2.9 (Turbopack), 31 страниц |
| `npm run build -- --webpack` | PASS — Next.js 16.2.9 (webpack), 31 страниц |
| `npm run catalog:baseline:audit` | PASS |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |

Baseline checksum сохранён без изменений:

`e757f5d2e0664f8a235c799dfe30d209d6bd607e165a9ebc0e0338d2ccbd894b`

Baseline: 79 products, 25 manufacturers, 19 categories, 7 application areas; READY 76, REQUIRES_EDITOR_REVIEW 3, Published 0.

## Нерешённые проблемы Product Page

- Cloud baseline пока не содержит реальных технических характеристик после удаления metadata; секция закономерно скрыта для всех 79 Cloud-карточек.
- Качество и длина некоторых legacy descriptions остаются неоднородными. Sanitizer безопасно нормализует представление, но не переписывает исходный контент.
- Внешние Cloud media зависят от доступности разрешённых origin; нейтральный placeholder остаётся fallback-механизмом.

Эти ограничения относятся к наполнению и инфраструктуре данных, а не к PR4 presentation layer.

## Git safety

Атомарный PR4-коммит не создан: в рабочем дереве присутствуют смешанные staged/untracked изменения предыдущих этапов. Reset, restore, clean и stash не выполнялись.
