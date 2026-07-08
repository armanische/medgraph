# Product Completeness Definition

**Status:** MVP-019 architecture baseline  
**Scope:** readiness levels for Golden Dataset v1

## Purpose

Product Completeness measures whether a product record is ready for review. It
does not mean the product is verified or published.

## Levels

| Completeness | Level | Meaning |
| ---: | --- | --- |
| 0% | Discovered | Product candidate exists. |
| 20% | Regulator identified | Registration record or RU candidate exists. |
| 40% | Instructions found | IFU, user manual or equivalent official instruction exists. |
| 60% | Characteristics sourced | Core characteristics have evidence-backed candidate values. |
| 80% | Compatibility reviewed for evidence | Compatibility, accessories or consumables have source-backed candidates. |
| 100% | Human-reviewed | Required facts passed human review or were explicitly rejected/blocked. |

## Transition Criteria

### 0%: Discovered

Conditions:

- manufacturer/model or product name candidate exists;
- discovery source is recorded.

Cannot:

- appear as verified;
- provide public characteristics;
- enter publication.

### 20%: Regulator identified

Conditions:

- registration number or regulator record candidate is found;
- source URL or citation is recorded;
- product identity ambiguity is visible.

Cannot:

- verify non-regulator characteristics;
- publish compatibility;
- hide unmatched registration candidates.

### 40%: Instructions found

Conditions:

- IFU, user manual or official instruction is found;
- document identity is tracked;
- document type candidate is recorded.

Cannot:

- assume every characteristic is supported;
- use brochure as IFU;
- publish before review.

### 60%: Characteristics sourced

Conditions:

- required category characteristics have candidate values;
- each value has source, document and locator where available;
- units and context are preserved;
- conflicts are visible.

Cannot:

- resolve conflicts automatically;
- normalize away context;
- publish extracted facts.

### 80%: Compatibility reviewed for evidence

Conditions:

- compatibility, accessories or consumables have source-backed candidates;
- exact model/version context is preserved;
- missing compatibility data is visible.

Cannot:

- treat connector match as compatibility;
- publish compatibility without human review;
- infer analog equivalence.

### 100%: Human-reviewed

Conditions:

- required documents reviewed;
- critical characteristics accepted or explicitly rejected;
- conflicts resolved or blocked;
- reviewer rationale recorded;
- no publication-blocking gate remains open.

Cannot:

- publish automatically;
- skip Publication workflow;
- remove rejected evidence from history.

## Category Criticality

Critical fields differ by category:

- ИВЛ: modes, tidal volume, pressure/flow ranges, alarms, power, patient group.
- Монитор: measured parameters, modules, alarm capability, connectivity, power.
- Наркозная станция: gases, vaporizers, ventilation modes, breathing circuits.
- УЗИ: probes, modes, software/options, clinical applications.
- Эндоскопия: compatibility, sterilization/reprocessing, dimensions, single-use.
- Инкубатор: temperature control, alarms, humidity, power, dimensions.
- Освещение: illuminance, color temperature, mounting, electrical data.

## Safety

Completeness must never:

- become Verification;
- become Publication;
- hide missing critical fields;
- reward marketing-only documents;
- allow LLM-filled characteristics.
