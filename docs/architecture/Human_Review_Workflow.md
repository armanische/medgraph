# Human Review Workflow

## Назначение и границы

Human Review — отдельная серверная граница между созданными импортом Review Items и Publication Pipeline. Extraction, coverage, наличие PDF и репутация производителя никогда не создают approval. Единственный разрешающий сигнал — явное решение человека, записанное в immutable decision store.

Workflow не меняет Discovery, Resolver, Downloader, Extraction Profiles, Evidence IDs, artifact hashes, Verification, Supabase, Wave 2 или public API. UI доступен только через gated `/internal/reviewer`; env gate необходимо дополнять Vercel Deployment Protection или эквивалентной внешней защитой.

## Две независимые оси состояния

Review status:

```text
pending_review --start_review--> in_review
in_review --approve-----------> approved
in_review --reject------------> rejected
in_review --request_changes---> needs_changes --reopen--> in_review
in_review --mark_conflict-----> conflicted ----reopen--> in_review
approved --mark_conflict------> conflicted
approved + published --archive--------------------------> archived
```

Publication readiness вычисляется отдельно: `not_ready`, `ready_for_publication`, `publication_blocked`, `published`. Переход к ready/published не переписывает Review Decision. Недопустимый переход завершается доменной ошибкой.

## Decision record

Каждое действие создаёт отдельный `human-review-decision-v1` record: ID, idempotency key, review item/product, server-side reviewer ID, decision, previous/next status, comment, timestamp, snapshot hash, evidence/value/source/document snapshots, conflict reason и результат eligibility. Record создаётся эксклюзивно и не перезаписывается.

Snapshot канонически хеширует значение и product identity, evidence IDs и integrity, official source, DocumentVersion и artifact validity. Если item изменился после открытия UI, server action отклоняет решение как stale. Повтор с тем же idempotency key возвращает уже сохранённое решение.

## Persistence и identity

`FileReviewDecisionStore` является storage abstraction. Данные находятся в `data/review-decisions/decisions`, а производные индексы — по item, product и reviewer. Summary и индексы можно перестроить; decision records append-only.

Reviewer ID берётся только из server-only `CYBERMEDICA_REVIEWER_ID`. В production fallback отсутствует. В development разрешён документированный `development-reviewer`. Client не передаёт reviewer ID и не управляет путями файлов.

Локальный filesystem подходит для пилота и single-writer development, но не является production persistence на ephemeral/multi-instance Vercel runtime. До production writes store необходимо заменить устойчивым backend через существующий interface; будущий вариант — Supabase с append-only policy, транзакционной idempotency и optimistic concurrency.

## Publication policy

Item eligibility требует непустые identity/value, valid evidence без integrity violations, существующий DocumentVersion, валидный artifact и HTTPS source, совпадающий с `sourceDocumentSummary` Review Queue. Product policy требует manufacturer/model/category/identity snapshot, минимум одно approved техническое или identity field, official source, DocumentVersion и отсутствие unresolved conflict. Optional compatibility/documents не обязательны, и 100% coverage не требуется.

Publication читает последние реальные decisions, проверяет `approve`, `approved`, current snapshot и policy. Связь с approval IDs хранится только в `publication-manifest.internal.json`; публичные records внутренних ID не содержат.

## Security и rollback

Writes доступны только из Server Action после internal gate, allowlist decision/status, server identity, throttle, stale check, path validation и append-only write. Browser direct filesystem write и публичный write API отсутствуют. Для rollback решение не удаляется: reviewer отмечает conflict или создаёт последующий допустимый decision, затем publication build пересобирает публичную проекцию. История остаётся полной.

