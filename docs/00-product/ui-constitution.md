# CyberMedica UI Constitution v1

**Статус:** нормативный документ

**Версия:** 1.0

**Дата:** 24 июля 2026 года

**Владельцы:** Product Owner и технический руководитель CyberMedica

**Область действия:** весь публичный и внутренний UI CyberMedica

> Нормативная основа: [PROJECT_GUIDE.md](../00-project/PROJECT_GUIDE.md). При противоречии действуют PROJECT_GUIDE и принятые ADR. Настоящий документ определяет обязательные UI-инварианты и не заменяет Design System, product specification или acceptance report.

Ключевые слова **ОБЯЗАТЕЛЬНО**, **ЗАПРЕЩЕНО** и **ДОПУСКАЕТСЯ** имеют нормативный смысл. Существующее расхождение с этим документом является архитектурным долгом, а не разрешением создавать новые расхождения.

## 1. Purpose

UI Constitution существует, чтобы интерфейс CyberMedica развивался как один продукт, а не как набор независимо спроектированных экранов.

Документ предотвращает:

- параллельные реализации одной сущности или паттерна;
- расхождение карточек, кнопок, Search, Breadcrumb, CTA и Header;
- локальные дизайн-системы внутри страниц;
- декоративные обещания, которых нет в Product Data;
- публикацию неподтверждённых или внутренних данных;
- постепенное превращение каталога оборудования в корпоративный лендинг;
- merge UI, не прошедшего Product Owner Review и Acceptance Review.

UI Constitution задаёт границы решений. Product specification определяет, **что** нужно пользователю; Design specification — **как** утверждённый сценарий компонуется; Design System — визуальные токены и примитивы; UI Constitution — **какие архитектурные правила нельзя нарушать ни на одном из этих этапов**.

## 2. Scope

Документ обязателен для:

- Homepage;
- Catalog и Catalog cards;
- Product Detail;
- Manufacturers и Manufacturer Detail;
- Search;
- Request/RFQ flow;
- Header, Footer и глобальной навигации;
- внутренних UI-модулей, если правило явно не ограничено публичным Storefront;
- всех будущих модулей, страниц, feature-веток и redesign-задач.

Он применяется к server-rendered и client-rendered UI, responsive-состояниям, loading/empty/error-состояниям, accessibility и interaction states.

Исключение допускается только через отдельное архитектурное решение. Локальная договорённость, срочность релиза, эксперимент, макет или существующий fork не являются исключением.

## 3. Core Principles

### Principle 1 — One Entity → One Component

Одна продуктовая сущность или устойчивый UI-паттерн имеет один канонический компонент и один публичный component contract.

- Product отображается через `ProductCard`.
- Category отображается через `CategoryCard`.
- Manufacturer отображается через `ManufacturerCard`.
- Одинаковое действие использует общий `Button`/`CTA` contract.

Разные страницы не создают собственные реализации одной сущности. Файл-обёртка страницы может собирать данные и layout, но не дублировать presentation-компонент.

### Principle 2 — Variant API

Контекстные различия реализуются только через явный, типизированный `variant` канонического компонента.

ЗАПРЕЩЕНЫ альтернативы вида `HomepageCard`, `CatalogCard`, `RecommendationCard`, `FeaturedCard`, `NewProductCard` и аналогичные page-specific forks.

Новый variant допускается, только если:

1. меняется композиция, а не смысл сущности;
2. сохраняются общий data contract, accessibility и interaction contract;
3. variant нужен минимум одному утверждённому product scenario;
4. он добавлен в canonical component и его contract tests;
5. он принят Product Owner Review.

### Principle 3 — Design Never Forks

Новая страница использует существующий дизайн компонента. ЗАПРЕЩЕНО создавать «улучшенную», «более современную» или локально стилизованную копию существующего компонента.

Если текущий компонент не удовлетворяет утверждённому сценарию, меняется canonical component или его Variant API. Изменение проверяется на всех consumers. Fork ради уменьшения scope запрещён.

### Principle 4 — Data Before Decoration

UI показывает только утверждения, подтверждённые публичным data contract.

Метки «Популярное», «Новинка», «Эксклюзив», «Рекомендуем», рейтинги, экономия, наличие, сроки поставки и сходные claims ЗАПРЕЩЕНЫ без:

- явного поля в Product Data;
- определённой семантики и владельца;
- происхождения и срока актуальности;
- правила публикации;
- fail-closed поведения при отсутствии подтверждения.

Порядок карточек не превращается в публичное обещание без документированного ranking contract.

### Principle 5 — Real Equipment First

Homepage и discovery UI используют реальные товары и подтверждённые media из Cloud/Storefront contract.

ЗАПРЕЩЕНЫ:

- stock images вместо реального оборудования;
- AI-generated изображения товара;
- абстрактные медицинские фотографии, создающие ложное ощущение ассортимента;
- фиктивные модели и декоративные Product cards.

При отсутствии media допускается только нейтральный системный placeholder, который не изображает несуществующий товар. Homepage остаётся «живой» за счёт реальных сущностей, а не декоративной фотографии.

### Principle 6 — Search First

Главное действие CyberMedica — найти оборудование. Search получает высший приоритет в Homepage и Catalog entry flow.

- Search доступен без лишнего шага.
- Его label, query contract и результаты согласованы между Header, Homepage и Catalog.
- Декоративный CTA не конкурирует с Search.
- Новый блок не может отодвигать Search без утверждённой product-причины.

### Principle 7 — Every Block Must Earn Its Place

Каждый блок страницы обязан иметь:

- конкретную пользовательскую задачу;
- измеримый KPI или acceptance signal;
- подтверждённый источник данных;
- уникальную роль в journey;
- правило empty/error/fail-closed.

Блок без измеримой цели удаляется из specification. «Заполнить экран», «добавить доверия» или «сделать современнее» без проверяемого критерия не являются продуктовой целью.

### Principle 8 — One Navigation

Header, Breadcrumb, Back и CTA выполняют разные роли и используют единый navigation contract:

- Header — глобальная навигация;
- Breadcrumb — положение в иерархии;
- Back — возврат к сохранённому состоянию предыдущего контекста;
- CTA — следующее продуктовое действие.

Breadcrumb не подменяет stateful Back. Back не заменяется простым `href`, если требуется восстановление URL/query/filter/sort/page/scroll. В одной action zone ЗАПРЕЩЕНЫ два визуально разных элемента с одинаковой функцией.

Один destination может повторяться на разных этапах длинной страницы только по утверждённой specification, с одинаковой терминологией и без конкурирующей иерархии.

### Principle 9 — One Design Language

Buttons, Cards, spacing, typography, hover, focus, active, loading, skeleton, empty и error states используют один язык и один набор primitives/tokens.

Страница не владеет собственной кнопкой, тенью, радиусом, фокусом или error pattern. Responsive-изменение не создаёт второй визуальный язык.

### Principle 10 — Product Over Marketing

CyberMedica — рабочий каталог медицинского оборудования, а не корпоративный рекламный лендинг.

Приоритет информации:

1. поиск и навигация к оборудованию;
2. реальные сущности и технические данные;
3. документы и регуляторная информация;
4. понятное коммерческое действие;
5. только затем — подтверждённое объяснение сервиса.

Маркетинговый текст, декоративная иллюстрация и корпоративная история не могут вытеснять product discovery.

### Principle 11 — Cloud First UI

Public UI получает данные только через Storefront Services и `CatalogRepository`, согласно ADR-001 и ADR-002.

ЗАПРЕЩЕНО:

- читать Supabase, raw JSON, Review, Publication или Research напрямую из компонента;
- показывать raw/import/internal metadata;
- считать наличие строки в Cloud достаточным основанием для публичного показа;
- обходить public projection или field-level publication policy.

Подтверждёнными считаются только данные, допущенные в публичный Storefront Domain Model действующим publication/read contract.

### Principle 12 — Fail Closed

Нет подтверждённых данных — нет содержательного блока.

- Не создаётся выдуманный fallback.
- Не показывается пустой heading или disabled commercial promise.
- Не подменяется неизвестное значение общим утверждением.
- Essential function, например Search, остаётся доступной; ошибка зависимого блока изолируется локально.
- Empty/Error state объясняет состояние, но не имитирует данные.

Fail-closed применяется на уровне поля, карточки, блока и действия.

### Principle 13 — Homepage Is Not Catalog

Homepage направляет пользователя в Catalog, но не копирует полный Catalog experience.

Homepage может показывать ограниченную, объяснимую выборку категорий, производителей и реальных товаров. Она не повторяет полный набор фильтров, сортировку, пагинацию или всю сетку.

### Principle 14 — Homepage Must Feel Alive

Homepage обязана показывать реальные продукты через `ProductCard` variant, а не состоять только из текста, категорий и обещаний.

Выборка должна быть:

- получена из существующего Storefront contract;
- детерминирована утверждённым правилом;
- свободна от неподтверждённых labels;
- ограничена так, чтобы вести в Catalog, а не заменять его;
- fail-closed при отсутствии допустимых товаров.

### Principle 15 — Product Owner Approval

Любой новый UI-экран, новый variant или существенное изменение canonical component до merge в `main` обязаны пройти Product Owner Review.

Evidence включает:

- утверждённые Specification и Design;
- Local QA;
- immutable Preview, если изменяется runtime;
- responsive/accessibility проверку;
- Acceptance Review с явным verdict;
- подтверждение UI Constitution compliance.

Отсутствие замечаний в code review не заменяет Product Owner Approval.

## 4. Component Inventory

Таблица определяет канонические логические компоненты. Физический путь может меняться без изменения public component contract. Альтернативная реализация под другим именем запрещена.

| Component | Назначение | Допустимые variants | Архитектурный запрет |
| --- | --- | --- | --- |
| `ProductCard` | Публичное представление Product в discovery-контексте | `catalog` (default), `featured`, `compact` | Нельзя создавать page-specific Product card или менять data semantics между variants |
| `CategoryCard` | Переход к Category/отфильтрованному Catalog | `featured`, `directory`, `compact` | Нельзя дублировать разметку Category в Homepage/Catalog |
| `ManufacturerCard` | Представление Manufacturer и переход на canonical page | `featured`, `directory`, `compact` | Нельзя создавать отдельный Homepage logo tile или подменять неизвестный logo |
| `Button` | Единая интерактивная поверхность действия | `primary`, `secondary`, `ghost`, `icon`; destructive — только в разрешённом internal flow | Нельзя создавать локальные button styles или использовать variant как произвольный цвет |
| `Input` | Единый ввод с label, validation и focus contract | `default`, `search`; size через утверждённый size API | Нельзя стилизовать input на уровне страницы в обход primitive |
| `Search` | Единый query/submit/empty/error contract поиска | `hero`, `catalog`, `compact` | Нельзя менять query semantics или создавать отдельный Search behavior для страницы |
| `Breadcrumb` | Семантическая иерархия текущей сущности | `default`, `compact` | Нельзя создавать JSX-цепочки Breadcrumb внутри route page |
| `CTA` | Следующее продуктовое действие с единой иерархией | `inline`, `section`, `product` | Нельзя создавать конкурирующие primary actions или локальную CTA card |
| `EmptyState` | Честное отсутствие сущностей/результатов | `page`, `section`, `filtered` | Нельзя подменять empty фиктивными данными или технической ошибкой |
| `LoadingState` | Стабильное ожидание без ложных значений | `page`, `section`, `grid`, `card` | Нельзя использовать случайный spinner вместо существующего skeleton contract |
| `ErrorState` | Безопасная recoverable/unavailable ошибка | `page`, `section`, `inline` | Нельзя показывать stack trace, internal ID или разрушать независимые блоки |
| `Hero` | Первый смысловой блок route с одним H1 и главным действием | `homepage`, `catalog`, `product`, `manufacturer` | Нельзя создавать новый Hero pattern внутри страницы или добавлять decoration без цели |

Variant не является разрешением удалить обязательные semantics, accessibility, data provenance, fail-closed или interaction states. Список variants расширяется только через утверждённую Specification и обновление этой inventory/Design System contract в одном PR.

## 5. Component Invariants

### 5.1. ProductCard

- Homepage использует `ProductCard variant="featured"` из той же реализации, что Catalog `ProductCard variant="catalog"`.
- Related/compatible content использует `compact`, а не `RecommendationCard` или `RelatedProductCard`.
- Все variants используют один Product presentation model, image fallback, title, manufacturer link, quality/action gating и accessibility contract.
- Variant может менять плотность и вторичную информацию, но не identity, status meaning или destination.

### 5.2. CategoryCard и ManufacturerCard

- Homepage и directory pages используют один component contract с variants.
- Canonical URL и entity identity не меняются между variants.
- Logo/media fallback не создаёт бренд, которого нет в data contract.
- Product count показывается только при одинаковой, документированной семантике.

### 5.3. Button и CTA

- Все действия используют canonical Button primitive; `CTA` только компонует его.
- `primary` означает одно главное действие в action zone, а не фирменный цвет по выбору страницы.
- Disabled/hidden определяется бизнес-доступностью. Недоступное коммерческое действие скрывается fail-closed, если disabled-состояние не объясняет полезный workflow.
- Touch target, focus-visible и keyboard activation обязательны для каждого variant.

### 5.4. Search и Input

- Header, Homepage и Catalog используют один query normalization contract.
- Variant меняет layout и доступную площадь, но не значение query, клавиатурное поведение или доступное имя.
- Input всегда имеет label; placeholder не является label.
- Empty query, no results и source error имеют единые состояния.

### 5.5. Breadcrumb, Back и navigation

- Все routes используют canonical Breadcrumb.
- Catalog → Product → Back использует единый state restoration contract.
- Breadcrumb links не записывают и не стирают return state.
- Header не реализует локальную копию route navigation.

### 5.6. States и Hero

- Loading/Empty/Error повторно используются на всех routes и сохраняют геометрию контекста.
- Error одного независимого Homepage блока не скрывает Hero, Search или Final CTA.
- Hero содержит один H1, только подтверждённые metadata и одно главное действие.
- Hero variant не создаёт новый Button, Search или Breadcrumb.

## 6. Design Tokens

Новые страницы и variants используют только существующие Design System tokens и primitives:

- spacing;
- typography;
- colors;
- radii;
- shadows;
- elevation;
- borders;
- motion;
- breakpoints;
- hover, focus, active, disabled и selected states;
- skeleton/loading timing и appearance.

ЗАПРЕЩЕНО без отдельного ADR:

- вводить локальную палитру, spacing scale, font scale, radius или shadow system;
- добавлять raw hex/rgb и произвольные elevation values ради одной страницы;
- копировать primitive с изменёнными классами;
- использовать inline styles для обхода tokens;
- создавать page-level CSS variables, выполняющие роль новых design tokens;
- менять breakpoint semantics локально.

Разовый layout constraint допускается только когда он не является новым token и объяснён в Design specification. Если значение повторяется или выражает визуальное правило, оно становится кандидатом в Design System, а не копируется.

Изменение общего token обязано проверять все canonical components и основные viewports. Существующие локальные значения, противоречащие Constitution, регистрируются как debt и устраняются отдельно без функционального scope creep.

## 7. Product Evolution Rules

Любая новая страница, новый canonical component, variant или существенный redesign проходит полный жизненный цикл:

```text
Specification
    ↓
Design
    ↓
Implementation
    ↓
Technical QA
    ↓
Product Owner Review
    ↓
Acceptance Review
    ↓
Merge
```

### 7.1. Gates

1. **Specification** фиксирует user goal, scope, data contract, states, KPI и ограничения.
2. **Design** использует Component Inventory и tokens; fork отмечается как blocker, а не рисуется как новая норма.
3. **Implementation** переиспользует canonical components и не принимает самостоятельных UX/UI-решений.
4. **Technical QA** проверяет tests, lint, TypeScript, build, accessibility, responsive, data boundaries и отсутствие regressions.
5. **Product Owner Review** подтверждает продуктовую цель, иерархию и реальный контент.
6. **Acceptance Review** независимо проверяет Specification, Design, Preview и Constitution compliance.
7. **Merge** разрешён только при verdict `APPROVED` и отсутствии BLOCKING/IMPORTANT findings.

Пропуск gate требует отдельного зафиксированного решения Product Owner и технического руководителя. Срочность не отменяет обязательные data/security/fail-closed правила.

### 7.2. Change control

- Изменение этого документа выполняется отдельным documentation/architecture scope.
- Изменение обязательного UI-инварианта требует Product Owner и architecture review.
- Исключение, меняющее долгосрочную архитектуру компонентов или tokens, требует ADR.
- Принятый exception имеет owner, срок, affected scope и план возврата к Constitution.
- Новый component/variant одновременно обновляет inventory, Design documentation и tests.

### 7.3. Pull request compliance

Каждый UI PR обязан ответить:

- какая сущность и canonical component затронуты;
- используется ли существующий variant;
- почему новый variant действительно необходим;
- какие data claims имеют public evidence;
- как работают loading/empty/error/fail-closed;
- не дублируются ли navigation и CTA;
- какие tokens и primitives использованы;
- где зафиксированы Product Owner и Acceptance Review.

PR, не способный доказать соответствие, получает статус `CHANGES REQUIRED`.

## 8. Conformance Checklist

UI соответствует Constitution, только если одновременно выполнены условия:

- [ ] каждая сущность использует один canonical component;
- [ ] контекстные различия выражены Variant API;
- [ ] page-specific forks отсутствуют;
- [ ] все публичные claims подтверждены Product Data/public contract;
- [ ] реальные media не заменены stock/AI/abstract imagery;
- [ ] Search остаётся главным discovery action;
- [ ] каждый блок имеет цель, KPI и state policy;
- [ ] Header/Breadcrumb/Back/CTA не дублируют ответственность;
- [ ] используются общие primitives и tokens;
- [ ] UI остаётся product-first и Cloud-first;
- [ ] отсутствие данных обрабатывается fail-closed;
- [ ] Homepage направляет в Catalog, не копируя его;
- [ ] Homepage показывает ограниченную выборку реальных Product;
- [ ] Product Owner Review и Acceptance Review завершены до merge.

## 9. References

- [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md)
- [ARCHITECTURE](../00-project/ARCHITECTURE.md)
- [DEVELOPMENT](../00-project/DEVELOPMENT.md)
- [RELEASE_PROCESS](../00-project/RELEASE_PROCESS.md)
- [ADR-001 — Cloud First](../00-project/ADR/ADR-001-cloud-first-source-of-truth.md)
- [ADR-002 — Storefront repository boundary](../00-project/ADR/ADR-002-storefront-repository-boundary.md)
- [ADR-003 — Staging acceptance gate](../00-project/ADR/ADR-003-staging-acceptance-gate.md)
- [Product documentation index](../01-product/README.md)
- [Launch Roadmap](../roadmap/Launch_Roadmap.md)
- [Launch Changelog](../releases/CHANGELOG-LAUNCH.md)
