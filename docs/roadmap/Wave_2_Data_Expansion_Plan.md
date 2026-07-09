# Wave 2 Data Expansion Plan

Status: planning pack for MVP-034

## Goal

Wave 2 expands CyberMedica from pilot/golden products to a structured backlog of 250-300 real medical devices. This is not mass import and not publication. The goal is to prepare manufacturer/category packs that make source discovery, document collection and review predictable.

## Target Volume

- Target range: 250-300 products.
- Planning baseline: 275 products.
- Scope: real medical devices, accessories and consumables with official manufacturer sources.
- Output: candidate product backlog, official source seeds, category requirements and review-ready document expectations.

## Categories

| Category | Target products | Priority |
| --- | ---: | --- |
| Ventilators | 40 | Critical |
| Patient monitors | 45 | Critical |
| Anesthesia workstations | 30 | Critical |
| Ultrasound | 45 | High |
| Endoscopy | 35 | High |
| Neonatal | 25 | High |
| Lighting | 20 | Medium |
| Consumables/accessories | 35 | Medium |
| **Total** | **275** |  |

## Manufacturers

Wave 2 manufacturer baseline:

- Hamilton Medical;
- Mindray;
- Drager;
- GE HealthCare;
- Philips;
- Ambu;
- SonoScape;
- Comen;
- SLE;
- Dixion.

## Priority Rules

1. Critical life-support devices first: ventilators, anesthesia, patient monitors, neonatal intensive care.
2. Prefer products with official product pages and IFU/manual/datasheet availability.
3. Prefer models likely to appear in procurement requests.
4. Add consumables only when their compatibility requirements can be documented.
5. Do not prioritize products based on dealer catalog visibility alone.

## What Counts as a Ready Product

A Wave 2 product is ready for extraction/review only when:

- official manufacturer source exists;
- RU search status is recorded;
- required document set is found or missing status is explicit;
- at least one document candidate has a stable URL;
- extraction template is assigned;
- all extracted facts remain Candidate Claims;
- publication is blocked until human review.

## Exit Criteria

- 250+ products discovered.
- 80% have official manufacturer page candidates.
- 70% have required document candidates.
- 50% are extraction-ready.
- 100% have category template assigned.
- 100% preserve Candidate/Review boundary.
- 0 auto-published facts.

## Safety Gates

Before any product enters extraction:

- source domain is official manufacturer or regulator;
- document type is classified;
- brochure is not treated as primary evidence for critical specifications;
- compatibility claims are review-only;
- conflicts are preserved, not resolved automatically;
- RU mismatch creates a blocker;
- missing document state is explicit.

## Non-Goals

- No Supabase schema changes.
- No Publication changes.
- No Verification changes.
- No public portal changes.
- No automatic import of all listed models.
- No LLM-generated facts.
