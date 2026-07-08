# Evidence Model

**Status:** MVP-018.5 design baseline  
**Scope:** conceptual chain from source to published fact

## Purpose

CyberMedica is an evidence platform. The Evidence Model defines how information
travels from an external source into a reviewed and published fact without
losing provenance.

Evidence supports truth decisions, but evidence alone does not publish data.

## Evidence Chain

```text
Source
↓
Document
↓
Document Version
↓
Locator
↓
Extracted Fact
↓
Candidate Claim
↓
Human Verification
↓
Published Fact
```

## Source

The origin where information was discovered.

Examples:

- Roszdravnadzor registry;
- manufacturer website;
- manufacturer document host;
- scientific publication;
- dealer catalog;
- hospital procurement document.

Responsibilities:

- source type;
- URL or stable citation;
- owner or publisher;
- trust priority;
- retrieval date;
- discovery method.

Cannot:

- become a verified fact by itself;
- override higher-priority evidence automatically;
- be an LLM response.

## Document

A logical document connected to a source.

Examples:

- Registration Certificate;
- IFU;
- User Manual;
- Service Manual;
- Datasheet;
- Brochure;
- Certificate.

Responsibilities:

- document type candidate;
- title;
- source relationship;
- language;
- product relationship;
- document identity independent of file version.

Cannot:

- be treated as immutable file content;
- prove every product fact automatically;
- publish characteristics without review.

## Document Version

A specific immutable version of a document or downloaded artifact.

Responsibilities:

- hash;
- file size;
- MIME type;
- retrieval metadata;
- version relationship;
- supersession relationship when known.

Cannot:

- be overwritten;
- silently replace another version;
- lose link to source.

## Locator

A precise pointer inside a document version or source page.

Examples:

- page number;
- section heading;
- table row;
- text span;
- PDF coordinate;
- URL fragment;
- extracted text offset.

Responsibilities:

- show where the fact came from;
- allow reviewer re-check;
- support conflict comparison.

Cannot:

- replace the source document;
- be omitted for extracted characteristics when available.

## Extracted Fact

A raw candidate value extracted from evidence.

Examples:

- `weight = 27 g`;
- `tidal volume = 100-2000 ml`;
- `registration number = ФСЗ 2009/04992`;
- `single-use = true`.

Responsibilities:

- characteristic key;
- raw value;
- normalized value when safe;
- unit;
- source locator;
- extraction method;
- confidence;
- status `unverified`.

Cannot:

- be public truth;
- resolve conflicts;
- become a published fact directly.

## Candidate Claim

A reviewable claim assembled from one or more extracted facts.

Responsibilities:

- proposed canonical field;
- evidence candidates;
- conflict flags;
- missing-data flags;
- reviewer notes;
- `autoPublish: false`.

Cannot:

- become a Verified Claim automatically;
- be read directly by Public Portal;
- be used by Search as public truth.

## Human Verification

The reviewer decision about a candidate claim.

Responsibilities:

- accept, reject or request more evidence;
- resolve conflict with rationale;
- preserve source references;
- decide whether the claim can move toward publication;
- record audit trail.

Cannot:

- mutate raw artifacts;
- bypass Publication;
- use LLM output as evidence.

## Published Fact

A fact approved through Verification and Publication.

Responsibilities:

- public value;
- public label;
- evidence references;
- publication version;
- supersession or archive state.

Cannot:

- exist without evidence;
- be created by importer or AI;
- hide provenance from internal audit.

## Evidence Quality Signals

Evidence can be ranked by:

- source type;
- official status;
- document type;
- document version freshness;
- locator precision;
- extraction confidence;
- conflict presence;
- reviewer decision.

These signals support review. They do not publish facts automatically.

## What Never Happens Automatically

- LLM output becomes evidence.
- Search snippet becomes evidence.
- Dealer catalog overrides official document.
- Candidate Claim becomes Published Fact.
- Conflict is resolved by source priority without review.
- Public Portal reads evidence candidates directly.
