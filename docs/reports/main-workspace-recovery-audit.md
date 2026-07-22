# CyberMedica — Main Workspace Recovery Audit

**Дата снимка:** 22 июля 2026 года
**Основной workspace:** `/Users/arman/Desktop/cybermedica-platform`
**Release workspace для сравнения:** `/private/tmp/cybermedica-lc012`
**Режим:** read-only аудит Git; единственное созданное изменение — этот отчёт

## Executive Summary

Основной workspace содержит несколько исторических этапов проекта, накопленных поверх одной ветки без атомарной фиксации. До создания этого отчёта Git показывал:

- 20 staged-файлов;
- 44 tracked modified-файла;
- 334 физических untracked-файла;
- 398 физических изменённых путей всего;
- 156 строк в обычном `git status --short`, потому что Git сворачивает untracked-директории.

Счётчик VS Code `378 changes` воспроизводится точно как `44 modified + 334 untracked = 378`. Двадцать staged-файлов Ambu отображаются отдельной группой индекса и не входят в этот счётчик. Признаков устаревшего SCM cache, вложенного Git-репозитория или одного файла одновременно в staged и unstaged состояниях не обнаружено.

Сравнение всех 398 путей с чистым release HEAD `a460698b5d4f7c1bc45e894b095149ca276ac473` дало:

- 78 byte-identical текущему release HEAD;
- 7 совпадают с более ранними release-коммитами и являются устаревшими относительно HEAD;
- 20 существуют в обоих workspace, но расходятся по содержимому;
- 293 существуют только в основном workspace.

Основной риск — не потеря Storefront UI, а смешивание трёх разных контуров: legacy Publication/Ambu, полноценной Cloud/Admin/Data инфраструктуры и минимального Storefront release artifact. Прямой общий commit или копирование основного workspace поверх release недопустимы.

## 1. Git State

### 1.1. Основной workspace

| Параметр | Значение |
| --- | --- |
| Branch | `preview/storefront-ux-polish-v1` |
| HEAD | `948468dd21cc163abd4fba8df37169823beeacc0` |
| HEAD time | `2026-07-21T22:58:57+03:00` |
| HEAD subject | `docs: add CyberMedica project guide` |
| Upstream | `origin/preview/storefront-ux-polish-v1` |
| Remote branch HEAD | `e456017184ab6a334dbdd02ad24cde2bd92b7a67` |
| Remote branch subject | `docs: add preview deployment workflow` |
| Ahead/behind | ahead 1, behind 0 |
| Origin default branch | `main` |
| Origin HEAD | `66b0f97b0d37fc6fef808833a1a90b415975d5de` |
| Origin HEAD subject | `Complete Wave 2 expansion and production hardening` |

`origin` проверен напрямую через `git ls-remote`; `fetch`, `push` и изменение refs не выполнялись.

### 1.2. Репозитории и worktrees

Внутри открытого каталога `/Users/arman/Desktop/cybermedica-platform` найден только один `.git`. Вложенных Git repositories нет.

Основной Git repository регистрирует два worktree:

| Путь | Branch | HEAD | Состояние |
| --- | --- | --- | --- |
| `/Users/arman/Desktop/cybermedica-platform` | `preview/storefront-ux-polish-v1` | `948468d` | dirty |
| `/private/tmp/cybermedica-storefront-consolidation` | `consolidation/storefront-launch-base-v1` | `8fae7b0` | dirty: 6 modified, 6 untracked |

`/private/tmp/cybermedica-lc012` — отдельный Git clone, а не worktree основного repository:

- branch: `consolidation/storefront-launch-base-v1`;
- HEAD: `a460698b5d4f7c1bc45e894b095149ca276ac473`;
- working tree: clean;
- его `origin` указывает на локальный путь `/private/tmp/cybermedica-storefront-consolidation`, а не на GitHub.

Следствие: чистый release clone содержит завершённые локальные commits, но они не опубликованы в GitHub origin. Перед будущей консолидацией нельзя считать имя `origin` в `lc012` сетевым remote.

## 2. Почему VS Code показывает 378, а Git — 156

### Проверенные гипотезы

| Гипотеза | Результат |
| --- | --- |
| Несколько SCM repositories | Не подтверждено: внутри workspace найден один `.git` |
| Вложенный `.git` | Не найден |
| Один файл одновременно staged и modified | Не найдено, dual-state count = 0 |
| Устаревший VS Code SCM cache | Нет свидетельств; число 378 объясняется точно |
| Раскрытие untracked-директорий | Подтверждено |

### Точная арифметика

Обычный `git status --short`:

```text
20 staged + 44 modified + 92 свернутых untracked entries = 156
```

Полный `git status --short --untracked-files=all`:

```text
20 staged + 44 modified + 334 untracked files = 398
```

Счётчик VS Code:

```text
44 modified + 334 untracked = 378
```

Таким образом, VS Code показывает рабочие изменения, а staged Ambu-файлы учитывает отдельно. Git CLI по умолчанию сворачивает целые untracked-каталоги в одну строку. Расхождение штатное и не указывает на потерю файлов.

## 3. Метод классификации и сравнения

Каждый физический путь из `git status --porcelain=v1 -z --untracked-files=all` отнесён ровно к одной группе A–K по назначению каталога и файла. Сумма групп равна 398.

Содержимое сравнивалось по Git blob hash с:

- release HEAD `a460698`;
- Sprint 1.2 commit `340ce6a`;
- PR4 base `8fae7b0`.

Термины:

- **equivalent** — файл byte-identical release HEAD;
- **stale** — совпадает с более ранним release commit, но не с HEAD;
- **divergent** — путь есть в release HEAD, содержимое отличается;
- **main-only** — пути нет в release HEAD.

## 4. Классификация A–K

Состояние зафиксировано до создания этого отчёта.

| Group | Назначение | Всего | Staged | Modified | Untracked | Equivalent | Stale | Divergent | Main-only |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | Legacy publication / Ambu VivaSight | 21 | 20 | 1 | 0 | 0 | 0 | 7 | 14 |
| B | Storefront UI | 36 | 0 | 28 | 8 | 31 | 2 | 3 | 0 |
| C | Catalog Admin | 16 | 0 | 0 | 16 | 0 | 0 | 0 | 16 |
| D | Cloud-first / Supabase | 40 | 0 | 2 | 38 | 8 | 1 | 2 | 29 |
| E | Legacy Import Pipeline | 109 | 0 | 0 | 109 | 0 | 0 | 0 | 109 |
| F | Catalog baseline / QA | 11 | 0 | 1 | 10 | 2 | 0 | 0 | 9 |
| G | Product and reference data | 80 | 0 | 1 | 79 | 2 | 0 | 1 | 77 |
| H | Documentation | 16 | 0 | 0 | 16 | 1 | 0 | 4 | 11 |
| I | Cross-cutting tests | 12 | 0 | 8 | 4 | 7 | 4 | 1 | 0 |
| J | Generated / disposable artifacts | 54 | 0 | 0 | 54 | 26 | 0 | 0 | 28 |
| K | Unknown / manual review | 3 | 0 | 3 | 0 | 1 | 0 | 2 | 0 |
| **Итого** | | **398** | **20** | **44** | **334** | **78** | **7** | **20** | **293** |

### A. Legacy publication / Ambu VivaSight

- Paths: `data/public/**`, `data/review-decisions/**`, `app/internal/reviewer/page.tsx`.
- Предполагаемый этап: MVP-056/057 и первая ручная публикация Ambu VivaSight 2 DLT.
- В release: отсутствует как целостный artifact; 7 агрегатных/index-файлов имеют другие версии, 14 файлов отсутствуют.
- Перенос: не переносить в Storefront release автоматически. Сначала сохранить как отдельный audit/history commit на recovery/legacy ветке и проверить совместимость с текущим Cloud Catalog.
- Риск: высокий — duplicate publication, повторное применение review history и возврат `data/public` как ошибочного runtime source.
- Рекомендуемый commit: `chore: preserve legacy Ambu review and publication snapshot`.

### B. Storefront UI

- Paths: публичные routes, home/catalog/manufacturer/search components, Storefront presentation helpers и brand asset.
- Предполагаемый этап: RFC-003–010, Release 0.2 PR1–PR4, Launch Sprint 1.1/1.2.
- В release: 31 из 36 byte-identical; 2 устарели; 3 расходятся.
- Stale: `app/catalog/[slug]/page.tsx`, `components/catalog/CatalogExplorer.tsx`.
- Divergent: `lib/storefront/index.ts`, `lib/storefront/country-presentation.ts`, `lib/storefront/manufacturer-presentation.ts`.
- Перенос: основной UI не переносить поверх release. Release HEAD является более новым presentation artifact. Три divergent-файла проверять построчно; два presentation helper отличаются только завершающим переводом строки, а `lib/storefront/index.ts` отражает архитектурное различие Shadow Read против минимального release adapter.
- Риск: высокий при wholesale-copy; низкий для byte-identical файлов, которые вообще не требуют переноса.
- Рекомендуемый commit: не создавать дублирующий UI commit; использовать существующие release commits `8fae7b0`, `add3064`, `340ce6a`, `a460698`.

### C. Catalog Admin

- Paths: `app/api/internal/catalog-admin/**`, `app/internal/catalog-admin/**`, `components/internal/CatalogAdmin*`, `lib/catalog-admin/**`, migration/test/doc.
- Предполагаемый этап: Catalog Admin v1 и cloud_api header fix.
- В release: все 16 файлов main-only.
- Перенос: возможен только вместе с server-only access guard, ENV contract и migration/RPC dependencies из Group D.
- Риск: высокий — service-role boundary, internal route exposure и неполный перенос RPC.
- Рекомендуемый commit: `feat: add catalog admin v1` после Cloud Foundation commit.

### D. Cloud-first / Supabase

- Paths: repository layer, Supabase clients, Cloud Preview adapter, migrations, ENV documentation, shadow-read и Cloud Foundation tests/docs.
- Предполагаемый этап: Cloud Foundation, Reference Publication Alignment, Shadow Read и Cloud Storefront Preview.
- В release: 8 equivalent, 1 stale, 2 divergent, 29 main-only.
- Важные divergent: `.env.example`, `lib/internal-access.ts`. Основной workspace содержит более полный Admin/import ENV и access contract; минимальный release намеренно их не включает.
- Перенос: переносить как инфраструктурную серию, не одним смешанным commit; сначала schema/contracts, затем repositories, затем preview adapter.
- Риск: высокий — migration order, RLS, server-only credentials и различия минимального runtime artifact.
- Рекомендуемый commit: `feat: add cloud foundation and storefront preview adapters` с отдельной проверкой migration history.

### E. Legacy Import Pipeline

- Paths: `data/import/**`, `data/legacy/**`, `scripts/importers/legacy/**`, import migration tooling и соответствующие docs/tests.
- Предполагаемый этап: Content Migration, immutable snapshot, dry-run и Product Import v1.
- В release: все 109 файлов main-only.
- Перенос: технически возможен и необходим для сохранения воспроизводимости, но immutable snapshot должен пройти checksum audit до фиксации.
- Риск: средний/высокий — 80 snapshot-файлов, import inputs и executable migration tooling нельзя смешивать с UI.
- Рекомендуемый commit: `feat: add reproducible legacy product import pipeline` после отдельного immutable snapshot commit.

### F. Catalog baseline / QA

- Paths: `data/baseline/**`, `scripts/qa/**`, baseline report/tests, preview/runtime QA.
- Предполагаемый этап: Catalog Baseline v1 и release readiness.
- В release: 2 equivalent, 9 main-only.
- Перенос: безопасен после фиксации Cloud/Data слоёв, если manifest checksum подтверждён.
- Риск: средний — baseline может оказаться привязан к данным, которые ещё не представлены в истории интеграционной ветки.
- Рекомендуемый commit: `test: add catalog baseline and cloud QA gates`.

### G. Product data and reference data

- Paths: `data/reference/**`, `data/review/**`, `data/standards/**`, quality migrations/helpers/tests и master-data docs.
- Предполагаемый этап: Reference Data Import, Product Data Standard, Catalog Quality v1/v2 и Manufacturer Master Data.
- В release: 2 equivalent, 1 divergent, 77 main-only.
- Перенос: только после фиксации immutable import inputs и Cloud schema; generated alignment-файлы должны воспроизводиться командами.
- Риск: высокий — reference checksums, canonical IDs, quality flags и staged Cloud history должны оставаться согласованными.
- Рекомендуемый commit: `feat: add catalog reference data and quality model` с выделением generated outputs при необходимости.

### H. Documentation

- Paths: оставшиеся `docs/**`, кроме domain docs из A–G и screenshots.
- Предполагаемый этап: архитектура, product planning, release evidence и reviews.
- В release: 1 equivalent, 4 divergent, 11 main-only.
- Divergent release reports: `release-0.2-pr1.md`–`release-0.2-pr4.md`; их нельзя перезаписывать без ручного объединения evidence.
- Перенос: документацию прикладывать к owning feature commits; исторические reviews можно фиксировать отдельным docs commit.
- Риск: средний — конфликт статусов Implemented/Planned и устаревших URL/checksum.
- Рекомендуемый commit: `docs: consolidate cloud catalog and release evidence` после кода, а не до него.

### I. Tests

- Paths: cross-cutting Storefront tests, не отнесённые к конкретным backend/data группам.
- Предполагаемый этап: Storefront migrations и Release 0.2.
- В release: 7 equivalent, 4 stale, 1 divergent.
- Stale: Product Detail/Conversion/UX/PR4 contracts из более ранних release commits.
- Перенос: не переносить stale tests поверх release. Каждый main-only backend test должен следовать вместе со своим feature group.
- Риск: средний — старые assertions могут отменить принятый Sprint 1.2 UI contract.
- Рекомендуемый commit: отдельный `test:` commit только для действительно cross-cutting gates после feature commits.

### J. Generated or disposable artifacts

- Paths: 53 файла `docs/screenshots/**` и один generated import report.
- Предполагаемый этап: visual QA и dry-run evidence.
- В release: 26 screenshots byte-identical, 28 artifacts main-only.
- Перенос: не переносить весь каталог автоматически. Сохранять только screenshots, на которые ссылается принятый release report; generated JSON должен быть воспроизводим командой.
- Риск: низкий для потери runtime, средний для разрастания Git и дублирования evidence.
- Рекомендуемый commit: отдельный commit не рекомендуется; выбранные assets включать в соответствующий release/docs commit.

### K. Unknown / requires manual review

- Paths: `eslint.config.mjs`, `next.config.ts`, `package.json`.
- Предполагаемый этап: смешанная инфраструктура нескольких RFC.
- В release: `next.config.ts` equivalent; `eslint.config.mjs` и `package.json` divergent.
- Перенос: нельзя выбирать одну версию целиком. Основной `package.json` содержит Cloud/Admin/import/quality scripts, отсутствующие в минимальном release; основной ESLint config дополнительно исключает `.vercel/**`.
- Риск: высокий для механической замены, потому что команды зависят от main-only файлов.
- Рекомендуемый commit: не создавать самостоятельный config dump; добавлять каждую script/config строку вместе с owning group.

## 5. Staged Ambu Investigation

### Что находится в index

В index staged ровно 20 файлов, все относятся к Ambu/Human Review/legacy Publication:

- 4 новых public records: category, manufacturer, product, knowledge;
- 2 изменённых publication aggregates/manifests;
- 10 новых append-only review decisions;
- 4 изменённых review indexes/summary.

Diff index содержит 967 additions и 20 deletions.

Review decisions состоят из:

- 5 `start_review` actions;
- 5 `approve` actions.

Generated publication summary фиксирует:

- published products: 1;
- published items: 5;
- manufacturers: 1;
- categories: 1;
- knowledge entries: 1;
- blocked: 5475;
- rejected: 0.

### Почему они staged

Git index не хранит автора или время операции `git add`, поэтому доказать конкретную команду невозможно. По содержимому и истории задач это результат ручного Human Review и последующего запуска legacy Publication Pipeline для Ambu VivaSight 2 DLT. Файлы были добавлены в index, но commit не был создан.

### Является ли это завершённой публикацией

Как artifact старого pipeline — да: присутствуют approvals, product/manufacturer/category/knowledge records, manifest и summary. Как текущая Storefront publication — нет:

- release Storefront использует Cloud Catalog через Storefront repository boundary;
- legacy `data/public` не является текущим operational Source of Truth;
- artifact публикует только один продукт, а не полный каталог;
- перенос в release может повторно ввести удалённую legacy dependency.

### Есть ли соответствующий commit

Точного commit с product path `data/public/products/wave2-ambu-vivasight-2-dlt.json` или десятью decision-файлами не найдено ни в одной локальной/remote ref.

Связанные, но не эквивалентные commits:

- `7ef62ab` — `Implement publication and human review workflow`;
- `64c02f3` — `Prepare first approved products for publication`.

Они содержат pipeline и подготовку, но не текущий staged output. Следовательно, staged Ambu нельзя считать дубликатом существующего commit и нельзя без проверки добавлять к release history.

## 6. Main vs Release Workspace

### Уже вошло в release

Release history содержит:

| Commit | Назначение |
| --- | --- |
| `8fae7b0` | Product Detail Page Redesign / PR4 base |
| `add3064` | Launch Sprint 1.1 Product Detail Experience |
| `340ce6a` | Launch Sprint 1.2 Visual Polish |
| `a460698` | Finalize Launch Sprint 1.2 |

В основном workspace 78 изменённых файлов уже byte-identical release HEAD. Особенно это большая часть Homepage, Catalog, Manufacturers, navigation, Storefront services, Cloud Preview presentation и brand asset. Их повторный commit создаст дублирующую историю без изменения результата.

### Устаревшие версии в основном workspace

Семь файлов совпадают с более ранними release commits, но не с текущим HEAD:

```text
app/catalog/[slug]/page.tsx
components/catalog/CatalogExplorer.tsx
tests/importers/cloud-storefront-preview-v1.test.ts
tests/importers/product-detail-storefront.test.ts
tests/importers/release-0.2-pr4.test.ts
tests/importers/storefront-conversion.test.ts
tests/importers/storefront-ux-polish.test.ts
```

Эти файлы нельзя переносить из main в release: они откатят Sprint 1.1/1.2.

### Конфликтующие версии

Двадцать файлов существуют в обоих workspace и отличаются:

```text
.env.example
app/internal/reviewer/page.tsx
data/public/publication-manifest.internal.json
data/public/summary.generated.json
data/review-decisions/indexes/by-product.generated.json
data/review-decisions/indexes/by-review-item.generated.json
data/review-decisions/indexes/by-reviewer.generated.json
data/review-decisions/summary.generated.json
docs/catalog-content-standard.md
docs/releases/release-0.2-pr1.md
docs/releases/release-0.2-pr2.md
docs/releases/release-0.2-pr3.md
docs/releases/release-0.2-pr4.md
eslint.config.mjs
lib/internal-access.ts
lib/storefront/index.ts
lib/storefront/country-presentation.ts
lib/storefront/manufacturer-presentation.ts
package.json
tests/importers/release-0.2-pr2.test.ts
```

Большинство различий объясняется тем, что release clone минимизирован для Storefront runtime, а основной workspace содержит Cloud/Admin/import tooling. Это не означает автоматически, что main или release версия неправильна; требуется domain-aware merge.

### Только в основном workspace

293 файла отсутствуют в release HEAD. Основные массивы:

- 109 Legacy Import Pipeline;
- 77 Product/reference/quality data;
- 29 Cloud-first/Supabase;
- 28 selected/generated visual artifacts;
- 16 Catalog Admin;
- остальные QA и документация.

Эти файлы нельзя получить из текущей release branch и поэтому их необходимо сначала сохранить атомарными commits в recovery history.

## 7. Безопасная последовательность консолидации

Ниже приведён план, а не выполненные операции.

1. **Заморозить фактический inventory.** Повторить full-path status, checksum manifest для 293 main-only файлов и сохранить внешний backup. Не менять index до сохранения staged Ambu inventory.
2. **Создать отдельную recovery branch от текущего main HEAD.** Не использовать release branch как место первичного спасения данных.
3. **Сохранить Ambu отдельно.** Провести publication/review audit и создать отдельный legacy history commit. Не включать его в Storefront release без архитектурного решения.
4. **Зафиксировать immutable inputs.** Отдельный commit для 79 product snapshots и manifest после checksum audit.
5. **Зафиксировать Legacy Import Pipeline.** Scripts, schemas, dry-run и import tests без Cloud apply.
6. **Зафиксировать Cloud Foundation.** Migrations, repositories, Supabase server clients, RLS/schema tests и ENV contract в migration order.
7. **Зафиксировать reference/master data.** Reference inputs, aliases и checksums отдельно от generated alignment output.
8. **Зафиксировать Catalog Quality и baseline.** Quality model/migrations, затем baseline manifest и QA gates.
9. **Зафиксировать Catalog Admin.** Internal UI/API только после Cloud contracts; отдельно подтвердить server-only key boundary.
10. **Перенести release commits в чистую integration branch.** Получить commits напрямую из `/private/tmp/cybermedica-lc012`; не копировать stale main UI-файлы. Перед этим настроить однозначный GitHub remote, потому что `lc012/origin` сейчас локальный.
11. **Объединить только 20 divergent paths вручную.** Для каждого выбрать domain owner; не использовать wholesale checkout одной стороны.
12. **Привязать tests и docs к owning commits.** Stale Product Detail tests оставить из release; main-only backend/data tests переносить вместе с реализацией.
13. **Отфильтровать artifacts.** Сохранить только referenced screenshots и воспроизводимые generated outputs.
14. **Полный integration gate.** Tests, lint, typecheck, build, baseline/schema/reference audits, immutable checksum и read-only Preview smoke.
15. **Только после review — push/PR.** Никаких merge или Production действий в recovery этапе.

## 8. Рекомендуемая атомарная серия commits

Предлагаемый порядок:

1. `chore: preserve legacy Ambu review and publication snapshot`
2. `data: preserve immutable legacy product snapshot`
3. `feat: add reproducible legacy product import pipeline`
4. `feat: add cloud foundation and repository layer`
5. `feat: add catalog reference data and quality model`
6. `test: add catalog baseline and cloud QA gates`
7. `feat: add catalog admin v1`
8. существующие release commits `8fae7b0` → `add3064` → `340ce6a` → `a460698`
9. `docs: consolidate cloud catalog and release evidence`

Cross-cutting `package.json`, `.env.example`, ESLint и access guard должны входить в тот commit, который вводит использующую их возможность. Отдельный общий config commit не рекомендуется.

## 9. Appendix — Tracked Changes

### Staged: 20

```text
data/public/categories/anesteziologiya-i-endoskopiya.json
data/public/knowledge/wave2-ambu-vivasight-2-dlt.json
data/public/manufacturers/ambu.json
data/public/products/wave2-ambu-vivasight-2-dlt.json
data/public/publication-manifest.internal.json
data/public/summary.generated.json
data/review-decisions/decisions/review_decision_07f2e7e6e9c978d720fc1bf4.json
data/review-decisions/decisions/review_decision_0ace374227920790a16d161f.json
data/review-decisions/decisions/review_decision_14760044bb11823f060fa45d.json
data/review-decisions/decisions/review_decision_1ccfd773056468f4181300de.json
data/review-decisions/decisions/review_decision_212adab99909e3ca3ad49b27.json
data/review-decisions/decisions/review_decision_34ca94f7b63e81b71464d31d.json
data/review-decisions/decisions/review_decision_5e22db4ce849f10cd6286ae7.json
data/review-decisions/decisions/review_decision_601f1ace2fa35429467ab787.json
data/review-decisions/decisions/review_decision_a4cc08ffdfa6116e4b000a8b.json
data/review-decisions/decisions/review_decision_d25e9d9b1dceed5f3ae631d8.json
data/review-decisions/indexes/by-product.generated.json
data/review-decisions/indexes/by-review-item.generated.json
data/review-decisions/indexes/by-reviewer.generated.json
data/review-decisions/summary.generated.json
```

### Modified, not staged: 44

```text
.env.example
app/catalog/[slug]/page.tsx
app/catalog/page.tsx
app/compare/page.tsx
app/favicon.ico
app/globals.css
app/internal/reviewer/page.tsx
app/layout.tsx
app/manufacturers/[slug]/page.tsx
app/manufacturers/page.tsx
app/page.tsx
app/robots.ts
app/sitemap.ts
components/catalog/CatalogExplorer.tsx
components/home/CTA.tsx
components/home/Categories.tsx
components/home/FeaturedManufacturers.tsx
components/home/FeaturedProducts.tsx
components/home/Footer.tsx
components/home/Hero.tsx
components/home/Search.tsx
components/home/WhyCyberMedica.tsx
components/layout/Header.tsx
components/search/SearchExperience.tsx
docs/catalog-content-standard.md
eslint.config.mjs
lib/internal-access.ts
lib/storefront/index.ts
lib/storefront/product-service.ts
lib/storefront/schemas.ts
lib/storefront/seo.ts
lib/storefront/structured-data.ts
lib/storefront/types.ts
next.config.ts
package.json
tests/importers/catalog-storefront.test.ts
tests/importers/global-search-storefront.test.ts
tests/importers/homepage-information-architecture.test.ts
tests/importers/manufacturers-storefront.test.ts
tests/importers/preview-hardening.test.ts
tests/importers/product-detail-storefront.test.ts
tests/importers/storefront-conversion.test.ts
tests/importers/storefront-structured-data.test.ts
tests/importers/storefront-ux-polish.test.ts
```

### Untracked: 334 до отчёта

Крупнейшие физические группы:

| Prefix | Files |
| --- | ---: |
| `data/legacy` | 80 |
| `docs/screenshots` | 53 |
| `data/review` | 50 |
| `tests/importers` | 24 |
| `lib/data` | 12 |
| `docs/reports` | 9 |
| `supabase/migrations` | 9 |
| `lib/storefront` | 8 |
| `scripts/importers` | 8 |
| `data/import` | 7 |
| `data/reference` | 6 |
| `scripts/qa` | 6 |
| Остальные prefixes | 62 |

После создания этого документа untracked physical count увеличивается на один. Index и остальные файлы не изменены.

## 10. Safety Statement

Во время аудита не выполнялись:

- `git add`, commit, push, reset, restore, clean, checkout, rebase или merge;
- удаление файлов;
- Cloud/Supabase writes;
- migration/import/publication;
- deployment или изменение Production.

Документ не является разрешением на автоматическую консолидацию. Каждый предложенный commit требует отдельного scope review и QA.
