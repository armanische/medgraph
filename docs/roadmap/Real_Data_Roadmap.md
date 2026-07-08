# Real Data Roadmap

**Status:** MVP-018 planning baseline  
**Scope:** staged enrichment of real medical device data

## Purpose

This roadmap describes how CyberMedica can grow from a small verified catalog to
a large real-data knowledge base without allowing unverified enrichment output
to become public truth.

The numbers below are planning targets. Each wave depends on review capacity,
document quality and safety checks.

## Wave 1: 50 Products

Goal: prove the enrichment pipeline on high-value categories.

Focus:

- ИВЛ;
- мониторы пациента;
- наркозные станции;
- HME / breathing circuit consumables;
- one or two representative devices from adjacent categories.

Manufacturer focus:

- Hamilton Medical;
- Mindray;
- Dräger;
- GE HealthCare;
- Philips;
- Ambu.

Exit criteria:

- every product has a stable identity candidate;
- official sources are ranked;
- documents are normalized;
- candidate characteristics have provenance;
- conflicts and missing data are visible;
- no compatibility claim is published without review;
- reviewers can move selected claims into the Verification workflow.

## Wave 2: 250 Products

Goal: expand category breadth while keeping document quality high.

Focus:

- more ИВЛ and monitoring lines;
- эндоскопия;
- УЗИ;
- инкубаторы;
- infusion and syringe pumps;
- aspirators and neonatal devices.

Manufacturer focus:

- SonoScape;
- Comen;
- SLE;
- Dixion;
- Fresenius Kabi;
- B. Braun;
- Intersurgical;
- Medtronic.

Exit criteria:

- category-specific critical fields are documented;
- Product Completeness Score is available for reviewer prioritization;
- source conflicts are grouped by product and characteristic;
- document discovery failures create retry tasks;
- publication remains a separate reviewer-approved action.

## Wave 3: 1000 Products

Goal: move from curated coverage to operational catalog scale.

Focus:

- complete key manufacturers within priority categories;
- add diagnostic systems, surgical equipment and accessories;
- improve analog and compatibility review workflows;
- introduce category-specific completeness thresholds.

Requirements before starting:

- stable artifact identity;
- reviewer queue capacity;
- conflict reporting;
- missing-field reporting;
- documented source policies per category;
- operational monitoring for enrichment failures.

Exit criteria:

- product families are consistently grouped;
- compatibility remains blocked until human review;
- analog suggestions are reviewer-authored or reviewer-approved;
- generated draft data remains clearly separated from published data.

## Wave 4: 5000+ Products

Goal: broad market coverage with mature governance.

Focus:

- large manufacturer catalogs;
- accessories and consumables;
- regional variants;
- historical product versions;
- tender-oriented search coverage.

Requirements before starting:

- scalable review operations;
- formal publication audit process;
- source re-check cadence;
- stale-document detection;
- duplicate and supersession workflows;
- legal review of public medical copy.

Exit criteria:

- publication pipeline can show provenance for all public facts;
- stale or superseded documents are visible to reviewers;
- public data can be rolled back or superseded safely;
- no generated candidate claim can reach public output without verification.

## Product Completeness Score

Use Product Completeness Score to prioritize reviewer work, not to publish.

Suggested weighting:

| Area | Weight |
| --- | ---: |
| Documents | 30% |
| Characteristics | 30% |
| Compatibility | 20% |
| Images | 10% |
| Sources | 10% |

The score answers: "Is this product ready for human review?" It does not answer:
"Is this product verified?"

## Product Priority Rules

Import first:

- products used in critical care;
- devices with frequent procurement demand;
- products where compatibility mistakes are costly;
- products with official documents available;
- categories already represented in CyberMedica;
- devices where a verified card would reduce engineer/procurement workload.

Defer:

- products without official documents;
- highly ambiguous distributor-only entries;
- products requiring new schema concepts;
- compatibility-heavy accessory sets until compatibility review is mature.

## Safety Gates

Every wave must preserve these gates:

1. Discovery can create candidates.
2. Extraction can create candidate characteristics.
3. Candidate claims remain unverified.
4. Human verification decides truth.
5. Publication decides public output.

If a wave cannot maintain these gates, the wave should stop before adding more
products.

## Never Automatic

CyberMedica must never automatically:

- publish characteristics without documents;
- use LLM output as evidence;
- resolve conflicts;
- publish compatibility;
- publish analog equivalence;
- publish clinical recommendations;
- convert dealer catalog text into verified data;
- hide missing critical fields;
- write enrichment output into public projections;
- bypass Verification or Publication.
