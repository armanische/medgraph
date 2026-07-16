# Monitoring and Logging Policy

Дата: 2026-07-16

## Scope

Эта политика определяет минимальные требования к будущему production monitoring для CyberMedica. MVP-055 не подключает Sentry, Vercel Log Drains или другой внешний сервис и не добавляет runtime telemetry. Любая интеграция требует отдельного review, DPA/retention решения и проверки отсутствия PII.

Политика распространяется на frontend, request API, internal route gates, build/deploy, evidence integrity и artifact storage audit. Она не разрешает логирование Verification, Publication или Review Decision payloads.

## Future environment names

Допустимые названия будущей конфигурации, без значений:

- `CYBERMEDICA_MONITORING_DSN` — server-only endpoint выбранного monitoring provider.
- `CYBERMEDICA_MONITORING_ENVIRONMENT` — deployment environment label.
- `CYBERMEDICA_LOG_LEVEL` — минимальный уровень событий.
- `CYBERMEDICA_LOG_REDACTION_MODE` — обязательный режим redaction.
- `CYBERMEDICA_LOG_RETENTION_DAYS` — утверждённый retention window.
- `CYBERMEDICA_ALERT_WEBHOOK_URL` — server-only alert destination.
- `CYBERMEDICA_CORRELATION_HEADER` — имя доверенного correlation header.

Эти имена являются roadmap placeholders, не поддерживаются текущим runtime и не должны добавляться в Vercel до появления проверенной интеграции. Ни одно значение не может быть `NEXT_PUBLIC_`.

## Structured event envelope

Каждое будущее событие должно содержать только:

- timestamp UTC;
- event name и schema version;
- environment, deployment ID и commit SHA;
- correlation/request ID;
- route template, HTTP method, status class и latency bucket;
- severity;
- safe error code;
- retryable flag;
- redaction status.

Запрещены raw request/response bodies, query strings, authorization headers, cookies, environment values, full webhook URL и stack traces в client responses.

## Correlation and request IDs

- Использовать доверенный platform request ID, если он доступен, иначе генерировать opaque UUID на сервере.
- Не строить correlation ID из email, телефона, IP, user-agent или других пользовательских данных.
- Возвращать request ID клиенту только как opaque support reference.
- Один ID может связывать входящий request, webhook attempt и sanitized error event.
- Не принимать клиентский ID как доверенный без format/length validation.

## Events to monitor

### Application errors

Логировать route template, safe error code, status class и correlation ID. Stack trace разрешён только в защищённом server-side monitoring с source access control и после автоматического redaction. Ожидаемые validation 4xx агрегировать как метрики, а не как error payloads.

### Request API and webhook

Для `/api/request` измерять count, status class, latency, rate-limit rejections и webhook timeout/failure. Для webhook разрешены destination class, upstream status class, duration и retryable flag. Запрещены URL, Bearer token, company, name, phone, email, message и JSON body.

In-memory limiter не является глобальной защитой serverless deployment. До public scale необходимо platform/shared rate limiting, не расширяющее Supabase scope.

### Internal route access attempts

При включённых internal flags фиксировать route template, deployment ID, protection outcome и status class. Не логировать generated report content. Raw IP не хранить; если security review требует abuse correlation, использовать краткоживущий salted pseudonymous digest с отдельным key management.

### Artifact and evidence audits

Audit failures должны поступать из CI/release jobs как counts и finding categories: checksum mismatch, invalid PDF, HTML masquerade, orphan delta, absolute path, evidence violation. Не прикладывать PDF bytes, extracted clinical text или signed URLs.

### Build and deploy

Фиксировать commit SHA, build ID, duration, page count, warning/error count, test summary и deployment promotion/rollback. Не сохранять полный environment dump или install logs с credentials.

## PII and sensitive-data prohibition

Никогда не логировать:

- имя, организацию, телефон, email и текст заявки;
- IP и полный user-agent без отдельного approved security purpose;
- cookies, session IDs, authorization headers и webhook tokens;
- Supabase anon/service-role keys или URL с credentials;
- environment values;
- reviewer notes, draft decisions и unpublished candidate evidence;
- document bytes, extracted source passages и absolute workstation paths.

Redaction должна работать до transport. Post-ingestion masking не считается достаточной защитой.

## Severity and alerts

| Severity | Examples | Target response |
| --- | --- | --- |
| P0 Critical | internal content exposed publicly, secret exposure, unintended Publication/Verification write | немедленно остановить promotion, rollback/revoke, incident process |
| P1 High | sustained 5xx, webhook unavailable, Supabase public boundary failure, artifact/evidence integrity regression | alert release owner, mitigation within incident window |
| P2 Medium | elevated latency, repeated rate-limit abuse, CSP violations, partial route failure | triage during support hours, track remediation |
| P3 Low | individual expected 4xx, isolated retryable upstream error, non-growing warning | aggregate and review periodically |

Alert должен содержать только event ID, deployment, safe code, severity и runbook link.

## Retention

- Application/error events: provisional maximum 30 days.
- Security/access events: provisional maximum 90 days, subject to legal/privacy approval.
- Build/deploy and integrity audit summaries: 12 months or release-retention period.
- Raw PII: zero retention because it must never enter logs.
- Local developer logs: не коммитить; удалять согласно workstation policy.

Значения provisional и требуют владельца privacy/compliance до Production. Legal hold может продлить только approved non-PII audit records.

## Access and redaction

- Least privilege: engineering support sees application events; security sees access events; audit summaries доступны release owners.
- Production log access требует SSO/MFA и audit trail.
- Redaction patterns покрывают email, phone, bearer/token/key formats, cookies, URLs с credentials и absolute user paths.
- Redaction tests выполняются до подключения provider.
- Export и support attachment проходят повторный redaction.

## Release and rollback monitoring

Перед promotion сохранить baseline status/latency, затем наблюдать `/`, catalog/search, request API, robots/sitemap и disabled internal routes. Rollback triggers: unintended indexing, internal leakage, security-header regression, sustained 5xx, webhook outage или public projection boundary failure.

Rollback возвращает предыдущий verified deployment. Он не запускает Wave 2, evidence repair, Review Queue, Verification, Publication или artifact migration.
