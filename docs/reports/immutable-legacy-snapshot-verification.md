# Immutable Legacy Snapshot Verification

**Дата проверки:** 22 июля 2026 года
**Recovery branch:** `recovery/main-workspace-consolidation-v1`
**Scope:** `data/legacy/manifest.json` и `data/legacy/products/*.json`

## Executive Summary

Immutable legacy snapshot проверен перед первой data-консолидацией. Набор содержит ровно 79 исходных карточек и один manifest. Все JSON-файлы валидны, file и payload checksums совпадают, ссылки manifest полны, дубликаты и посторонние файлы отсутствуют.

Snapshot byte-identical копии, находящейся в safety archive Phase 1. Capture, normalization, import, Cloud, Supabase, Storefront и Publication операции не выполнялись.

## Scope

В commit разрешены только:

```text
data/legacy/manifest.json
data/legacy/products/<source-id>.json  # 79 файлов
docs/reports/immutable-legacy-snapshot-verification.md
```

Не включаются:

- `scripts/importers/legacy/**`;
- generated review packages и import outputs;
- Storefront UI;
- Supabase configuration и migrations;
- Catalog Admin;
- legacy publication outputs;
- screenshots и build artifacts.

## Manifest

| Поле | Значение |
| --- | --- |
| Schema | `immutable-source-snapshot-v1` |
| Formed at | `2026-07-20T11:19:35.716Z` |
| Source sitemap | `https://cyber-medica.ru/sitemap-store.xml` |
| Sitemap SHA-256 | `c20d04c04eae4f3d5356df071779be34d9702a59df9e7af1dd715cee1516b360` |
| Records | 79 |
| Dataset SHA-256 | `13176ac8b5a7ffca86ecae0250a3345dd2ddcdda75ee8e1445e85546ccd3ca8c` |
| Product payload size | 1,115,890 bytes |

## Integrity Results

| Проверка | Результат |
| --- | ---: |
| Product JSON files | 79 |
| Manifest records | 79 |
| Valid JSON | 79 |
| File checksum matches | 79 |
| Payload checksum matches | 79 |
| Unique source IDs | 79 |
| Unique source URLs | 79 |
| Unique paths | 79 |
| Unique file checksums | 79 |
| Unique payload checksums | 79 |
| Duplicate source IDs | 0 |
| Duplicate source URLs | 0 |
| Duplicate payloads | 0 |
| Missing files | 0 |
| Unexpected files | 0 |
| Audit errors | 0 |

Offline audit result: `valid = true`.

## Safety Archive Comparison

Источник сравнения:

```text
/Users/arman/Desktop/cybermedica-recovery-backups/
cybermedica-main-workspace-before-recovery-2026-07-22.tar.gz
```

Safety archive SHA-256:

```text
573795c3ad71dfa6aa292de8bea5e42a985e4d88ed642ccf7ef920823f9785c3
```

Проверено:

- checksum safety archive: PASS;
- `data/legacy` извлечён во временный verification-каталог;
- recursive byte comparison текущего snapshot с архивной копией: PASS;
- расхождения: 0.

Это подтверждает, что snapshot не изменялся после Main Workspace Recovery Audit и до его фиксации в Git.

## Reproducibility

Dataset checksum воспроизводится из упорядоченных manifest records как SHA-256 последовательности `path + NUL + fileSha256 + LF`. Каждая карточка отдельно проверяется по:

- `sizeBytes`;
- `fileSha256`;
- `payloadSha256` после канонической JSON-сериализации.

Повторный capture из живого legacy-сайта не является воспроизведением этого набора и не должен перезаписывать v1. Проверка существующего snapshot выполняется полностью offline.

## Safety Boundaries

- Snapshot не нормализован.
- Product Data не переписывались.
- Cloud Catalog не изменялся.
- Supabase/SQL/RPC не использовались.
- Storefront и runtime source не изменялись.
- Publication и Review workflows не запускались.
- Внешние media binaries не загружались.
- Safety archive не изменялся.

## Result

Immutable legacy snapshot готов к отдельной атомарной фиксации в recovery history. Следующий этап после этого commit — Legacy Import Pipeline, но он не входит в текущий scope.
