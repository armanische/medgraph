# ADR-002 — Storefront repository boundary

**Статус:** Accepted  
**Дата:** 21 июля 2026 года

## Context

Public UI ранее зависел от legacy Research/Publication files. Это связывало presentation с внутренними workflows.

## Decision

Все public routes используют Storefront Services и CatalogRepository. Adapter выбирает physical data source. Public components не читают JSON, Supabase, Review или Publication напрямую.

## Consequences

- UI остаётся стабильным при смене storage;
- internal metadata не входит в public models;
- repository contract и schema validation являются архитектурным gate;
- новый source требует adapter и tests, а не переписывание страниц.
