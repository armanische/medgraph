# CyberMedica Production Readiness Checklist

Дата аудита: 2026-07-16
Ветка: `feature/wave2-expansion`

Статусы: `[x]` подтверждено локальным аудитом, `[ ]` обязательный следующий шаг, `[~]` принято с условием или требует внешней проверки.

## Repository

- [x] Проверена целевая ветка `feature/wave2-expansion`.
- [x] Последние пять commit просмотрены; история в рамках аудита не переписывалась.
- [~] Working tree содержит незакоммиченные MVP-053, MVP-054 и MVP-055 изменения. Перед merge должен быть сформирован и проверен осознанный diff.
- [~] Локальный repository footprint — около 2.45 GiB, Git objects — 852.54 MiB. Большой clone/checkout cost остаётся production condition.
- [x] `.env.local`, `.vercel`, `.next`, build output и private keys исключены через `.gitignore`.
- [x] Локальный `npm ci` выполнен без lockfile mutation; перед merge повторить его в clean CI checkout.
- [ ] Merge выполнять только после обязательных branch protection checks и review.

## Build

- [x] `npm run build -- --webpack` проходит на Next.js 16.2.9.
- [x] TypeScript build phase проходит.
- [x] 79 static/SSG pages сгенерированы без build warnings.
- [x] Dynamic routes явно отражены в build output.
- [~] Суммарные generated browser assets: 1.05 MiB JS и 70.56 KiB CSS без сжатия; это не First Load JS одной страницы.
- [~] Самый крупный route-specific chunk — `/catalog`, около 102 KiB без сжатия. Проверить фактический transfer в Preview.
- [x] Явных `next/dynamic` или runtime `import()` в `app`, `components`, `lib` нет; route splitting выполняет Next.js.
- [ ] Провести Lighthouse и Web Vitals замеры на Preview URL.

## Tests

- [x] `npm test`: 234/234, включая 11 preview-hardening tests.
- [x] `npm run lint` проходит.
- [x] `npx tsc --noEmit --pretty false` проходит.
- [x] `git diff --check` проходит.
- [x] `npm run audit:evidence-integrity`: 0 violations, output hash не изменился.
- [x] `npm run audit:artifact-storage`: 276 artifacts, integrity failures 0, inventory hash не изменился.
- [ ] Провести ручной keyboard/mobile/contrast pass на Preview.
- [ ] Провести smoke test lead webhook с тестовой заявкой и проверить отсутствие PII в логах.

## Wave 2

- [x] Aggregate охватывает 10 planned manufacturers.
- [x] Зафиксированы 157 products, 198 official sources, 312 documents, 205 downloads/artifacts, 479 candidate facts/review items.
- [x] Wave 2 safety: `publicationCreated=false`, `supabaseWrites=false`, `verificationChanged=false`, `reviewDecisionsChanged=false`.
- [~] 19 blocked products и 14 warnings остаются research completeness findings, а не runtime build failures.
- [ ] Не представлять Wave 2 completion как полную verification/publication readiness.

## Evidence

- [x] Evidence integrity current violations: 0.
- [x] Repair report: `violationsAfter=0`, `blockedItems=0`, `unrecoverableItems=0`.
- [x] Evidence safety подтверждает отсутствие Verified Claims, Publication, Supabase и Review Decision изменений.
- [x] Публичная Supabase projection читает только `public_api` и использует `cache: no-store`.
- [ ] Перед public indexing отдельно подтвердить содержимое опубликованной projection и RLS policy в целевом окружении.

## Artifacts

- [x] Полностью проаудированы 276 artifacts / 827,123,221 logical bytes.
- [x] SHA/path mismatch, invalid PDF, HTML masquerade, duplicate, zero-byte, temp и absolute-path findings: 0.
- [~] 12 orphan candidates сохранены; требуется owner/retention disposition, удаление не разрешено.
- [~] Все artifacts остаются внутри Git. External immutable storage описано только как будущая миграция.
- [x] Storage policy и `npm run audit:artifact-storage` существуют; миграция не выполнялась.
- [x] History rewrite и artifact deletion запрещены до успешного Preview, backup и отдельного approval.
- [ ] Настроить backup/restore rehearsal и retention owner до production cutover storage.

## Security

- [x] Высокодостоверные сигнатуры secrets в tracked text не найдены; `.env.local` не tracked.
- [x] Runtime source не содержит localhost, workstation absolute paths, debug endpoints или disabled-auth markers.
- [x] В `app/components/lib` отсутствуют TODO/FIXME/HACK; единственный runtime console call — контролируемый `console.error` для public projection failure.
- [x] Request API ограничивает размер полей, проверяет input, использует honeypot, timeout и локальный rate limit.
- [~] Rate limit хранится in-memory и не является глобальным для serverless replicas; для public load требуется edge/shared protection.
- [~] Internal env gates закрывают контент, но не являются authentication/authorization. При включении требуется deployment protection или отдельный auth.
- [~] Gated internal routes отдают soft-404 HTTP 200 с generic not-found metadata/body. Sensitive markers отсутствуют, но monitoring/CDN должны учитывать status.
- [x] Enforced CSP, `nosniff`, strict referrer policy, `DENY` framing, permissions policy и COOP настроены глобально.
- [x] `X-Powered-By` отключён; `/api/request` получает explicit `no-store`.
- [x] `/thanks` имеет canonical `/thanks`, `noindex,nofollow` и отсутствует в sitemap.
- [~] CSP временно разрешает inline scripts/styles для совместимости со static Next runtime; nonce migration не входит в MVP-055.
- [~] `npm audit --omit=dev`: 2 moderate, 0 high, 0 critical. Finding связан с bundled `postcss@8.4.31` в Next.js.
- [~] Temporary risk принят только для protected Preview: owner Platform Engineering + Security, review 2026-08-16 или при безопасном compatible patch.

## Internal routes

| Route | Production gate | Robots | Public links | Audit result |
| --- | --- | --- | --- | --- |
| `/admin` | `CYBERMEDICA_ENABLE_ADMIN=1` | `noindex,nofollow` | нет | closed by default; dynamic/no-store soft 404 |
| `/internal/review-queue` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1` | `noindex,nofollow` | нет | closed by default; dynamic/no-store |
| `/internal/reviewer` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1` | `noindex,nofollow` | нет | closed by default; dynamic/no-store |
| `/internal/import-center` | `CYBERMEDICA_ENABLE_IMPORT_CENTER=1` | `noindex,nofollow` | нет | closed by default; dynamic/no-store |
| `/internal/wave2` | `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD=1` | `noindex,nofollow` | нет | closed by default; dynamic/no-store |

- [x] Internal/admin routes отсутствуют в Header и sitemap.
- [x] Robots metadata задана для каждого internal/admin route.
- [x] Disabled metadata использует нейтральный title и не раскрывает workspace name.
- [x] Internal UI copy явно требует Deployment Protection при включении.
- [ ] Не включать internal flags на публичном deployment без реальной access boundary.

## Preview

- [x] Локальный production smoke: 28/28 GET checks; optional invalid request probe: 29/29. Реальная заявка не отправлялась.
- [ ] Создать Preview только из проверенного commit и lockfile.
- [ ] Оставить `CYBERMEDICA_ALLOW_INDEXING` unset/`0`.
- [ ] Оставить internal/admin flags unset, либо включать только вместе с Vercel Deployment Protection.
- [ ] Настроить test webhook и отдельные Preview Supabase credentials, если соответствующие сценарии проверяются.
- [ ] Проверить route/status/header matrix, sitemap, robots, forms, responsive UI и error states.
- [ ] Выполнить `npm run qa:preview-smoke -- <BASE_URL>`; при protected deployment ожидается `protected_preview`.
- [ ] Зафиксировать Preview URL, deployment ID, commit SHA и smoke-test evidence.

## Production

- [ ] Зафиксировать production domain, SSL, DNS и `metadataBase` соответствие `https://cybermedica.ru`.
- [ ] Настроить `CYBERMEDICA_LEADS_WEBHOOK_URL`; token использовать, если downstream его поддерживает.
- [ ] Настроить Supabase URL/anon key и независимо подтвердить `public_api`/RLS read-only boundary.
- [ ] Принять явное решение по `CYBERMEDICA_ALLOW_INDEXING`; до этого оставить indexing выключенным.
- [ ] Подтвердить application security headers/CSP и platform HSTS на реальном deployment.
- [ ] Подключить monitoring, structured error reporting, uptime alerts и log retention без PII.
- [ ] Подтвердить privacy/legal/contact policy для формы заявки.
- [ ] Выполнить production-like smoke test на promoted Preview artifact.

## Rollback

- [ ] Хранить предыдущий verified deployment и его env snapshot без secret values в документации.
- [ ] Назначить release owner и rollback authority.
- [ ] Rollback criteria: route regression, 5xx spike, webhook failure, public projection failure, security/header regression или unintended indexing.
- [ ] Rollback не должен запускать Wave 2, менять Review Queue, Verification, Publication или artifacts.
- [ ] После rollback повторить `/`, catalog/search, request API, robots/sitemap и internal-gate smoke tests.

## Release gate

Текущий кодовый verdict: **READY WITH CONDITIONS — 8.8/10**. Build/test blocker не найден. Public production остаётся условным до external Preview smoke, env validation, advisory disposition, platform-header verification и operational monitoring integration.
