# CyberMedica Launch Roadmap

**Статус:** Active

**Текущий baseline:** Launch Baseline v1

**Baseline commit:** `2ef6a576fc19352f5971bf3ac756360220093b1c`

**Обновлено:** 24 июля 2026 года

## Completed

- [x] Product Detail Recovery;
- [x] Structured Fields integrity и controlled staging validation;
- [x] Catalog Experience MVP;
- [x] Unified Launch Baseline Verification v1;
- [x] Baseline Freeze v1;
- [x] UI Constitution v1 — единые component, variant, data, navigation и acceptance invariants.

## Current Milestone

- [ ] **Homepage Evolution Specification v1**.

Specification обязана использовать [UI Constitution v1](../00-product/ui-constitution.md) как нормативный gate. Она не может создавать Homepage-specific Product Card, Search, Button, Breadcrumb, CTA или Design Tokens.

## Subsequent Launch Gates

- [ ] Homepage Evolution Design v1;
- [ ] Homepage Evolution Implementation v1;
- [ ] Technical QA и immutable Preview;
- [ ] Product Owner Review;
- [ ] Acceptance Review;
- [ ] controlled integration в `main`;
- [ ] final accessibility/performance verification;
- [ ] Production readiness review;
- [ ] explicit controlled promotion в `production`.

## UI Governance Backlog

- провести inventory audit фактических ProductCard/CategoryCard/ManufacturerCard implementations;
- зафиксировать canonical component ownership и public Variant API;
- зарегистрировать существующие page-specific forks как architectural debt;
- консолидировать Buttons, Search, Breadcrumb, CTA и state components отдельными проверяемыми PR;
- добавить автоматический UI Constitution compliance gate там, где правило может быть проверено статически.

Этот backlog не разрешает рефакторинг «по пути». Каждая консолидация имеет собственную Specification, regression matrix и Acceptance Review.

## Separate Data-Governance Backlog

Вне UI launch sequence остаются:

- Human Review и product approvals;
- Hamilton-T1 Structured Fields decision;
- Cloud Catalog publication;
- Production schema/data migration;
- Product enrichment.

UI Constitution не разрешает ни одну из этих операций.

## References

- [UI Constitution v1](../00-product/ui-constitution.md)
- [Launch Changelog](../releases/CHANGELOG-LAUNCH.md)
- [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md)
- [RELEASE_PROCESS](../00-project/RELEASE_PROCESS.md)
