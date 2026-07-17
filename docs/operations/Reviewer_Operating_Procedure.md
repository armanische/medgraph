# Reviewer Operating Procedure

## Перед началом

1. Работать только в защищённой локальной/Preview среде. Для Preview включить Vercel Deployment Protection.
2. Server-side задать `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1` и уникальный `CYBERMEDICA_REVIEWER_ID`.
3. Убедиться, что fixture flag выключен.
4. Выполнить `npm run review:audit`; результат должен быть valid.
5. Проверить выбранный продукт и readiness непосредственно в защищённом `/internal/reviewer`.

## Проверка и решение

1. Открыть `/internal/reviewer`, выбрать пилотный продукт и item.
2. Нажать «Начать проверку».
3. Сопоставить normalized value с raw text, official source, DocumentVersion, artifact и locator.
4. Выбрать Approve, Reject, Request changes или Mark conflict. Reject/changes/conflict требуют содержательную причину.
5. Проверить появление события в истории и обновление product readiness. Не использовать bulk approval.
6. Для `needs_changes` или `conflicted` после исправления выбрать Reopen с причиной и выполнить review заново.

Если UI сообщает о stale snapshot/status, решение не сохранено: обновить страницу, заново проверить evidence и повторить действие. Не редактировать decision JSON вручную.

## Review handoff

1. Вручную одобрить минимально достаточные поля одного пилотного продукта. Approval snapshot включает manufacturer/model/category/product identity; нужен минимум один технический field, official source и valid DocumentVersion/artifact.
2. Убедиться, что product показывает «Готово к публикации».
3. Выполнить `npm run review:summary` и `npm run review:audit`.
4. Зафиксировать завершённый Review. RFC-017 удалил legacy Publication CLI;
   reviewer не должен запускать retained Publication implementation напрямую.
5. Передача данных в Storefront выполняется отдельным явно разрешённым
   процессом; Human Review сам ничего не публикует.

Reviewer UI не меняет Storefront и не запускает publication/build процессы.

## Rollback и инциденты

Не удалять и не перезаписывать decisions. До публикации вернуть item через допустимый transition. После approval/publish отметить conflict, зафиксировать причину и пересобрать publication catalog; archived используется только после published state. При audit failure остановить публикацию, сохранить outputs и расследовать snapshot/integrity mismatch.

## Завершение

Выполнить `npm run review:audit`, затем выключить internal flag. Decision store и внутренние manifests не публиковать как web assets.
