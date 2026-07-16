# Suffixed File Cleanup Report

Дата: 2026-07-16  
Ветка: `feature/publication-pipeline`

## Результат

Проверены все 577 untracked-файлов, чьи имена содержали подозрительный суффикс ` 2`, ` 3`, `copy`, `final`, `new` или `.part`. Для каждого файла canonical-кандидат строился удалением только распознанного суффикса непосредственно перед расширением. Имя использовалось только для поиска кандидата, но не как доказательство дубликата.

Перед удалением для исходного и canonical-файла были независимо проверены:

- существование и тип regular file;
- размер;
- SHA-256;
- прямое byte-for-byte равенство содержимого;
- отсутствие исходного пути в `git ls-files`.

Каждый exact duplicate был повторно проверен непосредственно перед индивидуальным удалением. Wildcard removal и `git clean` не использовались.

## Классификация

| Класс | Количество |
| --- | ---: |
| Всего проверено | 577 |
| `exact_duplicate` | 573 |
| `duplicate_without_canonical` | 0 |
| `content_conflict` | 4 |
| `unique_file` | 0 |
| `temporary_file` | 0 |
| `unknown` | 0 |
| Удалено | 573 |

Удалено 85 621 789 байт подтверждённых untracked-копий. В эту группу входили 25 artifact-копий, по 121 копии discovery/documents/extraction/review reports, 3 integrity report copies и 61 копия исходников, тестов и документации. Canonical generated data и artifacts не изменялись.

## Сохранённые content conflicts

Эти файлы отличаются от canonical и не удалены:

| Untracked path | Canonical path | Размеры, байт | SHA-256 untracked | SHA-256 canonical |
| --- | --- | ---: | --- | --- |
| `lib/internal-access 2.ts` | `lib/internal-access.ts` | 295 / 582 | `7f9f81c2e530458ccf70b67fb3265dc222076a55ea8b33a34e092f53fc961d4f` | `368d9d48dde44c1e799cadd91386c4bc5932aa5505c42eec42ab437d2dc4fd30` |
| `scripts/importers/catalog/artifact-storage/manifest 2.ts` | `scripts/importers/catalog/artifact-storage/manifest.ts` | 13 180 / 13 282 | `12d600f7a4b04b2709d9391ce69b22097f39b0b579c39a2102e310c20830616f` | `e32eea64d75f4317090a58c08bcbc237f02588a3da0d75797f7ca8d80e320140` |
| `scripts/importers/catalog/evidence-integrity 2.ts` | `scripts/importers/catalog/evidence-integrity.ts` | 37 580 / 37 664 | `495b752e74f08fb66aa517f7c136371cdcd9a21004f0c0e64444bbd041a42ddd` | `57ca98b05d3ede2ff555c14c15a2fba79fc5744cee10686524944d6f11c60de2` |
| `tests/importers/preview-hardening.test 2.ts` | `tests/importers/preview-hardening.test.ts` | 6 701 / 6 688 | `63853a62b96e22eacf31f7557b245f1c7a5910678ecbd06de03602af1929940a` | `a36b89a1868b83d2b59447ccb53be81ddcc6e52d4cea28bc6047afd4ab8b5207` |

## Финальный поиск

Обязательный repository-wide `find` дополнительно показывает:

- 4 сохранённых untracked content conflicts из таблицы выше;
- 9 ignored build-cache файлов внутри `.next` с числовыми суффиксами; они не входили в 577 untracked Git-кандидатов и не удалялись;
- 7 canonical tracked-файлов с `endoscopy` в имени. Это ложные совпадения шаблона `*copy*`, а не suffixed copies.

Оставшиеся четыре untracked подозрительных пути требуют отдельного содержательного review. Автоматическое объединение или удаление запрещено.

## Safety

- Tracked-файлы не удалялись.
- Отличающиеся файлы не удалялись.
- Unique/unknown files не удалялись.
- Generated data не изменялись.
- `git clean`, wildcard `rm`, commit, merge и deploy не выполнялись.
- `git diff --check` проходит.
