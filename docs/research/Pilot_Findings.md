# Pilot Findings

**Status:** MVP-020 findings  
**Scope:** Golden Product Pilot across five product candidates  
**Verification:** no verified facts created  
**Publication:** no publication created

## Products Reviewed

| Product | Category | Completeness | Publication readiness |
| --- | --- | ---: | --- |
| HAMILTON-T1 | Transport ventilator | 60% | Blocked |
| Ambu aScope 5 Broncho | Single-use bronchoscope | 40% | Blocked |
| Ambu aScope 4 Broncho | Single-use bronchoscope | 20% | Blocked |
| SonoScape HD-550 | Video endoscopy system | 0% | Blocked |
| Mindray A8 | Anesthesia workstation | 0% | Blocked |

## What Worked Well

- The architecture made it easy to separate source discovery from verification.
- Candidate facts could be documented without pretending they are verified.
- Completeness levels were useful for explaining why a product is blocked.
- Quality Gates clearly blocked publication when hashes, RU or review were missing.
- Evidence Model exposed the exact gap between source page and publishable fact.

## What Was Inconvenient

- Existing generated research artifacts for the selected products are empty and
  show `needs_source`.
- Source discovery depends heavily on network availability and manufacturer site
  structure.
- Manufacturer pages often expose useful facts before document downloads are
  captured by the artifact store.
- Product-family pages mix facts, marketing copy, options and market caveats.
- Negative compatibility statements need first-class support.

## What Is Missing

- Official RU discovery for pilot products.
- Stable document download and hash capture for manufacturer-hosted files.
- Document locator capture from PDFs/manuals.
- Manufacturer-specific source discovery playbooks as executable seeds.
- Article/SKU mapping for endoscopy products.
- Compatibility matrix model for anesthesia, endoscopy and ventilators.
- Clear handling for market-dependent and option-dependent facts.

## What Must Be Automated

- official source search by manufacturer/model/category;
- RU/regulator search and matching;
- manufacturer document discovery;
- document download with hash/version tracking;
- PDF text extraction with locators;
- characteristic extraction by category template;
- missing-document task creation;
- conflict grouping by characteristic;
- reviewer queue creation from candidate claims.

## Hardest Documents To Find

- RU/regulator records for exact product variants;
- IFU/user manuals behind regional portals;
- service manuals;
- compatibility/accessory matrices;
- article/SKU tables;
- software/options matrices.

## Characteristics Likely To Conflict

- model and variant names;
- patient group;
- mode availability;
- software-dependent features;
- compatibility with accessories and displays;
- dimensions and weight by configuration;
- single-use/sterility language when taken from marketing pages.

## Importers To Improve

- SourceFinder: add manufacturer-specific query strategies and manual official
  source seeds.
- DocumentFinder: detect download links embedded in product pages.
- Downloader: persist hashes and version metadata for linked documents.
- CharacteristicExtractor: use category templates and preserve option caveats.
- ConflictDetector: handle option/market caveats as review issues.
- MissingInformationDetector: produce category-specific missing-document tasks.

## Architecture Ambiguities

- Product pages can be evidence for lightweight identity facts, but technical
  characteristics should prefer IFU/manual/datasheet.
- Negative compatibility claims should be represented, not discarded.
- Completeness score needs both document coverage and category-specific critical
  field coverage.
- A product can have useful official page facts while still having zero
  publication readiness.

## Safety Confirmation

The pilot created:

- no verified facts;
- no publication records;
- no Portal changes;
- no API changes;
- no Supabase schema changes;
- no importer code changes;
- no generated data mutation.

## Recommended Next Step

Before Wave 1, implement or configure source/document discovery around the five
pilot products and run the pipeline again. The goal should be candidate claims
with document hashes and locators, not publication.
