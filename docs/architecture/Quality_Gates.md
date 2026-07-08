# Quality Gates

**Status:** MVP-019 architecture baseline  
**Scope:** publication-blocking checks for Golden Dataset v1

## Purpose

Quality Gates define checks that must pass before any product fact can move
toward publication. They are intentionally stricter than discovery or
completeness scoring.

## Gate Summary

| Gate | Required before publication |
| --- | --- |
| Product identity confirmed | Yes |
| Registration number confirmed | Yes, when applicable |
| Required documents found | Yes |
| Document hash recorded | Yes |
| Document type reviewed | Yes |
| Characteristics have evidence | Yes |
| Units and context preserved | Yes |
| Conflicts resolved or blocked | Yes |
| Compatibility reviewed | Yes, if published |
| Reviewer approved | Yes |
| Publication approved | Yes |

## Gate 1: Product Identity

Checks:

- manufacturer confirmed;
- model and variant ambiguity reviewed;
- distributor is not mistaken for manufacturer;
- aliases are preserved.

Publication blocked when:

- identity maps to multiple products;
- registration record does not match product;
- model/variant is unclear for the fact being published.

## Gate 2: Registration

Checks:

- registration number confirmed against regulator source;
- status captured;
- retrieval date recorded;
- source URL or citation stable.

Publication blocked when:

- RU candidate is unmatched;
- multiple registration records conflict;
- status is unclear.

## Gate 3: Required Documents

Checks:

- category required document set is present;
- document source is official or accepted for review;
- document language and type are recorded.

Publication blocked when:

- IFU/manual is missing for safety-critical fields;
- datasheet is the only source for intended use;
- brochure is used as primary evidence.

## Gate 4: Document Integrity

Checks:

- file hash recorded;
- file size recorded;
- retrieval metadata recorded;
- document version tracked.

Publication blocked when:

- artifact is mutable or overwritten;
- hash is missing;
- file cannot be re-identified.

## Gate 5: Characteristic Evidence

Checks:

- every public characteristic has source evidence;
- locator exists where available;
- unit and condition are preserved;
- extraction status moved through review.

Publication blocked when:

- characteristic has no source;
- value came from LLM;
- value came only from search snippet;
- unit/context is missing for physical measurement.

## Gate 6: Conflict Handling

Checks:

- conflicts are visible;
- reviewer decision recorded;
- rejected values remain in history.

Publication blocked when:

- conflict exists without decision;
- system selected value automatically;
- lower-priority source silently overwrote higher-priority source.

## Gate 7: Compatibility and Analogs

Checks:

- compatibility evidence is official or reviewer-approved;
- exact model/version context is preserved;
- analog criteria are visible.

Publication blocked when:

- connector match is the only evidence;
- compatibility is inferred from similar product;
- analog equivalence lacks human review.

## Gate 8: Reviewer Approval

Checks:

- reviewer approved fact;
- rationale recorded;
- rejected/blocked fields are visible.

Publication blocked when:

- reviewer decision is missing;
- approval came from AI or importer;
- commercial priority is used as reason.

## Gate 9: Publication Approval

Checks:

- verified fact selected for public projection;
- publication decision recorded;
- audit trail preserved.

Publication blocked when:

- publication is triggered by extraction;
- candidate claim is sent to portal;
- evidence cannot be traced.

## What Cannot Be Done For Speed

- publish brochure as primary source;
- replace IFU with marketing copy;
- treat PDF existence as proof before checking document identity;
- fill missing values with LLM;
- skip hash/version tracking;
- hide conflicts;
- publish compatibility without review;
- bypass Publication workflow.
