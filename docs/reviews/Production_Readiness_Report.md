# CyberMedica Production Readiness Report

Дата: 2026-07-16
Ветка: `feature/wave2-expansion`
Вердикт: **READY WITH CONDITIONS**
Итоговая оценка: **8.8/10**

## Executive summary

Ветка проходит production build, lint, 234 теста, TypeScript и whitespace validation. Архитектурные safety boundaries Wave 2/Evidence сохранены, evidence integrity имеет 0 текущих нарушений, а artifact audit не выявил checksum, PDF, duplicate, HTML или temporary-file проблем.

Кодового blocker для создания защищённого Preview не найден. MVP-055 добавил global security headers, отключил `X-Powered-By`, закрыл `/thanks` от индексации, нейтрализовал metadata выключенных internal routes и добавил deterministic smoke command. Public Production нельзя считать безусловно готовым до внешнего Preview smoke, env validation, решения по moderate dependency advisory и подключения approved monitoring/access controls.

В рамках MVP-055 pipeline, Wave 2, evidence semantics и generated reports не менялись. Hardening ограничен headers, internal access presentation, metadata, QA tooling, env/docs и тестами. Deploy не выполнялся.

## Scorecard

| Область | Оценка | Основание |
| --- | ---: | --- |
| Repository | 7.5/10 | ветка корректна; working tree содержит ожидаемые незакоммиченные MVP-053/054 изменения; repository около 2.45 GiB |
| Architecture | 9.0/10 | разделены public/internal/import/evidence layers; архитектура не менялась |
| Pipeline | 9.5/10 | deterministic import pipeline покрыт тестами и не запускается build/deploy |
| Wave 2 | 8.5/10 | 10 manufacturers, 0 aggregate errors; остаются 19 blocked products и 14 warnings |
| Evidence | 10/10 | current violations 0, blocked/unrecoverable 0, safety boundaries подтверждены |
| Dashboard | 9.5/10 | read-only, env-gated, noindex; disabled metadata не раскрывает название workspace |
| Security | 8.5/10 | global CSP/headers и no-store API; остаются soft 404, in-memory limiter и 2 moderate npm findings |
| Storage | 7.5/10 | 276 artifacts целостны; 12 orphan candidates и Git-resident storage остаются conditions |
| Testing | 10/10 | build/lint/234 tests/tsc/diff-check проходят |
| Deployment | 7.0/10 | deterministic smoke command готов; реальный Preview, monitoring и real env validation ещё не выполнены |

Средняя оценка: **8.8/10**.

## Repository audit

- Branch: `feature/wave2-expansion`, синхронизирована с `origin/feature/wave2-expansion` на precheck.
- HEAD на старте: `ac07de3 Complete Ambu Wave 2 execution and repair release readiness`.
- Working tree не clean: содержит результаты MVP-053, позднее дополненные только тремя review-документами MVP-054.
- Repository disk footprint: примерно 2.45 GiB.
- Git objects: 852.54 MiB.
- `.env.local` ignored и не tracked; secret values не выводились.

Перед merge нужен reviewed diff и clean CI checkout. В рамках задачи commit не создавался.

## Internal routes audit

| Route | Gate | Metadata | Public exposure | Production smoke |
| --- | --- | --- | --- | --- |
| `/admin` | `CYBERMEDICA_ENABLE_ADMIN` | title + noindex/nofollow | links/sitemap отсутствуют | internal content closed |
| `/internal/review-queue` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW` | title + noindex/nofollow | links/sitemap отсутствуют | internal content closed |
| `/internal/reviewer` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW` | title + noindex/nofollow | links/sitemap отсутствуют | internal content closed |
| `/internal/import-center` | `CYBERMEDICA_ENABLE_IMPORT_CENTER` | title + noindex/nofollow | links/sitemap отсутствуют | internal content closed |
| `/internal/wave2` | `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD` | title + noindex/nofollow | links/sitemap отсутствуют | internal content closed |

Все страницы используют `notFound()` и production env gate. При unset flags локальный production server не раскрыл внутренний контент и отдал `noindex,nofollow`. MVP-055 перевёл `/admin` на ту же dynamic/no-store модель, а disabled metadata всех пяти маршрутов теперь использует нейтральный title «Страница не найдена».

Наблюдение: Next.js возвращает not-found body с HTTP 200, то есть soft 404. Хрупкий status workaround не добавлялся; smoke проверяет body, generic metadata, `noindex` и отсутствие sensitive markers. Env gate не заменяет auth: любой включённый internal route должен находиться за Vercel Deployment Protection или отдельной authentication boundary. Это явно указано и в документации, и в internal UI copy.

## Environment audit

### Required for enabled production capabilities

- `CYBERMEDICA_LEADS_WEBHOOK_URL` — обязателен для работающей формы заявки; без него API возвращает 503.
- `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` — обязательны для `/products/fs510` public projection. Несмотря на `NEXT_PUBLIC_` имена, client import не обнаружен; текущий клиент server-only и read-only.

### Optional

- `CYBERMEDICA_LEADS_WEBHOOK_TOKEN` — Bearer token downstream webhook.
- `CYBERMEDICA_ALLOW_INDEXING` — explicit opt-in; по умолчанию robots запрещает indexing.

### Internal only

- `CYBERMEDICA_ENABLE_ADMIN`
- `CYBERMEDICA_ENABLE_INTERNAL_REVIEW`
- `CYBERMEDICA_ENABLE_IMPORT_CENTER`
- `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD`

Эти флаги не являются auth и должны оставаться выключенными на public deployment без внешней защиты.

### Development/import only

- `CATALOG_RESEARCH_PROVIDER`
- `CHROME_PATH`
- `PDFTOTEXT_PATH`
- `PYTHON_PATH`

`.env.example` теперь документирует все найденные переменные без значений и маркирует required/optional, internal-only, import-only, server-only, safe/forbidden in browser. Import-only paths не должны задаваться в Vercel.

## Build audit

- Next.js: 16.2.9, webpack production build.
- Compile: success, без warnings.
- TypeScript build phase: success.
- Static generation: 79 pages.
- Static routes включают `/`, `/compare`, `/manufacturers`, `/tender`, `/thanks`, `/workspace` и metadata routes.
- SSG: 49 catalog paths, 1 knowledge path и 8 manufacturer paths.
- Dynamic: request API, catalog/search/request/product projection и пять admin/internal routes.
- Generated static browser assets: 43 JS files, 1,098,548 bytes (1.05 MiB) суммарно; CSS — 72,275 bytes.
- Largest route-specific browser chunk: `/catalog`, 104,655 bytes.
- Явных dynamic imports в `app/components/lib` нет; Next route splitting остаётся активным.

Next 16 build output не предоставляет прежнюю per-route First Load JS таблицу. Указанные totals не равны пользовательской загрузке одной страницы; transfer size должен быть измерен в Preview.

### Preview deployment configuration

- `vercel.json` отсутствует и не создан: custom build/install/output override не требуется.
- Vercel должен auto-detect Next.js, выполнить clean lockfile install, `npm run build` и использовать `.next` output.
- Node version не закреплена через `engines`/`.nvmrc`; совместимую версию требуется явно подтвердить в Project Settings и build log.
- Internal server routes читают packaged generated JSON через build traces; artifact PDFs не импортируются в browser bundle.
- Repository/Git footprint остаётся upload/clone condition, хотя clean build и локальный production start проходят.

## Next.js audit

### Confirmed

- Все 18 page routes экспортируют metadata или `generateMetadata`.
- Root metadata содержит title template, description, OpenGraph, Twitter, metadataBase и controlled robots.
- Public canonical declarations существуют для основных indexable routes.
- `robots.ts` default-deny и разрешает crawl только при `CYBERMEDICA_ALLOW_INDEXING=1`.
- Sitemap не включает admin/internal routes.
- `favicon.ico` существует.
- Viewport создаётся стандартным Next metadata default.
- Static/dynamic caching соответствует build classification; Supabase projection использует `no-store`.
- Все маршруты получают enforced self-only CSP, `nosniff`, strict referrer policy, frame denial, permissions policy и COOP.
- `X-Powered-By` отключён; `/api/request` получает explicit `no-store`.
- `/thanks` имеет canonical `/thanks`, `noindex,nofollow` и отсутствует в sitemap.

### Warnings

- Web app manifest, apple-touch icon и dedicated OpenGraph image отсутствуют.
- CSP сохраняет `'unsafe-inline'` для Next runtime и текущих inline styles/scripts. Nonce не введён, чтобы не отключать static generation; это accepted temporary limitation.
- External origins не allowlisted: Supabase используется server-only, webhook выполняется server-side. Vercel Toolbar может потребовать отдельного review, а не wildcard.
- HSTS не задан приложением и должен быть подтверждён на Vercel/custom-domain уровне до Production.
- Root static response имеет длительный `s-maxage`; проверка обновления content после promotion должна входить в smoke test.

## Security audit

### Findings

- High-confidence private key/AWS/GitHub/OpenAI token signatures не найдены. Два broad `sk-` совпадения оказались частью официального Ambu filename URL, не secrets.
- Runtime localhost/test URLs и workstation absolute paths не найдены.
- Absolute `/Users/` встречается только в integrity sanitizer и negative tests.
- Debug endpoints, disabled-auth markers и runtime TODO/FIXME/HACK отсутствуют.
- Единственный runtime console call — `console.error` при сбое public product projection; stack клиенту не отдаётся.
- Request endpoint валидирует поля, content length, email, honeypot и timeout; rate limit ограничен памятью одного процесса/replica.
- API contract не менялся. Global route config добавляет `/api/request` response `Cache-Control: no-store`; PII logging отсутствует.
- Локальный production smoke прошёл 28/28 GET checks и 29/29 с optional invalid JSON request probe. Probe получил HTTP 400 и не создал lead/webhook payload.

### Conditions

- Подтвердить CSP и остальные headers на реальном Vercel Preview; HSTS проверить на platform/custom-domain уровне.
- Не включать internal env flags без auth/deployment protection.
- Для public scale заменить/дополнить in-memory rate limit shared/edge protection.
- Реализовать provider integration по `docs/production/Monitoring_and_Logging_Policy.md`; MVP-055 подключение сервиса не выполняет.

## Dependency audit

- Direct production dependencies: `next`, `react`, `react-dom`.
- Deprecated lockfile entries: 0.
- Lockfile содержит 13 transitive package names с несколькими версиями; это обычные nested ranges, не top-level duplicate declarations.
- Явно unused top-level dependency не обнаружен. `react-dom` напрямую не импортируется исходниками, но является обязательным direct peer для Next/React приложения.
- Чистый `npm ci` установил 358 packages без lockfile mutation; последующий `npm ls --depth=0` показал 0 extraneous entries.
- Доступны patch releases: Next/eslint-config-next 16.2.10, React/React DOM 19.2.7, Playwright 1.61.1; обновление не выполнялось.
- `npm audit --omit=dev`: 2 moderate, 0 high, 0 critical. Причина — Next 16.2.9 включает `postcss@8.4.31`, затронутый GHSA-qx2v-qp2m-jg93. Next 16.2.10 также объявляет PostCSS 8.4.31; автоматический downgrade, предложенный npm, не применять.
- Temporary risk owner: Platform Engineering совместно с Security. Severity: Moderate. Review date: 2026-08-16 или при первом совместимом patch, который обновляет bundled PostCSS, что наступит раньше.

## Wave 2, Evidence and Storage

- Wave 2: 10 manufacturers, 157 products discovered, 198 official sources, 312 documents, 205 artifacts, 479 candidate facts/review items, 19 blocked products, 14 warnings, 0 errors.
- Safety: Publication/Supabase/Verification/Review Decisions не изменены.
- Evidence integrity: 0 current violations, 0 blocked/unrecoverable repair items.
- Artifact storage: 276 files, 788.81 MiB logical; 0 hash/PDF/HTML/duplicate/temp failures; 12 retained orphan candidates.
- Storage policy и `npm run audit:artifact-storage` существуют. External immutable migration не выполнена; Git footprint остаётся condition, но не blocker для защищённого Preview.
- Git history rewrite и удаление artifacts запрещены до успешного Preview, backup/restore proof и отдельного approval.
- Повторные evidence/artifact audits детерминированы: evidence violations 0; artifact inventory 276 files, 12 retained orphans, hashes generated reports не изменились.
- Dashboard/Import Center остаются read-only и production-gated.

## Blockers and warnings

### Code/build blockers

Не найдены.

### Preview blockers

Для обычного закрытого Preview — не найдены. Если internal flags должны быть включены, отсутствие Deployment Protection является blocker.

### Production go-live gates

1. Пройти реальный Vercel Preview smoke (`npm run qa:preview-smoke -- <BASE_URL>`), Lighthouse/keyboard/mobile pass.
2. Проверить production env values, Supabase RLS/public projection и webhook delivery.
3. Зафиксировать mitigation или documented risk acceptance для PostCSS advisory.
4. Подтвердить security headers на Vercel, monitoring integration, rollback и PII-safe logs.
5. Оставить internal flags выключенными либо добавить настоящую access boundary.
6. Принять явное решение по public indexing и legal/privacy форме заявки; `/thanks` уже закрыт через `noindex,nofollow`.

## Final verdict

**READY WITH CONDITIONS — 8.8/10.**

Ветка технически готова к защищённому Preview. Production promotion допустим только после закрытия перечисленных operational/security gates. Никакой deploy или commit в рамках аудита не выполнялся.
