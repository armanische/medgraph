# Priority Manufacturers

**Status:** MVP-018 planning baseline  
**Scope:** first waves of manufacturer coverage for real data enrichment

## Purpose

This roadmap defines which manufacturers should be prioritized when CyberMedica
starts enriching the catalog with real medical device data. Priority is based on
clinical relevance, procurement frequency, document availability and category
coverage.

Counts are planning estimates, not import targets.

## Priority Levels

| Priority | Meaning |
| --- | --- |
| P0 | Start here. High-value categories, frequent procurement, strong document demand. |
| P1 | Add after P0 flow is stable. Broad catalog impact. |
| P2 | Expand coverage after document normalization and review capacity improve. |

## First-Wave Manufacturers

| Manufacturer | Priority | Categories | Estimated products |
| --- | --- | --- | ---: |
| Hamilton Medical | P0 | ИВЛ, реанимация, дыхательная поддержка | 20-40 |
| Mindray | P0 | ИВЛ, мониторы, УЗИ, наркозные станции | 60-120 |
| Dräger | P0 | ИВЛ, наркозные станции, мониторы, реанимация | 50-100 |
| GE HealthCare | P0 | УЗИ, мониторы, фетальные мониторы, диагностика | 50-100 |
| Philips | P0 | Мониторы, ИВЛ, диагностика, реанимация | 40-90 |
| Ambu | P0 | Эндоскопия, анестезиология, расходные материалы | 20-50 |
| SonoScape | P1 | Эндоскопия, УЗИ | 25-60 |
| Comen | P1 | Мониторы, реанимация, фетальный мониторинг | 20-50 |
| SLE | P1 | Неонатальная ИВЛ, реанимация | 10-25 |
| Dixion | P1 | Аспираторы, мониторы, хирургическое оборудование | 25-70 |
| Fresenius Kabi | P1 | Инфузионные насосы, шприцевые насосы | 20-50 |
| B. Braun | P1 | Инфузия, гемодиализ, расходные материалы | 30-80 |
| Medtronic | P1 | Хирургия, мониторинг, расходные материалы | 40-100 |
| Intersurgical | P1 | Анестезиология, дыхательные контуры, расходные материалы | 30-80 |
| Getinge / Maquet | P2 | ИВЛ, операционные столы, стерилизация | 30-80 |
| Nihon Kohden | P2 | Мониторы, ЭКГ, диагностика | 25-70 |
| Canon Medical | P2 | УЗИ, КТ, диагностика | 20-60 |
| Siemens Healthineers | P2 | Диагностика, УЗИ, лабораторное оборудование | 40-120 |
| Olympus | P2 | Эндоскопия, хирургия | 30-90 |
| Pentax Medical | P2 | Эндоскопия | 15-40 |

## Product Priority Criteria

Products should be imported first when they satisfy several of these criteria:

- frequent procurement in hospitals and public tenders;
- high need for document verification;
- compatibility-sensitive use;
- risk of incorrect analog selection;
- available official IFU, manual or datasheet;
- clear manufacturer and model identity;
- useful coverage of a category that already exists in CyberMedica;
- strong value for clinicians, medical engineers and procurement teams.

## Category Order

Initial category priority:

1. ИВЛ и дыхательная поддержка
2. Мониторы пациента
3. Наркозные станции
4. Эндоскопия
5. УЗИ
6. Инкубаторы и неонатальное оборудование
7. Инфузионные и шприцевые насосы
8. Аспираторы
9. Фетальные мониторы
10. Операционные столы и освещение
11. Расходные материалы для анестезиологии и реанимации
12. Диагностическое оборудование

## What Not To Prioritize Early

Avoid early bulk import of:

- products without official documents;
- discontinued devices without stable source access;
- devices with unclear manufacturer identity;
- broad accessory catalogs where compatibility is the primary claim;
- products that require a new data model before safe representation.

## Review Capacity Rule

Enrichment volume must follow review capacity. A wave is complete only when
candidate data is traceable, conflicts are visible and reviewers can decide what
is safe to publish. More candidates are not useful if they bypass human review.
