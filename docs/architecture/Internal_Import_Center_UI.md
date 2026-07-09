# Internal Import Center UI

Дата: 2026-07-09

## Назначение

Internal Import Center — read-only dashboard для просмотра generated reports Wave 2 execution.

Route:

`/internal/import-center`

## Access Control

В development страница доступна.

В production страница скрыта по умолчанию и доступна только при:

`CYBERMEDICA_ENABLE_IMPORT_CENTER=1`

Без flag route возвращает `notFound()`.

## Read-Only Principle

Import Center не запускает импорт, не скачивает документы и не меняет pipeline state. Он читает только generated JSON reports:

- `data/research/wave2/wave2-summary.generated.json`;
- `data/research/wave2/<Manufacturer>/summary.generated.json`.

## What It Shows

Wave 2 aggregate:

- products discovered;
- official sources;
- documents found;
- downloads;
- artifacts;
- candidate facts;
- review items;
- blocked products;
- warnings;
- errors.

Manufacturer table:

- Hamilton;
- Mindray;
- Ambu;
- Drager;
- SonoScape;
- Comen;
- SLE;
- Dixion;
- GE;
- Philips.

Manufacturer details:

- summary metrics;
- blocked products;
- warnings;
- errors;
- safety flags.

## What It Does Not Do

Import Center does not:

- publish data;
- create Verified Claims;
- write to Supabase;
- call public API;
- mutate Verification;
- mutate Publication;
- process Review Decisions;
- trigger import pipeline runs.

## Empty and Error States

If reports are missing:

`Отчёт Wave 2 ещё не сформирован.`

Suggested command:

`npm run wave2:execute -- all`

If JSON is invalid, the page shows a safe message without stack traces.

## Future Import Center v2

Potential next steps:

- show historical runs;
- compare two Wave 2 executions;
- show per-stage timing;
- link to generated document/extraction/review reports;
- add authenticated internal-only run trigger after security review;
- add audit logs and operator identity;
- keep publication as a separate boundary.
