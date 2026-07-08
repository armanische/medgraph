# Real Data Enrichment Pipeline

**Status:** MVP-018 foundation  
**Scope:** architecture for safe enrichment of real medical device data  
**Non-goals:** Supabase schema changes, importer changes, Verification changes, Publication changes, UI changes

## Purpose

CyberMedica needs a repeatable way to enrich the catalog with real medical
devices without turning unverified research into published medical knowledge.
This pipeline defines the lifecycle from product discovery to publication while
preserving the existing Verification and Publication boundaries.

The enrichment pipeline produces structured candidates, evidence references and
review tasks. It never publishes facts by itself.

## Lifecycle

```text
Product discovered
↓
Source discovery
↓
Document discovery
↓
Document normalization
↓
Characteristic extraction
↓
Candidate claims
↓
Human verification
↓
Publication
```

## Stage Responsibilities

### Product Discovered

Creates or identifies a draft product candidate.

Responsible for:

- product name as seen in a source;
- manufacturer candidate;
- category candidate;
- model or catalog identifier when available;
- reason for inclusion in the catalog.

Not responsible for:

- verified characteristics;
- compatibility statements;
- clinical recommendations;
- publication decisions.

Output:

- `ProductCandidate`
- discovery source reference
- initial review priority

### Source Discovery

Finds possible sources for a product and ranks them by trust level.

Responsible for:

- official regulator records;
- manufacturer pages;
- official IFU and manuals;
- official datasheets;
- distributor or dealer pages when useful as secondary hints;
- scientific publications as contextual evidence.

Not responsible for:

- deciding factual truth;
- resolving conflicting values;
- promoting a source to verified status.

Output:

- `SourceCandidate`
- source priority;
- source type;
- source URL;
- discovery method;
- warnings for ambiguity.

### Document Discovery

Finds downloadable or citable documents connected to a source.

Responsible for:

- registration certificates;
- instructions for use;
- service manuals;
- datasheets;
- catalogs;
- product brochures;
- document URL and file metadata.

Not responsible for:

- treating dealer catalogs as publication-grade evidence;
- inferring document type without review when unclear;
- creating verified documents.

Output:

- `DocumentCandidate`
- document type candidate;
- source relationship;
- download or citation status.

### Document Normalization

Stores and describes documents in a stable, reproducible form.

Responsible for:

- content-addressed file identity;
- hash, size, MIME type and retrieval metadata;
- document version relationship;
- text extraction when supported;
- locator-ready text segments.

Not responsible for:

- overwriting immutable artifacts;
- silently replacing a document version;
- accepting malformed files as valid evidence.

Output:

- immutable artifact reference;
- normalized document metadata;
- extracted text segments;
- warnings and parser diagnostics.

### Characteristic Extraction

Extracts candidate characteristics from normalized documents.

Responsible for:

- characteristic key;
- candidate value;
- unit;
- source document;
- locator;
- extraction method;
- confidence score;
- evidence quote boundaries when available.

Not responsible for:

- verified claims;
- medical interpretation;
- automatic conflict resolution;
- publication readiness.

Output:

- `CandidateCharacteristic`
- evidence locator;
- extraction diagnostics.

### Candidate Claims

Groups candidate characteristics into reviewable claims.

Responsible for:

- one or more evidence candidates;
- unverified status;
- conflict flags;
- missing-data flags;
- reviewer notes.

Not responsible for:

- Verified Claims;
- Claim Revisions;
- Publication records;
- public API payloads.

Output:

- `CandidateClaim`
- `verificationStatus: unverified`
- `autoPublish: false`
- review priority.

### Human Verification

Reviewer compares candidate claims against source documents and project policy.

Responsible for:

- accepting, rejecting or requesting more evidence;
- resolving source conflicts;
- checking units and context;
- deciding if a value is safe to publish;
- documenting the reason for the decision.

Not responsible for:

- bypassing Publication;
- changing immutable source artifacts;
- using LLM output as evidence.

Output:

- verification decision;
- approved claim revision candidate;
- rejection or more-evidence reason.

### Publication

Publishes only verified and approved data through the existing publication
boundary.

Responsible for:

- public-facing projection;
- versioned publication state;
- audit trail;
- rollback and supersession rules.

Not responsible for:

- ingesting raw candidate data directly;
- trusting enrichment pipeline output without review.

Output:

- published product data;
- public API projection;
- publication audit record.

## Source Priority

Official trust order:

1. Регистрационное удостоверение Росздравнадзора
2. Инструкция производителя
3. Service Manual
4. IFU
5. Datasheet
6. Manufacturer Website
7. Каталог производителя
8. Дилерский каталог
9. Научные публикации
10. Другие источники

Higher-priority sources should be preferred when sources conflict, but the
pipeline still must not resolve conflicts automatically. Source priority is a
review aid, not a publication decision.

## Sources That Cannot Enable Automatic Publication

The following source types may help discovery or review, but must never enable
automatic publication:

- dealer catalogs;
- marketplace pages;
- SEO landing pages;
- scraped snippets;
- search result summaries;
- LLM-generated summaries;
- forum posts or social media;
- unauthenticated file mirrors;
- scientific publications used outside their stated context;
- any source without a stable URL, document identity or retrieval record.

## Product Completeness Score

`Product Completeness Score` is a reviewer-facing readiness signal. It is not a
verification status and must not control publication automatically.

Suggested weighting:

| Area | Weight | Meaning |
| --- | ---: | --- |
| Documents | 30% | Required official documents are discovered and normalized. |
| Characteristics | 30% | Core characteristics have sourced candidate values. |
| Compatibility | 20% | Compatibility statements are supported by documents and review notes. |
| Images | 10% | Product image or manufacturer visual is sourced and usable. |
| Sources | 10% | Source set includes official, stable and ranked references. |

Completeness may help prioritize reviewer work:

- `0-39`: discovery stage;
- `40-69`: enrichment in progress;
- `70-89`: ready for focused human review;
- `90-100`: complete enough for publication review.

## Safety Rules

The enrichment pipeline must never:

- publish characteristics without documents;
- use an LLM as a source of truth;
- automatically resolve conflicts;
- publish compatibility without human review;
- publish clinical recommendations;
- treat catalog PDF text as evidence for characteristics;
- convert dealer data into verified data;
- hide missing critical fields;
- create Verified Claims;
- create Publication records;
- write directly into Supabase publication tables;
- mutate ImportManifest or Artifact Store semantics;
- bypass Verification or Publication.

## Implementation Boundary

MVP-018 is documentation only. Future implementation should be additive and
must keep these boundaries:

- enrichment can create candidates;
- Verification decides truth;
- Publication decides what becomes public;
- generated draft data remains draft data until explicitly verified.
