# Wave 1 Execution Plan

**Status:** MVP-020 roadmap update  
**Scope:** path from Golden Product Pilot to 50, 250, 1000 and 5000+ products

## Purpose

The pilot showed that CyberMedica can model the research workflow safely, but
source discovery and document normalization must become operational before
larger waves. This plan turns the pilot into an execution path.

## Phase 0: Pilot Stabilization

Target: 5 products.

Products:

- HAMILTON-T1;
- Ambu aScope 5 Broncho;
- Ambu aScope 4 Broncho;
- SonoScape HD-550;
- Mindray A8.

Exit criteria:

- official source URLs captured;
- RU search task created for each product;
- required documents listed as found or missing;
- hashes recorded for any downloaded document;
- category template assigned;
- publication remains blocked.

## Phase 1: Golden Dataset Wave 1

Target: 50 products.

Focus categories:

- ИВЛ;
- monitors;
- anesthesia;
- ultrasound;
- endoscopy;
- incubators;
- lighting;
- infusion/aspiration.

Execution steps:

1. Convert manufacturer playbooks into source discovery seeds.
2. Add required document checklist per category.
3. Run source discovery for Critical products first.
4. Download official documents into artifact store.
5. Extract only candidate characteristics.
6. Generate missing-document and conflict reports.
7. Route candidate claims to human review.
8. Publish nothing automatically.

Exit criteria:

- 100% products have source candidates;
- 100% have RU search status;
- 90% have IFU/manual candidate;
- 90% have datasheet/specification candidate;
- 0 auto-published facts;
- all compatibility claims blocked for review.

## Phase 2: 250 Products

Goal: broaden coverage after document handling is stable.

Prerequisites:

- stable source discovery;
- document hash/version tracking;
- category-specific extraction templates;
- review queue design;
- conflict/missing data reporting.

Execution:

- expand manufacturer coverage;
- add more products from P0/P1 manufacturers;
- introduce accessory and consumable modeling;
- keep publication separate.

Exit criteria:

- reviewer can inspect evidence chain per claim;
- missing critical fields are actionable;
- compatibility and analog claims remain review-only.

## Phase 3: 1000 Products

Goal: operational catalog scale.

Prerequisites:

- importer runs are repeatable;
- artifact identity is reliable;
- review capacity exists;
- data quality dashboards exist;
- stale source detection is planned.

Execution:

- batch by manufacturer and category;
- prioritize devices with official documents;
- maintain manual override only for official source seeds;
- use completeness to prioritize, not publish.

Exit criteria:

- product families are grouped consistently;
- conflicts are preserved;
- public projection uses verified/published facts only.

## Phase 4: 5000+ Products

Goal: broad market coverage.

Prerequisites:

- mature Review Queue;
- publication audit workflow;
- source refresh cadence;
- manufacturer dashboard or submission workflow;
- legal review for public copy.

Execution:

- add long-tail manufacturers;
- add accessories and consumables;
- add regional variants;
- monitor stale documents and supersession.

Exit criteria:

- no candidate data reaches Portal directly;
- every public fact has evidence;
- rollback and supersession are operational.

## Automation Priorities

1. Manufacturer-specific source discovery.
2. RU/regulator matching.
3. Document download and hash capture.
4. PDF locator extraction.
5. Category template extraction.
6. Missing-document task generation.
7. Conflict grouping.
8. Review Queue handoff.

## Safety Rules

Never:

- publish from importer output;
- create verified facts from candidate claims;
- use LLM as evidence;
- publish compatibility without review;
- treat brochure as primary evidence for critical facts;
- hide missing documents;
- count completeness as publication readiness.
