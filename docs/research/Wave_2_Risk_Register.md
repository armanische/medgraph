# Wave 2 Risk Register

Status: MVP-034 research risk baseline

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PDF documents are unavailable or gated | Required document coverage drops | Record missing-document tasks; do not scrape gated assets without policy. |
| Regional manufacturer sites differ | Conflicting product specs | Keep region/source URL on every document candidate. |
| Models are discontinued | Product page may disappear | Prefer archived official documents only when source identity is clear. |
| Characteristics conflict across IFU/datasheet/brochure | Unsafe publication risk | Preserve conflict and route to review. |
| RU mismatch | Wrong product identity | Block publication and require manual RU review. |
| Option-dependent specifications | Incorrect comparison/tender results | Model options separately; do not collapse variants. |
| Language issues | Extraction errors | Mark document language and require reviewer attention. |
| Dealer/SEO pages outrank official pages | Low-trust source pollution | Use official manufacturer/regulator priority only. |
| Brochure contains marketing claims | Weak evidence | Brochure cannot satisfy critical fields by itself. |
| Compatibility is inferred by connector shape | Unsafe compatibility | Compatibility requires document evidence and review. |

## Risk Levels by Category

| Category | Risk |
| --- | --- |
| Ventilators | Critical |
| Anesthesia workstations | Critical |
| Patient monitors | Critical |
| Neonatal | High |
| Endoscopy | High |
| Ultrasound | Medium |
| Lighting | Medium |
| Consumables/accessories | High when compatibility-related |

## Review Notes

- Missing data is better than invented completeness.
- No product should move to publication from Wave 2 data preparation.
- The most dangerous failure mode is silent conflict resolution.
- Compatibility and clinical/procurement claims remain high-risk.
