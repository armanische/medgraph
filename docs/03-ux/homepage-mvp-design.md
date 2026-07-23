# CyberMedica — Homepage MVP Design v1

**Статус:** Ready for product design approval<br>
**Тип:** нормативная visual, wireframe и layout specification<br>
**Версия:** 1.0<br>
**Дата:** 23 июля 2026 года<br>
**Launch Baseline:** `2ef6a576fc19352f5971bf3ac756360220093b1c`<br>
**Product source of truth:** `docs/00-product/homepage-mvp-specification.md`<br>
**Область:** публичная Homepage CyberMedica<br>
**Следующая задача после утверждения:** Homepage MVP Implementation v1

## Статус документа и правила применения

После явного утверждения этот документ становится единственным источником визуальных и layout-требований для Homepage MVP. Он дополняет, но не заменяет продуктовый контракт Homepage MVP Specification v1.

При реализации разработчик не выбирает самостоятельно:

- порядок секций;
- композицию Hero;
- наличие иллюстрации;
- сетку категорий, производителей и преимуществ;
- размеры основных элементов;
- CTA hierarchy;
- responsive-переходы;
- hover, focus, active, loading и empty states.

Если реализация требует отступления, сначала обновляются и утверждаются соответствующие требования. Этот документ не разрешает изменение Catalog Experience, Product Detail, Structured Fields, Product Data, сервисов или маршрутов.

### Controlled terminology resolution

В Homepage MVP Specification v1 вторичное действие Final CTA названо `Отправить запрос`. В текущей Design v1 задаче владелец продукта явно задал customer-facing label `Запросить КП`. Design v1 фиксирует видимую надпись **«Запросить КП»** как уточнение терминологии без изменения вторичного приоритета, назначения или маршрута `/request`.

### Не входит в документ

- React, Next.js, HTML, CSS и Tailwind implementation;
- новые компоненты или UI-kit;
- Figma, изображения и создание иконок;
- redesign Header, Footer, Catalog или Product Detail;
- новые data fields, content entities или analytics provider;
- новые публичные маршруты и бизнес-логика.

---

## 1. Design Goals

### 1.1. Primary design goal

Первый экран должен позволить пользователю понять назначение CyberMedica и начать поиск оборудования без визуального отвлечения. Search — главный объект Homepage, а не дополнение к рекламной композиции.

### 1.2. Product goals translated into design

| Product goal | Visual response | Проверяемый результат |
| --- | --- | --- |
| Быстро начать поиск | Search расположен внутри Hero сразу после H1 и пояснения | Поле и submit видимы на первом экране desktop и доступны без промежуточного CTA |
| Перейти в полный Catalog | Вторичный Hero CTA и основной Final CTA используют один label и маршрут | Пользователь видит стабильный путь в Catalog в начале и конце страницы |
| Выбрать класс оборудования | Категории идут первым обзорным блоком | Не требуется изучать производителей или преимущества до выбора категории |
| Найти бренд | Производители идут сразу после категорий | Brand-led сценарий остаётся заметным, но не конкурирует с Search |
| Понять практическую пользу | Четыре компактные текстовые карточки | Нет рекламной стены текста или неподтверждённых trust claims |
| Получить помощь | Secondary Request CTA в финальном блоке | Request доступен, но визуально слабее Catalog CTA |

### 1.3. Experience targets

- Homepage должна выглядеть как начало существующего каталожного продукта, а не отдельный лендинг.
- Визуальная плотность ближе к Catalog и Product Detail, чем к campaign page.
- Основное действие различимо за 3–5 секунд просмотра.
- Каждый блок отвечает только за одно пользовательское решение.
- Страница не содержит декоративных product cards, counts dashboard или merchandising grid.
- Контентная ширина не создаёт длинных строк и не требует горизонтального движения.
- Mobile сохраняет тот же смысл, а не упрощённую версию продукта.

### 1.4. Expected page rhythm

Высота страницы остаётся content-driven; fixed viewport-height sections запрещены. При максимальном количестве MVP entries ожидаемый диапазон без Header/Footer:

| Viewport | Ориентировочная высота | Назначение ограничения |
| --- | ---: | --- |
| Desktop 1440 px | 1 650–1 950 px | Сохранить продуктовую плотность и исключить landing-page pacing |
| Tablet 768 px | 2 150–2 550 px | Допустить двухколоночные списки без каруселей |
| Mobile 390 px | 2 850–3 400 px | Показать весь контент последовательно без скрытых swipe-секций |

Диапазоны являются regression guardrail, а не обязательной фиксированной высотой. Реальный текст, локализация и fail-closed отсутствие блоков могут уменьшать страницу.

---

## 2. Visual Principles

### 2.1. Existing system only

Homepage использует существующую CyberMedica system language:

- **Onest** для UI, заголовков и основного текста;
- **IBM Plex Mono** только для коротких labels и числовых counts;
- светлый canvas, белые surfaces и тонкие rules;
- teal как основной interactive accent;
- coral только как редкий brand accent, не как альтернативный primary CTA;
- компактные карточки с border, малой тенью и radius 12px;
- motion 160–180ms и подъём interactive surface не более 1px;
- visible focus ring через существующий teal outline.

Новая palette, type scale, radius scale, shadow language или icon family не создаётся.

### 2.2. Color usage

| Роль | Existing token | Значение | Homepage usage |
| --- | --- | --- | --- |
| Primary text | `--cm-ink` | `#0b1320` | H1, H2, names, primary button background |
| Secondary text | `--cm-slate` | `#4e6070` | Supporting copy, descriptions |
| Tertiary text | `--cm-dim` | `#8298ae` | Counts, secondary metadata |
| Page canvas | `--cm-canvas` | `#f4f7fa` | Base page and alternating sections |
| Surface | `--cm-surface` | `#ffffff` | Cards, search input, manufacturer section |
| Low surface | `--cm-surface-low` | `#eef2f7` | Subtle section contrast and skeleton |
| Interactive accent | `--cm-teal` | `#0b7b8e` | Focus, links, active border, hover |
| Interactive hover | `--cm-teal-dark` | `#09636f` | Link and action hover |
| Soft accent | `--cm-teal-soft` | `#dcf0f4` | Focus background, subtle gradients |
| Brand accent | `--cm-coral` | `#d84b43` | Optional 1–2px decorative detail only |
| Border | `--cm-rule` | existing alpha | Cards and section separators |
| Strong border | `--cm-rule-strong` | existing alpha | Controls and emphasized boundaries |

Rules:

- Coral не используется для Search submit, Catalog CTA или Request CTA.
- Text over teal/coral fills не вводится без contrast verification.
- Section differentiation создаётся surface и border, а не несколькими насыщенными backgrounds.
- Gradients допускаются только из существующих white/canvas/teal-soft values.

### 2.3. Typography hierarchy

| Element | Desktop | Tablet | Mobile | Weight / line height |
| --- | --- | --- | --- | --- |
| H1 | 48px | 40px | 34px | 800 / 1.08, tracking `-0.035em` |
| Hero supporting copy | 16px | 16px | 15px | 400 / 1.65 |
| H2 | 30px | 26px | 24px | 800 / 1.2, tracking `-0.025em` |
| Card H3 | 15px | 15px | 15px | 700 / 1.35 |
| Body | 13–14px | 13–14px | 13px | 400 / 1.7 |
| Button | 13px | 13px | 13px | 600 |
| Count / micro label | 10px | 10px | 10px | IBM Plex Mono 500–600 |

Rules:

- H1 занимает максимум 18–20 слов в 2–3 строки desktop и до 4 строк mobile.
- Hero copy имеет максимальную ширину 44rem.
- Section descriptions, если предусмотрены продуктовой спецификацией, не превышают 38rem.
- Names допускают максимум 2 строки до переноса layout; обрезка по одной строке запрещена для category/manufacturer names.
- Uppercase mono labels не добавляются в Hero и не используются как рекламные overlines.

### 2.4. Shape, border and shadow

- Card radius: existing `--cm-radius-card`, 12px.
- Control radius: existing `--cm-radius-control`, 10px.
- Card border: 1px `--cm-rule`.
- Control border: 1px `--cm-rule-strong`.
- Default interactive card shadow: existing `--cm-shadow-card`.
- Hover shadow: existing `--cm-shadow-card-hover`.
- Static advantages cards не поднимаются при hover.
- Search form может использовать существующую medium shadow; heavy hero shadows запрещены.

### 2.5. Imagery decision

Hero illustration в MVP **не используется**.

Причины:

- изображение не добавляет новый способ поиска;
- product image создала бы неподтверждённую «рекомендацию»;
- generic medical visual превратил бы страницу в рекламный лендинг;
- освободившаяся ширина усиливает Search и сокращает высоту первого экрана.

Hero получает глубину только через существующий мягкий white-to-teal surface gradient и тонкий нижний rule. Фото, video, decorative device mockup, 3D object и illustration placeholder запрещены.

### 2.6. Motion

- Links, buttons and cards: 160–180ms ease.
- Interactive card hover: translateY `-1px`, teal-tinted border, hover shadow.
- Button hover: existing system behavior.
- No parallax, reveal-on-scroll, auto-animation or pulsing CTA.
- Skeleton shimmer использует существующий `cm-skeleton` pattern.
- `prefers-reduced-motion` отключает non-essential animation согласно global rule.

---

## 3. Wireframe

### 3.1. Canonical page order

```text
GLOBAL HEADER — existing, unchanged

1. HERO WITH SEARCH
   H1
   Supporting copy
   Visible Search label
   [ Search input                         ][ Найти ]
   [ Перейти в каталог ]

2. FEATURED CATEGORIES
   Категории оборудования                 Все категории →
   [ Category ][ Category ][ Category ]
   [ Category ][ Category ][ Category ]

3. MANUFACTURERS
   Производители                          Все производители →
   [ Manufacturer ][ Manufacturer ][ Manufacturer ][ Manufacturer ]
   [ Manufacturer ][ Manufacturer ][ Manufacturer ][ Manufacturer ]

4. WHY CYBERMEDICA
   Как CyberMedica помогает с выбором
   [ 01 Benefit ][ 02 Benefit ][ 03 Benefit ][ 04 Benefit ]

5. FINAL CTA
   Не нашли нужную модель?       [ Перейти в каталог ][ Запросить КП ]
   Supporting copy

GLOBAL FOOTER — existing, unchanged
```

Порядок фиксирован. Документарный порядок разделов 7 и 8 ниже следует требуемой структуре deliverable; реальный page order всегда **Manufacturers → Advantages** согласно Homepage MVP Specification v1.

### 3.2. Desktop wireframe — 1440px

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Existing sticky Header                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ HERO / soft surface                                                      │
│                                                                          │
│  H1 — max 52rem                                                          │
│  Supporting copy — max 44rem                                             │
│                                                                          │
│  Найти оборудование                                                      │
│  ┌──────────────────────────────────────────────┬─────────────────────┐  │
│  │ Search input                                 │ Найти               │  │
│  └──────────────────────────────────────────────┴─────────────────────┘  │
│  [ Перейти в каталог ]                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ CATEGORIES / canvas                                                      │
│  Section title                                         All link          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│  │ Category       │ │ Category       │ │ Category       │               │
│  └────────────────┘ └────────────────┘ └────────────────┘               │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │
│  │ Category       │ │ Category       │ │ Category       │               │
│  └────────────────┘ └────────────────┘ └────────────────┘               │
├──────────────────────────────────────────────────────────────────────────┤
│ MANUFACTURERS / white                                                    │
│  Section title                                         All link          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ Mark Name  │ │ Mark Name  │ │ Mark Name  │ │ Mark Name  │            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ Mark Name  │ │ Mark Name  │ │ Mark Name  │ │ Mark Name  │            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
├──────────────────────────────────────────────────────────────────────────┤
│ WHY / canvas                                                             │
│  Section title                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │ 01 Benefit │ │ 02 Benefit │ │ 03 Benefit │ │ 04 Benefit │            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
├──────────────────────────────────────────────────────────────────────────┤
│ FINAL CTA / inset light card                                             │
│  Heading + copy                       [ Catalog ][ Request quote ]        │
└──────────────────────────────────────────────────────────────────────────┘
│ Existing Footer                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3. Tablet wireframe — 768px

```text
Header
Hero: single content column
Search: input + submit in one row
Secondary Catalog button below Search

Categories: 2 columns × up to 3 rows
Manufacturers: 2 columns × up to 4 rows
Advantages: 2 columns × 2 rows
Final CTA: text, then two buttons
Footer
```

### 3.4. Mobile wireframe — 390px

```text
Header

H1
Supporting copy
Visible Search label
[ Search input                         ]
[ Найти                                ]
[ Перейти в каталог                    ]

Категории оборудования
[ Category ]
[ Category ]
… up to 6
[ Все категории ]

Производители
[ Mark + Manufacturer ]
… up to 8
[ Все производители ]

Как CyberMedica помогает с выбором
[ 01 Benefit ]
[ 02 Benefit ]
[ 03 Benefit ]
[ 04 Benefit ]

Не нашли нужную модель?
Supporting copy
[ Перейти в каталог ]
[ Запросить КП       ]

Footer
```

### 3.5. Section size specification

| Section | Desktop vertical padding | Tablet | Mobile | Internal max width / height rule |
| --- | ---: | ---: | ---: | --- |
| Hero | 64px | 56px | 40px | No fixed min-height; content max 56rem |
| Categories | 48px | 48px | 36px | Cards content-driven, minimum 144px desktop/tablet, 124px mobile |
| Manufacturers | 48px | 48px | 36px | Cards minimum 112px desktop/tablet, 96px mobile |
| Advantages | 48px | 48px | 36px | Cards minimum 144px desktop, 132px tablet/mobile |
| Final CTA | 48px | 40px | 36px | Inset panel minimum 168px desktop, content-driven mobile |

Fixed height is forbidden for text containers. Minimums provide rhythm; content may expand without clipping.

---

## 4. Hero

### 4.1. Composition

Hero is a single-column, text-and-action composition inside existing `cm-container`.

Order:

1. H1;
2. supporting copy;
3. visible Search label;
4. Search form;
5. secondary `Перейти в каталог` action.

There is no right visual column. On desktop the content occupies maximum 56rem and remains left-aligned to the global container. The right side is whitespace, preserving calm B2B hierarchy.

### 4.2. Surface

- Existing white → soft teal gradient, direction approximately 135 degrees.
- One bottom border using `--cm-rule`.
- No floating blobs, device cards, image frames or marketing badges.
- No separate dark Search band.
- Search remains part of Hero so the first screen has one visual task.

### 4.3. Typography

- H1 uses the exact approved copy and the H1 scale in section 2.3.
- H1 max width: 52rem desktop, 42rem tablet, 100% mobile.
- Supporting copy max width: 44rem; margin-top 16px.
- Search label appears 28px desktop / 24px mobile below supporting copy.
- Search form appears 8px below its visible label.
- Secondary CTA appears 16px below Search.

### 4.4. CTA placement

- `Найти` is visually primary because it is embedded in the emphasized Search form.
- `Перейти в каталог` uses existing secondary button styling in Hero.
- No Request CTA in Hero.
- Desktop and tablet secondary CTA is intrinsic width.
- Mobile Search submit and Catalog CTA are full width.

### 4.5. Illustration decision

No illustration slot is reserved. Implementation must not insert a product image, abstract medical art, stock photo or empty decorative column.

### 4.6. Hero acceptance

- Search is visually stronger than the secondary Catalog CTA.
- Hero does not exceed approximately 430px content height at 1440px.
- H1, supporting copy and Search are visible without scrolling on 1440px and 768px.
- On 390px, the Search input begins within the first viewport after the global Header; exact fold position may vary with system font rendering.
- One H1 only.

---

## 5. Search

### 5.1. Visual priority

Search is the largest interactive control on Homepage. Its width is greater than any standalone button and its border/focus treatment uses the same teal language as Catalog search.

### 5.2. Desktop and tablet layout

- Form max width: 56rem.
- One horizontal control group.
- Total control height: 56px.
- Input occupies remaining width; submit width 112–128px.
- Input horizontal padding: 16–20px.
- Search icon may use the existing Catalog search icon only; no new icon asset.
- Form radius: 12px outer surface, compatible with existing control radius.
- Visible label above form uses 12px/600 Onest, not mono uppercase.
- Submit default uses `--cm-ink` background and white text; hover uses `--cm-teal`, matching the existing primary-button contract.
- On the horizontal form, only the outer right corners belong to submit; input and submit read as one control without a double border.

### 5.3. Mobile layout

- Input and submit stack vertically below 640px.
- Input height: 52px.
- Submit height: 48px.
- Gap: 8px.
- Both controls are 100% width.
- Input and submit use their complete existing control radius because they are separate rows.
- Placeholder remains the approved copy; it may wrap only as browser behavior, not be shortened independently.

### 5.4. States

| State | Visual rule | Behavioural note |
| --- | --- | --- |
| Default | White surface, strong rule border, dim placeholder | Search label remains visible |
| Hover | Border moves toward teal at low opacity | No transform of entire form |
| Focus within | Teal border + existing 3px soft teal ring | Keyboard focus is never removed |
| Populated | Ink text; optional clear action uses existing pattern | Clear action requires accessible name |
| Empty submit | No red error; field retains focus | Matches product contract |
| Submitting/navigation | Submit may show disabled opacity only during real transition | Spinner is not the primary loading mechanism |
| Disabled | Not used in normal Homepage state | Search should remain available when overview sections fail |

### 5.5. Results behavior

Homepage MVP Design does not add autocomplete, suggestions, popular-query chips or inline product results. Submit navigates to `/catalog?q=…`, where existing Catalog Experience owns search, empty, error and state restoration.

This rule prevents Homepage from duplicating Catalog logic and removes the need to design a second results interaction.

### 5.6. Accessibility

- Visible label is programmatically associated with input.
- Form has a search landmark name.
- Submit uses text `Найти`; icon-only submit is forbidden.
- Focus order: input → submit → secondary Catalog CTA.
- Touch targets meet 44px minimum.
- Placeholder is supporting guidance, not the accessible name.

---

## 6. Catalog Entry

### 6.1. Shared section header

Categories and Manufacturers use one section-header pattern:

- H2 left;
- `Все …` link right on desktop/tablet;
- 20px gap from header to grid;
- on mobile the all-items action moves below the grid as a full-width secondary button;
- no subtitle unless future approved copy is added to the product specification.

### 6.2. Category cards

**Grid**

- Desktop: 3 columns, up to 2 rows.
- Tablet: 2 columns, up to 3 rows.
- Mobile: 1 column, up to 6 rows.
- Gap: 12px.

**Card content order**

1. category name;
2. optional short public description;
3. footer with optional product count and `Открыть →` affordance.

**Dimensions**

- Padding: 20px desktop/tablet, 16px mobile.
- Minimum height: 144px desktop/tablet, 124px mobile.
- Name reserves up to 2 lines.
- Description displays maximum 2 visual lines; if absent, footer remains anchored to the card bottom.

**Visual treatment**

- Entire card is one link.
- Text-first design; no image region and no generated category icon.
- White surface on canvas section.
- Interactive `cm-card` hover/focus behavior.
- Count uses 10px mono dim text and is omitted when not available without extra requests.

### 6.3. Category card states

- Long name wraps to a second line without shrinking font.
- Missing description leaves intentional whitespace; no filler text.
- Missing count removes count only; `Открыть →` remains aligned right.
- No disabled card. An entity without a valid destination is not rendered.

### 6.4. Section loading

If Homepage uses a streaming boundary, Categories loading state shows six shape-matched skeleton cards:

- two short title bars;
- one optional description bar;
- one footer bar;
- same grid and minimum height as loaded cards.

Spinner, generic full-page loader and shifting from unrelated geometry are forbidden. If data is server-rendered before first paint, no artificial skeleton delay is added.

### 6.5. Empty and error

- Zero valid categories: the entire section is omitted, including heading and CTA.
- Recoverable section error, if architecture exposes one: one compact existing `cm-empty-state` with `Категории временно недоступны` and secondary link `Перейти в каталог`.
- Error never includes stack, endpoint, environment or retry loop invented by Homepage.

---

## 7. Advantages

### 7.1. Runtime position

Advantages is the fourth page block and appears **after Manufacturers**, despite this document chapter appearing first to preserve the requested deliverable structure.

### 7.2. Content count

Exactly four capability cards are rendered when the section is present:

1. Подбор под задачу;
2. Помощь с поиском аналогов;
3. Доступные характеристики и документы;
4. Сопровождение запроса.

No fifth item, stats, customer quote or certification badge is added.

### 7.3. Grid

- Desktop: 4 equal columns, one row.
- Tablet: 2 columns, two rows.
- Mobile: 1 column, four rows.
- Gap: 12px.

### 7.4. Card design

- Static `cm-card` surface, not a link.
- Padding: 20px desktop/tablet, 16px mobile.
- Minimum height: 144px desktop, 132px tablet/mobile.
- Small numeric marker `01`–`04` in IBM Plex Mono and teal.
- Title below marker, then one short approved explanation.
- No custom icons, checkmarks, illustrations or hover lift.
- Text remains left aligned on every viewport.

### 7.5. Visual density

- Marker to title: 12px.
- Title to copy: 8px.
- Body uses maximum 4 visual lines desktop and content-driven height mobile.
- Cards in the same row align by stretch.
- Background is canvas; cards remain white.

### 7.6. States

This is static approved content; skeleton, empty and error states are not needed. If product copy is unavailable, implementation must stop rather than substitute marketing content.

---

## 8. Manufacturers

### 8.1. Grid

- Desktop: 4 columns, up to 2 rows.
- Tablet: 2 columns, up to 4 rows.
- Mobile: 1 column, up to 8 rows.
- Gap: 12px.

### 8.2. Card composition

Each manufacturer is a full-card link.

Top row:

- existing `ManufacturerMark` at 44 × 44px (`md` size);
- manufacturer name, up to 2 lines;
- optional country below name.

Bottom row:

- optional product count on the left;
- `Открыть →` on the right.

### 8.3. Dimensions

- Padding: 16px.
- Minimum height: 112px desktop/tablet, 96px mobile.
- Gap between mark and text: 12px.
- Divider before footer: existing `--cm-rule`.
- Footer top spacing: minimum 12px; remains at bottom using flexible layout.

### 8.4. Logo rules

- Only the existing verified local logo asset is displayed.
- Logo uses `object-contain` with internal 4px padding.
- No external runtime fetch, recoloring, cropping, grayscale or forced normalization.
- Missing or unverified logo uses the existing `ManufacturerMark` fallback.
- No new logo placeholder or generated icon is created by Homepage.
- Manufacturer presence never receives `официальный` or partner badge.

### 8.5. Interaction states

- Default: white `cm-card`.
- Hover: teal-tinted border, existing hover shadow, `-1px` lift; `Открыть` becomes teal.
- Focus visible: global 2px teal outline with 3px offset.
- Active: transform returns to zero; no color flash.
- Mobile: no hover-dependent information; name, country, count and affordance remain visible.

### 8.6. Loading, empty and error

- Loading uses eight geometry-matched skeleton cards only when a real streaming boundary exists.
- Zero valid manufacturers hides the full section.
- Recoverable error uses compact `cm-empty-state` and link `Все производители`, without technical detail.
- No blank logo boxes or fabricated manufacturer names.

---

## 9. Final CTA

### 9.1. Composition

Final CTA is an inset light panel inside a normal canvas section, not a full-width dark campaign banner.

Desktop:

- two-column internal layout;
- copy takes approximately 60%;
- actions occupy approximately 40% and align to the right;
- primary Catalog button appears before secondary Request button.

Tablet and mobile:

- single-column stack;
- copy first;
- actions below with 20px gap;
- both buttons full width on mobile.

### 9.2. Surface

- `cm-card` border/radius/shadow.
- Very soft white → teal-soft gradient compatible with existing Product/Catalog header surfaces.
- Padding: 32px desktop, 24px tablet, 20px mobile.
- No coral filled button, dark background, decorative blob or full-bleed artwork.

### 9.3. Typography

- H2: same section heading scale, no larger than 30px.
- Supporting copy: 14px/1.7, max width 38rem.
- No overline.

### 9.4. Action hierarchy

1. `Перейти в каталог` — existing primary button style.
2. `Запросить КП` — existing secondary button style.

Both controls have minimum height 48px in this block. Request must not use coral, larger size, icon or stronger shadow than Catalog.

### 9.5. Spacing

- H2 to copy: 12px.
- Copy/actions column gap: 32px desktop.
- Buttons gap: 12px.
- Mobile buttons stack with 8px gap.

---

## 10. Responsive Layout

### 10.1. Breakpoint contract

Design uses existing project breakpoints:

- **Mobile:** 320–639px;
- **Tablet:** 640–1023px;
- **Desktop:** 1024px and wider;
- **Wide desktop QA:** 1440px viewport; content still constrained by `cm-container`.

No Homepage-only breakpoint is introduced.

### 10.2. Container

- Below 640px: horizontal gutter 16px.
- From 640px: horizontal gutter 24px.
- Existing `cm-container` maximum width remains authoritative, up to 78rem in the current system.
- Full-width section backgrounds are allowed; content never leaves the container.

### 10.3. Responsive matrix

| Block | Desktop ≥1024 | Tablet 640–1023 | Mobile <640 |
| --- | --- | --- | --- |
| Hero | Single content column, max 56rem | Same, max 46rem | Full width |
| Search | Input + button row | Input + button row | Input and button stacked |
| Hero Catalog CTA | Intrinsic width | Intrinsic width | Full width |
| Categories | 3 columns | 2 columns | 1 column |
| Category all link | Header right | Header right | Full-width button below grid |
| Manufacturers | 4 columns | 2 columns | 1 column |
| Manufacturer all link | Header right | Header right | Full-width button below grid |
| Advantages | 4 columns | 2 columns | 1 column |
| Final CTA | Copy/actions two-column | Single-column | Single-column |
| Final buttons | Inline, right aligned | Inline or fit-content, left aligned | Stacked full width |

### 10.4. Content parity

- All valid categories and manufacturers selected by the product contract remain reachable on all viewport sizes.
- Counts or optional descriptions may be omitted on mobile only if the Homepage Specification permits it; name, link and block meaning remain.
- No mobile-only carousel, accordion or `Показать ещё` control.
- No desktop-only action.
- DOM order matches visual order.

### 10.5. Overflow rules

- No page-level horizontal overflow at 320px, 390px, 768px, 1024px or 1440px.
- Names wrap with `overflow-wrap` behavior rather than creating scroll.
- Search controls may not exceed container width.
- Button labels wrap only as a last resort; minimum mobile design is verified with Russian copy.
- Manufacturer logos shrink never below 44px; text column takes remaining width.

---

## 11. Component Usage

### 11.1. Existing component and pattern mapping

| Homepage need | Existing system source | Required usage | Forbidden variation |
| --- | --- | --- | --- |
| Global layout | `cm-container` | All section content | New max-width wrapper |
| Section rhythm | `cm-section` | Categories, Manufacturers, Advantages | Unrelated `py-24` landing spacing |
| Section heading | `cm-section-title` / existing Title scale | All H2 | New display heading scale |
| Interactive card | `cm-card` | Category and manufacturer links | Custom radius/shadow |
| Static card | `cm-card` without link hover | Advantages | Fake clickable hover |
| Primary button | `cm-button-primary` | Catalog CTA and Search action language | Coral primary CTA |
| Secondary button | `cm-button-secondary` | Secondary Catalog/Request actions | New tertiary filled variant |
| Search field | `cm-field` and current Catalog search pattern | Hero Search | Separate search UI system |
| Manufacturer identity | `ManufacturerMark` | Verified logo/fallback | External or generated logo |
| Skeleton | `cm-skeleton` geometry pattern | Dynamic grids when truly loading | Spinner or artificial delay |
| Empty state | `cm-empty-state` | Recoverable section error only | Technical error panel |
| Header/Footer | Existing global components | Unchanged | Homepage-specific navigation |

The implementation may compose presentation components for Homepage, but cannot create a parallel primitive or change shared primitives within Homepage scope.

### 11.2. Breadcrumbs

Breadcrumbs are **not used** on Homepage. The root route is already the start of the hierarchy. Adding `Главная` as a breadcrumb would be redundant and visually conflict with Catalog/Product Detail semantics.

### 11.3. Links and affordances

- Full category/manufacturer card is the click target.
- Nested links inside a linked card are forbidden.
- Arrow affordance is text/symbol already used by the system; no new icon asset.
- Section-level all-items action is visibly separate from card grid.
- External-link treatment is not needed on Homepage.

### 11.4. Interaction state table

| Element | Hover | Focus | Active | Disabled |
| --- | --- | --- | --- | --- |
| Primary button | Teal surface, small shadow, -1px | Global teal outline | 0px transform | Opacity only when real transition requires it |
| Secondary button | Teal border/text, small shadow, -1px | Global teal outline | 0px transform | Not used for static data failure |
| Interactive card | Teal-tinted border, hover shadow, -1px | Global teal outline | 0px transform | Entity is omitted instead |
| Text link | Teal-dark or teal | Global teal outline | No transform | Not rendered if destination invalid |
| Search form | Stronger border only | Teal border + soft ring | No transform | Not disabled by overview block failure |

### 11.5. Skeleton/loading

- Hero and Search do not skeleton: their copy and interaction are not data-dependent.
- Categories and Manufacturers use shape-matched skeletons only during a real asynchronous boundary.
- Skeleton count matches maximum initial layout: 6 categories, 8 manufacturers.
- Skeletons carry `aria-hidden`; the section/container exposes one polite loading label if needed.
- Reduced motion removes visible shimmer.
- Loaded content must not shift section width or grid column count.

---

## 12. Spacing Rules

### 12.1. Allowed scale

Homepage uses the existing spacing scale only:

`4, 8, 12, 16, 20, 24, 32, 36, 40, 48, 56, 64px`.

One-off values outside this scale require a design-spec revision.

### 12.2. Global vertical rhythm

| Relationship | Spacing |
| --- | ---: |
| H1 → Hero supporting copy | 16px |
| Supporting copy → Search label | 24px mobile, 28px tablet/desktop |
| Search label → Search form | 8px |
| Search form → secondary Hero CTA | 16px |
| Section heading → grid | 20px |
| Cards in grid | 12px |
| Section → section | Controlled by section padding and border; no extra spacer |
| Final CTA copy → actions on stacked layout | 20px |

### 12.3. Card internal rhythm

**Category**

- padding 20px / mobile 16px;
- name → description 8px;
- content → footer minimum 16px;
- footer top border with 12px top padding.

**Manufacturer**

- padding 16px;
- mark → text 12px;
- identity → footer minimum 12px;
- footer top border with 12px top padding.

**Advantage**

- padding 20px / mobile 16px;
- marker → title 12px;
- title → body 8px.

### 12.4. Alignment rules

- All H2 align to the same container left edge.
- Grid edges align with section heading edges.
- Hero Search starts on the same left axis as H1.
- Final CTA inset panel aligns with grid width.
- Counts and arrows align on one card footer baseline when cards share a row.
- Buttons use centered labels; text content remains left aligned.

### 12.5. Density guardrails

- No section uses more than 64px vertical padding.
- No decorative whitespace creates a section taller than its content by more than 128px.
- No card uses more than 20px content padding in Homepage MVP.
- No overview card includes more than three semantic text levels: name/title, optional body/country, footer metadata.
- Homepage uses no fixed 100vh/min-screen section.

---

## 13. Acceptance Criteria

### 13.1. Design authority and scope

- [ ] Design follows approved Homepage MVP Specification v1.
- [ ] Page contains only Hero with Search, Categories, Manufacturers, Advantages and Final CTA in that order.
- [ ] Header and Footer reuse existing global components unchanged.
- [ ] No Product Detail, Catalog, Structured Fields or data contract change is required.
- [ ] No new visual system, palette, typography, radius, shadow or icon family is introduced.

### 13.2. Hero and Search

- [ ] Hero is single-column and has no illustration or reserved visual column.
- [ ] Hero uses the approved H1, supporting copy, visible Search label and actions.
- [ ] Search is the strongest interactive element on the first screen.
- [ ] Desktop/tablet Search is one row at 56px; mobile input and submit stack.
- [ ] No autocomplete, popular-query chips or inline results are designed.
- [ ] Search submit uses `Найти`; empty submit has no red error state.
- [ ] Hero has no Request CTA, marketing badge, stats or product image.

### 13.3. Catalog entry

- [ ] Categories use a 3/2/1 responsive grid with maximum 6 entries.
- [ ] Category cards are text-first and contain no invented image or icon.
- [ ] Manufacturers use a 4/2/1 responsive grid with maximum 8 entries.
- [ ] Manufacturer logos use verified local assets or existing `ManufacturerMark` fallback.
- [ ] Counts are secondary and disappear cleanly when unavailable.
- [ ] Full card links have complete hover, focus and active states.

### 13.4. Advantages and Final CTA

- [ ] Advantages contains exactly four cards in a 4/2/1 grid.
- [ ] Advantage cards use numeric markers and no newly created icons.
- [ ] Advantage cards are static and do not show clickable hover behavior.
- [ ] Final CTA is an inset light panel, not a dark full-width banner.
- [ ] `Перейти в каталог` is visually primary.
- [ ] `Запросить КП` is visually secondary and routes to `/request`.
- [ ] Buttons stack full-width on mobile in the approved order.

### 13.5. Design-system compliance

- [ ] Onest and IBM Plex Mono roles match this document.
- [ ] Existing `cm-*` colors and primitives are used.
- [ ] Card radius is 12px and control radius is 10px.
- [ ] Teal remains the single interactive accent; coral is not used for primary actions.
- [ ] Interactive motion is limited to existing 160–180ms behavior and 1px lift.
- [ ] Focus-visible is present and not replaced by hover-only feedback.
- [ ] Breadcrumbs are absent from Homepage.

### 13.6. Responsive and accessibility

- [ ] Layout is verified at 390px, 768px and 1440px.
- [ ] No horizontal page overflow at 320px or wider.
- [ ] DOM order matches visible order at every breakpoint.
- [ ] Main actions meet 44 × 44px touch target minimum.
- [ ] One H1 and sequential H2 structure are preserved.
- [ ] Text remains readable without truncating category or manufacturer names to one line.
- [ ] No hover-only, swipe-only or carousel-only content exists.
- [ ] Reduced-motion behavior inherits the global system rule.

### 13.7. Loading, empty and failure states

- [ ] Hero and Search remain immediately available when overview data is missing.
- [ ] Real async loading uses geometry-matched skeletons, never a spinner or artificial delay.
- [ ] Empty category/manufacturer section is completely hidden.
- [ ] Recoverable section error uses existing compact empty-state language without technical detail.
- [ ] No placeholder entity, blank logo card or fabricated count is shown.

### 13.8. Visual consistency review

- [ ] Container, type, surfaces and card treatment visually match Catalog.
- [ ] Hero gradient, whitespace and action hierarchy do not conflict with Product Detail Hero.
- [ ] Homepage cards are less information-dense than Catalog product cards and cannot be mistaken for products.
- [ ] Search visual language matches Catalog search while retaining Homepage prominence.
- [ ] Final CTA uses the same button hierarchy as the rest of Storefront.
- [ ] The page reads as one product surface, not five separate landing-page campaigns.

### 13.9. Implementation handoff completeness

- [ ] Every block has fixed order, grid, spacing, typography and responsive behavior.
- [ ] Every interactive element has default, hover, focus and active rules.
- [ ] Loading, empty and error behavior is specified.
- [ ] No unresolved illustration, icon, color, CTA or layout choice remains for implementation.
- [ ] Any deviation requires an approved update to this document before code changes.

### 13.10. Definition of Ready for implementation

Homepage MVP Design v1 is ready for implementation only after explicit product/design approval. The implementation task must preserve this wireframe and the Homepage MVP Specification v1 product contract, and must not introduce independent UX/UI decisions.

---

## Design decision summary

| Decision | Approved design | Reason |
| --- | --- | --- |
| Hero composition | Single-column, no illustration | Search remains the first and strongest action |
| Search placement | Inside Hero | Removes a redundant standalone section and shortens path |
| Category cards | Text-first, 3/2/1 grid | Avoids fabricated imagery and preserves taxonomy focus |
| Manufacturer cards | Existing 44px mark, 4/2/1 grid | Reuses verified identity pattern |
| Advantages | Four static cards, numeric markers | No new icon set and no fake interaction |
| Final CTA | Inset light card | Matches Catalog/Product Detail rather than campaign landing |
| Primary final action | Перейти в каталог | Preserves catalog-first product hierarchy |
| Secondary final action | Запросить КП | Explicit Design v1 terminology; route remains `/request` |
| Mobile pattern | One-column, no carousel | Full content parity and keyboard/touch accessibility |
| Next task | Homepage MVP Implementation v1 | Implements approved product and visual contracts only |
