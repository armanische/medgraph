# ADR-001 — Cloud First и operational Source of Truth

**Статус:** Accepted  
**Дата:** 21 июля 2026 года

## Context

Filesystem JSON обеспечивает воспроизводимость, но не даёт транзакционность, concurrent editing, RLS и надёжное operational ownership.

## Decision

Supabase PostgreSQL является operational Source of Truth. Git хранит code, migrations, standards, immutable snapshots и baselines. Static catalog остаётся fallback, но не каноном данных.

## Consequences

- operational writes проходят через controlled server/service mechanisms;
- migrations и RLS становятся release artifacts;
- runtime switch выполняется отдельно;
- потеря static записи не означает потерю Cloud data и наоборот.

## Rollback

Runtime может временно использовать static fallback. Это application rollback, а не смена Source of Truth.
