# CyberMedica Launch Changelog

Changelog фиксирует инженерные baseline и launch milestones. Он не разрешает Production promotion, migration, publication или data writes.

## Unreleased — UI Governance

### Added

- **CyberMedica UI Constitution v1** — нормативные правила One Entity → One Component, Variant API, Design Never Forks, product/Cloud-first UI, fail-closed states, canonical component inventory, Design Token governance и обязательный Product Owner/Acceptance lifecycle.
- Product Documentation Index связывает UI Constitution, Launch Roadmap и Launch Changelog.
- Launch Roadmap переводит следующий milestone на **Homepage Evolution Specification v1**.

### Invariants

- runtime и UI не изменены;
- Product Detail, Catalog и Structured Fields не изменены;
- Product Data, Cloud Catalog, Supabase и migrations не изменены;
- `main` и `production` не изменены этой documentation-only веткой;
- adoption в `main` требует отдельного review/merge.

## Launch Baseline v1 — 23 July 2026

**Status:** Frozen

**Commit:** [`2ef6a576fc19352f5971bf3ac756360220093b1c`](https://github.com/armanische/medgraph/commit/2ef6a576fc19352f5971bf3ac756360220093b1c)

### Included

- Product Detail Recovery;
- Structured Product Detail Fields architecture and integrity controls;
- Catalog Experience MVP;
- unified Catalog/Product return-state contract;
- Preview security and runtime baseline.

### Not Included

- Production promotion;
- Product Data publication;
- Hamilton-T1 approval или Structured Fields publication;
- UI Constitution v1 до отдельного merge.
