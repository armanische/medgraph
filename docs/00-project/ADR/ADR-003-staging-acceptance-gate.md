# ADR-003 — Staging как среда приёмки

**Статус:** Accepted  
**Дата:** 21 июля 2026 года

## Context

Localhost может использовать другой data source, env и runtime topology. Local QA не подтверждает Vercel/Supabase integration.

## Decision

Staging является основной средой приёмки runtime/UI/API/data изменений. PR не считается завершённым до staging QA, если staging применим.

## Consequences

- Preview URL и deployment ID входят в evidence;
- UI принимается по staging screenshots;
- Preview остаётся protected/noindex;
- документационные и offline задачи могут иметь явно обоснованное исключение.
