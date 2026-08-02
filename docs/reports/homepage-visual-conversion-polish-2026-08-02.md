# Homepage Visual and Conversion Polish — 2026-08-02

## Scope and identity

- Model/intelligence: Codex Sol / High.
- Branch: `codex/homepage-visual-conversion-polish-v1`.
- Base: `8ab238789d31f546e96f805e96ef3350092edcd9`.
- Feature commit: `861333e70a4a344b119e54f8fc34c2f3012e999b`.
- Git author/committer: `cybermedica <cybermedicaooo@gmail.com>`.
- Vercel user: `cybermedica`; team/project: `medgraph/medgraph`.
- Runtime Product, lifecycle, Supabase, ENV, DNS and migration writes: none.

## Baseline audit

The previous homepage was usable but did not state the company proposition as
quickly as it could. The first `h1` described a catalog rather than the supply
and selection service, the final block repeated catalog navigation, and the
benefits described platform mechanics more than buyer value. Category
navigation showed only six highest-count categories and did not intentionally
cover the main published equipment directions.

The featured carousel, resilient published-catalog transport, search,
manufacturer navigation and global visual primitives were already sound and
were retained. The audit found no horizontal overflow at 1440, 1280, 820, 390
or 360 px.

## Implemented presentation

The page remains server-rendered around the existing small search/carousel
client boundaries. No UI framework, animation library, second catalog fetch or
third-party script was added.

The final public copy is:

- hero: **Медицинское оборудование для клиник и медицинских учреждений**;
- hero description: **Подбор, поставка и сопровождение профессионального
  медицинского оборудования для государственных и частных заказчиков.**;
- primary action: **Перейти в каталог** → `/catalog`;
- secondary action: **Отправить запрос** → `/request`;
- final conversion heading: **Не нашли нужное оборудование?**;
- final action: **Отправить запрос** → `/request`.

The trust section now contains four neutral, supportable points:

1. Оборудование ведущих производителей;
2. Подбор под техническое задание;
3. Работа с государственными и частными заказчиками;
4. Сопровождение поставки и документации.

A compact company section explains equipment specialization and selection by
technical requirements without claiming years in business, client counts,
dealer status, guaranteed timing or exclusive rights.

## Published category navigation

The eight links use exact category slugs confirmed in the live published
catalog. The existing `CatalogExplorer` reads the `category` query parameter;
no unsupported deep-link contract was introduced.

| Direction | Canonical link |
| --- | --- |
| Аппараты ИВЛ | `/catalog?category=ventilators` |
| Мониторы пациента | `/catalog?category=patient-monitors` |
| Шприцевые насосы | `/catalog?category=syringe-pumps` |
| УЗИ-системы | `/catalog?category=ultrasound-systems` |
| Эндоскопические системы | `/catalog?category=endoscopy-systems` |
| Рентгеновские аппараты | `/catalog?category=x-ray-systems` |
| Дефибрилляторы-мониторы | `/catalog?category=defibrillator-monitors` |
| Аппараты респираторной поддержки | `/catalog?category=respiratory-support-devices` |

All eight returned HTTP 200 in Production. The featured selection remains the
same eight Product Owner-approved Published Products and all eight canonical
Product Detail links returned HTTP 200.

## Accessibility and responsive evidence

Automated WebKit checks covered desktop 1440/1280, tablet 820, iPhone 390 and
narrow mobile 360. The result was:

- exactly one `h1`;
- no heading-level skip;
- no duplicate IDs;
- no image without `alt`;
- no empty link;
- keyboard focus enters the page;
- primary controls and category cards meet the 44 px minimum;
- no horizontal page overflow;
- no WebKit runtime or hydration error.

The existing carousel additionally passed its iPhone/tablet/desktop navigation,
swipe layout, keyboard and eight-link checks. The general iOS smoke passed three
WebKit profiles across homepage, catalog, request, Product Detail and internal
login.

## Performance and resilience

All new content sections are Server Components and the trust icons are small
inline SVGs. No client dependency or additional public data request was added.
Both Next.js 16.2.9 Turbopack and Webpack production builds passed. The
catalog reliability gate passed all six timeout/retry/LKG cases with a validated
71-Product Production snapshot. A cached canonical read returned HTTP 200 with
TTFB 1.603 s and total 1.896 s; this is an operational probe, not a Core Web
Vitals replacement.

`/internal/health/catalog` reported `healthy`, live transport `healthy`,
projection version 73, snapshot count 71, fallback inactive and snapshot not
stale.

## Visual evidence

| Viewport | Before | After |
| --- | --- | --- |
| 1440 | [before](../screenshots/homepage-polish-before-desktop-1440-2026-08-02.png) | [after](../screenshots/homepage-polish-after-desktop-1440-2026-08-02.png) |
| 1280 | [before](../screenshots/homepage-polish-before-desktop-1280-2026-08-02.png) | [after](../screenshots/homepage-polish-after-desktop-1280-2026-08-02.png) |
| Tablet 820 | [before](../screenshots/homepage-polish-before-tablet-2026-08-02.png) | [after](../screenshots/homepage-polish-after-tablet-2026-08-02.png) |
| iPhone 390 | [before](../screenshots/homepage-polish-before-iphone-2026-08-02.png) | [after](../screenshots/homepage-polish-after-iphone-2026-08-02.png) |
| Mobile 360 | [before](../screenshots/homepage-polish-before-mobile-360-2026-08-02.png) | [after](../screenshots/homepage-polish-after-mobile-360-2026-08-02.png) |

## Production rollout and invariance

- Production runtime deployment: `dpl_2kYWALAQf159WUxjvXx1ECuvNrv3`, READY.
- Canonical alias: `https://cyber-medica.ru`.
- Products: 79 (read-only Catalog Admin inventory).
- Published/Unpublished: 71/8 (validated published projection and baseline).
- Lifecycle baseline: `71/71/71/71`; no lifecycle runner or write RPC was
  invoked by this task.
- Projection version: 73; published snapshot count: 71.
- Sitemap Product URLs: 71.
- `/`, `/catalog`, `/request`: HTTP 200.
- `GET /api/request`: HTTP 405.
- Legacy navigation links and personal email links: none. Existing Product
  image assets on `static.tildacdn.com` are media provenance, not navigation or
  route ownership, and were not changed.
- `gitForkProtection`: `true`.
- The eight deferred Products remain outside this task and unpublished.

The next roadmap stage may focus on a separate public contact/footer review or
analytics measurement contract. The eight special Product correctives remain
deferred and do not block the public Storefront.
