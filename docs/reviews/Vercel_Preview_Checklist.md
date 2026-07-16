# Vercel Preview Checklist

Дата подготовки: 2026-07-16
Назначение: проверка Preview без изменения pipeline, Wave 2, Verification или Publication.

## До deploy

- [ ] Использовать reviewed commit из `feature/wave2-expansion`; working tree и CI checkout должны быть clean.
- [ ] Убедиться, что `package-lock.json` соответствует `package.json`; устанавливать через `npm ci`.
- [ ] Подтвердить Node runtime, совместимый с Next.js 16.2.9 и lockfile. Repository не фиксирует `engines`/`.nvmrc`, поэтому версию нужно выбрать явно в Vercel Project Settings.
- [ ] Выполнить build, lint, tests и TypeScript check в CI.
- [ ] Не загружать `.env.local` в Vercel и не копировать secrets в build logs.
- [ ] `CYBERMEDICA_ALLOW_INDEXING` оставить unset или `0`.
- [ ] `CYBERMEDICA_ENABLE_ADMIN`, `CYBERMEDICA_ENABLE_INTERNAL_REVIEW`, `CYBERMEDICA_ENABLE_IMPORT_CENTER`, `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD` оставить unset.
- [ ] Если internal UI нужен для review, сначала включить Vercel Deployment Protection, затем добавить минимально необходимый env flag.
- [ ] Для request-flow использовать отдельный test webhook и test token.
- [ ] Для public projection использовать отдельный Preview Supabase project/credentials с read-only `public_api` и RLS.
- [ ] Зафиксировать expected routes, data snapshot и release owner.
- [ ] Не добавлять `vercel.json` только ради framework/build defaults: Vercel должен определить Next.js, `npm ci`, `npm run build` и `.next` из repository metadata. Любое override требует отдельного обоснования.

## Во время deploy

- [ ] Проверить install log: нет lockfile mutation, deprecated-package warnings и install script failures.
- [ ] Проверить build log: Next.js version, TypeScript, 79 generated pages, отсутствие warnings/errors.
- [ ] Проверить, что deployment создан из ожидаемого commit SHA.
- [ ] Убедиться, что build не запускает importers, Wave 2, Downloader, Resolver или background jobs.
- [ ] Убедиться, что generated reports и artifacts не изменяются во время build.
- [ ] Проверить bundle delta относительно аудита: примерно 1.05 MiB generated JS и 70.56 KiB CSS без сжатия; значимый рост расследовать.
- [ ] Не включать production domain и public indexing на Preview.

## После deploy

- [ ] Проверить HTTPS, certificate chain, canonical host и отсутствие mixed content.
- [ ] Проверить `/robots.txt`: `Disallow: /`.
- [ ] Проверить `/sitemap.xml`: нет `/admin` и `/internal/*`.
- [ ] Проверить response headers, caching и CDN behavior.
- [ ] Выполнить `npm run qa:preview-smoke -- <BASE_URL>`; сохранить summary. Если Deployment Protection отвечает до приложения, ожидается verdict `protected_preview`, а ручная проверка выполняется в authenticated browser session.
- [ ] Проверить отсутствие secrets, stack traces, local paths и internal JSON в HTML/client bundles.
- [ ] Проверить `404`, loading и error states.
- [ ] Проверить desktop/mobile layout и keyboard navigation.
- [ ] Проверить логи на unexpected errors и PII.
- [ ] Сохранить deployment ID, URL, commit SHA, время проверки и ответственного.

## Smoke tests

| Area | Check | Expected |
| --- | --- | --- |
| Home | `/` | 200, корректные title/description, без console errors |
| Catalog | `/catalog` и один `/catalog/[slug]` | данные и safety labels отображаются |
| Search | `/search` | поиск работает, Candidate Claims не публикуются |
| Product | `/products/fs510` | public projection или спокойный error state |
| Knowledge | `/knowledge/fs510` | evidence UI без internal leakage |
| Compare | `/compare` | deterministic comparison |
| Tender | `/tender` | deterministic rules, no Candidate Claims |
| Workspace | `/workspace` | read-only calculated results |
| Request | `/request` | validation, honeypot, test webhook success/failure |
| Thanks | `/thanks` | 200, canonical `/thanks`, `noindex,nofollow` |
| Admin | `/admin` | internal content закрыт при unset flag |
| Internal | все `/internal/*` | internal content закрыт при unset flags |
| Robots | `/robots.txt` | Preview полностью disallow |
| Sitemap | `/sitemap.xml` | только public routes |
| API | `GET /api/request` | 405; optional `--validate-request-api` отправляет только пустой invalid JSON probe и не создаёт заявку |

Автоматический запуск:

```text
npm run qa:preview-smoke -- https://<preview-host>
npm run qa:preview-smoke -- https://<preview-host> --validate-request-api
```

Второй режим отправляет только заведомо невалидный JSON `{}` в request API и ожидает 400/415; реальная заявка, PII и webhook payload не создаются. Дополнительно зафиксировать фактический HTTP status gated routes: локальный Next production smoke возвращает soft-404 body с HTTP 200. Скрипт требует generic not-found body, `noindex` и отсутствие sensitive markers, а не полагается только на status.

## Performance and security pass

- [ ] Lighthouse: Performance, Accessibility, Best Practices, SEO.
- [ ] Проверить First Contentful Paint, LCP, CLS, INP и route-specific transferred JS.
- [ ] Проверить application CSP, COOP, frame denial, permissions, referrer и `nosniff`; HSTS проверить на platform/custom-domain level.
- [ ] Убедиться, что `X-Powered-By` отсутствует.
- [ ] Проверить rate limiting с учётом serverless replicas; локальный in-memory limiter не считать глобальным.
- [ ] Зафиксировать disposition moderate PostCSS advisory.
- [ ] Проверить CSP browser console. Inline scripts/styles временно разрешены для static Next runtime; новые external origins или wildcard не добавлять без evidence.

## Promotion gate

Preview может быть предложен к Production только если:

- все обязательные smoke tests пройдены;
- internal content недоступен без approved protection;
- indexing остаётся controlled;
- env/secret owners подтвердили значения;
- security advisory и headers имеют documented disposition;
- monitoring/rollback готовы;
- deployment artifact промотируется без повторного изменения исходников или данных.

## Rollback

- [ ] Остановить promotion и отметить deployment как rejected при 5xx, internal leakage, unintended indexing, broken form или data-boundary regression.
- [ ] Вернуть alias на предыдущий verified Preview/Production deployment.
- [ ] Не запускать import pipeline или data repair как часть frontend rollback.
- [ ] После rollback повторить critical smoke: `/`, `/catalog`, `/request`, `/robots.txt`, `/sitemap.xml`, `/admin`, `/internal/*`.
- [ ] Повторить автоматический smoke на rollback URL и приложить summary к incident note.
- [ ] Создать incident note без secrets и PII.
