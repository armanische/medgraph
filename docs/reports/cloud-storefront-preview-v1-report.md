# Executive Summary

Cloud Storefront Preview v1 реализован как отдельный fail-closed режим `cloud_preview`. Локальный production-like QA подтвердил отображение всех 79 staging-товаров без изменения публикации, review state или исходных данных. Static mode остаётся режимом по умолчанию и по-прежнему содержит 2 публичных товара.

Vercel Preview-переменная `CATALOG_DATA_SOURCE=cloud_preview` настроена только для ветки `preview/storefront-ux-polish-v1`. Безопасный prebuilt artifact создан и проверен, но его загрузка была заблокирована политикой среды выполнения; Production deployment не выполнялся.

# Data Source Architecture

- `static` — default и единственный допустимый режим в Vercel Production.
- `cloud_preview` — Preview-only режим; при `VERCEL_ENV=production` запуск завершается ошибкой.
- Storefront pages продолжают использовать существующие `ProductService`, `ManufacturerService`, `CategoryService` и `CatalogRepository`.
- `CloudPreviewCatalogRepository` — server-only read adapter к service-only RPC `cloud_api.cloud_storefront_preview_catalog()`.
- RPC вызывается с `Accept-Profile: cloud_api` и `Content-Profile: cloud_api`.
- Preview draft visibility включается явной политикой `ProductService`; `preview_draft` не добавлен в публичный набор статусов.
- RPC имеет `STABLE` semantics, доступ только `service_role`; `anon` и `authenticated` отозваны.

# Catalog Results

Read-only staging audit и локальный UI QA:

| Метрика | Результат |
| --- | ---: |
| Products | 79 |
| Draft | 79 |
| Published | 0 |
| Pending review state | 79 |
| Media references | 134 |
| Application areas mapped | 79 |
| Manufacturer mapped | 25 |
| Category mapped | 5 |
| Storefront categories | 19 |
| Storefront manufacturers | 8 |
| Storefront application areas | 7 |

Каталог показывает 79 из 79 позиций, допускает несопоставленные manufacturer/category и не ограничивается двумя static-товарами.

# Product Page Results

Успешно открыты пять репрезентативных карточек:

1. `Одношприцевой инфузионный насос BeneFusion SP 5` — manufacturer и category сопоставлены, 2 media.
2. `Аппарат ИВЛ Hamilton-T1` — manufacturer сопоставлен, category отсутствует, 3 media.
3. `Двухшприцевой инфузионный насос Instilar 1428` — category сопоставлена, manufacturer отсутствует, 3 media.
4. `Аппарат для гемосорбции «Гемос»` — manufacturer и category отсутствуют.
5. `Гастрофиброскоп Pentax FG-29V` — несколько media references и безопасные missing states.

Каждая страница показала Preview banner, описание, характеристики, изображения, документы/регистрацию в нейтральном состоянии и отключённое сравнение. HTML description проходит allowlist sanitizer: исполняемые блоки и атрибуты удаляются.

# Search and Filters

- Поиск `BeneVision N1` вернул 2 релевантные карточки.
- Manufacturer `Hamilton Medical` + application area `Реанимация` вернули 3 карточки: Hamilton-C1, Hamilton-C3 и Hamilton-T1.
- Category, manufacturer и application-area selectors загрузились полностью.
- Сортировки `А–Я`, `Я–А` и `Сначала обновлённые` работают.
- Комбинация фильтров без результатов корректно отображает empty state и не ломает UI.

# Missing Data States

Подтверждены безопасные формулировки:

- `Производитель не указан`;
- `Категория уточняется`;
- `Документы добавляются`;
- `Регистрационные данные уточняются`;
- `Внутренний предпросмотр` вместо availability/publication утверждений.

Internal quality flags, evidence identifiers, source checksums и raw metadata в публичный дизайн не выводятся.

# Security QA

- Все Cloud reads выполняются server-side с service role.
- Storefront adapter не содержит PATCH/INSERT/UPDATE/DELETE.
- `/`, `/catalog`, product pages, `/manufacturers`, `/search` и `/compare` возвращают `Cache-Control: private, no-cache, no-store` и `X-Robots-Tag: noindex, nofollow`.
- Metadata содержит `noindex`; Preview `robots.txt` запрещает весь crawl; Preview sitemap пуст.
- JSON-LD для draft Preview отключён.
- Сравнение в `cloud_preview` отключено с явным сообщением.
- Client build scan: 0 service-role leaks, 0 source maps.
- Prebuilt artifact scan: 95 файлов, 0 service-role leaks, 0 source maps, 0 research/snapshot/migration файлов.
- Supabase health check: HTTP 200.
- Schema audit CLI не завершился из-за недоступного локального Docker daemon; это ограничение окружения, не ошибка Cloud read adapter.

# Production Isolation

- Runtime default остаётся `static`.
- Static webpack build успешно сгенерировал ровно 2 product routes: `/catalog/fs510` и `/catalog/ambu-vivasight-2-dlt`.
- `cloud_preview` запрещён кодом при `VERCEL_ENV=production`.
- Production environment и Production deployment не изменялись; `vercel --prod` не запускался.
- Staging products после QA: 79; `published=true`: 0; draft: 79; pending: 79.
- Не выполнялись PATCH, publication operations, Full Migration или Snapshot v2 capture.

# Screenshots

- `docs/screenshots/cloud-storefront-preview-catalog.png`
- `docs/screenshots/cloud-storefront-preview-product.png`
- `docs/screenshots/cloud-storefront-preview-filtered-catalog.png`

# Known Limitations

- Remote Preview deployment не создан из-за запрета среды на upload private prebuilt artifact; artifact готов для ручной команды `npx vercel@56.3.2 deploy --prebuilt --yes`.
- 54 товара не имеют сопоставленного производителя, 74 — сопоставленной категории.
- Большинство карточек не имеют документов и регистрационных данных.
- Compare намеренно недоступен в `cloud_preview`.
- External product media разрешены только с текущего подтверждённого host `static.tildacdn.com`.

# Recommendation Before Publication

Выполнить ручной Preview upload готового artifact и повторить визуальный smoke QA по сохранённому сценарию. До любой публикации приоритетно завершить manufacturer/category mapping, проверить права и качество media, добавить документы/регистрационные сведения и провести редакторское ревью карточек с отсутствующими reference fields. Production switch, автоматическая публикация и Full Migration на этом этапе не выполнять.
