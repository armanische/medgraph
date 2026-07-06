# Roszdravnadzor Importer MVP

Серверный ingestion-модуль для ручного импорта публичной реестровой записи
Росздравнадзора. Он не подключён к Supabase, Portal, Projection, Publication или
Verification.

## Подготовка и запуск

```bash
npm install
npm run import:roszdravnadzor -- "ФСЗ 2009/04992"
```

Нужен установленный Google Chrome или Chromium. Для нестандартного пути:

```bash
CHROME_PATH="/path/to/chrome" \
  npm run import:roszdravnadzor -- "ФСЗ 2009/04992"
```

Проверка TLS включена по умолчанию. Если локальная dev-среда не доверяет
сертификату виджета, разрешён только явный временный запуск:

```bash
ROSRZN_IGNORE_HTTPS_ERRORS=1 \
  npm run import:roszdravnadzor -- "ФСЗ 2009/04992"
```

Флаг не действует при `NODE_ENV=production`. При его использовании importer
передаёт Playwright `ignoreHTTPSErrors: true` и обязательно записывает security
warning в output и `ImportManifest`. Без флага
`ERR_CERT_AUTHORITY_INVALID` завершает импорт со статусом `blocked`.

Если оператор уже знает идентификатор detail-страницы, можно явно пропустить
поиск в widget:

```bash
ROSRZN_IGNORE_HTTPS_ERRORS=1 ROSRZN_DETAIL_ID=37042 \
  npm run import:roszdravnadzor -- "ФСЗ 2009/04992"
```

`ROSRZN_DETAIL_ID` не вычисляется и не подбирается импортёром. При его
использовании output и manifest содержат предупреждение о ручном fallback.

Если поле поиска или запись не обнаружены ни в DOM, ни в реально наблюдавшихся
JSON/XHR/fetch-ответах, импорт завершается как `blocked` и создаёт:

```text
tmp/roszdravnadzor/diagnostics/<timestamp>/
├── screenshot.png
├── page.html
├── visible-text.txt
├── elements.json
├── iframes.json
├── network.json
└── metadata.json
```

Папка возвращается в `diagnosticsPath`. Диагностика не является Evidence и не
поступает в ingestion pipeline.

Диагностику можно проанализировать без повторного обращения к сайту:

```bash
npm run replay:roszdravnadzor -- \
  tmp/roszdravnadzor/diagnostics/<timestamp>
```

Replay читает только локальные JSON-файлы, показывает найденные элементы,
iframe, наблюдавшиеся JSON/XHR/fetch-ответы, возможные selector strategies и
следующее безопасное действие. Replay не изменяет файлы и не использует сеть.

## Устранение ошибок

### `ERR_CERT_AUTHORITY_INVALID`

По умолчанию импорт должен оставаться заблокированным. Сначала исправьте
локальную цепочку доверия сертификата. Только для разработки разрешён явный
временный запуск с `ROSRZN_IGNORE_HTTPS_ERRORS=1`. Security warning останется в
output и manifest; в production флаг игнорируется.

### `Registration-number search input was not found`

1. Откройте путь `diagnosticsPath` из blocked output.
2. Запустите `replay:roszdravnadzor`.
3. Проверьте `elements.json`, `iframes.json` и наблюдавшиеся network responses.
4. Если оператору известен реальный detail ID, повторите импорт с
   `ROSRZN_DETAIL_ID`. ID нельзя угадывать.

Detail fallback сверяет найденный номер РУ с запросом. Несовпадение блокирует
импорт до создания IngestionPlan и ImportManifest. Если номер невозможно
извлечь, импорт может продолжиться только с явным warning и статусом
`completed_with_warnings`.

## Pipeline

```text
ProviderAdapter
→ RawRegistryRecord
→ RawArtifact
→ NormalizedRecord
→ IngestionPlan
→ ImportManifest
```

Roszdravnadzor — первая реализация `ProviderAdapter`. Общие контракты,
content-addressed storage, downloader и manifest не зависят от конкретного
регулятора или физических таблиц CyberMedica.

## Артефакты и идемпотентность

Raw JSON, HTML и документы сохраняются по SHA-256:

```text
tmp/roszdravnadzor/artifacts/sha256/ab/cd/<sha256>.pdf
```

Существующий hash никогда не перезаписывается. Запись выполняется через
уникальный `.part`, `fsync` и атомарную публикацию жёсткой ссылкой. При ошибке
`.part` удаляется.

Manifest:

```text
tmp/roszdravnadzor/import-manifest.json
```

Manifest lock contains PID, acquisition timestamp, stale timeout and a unique
token. A stale lock is revalidated and removed automatically.

Повторный импорт того же SHA не создаёт новую версию. Новый SHA того же
логического документа создаёт `DocumentVersion` с `previousSha256` и
`supersedes`. РУ, приложение, IFU/manual и сертификат моделируются как разные
Documents.

## Безопасность

- CAPTCHA, авторизация и ограничения сайта не обходятся.
- TLS проверяется по умолчанию; dev-only bypass всегда маркируется warning.
- Документы принимаются только с allowlisted HTTPS host.
- Разрешены PDF, DOC, DOCX и generic binary.
- PDF проверяется по magic bytes `%PDF-`; остальные сигнатуры подключаются
  через `DocumentSignatureValidator`.
- HTML и JSON вместо документа отклоняются.
- Размер контролируется во время streaming download.
- Retry применяется только для timeout/network errors и HTTP
  `429/500/502/503/504`; `403/404` не повторяются.

## Выход

Команда возвращает JSON:

- `normalizedRecord`;
- `ingestionPlan`;
- `manifestPath`;
- `downloadedArtifactPaths`;
- `status`;
- `warnings`.
- `diagnosticsPath` для browser-level blocked failure.

`claimCandidates` всегда имеют `candidate`, `unverified` и
`autoPublish: false`. Importer не создаёт Claims, Verification или Publication.

## Проверки

```bash
npm test
npm run lint
npm run build
```

Importer остаётся единичным ручным ingestion-процессом. Перед записью данных в
Knowledge Factory необходим human review.
