# Lost Launch Work Audit

**Дата аудита:** 2026-07-23

**Audit branch:** `codex/audit-lost-launch-work-v1`

**Сравниваемый baseline:** `origin/main` at `68ca9417c21e80f390c2ea231c339ec962c26d4a`

**Baseline tree:** `ece7a6c3a9b94dffe3213e329d6a9442fbe46d43`

**Режим:** read-only audit; runtime, Cloud Catalog, Supabase и deployments не изменялись

## Executive Summary

Аудит нашёл **26 завершённых Launch / Storefront задач** с проверяемыми Git,
документальными или Preview-артефактами:

| Класс | Значение | Количество |
|---|---|---:|
| A | Полностью сохранена | **18** |
| B | Частично потеряна | **3** |
| C | Полностью потеряна | **2** |
| D | Осознанно заменена новой реализацией | **3** |

Общий риск — **High / Launch Critical**. Cloud architecture и данные не
повреждены, но утверждённая Product Detail experience из Launch Sprint 1.1 и
1.2 не полностью дошла до `main`. Основная причина — не revert и не ошибочное
разрешение merge-конфликта. Feature-ветка Product Detail MVP была продолжена от
PR4 (`8fae7b0`), в то время как три последующих принятых commit находились
только в отдельном release clone:

```text
8fae7b0  PR4
   ├── add3064  Launch Sprint 1.1
   │      └── 340ce6a  Launch Sprint 1.2 polish
   │             └── a460698  Sprint 1.2 final/content acceptance
   └── 2410d45  Product Detail MVP
          └── 2d5ed59  integration marker
                 └── 68ca941  current origin/main
```

Следовательно, точка потери — **выбор неполной базы `8fae7b0` для
`feature/product-detail-page-mvp` и последующая интеграция дерева `2410d45`**.
Commit `2410d45` не удалял Sprint-код: в его ancestry этого кода уже не было.

Особенно важные доказательства:

- точный commit Launch Sprint 1.1:
  `add30644888b32d24c64ab1ac57a192f9a7ed589`;
- точный tree Launch Sprint 1.1:
  `00e27bc383f88b85278f33741df8306f8d18a2c1`;
- финальный принятый Product Detail tree после Sprint 1.2:
  `454bf8c46c4e5a8646986de28e6d18d5b8a3514e` at `a460698`;
- deployment `478LyCq39` — это
  `dpl_478LyCq39mAU4B8K9UX4Vq7zBW3p`, ветка
  `consolidation/storefront-launch-base-v1`, commit `a460698`, tree
  `454bf8c...`, Preview, `READY`, `gitDirty=0`;
- текущий `main` содержит PR4 и Product Detail MVP, но не содержит commits
  `add3064`, `340ce6a`, `a460698`.

### Граница аудита

В реестр включены завершённые задачи, которые создавали public Storefront
runtime, acceptance contract, Preview/runtime hardening или утверждённый UI.
Чисто исследовательские RFC, data/import/admin задачи и незавершённые feature
ветки не считаются Launch-регрессиями. В частности,
`feature/catalog-experience-mvp` (`929d11e`) является намеренно неслитой
текущей задачей, а не потерянной работой.

## Источники и метод

Проверены:

- актуальный `origin/main`, local/remote branches и ancestry;
- все зарегистрированные worktrees;
- recovery branch и
  `docs/reports/main-workspace-recovery-audit.md` at `d183e3c`;
- чистый release clone `/private/tmp/cybermedica-lc012` at `a460698`;
- commit/tree SHA, reflog и file-level diffs;
- Vercel deployment metadata без раскрытия ENV или секретов;
- `PROJECT_GUIDE`, `DEVELOPMENT`, `RELEASE_PROCESS`, ADR-001—ADR-004;
- release reports, screenshots и contract tests;
- текущие Product Detail, Catalog и Cloud Storefront source files.

Branch в старых commits восстановлен по сохранившимся branch/worktree/recovery
артефактам. Git сам по себе не хранит имя ветки внутри commit, поэтому такие
значения явно не трактуются как криптографическое доказательство.

## Task Inventory

| Task | Branch | Commit | Preview | Status in main | Lost scope | Confidence |
|---|---|---|---|---|---|---|
| Storefront Catalog Data Layer | historical Storefront line | `5515ae1` | pre-Cloud; отдельный accepted Preview не сохранился | **A** | — | High |
| Homepage → Storefront services | historical Storefront line | `cd39500` | pre-Cloud | **A** | — | High |
| Catalog → Storefront services | historical Storefront line | `45ca561` | pre-Cloud | **A** | — | High |
| Product Detail → Storefront services | historical Storefront line | `b4c7c56` | pre-Cloud | **A** | — | High |
| Manufacturers → Storefront services | historical Storefront line | `5a36002` | pre-Cloud | **A** | — | High |
| Search → Storefront services | historical Storefront line | `e6b2214` | pre-Cloud | **A** | — | High |
| Compare → Storefront services | historical Storefront line | `253e363` | pre-Cloud | **A** | — | High |
| Storefront infrastructure/sitemap migration | historical Storefront line | `4f0b8bc` | pre-Cloud | **A** | — | High |
| Storefront SEO Foundation | historical Storefront line | `abb18dc` | pre-Cloud | **A** | — | High |
| Storefront Structured Data | historical Storefront line | `032278b` | pre-Cloud | **A** | — | High |
| Homepage UX & IA v1 | historical Storefront line | `612aaf4` | pre-Cloud | **D** | Исходный UI заменён утверждённым PR3 | High |
| Lead Generation & Conversion | historical Storefront line | `ccde5de` | pre-Cloud | **A** | — | High |
| Production release blockers (VivaSight media, FS510 indexing) | historical Storefront line | `23ef6a8` | pre-Cloud | **A** | — | High |
| Storefront UX Polish v1 | `preview/storefront-ux-polish-v1` | `a24e6d5` | ранний Preview; точный accepted deployment не нужен для текущего дерева | **D** | Визуальная реализация заменена Release 0.2 PR1—PR4 | High |
| Storefront Cloud Integration Fix v1 | `preview/storefront-ux-polish-v1` | consolidated in `2224cf3` | ручной Cloud QA; нет отдельного clean SHA deployment | **B** | Runtime fix и tests сохранены; release report/screenshots не вошли в `main` | Medium |
| Runtime Bundle Cleanup v1 | `preview/storefront-ux-polish-v1` | core trace boundary consolidated in `2224cf3` | local `next`/Vercel build evidence | **B** | Research excludes сохранены; fail-closed Reviewer state, dedicated report и evidence отсутствуют | High |
| Cloud Storefront Preview Foundation | `consolidation/storefront-launch-base-v1` | `2224cf3`, tree `bb8910d` | included in later clean PR4 Preview | **A** | — | High |
| Release 0.2 PR1 — Product Presentation Contract | `consolidation/storefront-launch-base-v1` | `d4de7bc`, tree `ceee745` | included in PR4 Preview | **A** | — | High |
| Release 0.2 PR2 — Catalog Density | `consolidation/storefront-launch-base-v1` | `c3d9e4d`, tree `2e699e6` | included in PR4 Preview | **A** | — | High |
| Release 0.2 PR3 — Homepage & Manufacturers | `consolidation/storefront-launch-base-v1` | `84940b7`, tree `6e723ea` | included in PR4 Preview | **A** | — | High |
| Release 0.2 PR4 — Product Detail Redesign | `consolidation/storefront-launch-base-v1` | `8fae7b0`, tree `3f3fb3c` | `dpl_GJuGSu1Ke1GVrCYXNuNa4thtVx1R`, READY | **D** | PR4 layout evolved into Product Detail MVP; commit остаётся ancestor `main` | High |
| Launch Sprint 1.1 — Product Detail Visual Completion | clean release clone, `consolidation/storefront-launch-base-v1` | `add30644888b32d24c64ab1ac57a192f9a7ed589`, tree `00e27bc383f88b85278f33741df8306f8d18a2c1` | `dpl_7M4F4snkLtHivmXFy8hoGjS7ZLXw`, READY | **B** | Back/Top controls, in-page lightbox, magnifier, derived compact Summary/Advantages и единая Category label | High |
| Launch Sprint 1.2 — Visual Polish | clean release clone, `consolidation/storefront-launch-base-v1` | `340ce6aa18d68aadbcb4c214eb52c713dad0ea8a`, tree `676f2064b71bf544fb8c626da87f2453c1e09731` | `dpl_GuoSku6fGSdvEpbFfmUF8iw6mFM1`, READY | **C** | Card alignment, value-only metadata, model/SKU cleanup, non-duplicated application area, compact advantage cards | High |
| Product Acceptance — Content Review / Hero simplification | clean release clone, `consolidation/storefront-launch-base-v1` | `a460698b5d4f7c1bc45e894b095149ca276ac473`, tree `454bf8c46c4e5a8646986de28e6d18d5b8a3514e` | `dpl_478LyCq39mAU4B8K9UX4Vq7zBW3p`, READY | **C** | Accepted metadata B, removal of duplicate model pill, final Summary/Advantages contract and acceptance report | High |
| Product Detail Page MVP | `feature/product-detail-page-mvp` | `2410d457c2ec8479c3cd5eff63276c943e0af69b`, tree `04e11a696f4158c4166944cb32f6a91776185d23` | `dpl_4wUjYq9C4hwSJFxfAvEcREJfaP7e`, READY | **A** | —; semantic Cloud data sections preserved | High |
| Cloud Storefront Foundation → main integration | `integration/cloud-storefront-foundation-main` | `2d5ed5920fcc27654a3e6d9e84c127c96cd552a8`, tree `04e11a696f4158c4166944cb32f6a91776185d23` | `dpl_7SsAG2PBkTbxY12MfhScbf2BpkfH`, READY | **A** | —; marker commit has same tree as Product Detail MVP | High |

### Scope and files by accepted release stage

- Storefront migrations (`5515ae1`—`4f0b8bc`): `lib/storefront/**`, public
  route loaders, services/repository boundary and route tests.
- SEO/Structured Data (`abb18dc`, `032278b`): metadata/canonical/sitemap,
  `JsonLd`, schema builders and tests.
- Release 0.2 PR1—PR3: `lib/storefront/product-presentation.ts`, Catalog cards,
  Homepage, Manufacturers, brand assets, release reports/screenshots/tests.
- PR4 (`8fae7b0`): Product Detail page, presentation helpers, PR4 tests/report
  and screenshots.
- Sprint 1.1 (`add3064`): **16 files, +1022/-262**, including
  `app/catalog/[slug]/page.tsx`, `components/catalog/CatalogExplorer.tsx`, five
  Product Detail presentation components, `lib/storefront/product-detail-experience.ts`,
  launch contract tests and release documentation.
- Sprint 1.2 (`340ce6a`): **8 files, +153/-99**, focused on Product Detail,
  Catalog card density and acceptance contracts.
- Final content acceptance (`a460698`): **6 files, +129/-16**, including Hero
  simplification, content rules, final tests and review report.
- Product Detail MVP (`2410d45`): **2 files, +127/-13**; it extended the PR4
  page with Cloud-domain sections but did not include Sprint ancestry.

## Vercel Deployment Evidence

Все перечисленные deployments имеют environment `Preview`; Production
deployment в рамках аудита не выполнялся.

| Deployment | Branch | Commit | Tree | Status | Основной scope |
|---|---|---|---|---|---|
| `dpl_GJuGSu1Ke1GVrCYXNuNa4thtVx1R` (`medgraph-9wizfgajn-medgraph.vercel.app`) | `consolidation/storefront-launch-base-v1` | `8fae7b0` | `3f3fb3c` | READY | Cloud Preview + PR1—PR4 |
| `dpl_7M4F4snkLtHivmXFy8hoGjS7ZLXw` (`medgraph-j5ohxol7h-medgraph.vercel.app`) | `consolidation/storefront-launch-base-v1` | `add3064` | `00e27bc` | READY | PR4 + Launch Sprint 1.1 |
| `dpl_47TnE5E3AgpfjzCuA7yB4fdmYRZ3` (`medgraph-9sshiwdxc-medgraph.vercel.app`) | `consolidation/storefront-launch-base-v1` | `783f45d` | `b82cdb3` | READY | Initial Sprint 1.2 artifact; superseded by corrected commit |
| `dpl_GuoSku6fGSdvEpbFfmUF8iw6mFM1` (`medgraph-1yfq7hlw8-medgraph.vercel.app`) | `consolidation/storefront-launch-base-v1` | `340ce6a` | `676f206` | READY | Corrected Sprint 1.2 visual polish |
| `dpl_478LyCq39mAU4B8K9UX4Vq7zBW3p` (`medgraph-cu70qtl97-medgraph.vercel.app`) | `consolidation/storefront-launch-base-v1` | `a460698` | `454bf8c` | READY, `gitDirty=0` | Final Sprint 1.2 + content acceptance; contains `8fae7b0`, `add3064`, `340ce6a`, `a460698` |
| `dpl_4wUjYq9C4hwSJFxfAvEcREJfaP7e` (`medgraph-5xuslzpjh-medgraph.vercel.app`) | `feature/product-detail-page-mvp` | `2410d45` | `04e11a6` | READY | Product Detail MVP from PR4 base, without Sprint commits |
| `dpl_7SsAG2PBkTbxY12MfhScbf2BpkfH` (`medgraph-dihcox55c-medgraph.vercel.app`) | `integration/cloud-storefront-foundation-main` | `2d5ed59` | `04e11a6` | READY | Integration candidate, identical runtime tree to `2410d45` |
| `dpl_97EnFVcBCitrxy5TFHscJSqK9bLo` (`medgraph-3ntrz4f32-medgraph.vercel.app`) | `main` | `68ca941` | `ece7a6c` | READY | Current `origin/main` |

Deployment `478LyCq39` однозначно не является dirty или неподтверждённым
экспериментом. Его full ID, clean Git metadata, commit, tree и READY status
совпадают с чистым release clone. Он является последним доказанным состоянием,
в котором одновременно присутствуют PR4, Sprint 1.1, Sprint 1.2 и финальная
content acceptance.

## Confirmed Regressions

### 1. Launch Sprint 1.1 — Product Detail Visual Completion (B)

**Доказательства.** Commit `add3064`, tree `00e27bc`, clean READY deployment
`dpl_7M4F...`, release report и `launch-sprint-1-1` contract test согласованно
описывают одну реализацию. Commit не является ancestor текущего `main`.

**Что было:**

- source-derived Summary максимум на четыре предложения в Hero;
- полное описание ниже Summary;
- отдельный compact Advantages block;
- клиентская Product Gallery с in-page lightbox;
- круглая кнопка-лупа вместо текстовой ссылки;
- `Esc`, стрелки, backdrop click и mobile swipe;
- явная кнопка «Назад к каталогу»;
- scroll-aware кнопка «Наверх»;
- единая публичная классификация карточек — «Категория», без «Тип товара».

**Что сохранилось в `main`:** 40/60 Hero, Cloud Product loading,
breadcrumbs, specifications, regulatory info, downloads, manufacturer,
compatibility и related products. Эти части сохранены PR4/Product Detail MVP.

**Что потеряно в `main`:** navigation controls, полноценный lightbox и
keyboard/swipe interaction, magnifier control, derived Summary/full-description
split, derived compact Advantages и Catalog label unification contract.
Текущая inline gallery открывает media во внешней вкладке, а не в lightbox.

**Где потеряно.** Не удаляющим diff. `feature/product-detail-page-mvp` взяла
родителем `8fae7b0`, а не `a460698`; затем `2410d45` и `2d5ed59` перенесли это
неполное ancestry в `main`.

**Последнее корректное состояние.** Для Sprint 1.1 — `add3064`/`00e27bc`; для
совместного финального UI — `a460698`/`454bf8c`.

**Минимальный recovery scope.** Не cherry-pick всего commit. Адаптировать к
текущей Cloud Domain Model только Product Gallery, Product Page Navigation,
Summary/description split, compact Advantages и соответствующие acceptance
tests. Не трогать ProductService, CatalogRepository, Cloud mapper или data.

**Риск конфликта с Cloud Architecture:** Low–Medium. Потерянные элементы —
presentation/client interaction; риск сосредоточен в совмещении старого page
layout с новым semantic Product Detail MVP.

### 2. Launch Sprint 1.2 — Visual Polish (C)

**Доказательства.** Corrected commit `340ce6a`, tree `676f206`, READY deployment
`dpl_Guo...`, затем clean final deployment `dpl_478...`. Ни `340ce6a`, ни его
tree не присутствуют в ancestry `main`.

**Что потеряно:**

- одинаковая высота title/metadata zones Catalog cards;
- принятый metadata Variant B без подписей;
- отсутствие конструкции «Модель / Артикул»;
- отсутствие дублирующего application-area section после Hero;
- короткие advantage cards с исправленной icon geometry;
- Sprint 1.2 contract tests.

**Текущий обратный контракт.** Сохранившийся
`tests/importers/release-0.2-pr4.test.ts` всё ещё требует labeled metadata,
`presentation.model` и `line-clamp-4`. Поэтому test suite может проходить,
защищая именно предыдущее состояние PR4, а не принятую Sprint 1.2 версию.

**Где потеряно.** Та же неполная база `8fae7b0`; не отдельный revert.

**Последнее корректное состояние.** `340ce6a` для Visual Polish; `a460698` для
финального принятого UI.

**Минимальный recovery scope.** Небольшие изменения Product Detail metadata,
application-area rendering и Catalog card layout плюс перенос Sprint 1.2
contract tests. Восстановление должно использовать нынешний Product type и не
копировать старый repository/service code.

**Риск Cloud-конфликта:** Low. Изменения презентационные.

### 3. Product Acceptance — Content Review / Hero simplification (C)

**Доказательства.** Commit `a460698`, tree `454bf8c`, clean READY deployment
`dpl_478...`, final acceptance report. Commit отсутствует в `main`.

**Что потеряно:** принятый Variant B для metadata, удаление отдельной цветной
плашки manufacturer/model, финальный Summary/Advantages display contract,
review findings по десяти товарам и тесты финального Hero.

**Важно.** Сам review зафиксировал, что автоматический Summary/Advantages
generator для части Cloud catalog даёт слабый шаблонный контент. Поэтому
восстановление поведения нельзя смешивать с массовым переписыванием Product
Data. Сначала восстанавливается presentation contract, а улучшение генерации
должно быть отдельной content task.

**Последнее корректное состояние.** `a460698`/`454bf8c`.

**Минимальный recovery scope.** Hero composition + metadata mode + acceptance
contract/report. Cloud data не изменять.

**Риск Cloud-конфликта:** Low для UI, Medium для content derivation, если
попытаться расширить scope на данные.

### 4. Runtime Bundle Cleanup v1 (B)

**Доказательства.** Текущий `main` содержит `outputFileTracingExcludes` для
`data/research/**/*`, `data/legacy/**/*` и migrations. Cloud Preview contract
тестирует эту границу. Recovery workspace содержит отдельный проверенный report
с измерением ≈851 MB → 1.98 MB и fail-closed Reviewer implementation.

**Что потеряно:** graceful state для `/internal/reviewer` при отсутствии
research datasets, dedicated trace-size regression test и committed report.
Основная цель — исключение research data из serverless artifact — сохранена.

**Минимальный recovery scope.** Отдельная non-Launch runtime-hardening task:
fail-closed Reviewer state + `.nft.json` trace assertion + evidence document.

**Риск Cloud-конфликта:** None; риск относится к internal runtime packaging.

### 5. Storefront Cloud Integration Fix v1 evidence (B)

**Доказательства.** `main` содержит фактические исправления: request-time
`connection()`, единый service source, trusted Cloud media origin, CSP,
deployment trace exclusions и Cloud contract tests. Однако исходный detailed
report/screenshots сохранились только в recovery workspace, а не в `main`.

**Пользовательская функциональность:** не потеряна. Это confirmed loss release
evidence/documentation, а не runtime regression.

**Минимальный recovery scope.** После Launch UX recovery отдельно перенести
только актуальный evidence report, предварительно пометив исторические counts;
runtime не менять.

**Риск Cloud-конфликта:** None.

## Suspected Regressions

Ниже перечислены случаи, для которых недостаточно доказательств, чтобы считать
их завершёнными принятыми Launch-задачами:

1. **Product Experience v1 и Release Plan v0.2 documents.** Файлы существуют в
   dirty recovery workspace и на них ссылаются последующие PR reports, но для
   них не найден отдельный clean commit или accepted deployment. Вероятен
   documentation loss; runtime regression не доказана.
2. **Storefront Design/Product Review documents.** В recovery workspace есть
   review-артефакты, но audit-only материалы не подтверждают реализованный UI.
   Они исключены из количественного реестра, чтобы не смешивать backlog с
   shipped work.
3. **Reviewer fail-closed UI.** Код и QA report существуют в dirty workspace,
   но отдельный clean accepted commit не найден. Потеря runtime-hardening
   подтверждается сравнением, однако утверждение о product acceptance этого
   экрана имеет только Medium confidence.
4. **Старые manual Previews с `gitDirty=1`.** Они не использовались как source
   of truth. Только deployments, связанные с clean commit/tree, считаются
   acceptance evidence.

Не являются подозреваемыми регрессиями:

- `feature/catalog-experience-mvp` at `929d11e`: новая, намеренно неслитая
  feature work;
- failed/superseded previews;
- старые Homepage/UX implementations, заменённые PR3/Release 0.2;
- PR4 UI, сознательно развитый Product Detail MVP;
- legacy Review/Publication/Research behavior, исключённый архитектурными ADR.

## Regression Test Gaps

### Почему существующие tests прошли

1. Sprint 1.1/1.2 test files жили только в ветке `add3064` → `a460698` и не
   попали в ancestry Product Detail MVP.
2. Product Detail MVP tests проверяют наличие semantic sections и Cloud fields,
   но не проверяют принятые interactions и visual/content contract.
3. PR4 test остался и утверждает старые требования, противоположные Sprint 1.2.
4. CI не проверяет, что accepted Preview commit/tree является ancestor
   интеграционной ветки или что его поведение явно superseded ADR/decision.

### Необходимые проверки (не реализованы в рамках аудита)

| Gap | Предлагаемая regression check |
|---|---|
| Пропали Back/Top controls | Component contract + browser test: Product → Back сохраняет catalog URL/state; Top появляется после scroll и возвращает к началу |
| Lightbox заменился внешней ссылкой | Browser test для click, `Esc`, arrows, backdrop, mobile swipe; запрет `target="_blank"` как основной gallery interaction |
| Summary снова стал длинным excerpt | Contract: отдельные Summary и full description, Summary ограничен принятым reading-size contract |
| Advantages исчезли при пустом `keyFeatures` | Fixture с source-derived list; проверка коротких non-duplicated cards |
| Вернулись labels/model pill | Acceptance test для metadata Variant B и отсутствия «Модель / Артикул»/duplicate badge |
| Повторилась область применения | DOM/browser assertion: application area отображается один раз в принятой композиции |
| Catalog cards потеряли alignment | Screenshot/geometry regression at desktop/tablet; fixed title and metadata region baselines |
| Accepted branch выпала из ancestry | CI release manifest: task, accepted commit, tree, deployment; promotion gate `merge-base --is-ancestor` либо explicit supersession record |
| Test suite защищает старое поведение | Удалять/обновлять superseded contract в том же commit, где принимается новая версия |
| Research снова попал в artifact | Build assertion по `.nft.json`: 0 `data/research` paths и размер каждой internal function ниже установленного лимита |

## Recovery Order

### 1. Launch-blocking

1. Восстановить Product Detail interaction shell Sprint 1.1 поверх текущего
   Product Detail MVP: gallery/lightbox, Back, Top и contract tests.
2. Восстановить принятую Hero/metadata composition без удаления новых Cloud
   sections Product Detail MVP.

### 2. UX

3. Вернуть Catalog card alignment и единый Category presentation из Sprint
   1.1/1.2.
4. Вернуть compact Advantages и Summary/full-description hierarchy.

### 3. Content

5. Восстановить acceptance contract/report, затем отдельной задачей улучшить
   слабые Summary/Advantages templates без Cloud writes и массовой редакции.

### 4. Minor UI / evidence

6. Восстановить current-state Cloud integration evidence.
7. Закрыть Reviewer fail-closed и bundle trace evidence отдельной technical
   debt task, не смешивая её с Launch UI.

## Exact Next Task

### Recovery 1 — Restore Product Detail Interaction Shell

**Цель:** вернуть только подтверждённый Launch Sprint 1.1 interaction scope на
текущую Cloud Product Detail MVP, не откатывая semantic sections.

**Source of truth:**

- `add30644888b32d24c64ab1ac57a192f9a7ed589` / tree `00e27bc...` для Sprint
  1.1 behavior;
- `a460698b5d4f7c1bc45e894b095149ca276ac473` / tree `454bf8c...` для
  последнего принятого visual state;
- текущий `origin/main` для ProductService, CatalogRepository, Cloud Domain
  Model и semantic sections.

**Разрешённый scope:**

- адаптировать `ProductGallery` к текущему `Product.media`;
- адаптировать `ProductPageNavigation`;
- click-to-lightbox, magnifier, `Esc`, arrows, backdrop и mobile swipe;
- Back to Catalog и scroll-aware Top;
- focused component/browser contract tests;
- desktop/mobile Preview evidence.

**Запрещённый scope:** Cloud/domain/repository changes, Product Data, Summary
generator, metadata redesign, Catalog card polish, Supabase writes, migrations,
Production deployment.

**Acceptance:** существующие Product Detail MVP sections остаются; Cloud page
работает; interactions подтверждены browser tests и screenshots; accepted
commit/tree записан в release evidence до дальнейшей интеграции.

Эта задача в рамках настоящего аудита **не выполнялась**.

## Safety Confirmation

- Runtime files изменены: **0**.
- `origin/main` изменён: **нет**.
- Merge/recovery commit: **нет**.
- Production deployment/environment: **не затронуты**.
- Supabase/Cloud Catalog writes: **0**.
- Migrations/import/publication: **не выполнялись**.
