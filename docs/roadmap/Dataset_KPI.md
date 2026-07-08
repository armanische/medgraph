# Dataset KPI

**Status:** MVP-019 planning baseline  
**Scope:** quality targets for Golden Dataset v1

## Purpose

Dataset KPI defines measurable expectations for the first CyberMedica golden
product collection. These KPIs protect quality while importers, Review Queue and
AI workflows are developed around the dataset.

## Wave 1 Target

| Metric | Target |
| --- | ---: |
| Product candidates | 50+ |
| Category coverage | 8 categories |
| Priority products marked Critical or High | 85%+ |
| Product identity candidate | 100% |
| Registration record / RU candidate | 100% |
| Required document package started | 100% |
| IFU or user manual found | 90% |
| Datasheet or technical specification found | 90% |
| Source URL recorded | 100% |
| Document hash recorded when downloaded | 100% |
| Candidate characteristics with source | 100% |
| Compatibility claims auto-published | 0 |
| Auto-published facts | 0 |
| Facts reviewed before publication | 100% |
| Conflicts hidden | 0 |
| LLM-filled characteristics | 0 |

## Completeness Target

Wave 1 should aim for:

- average completeness: 95% for products selected for publication review;
- minimum completeness: 80% before reviewer publication assessment;
- 100% of public facts backed by evidence;
- 100% of published facts approved by reviewer.

Completeness is not verification. A product can be 95% complete and still have
zero published facts if review is not finished.

## Category KPI

| Category | Required KPI |
| --- | --- |
| ИВЛ | modes, ranges, alarms and accessories sourced before review |
| Мониторы пациента | measured parameters and module compatibility sourced before review |
| Наркозные станции | gases, vaporizers, ventilation and circuits sourced before review |
| УЗИ | probes and software/options sourced before review |
| Эндоскопия | IFU, sterility/reprocessing and compatibility sourced before review |
| Освещение | illuminance, mounting and electrical data sourced before review |
| Инкубаторы | environmental control, alarms and cleaning sourced before review |
| Инфузия/аспирация | accessories/consumables and operating limits sourced before review |

## Review KPI

| Metric | Target |
| --- | ---: |
| Critical products assigned for review | 100% |
| Conflicts visible to reviewer | 100% |
| Missing critical fields visible | 100% |
| Reviewer rationale recorded | 100% |
| Rejected values preserved in history | 100% |
| Compatibility reviewed before public display | 100% |

## Importer Validation KPI

The golden dataset should help validate future importers:

- source discovery can find official sources;
- document discovery can classify required documents;
- document normalization can store stable artifact identity;
- extraction can preserve value, unit and locator;
- conflict detector preserves disagreements;
- missing-data detector creates actionable review tasks.

## AI Readiness KPI

AI Assistants may use the dataset only under these limits:

- public AI answers use published facts only;
- reviewer AI drafts must cite evidence candidates;
- AI never creates source truth;
- AI never fills missing characteristics;
- AI never publishes facts.

## Safety KPI

Zero tolerance:

- 0 facts published without evidence;
- 0 candidate claims exposed directly in Public Portal;
- 0 brochure-only critical facts published;
- 0 compatibility claims published without review;
- 0 LLM-generated characteristics treated as evidence;
- 0 automatic publication events.

## What Cannot Be Done For Speed

- lower document requirements for Critical products;
- publish brochure as primary source;
- replace IFU with marketing copy;
- mark PDF as evidence before identity/hash checks;
- use LLM to fill missing characteristics;
- skip conflict review;
- publish compatibility from product family name;
- count completeness as verification.
