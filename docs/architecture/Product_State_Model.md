# Product State Model

**Status:** MVP-018.5 design baseline  
**Scope:** lifecycle states for a medical device record

## Purpose

The Product State Model defines how a medical device moves from discovery to
publication and archive. It prevents unverified research from becoming public
knowledge by accident.

Product state is not the same as publication state. A product can have rich
candidate data and still be unpublished.

## Lifecycle

```text
Discovered
↓
Research Started
↓
Documents Found
↓
Characteristics Extracted
↓
Candidate Claims Ready
↓
Human Review
↓
Verified
↓
Published
↓
Archived
```

## Discovered

Meaning:

- product candidate exists;
- identity may be incomplete;
- source may be a seed, catalog item, registry hit or manual entry.

Who moves it here:

- Importer;
- manual admin action;
- future Import Center.

Conditions:

- product name or source identifier exists;
- discovery source is recorded.

Forbidden:

- public display as verified;
- verified characteristics;
- compatibility claims;
- publication.

## Research Started

Meaning:

- source discovery has begun;
- manufacturer and regulator candidates may exist.

Who moves it here:

- Knowledge Engine;
- enrichment pipeline;
- reviewer action.

Conditions:

- product candidate has enough identity to search;
- research task is created.

Forbidden:

- treating search results as facts;
- using snippets as evidence;
- creating Published Facts.

## Documents Found

Meaning:

- one or more document candidates are connected to the product.

Who moves it here:

- document discovery pipeline;
- manual reviewer upload/link action.

Conditions:

- source URL or artifact reference exists;
- document type candidate is recorded.

Forbidden:

- assuming document supports all characteristics;
- accepting malformed files silently;
- overwriting raw artifacts.

## Characteristics Extracted

Meaning:

- candidate characteristics were extracted from documents or source pages.

Who moves it here:

- Knowledge Engine;
- extraction pipeline.

Conditions:

- extracted facts have locators where available;
- extraction status is unverified;
- missing fields and conflicts are visible.

Forbidden:

- automatic verification;
- automatic conflict resolution;
- public search indexing as truth.

## Candidate Claims Ready

Meaning:

- extracted facts are grouped into reviewable claims.

Who moves it here:

- Candidate Claim builder;
- Knowledge Engine.

Conditions:

- each claim has evidence candidates;
- each claim is marked unverified;
- `autoPublish` is false.

Forbidden:

- portal reading candidate claims directly;
- publication;
- AI answers presenting claims as facts.

## Human Review

Meaning:

- reviewer is evaluating evidence, conflicts and missing data.

Who moves it here:

- Review Queue;
- reviewer;
- editorial workflow.

Conditions:

- candidate claims are available;
- source documents can be inspected;
- characteristic policy is known.

Forbidden:

- skipping evidence inspection for medical facts;
- using LLM output as source;
- bypassing Publication.

## Verified

Meaning:

- one or more claims have passed human verification.

Who moves it here:

- authorized reviewer;
- approved Verification workflow.

Conditions:

- evidence supports the claim;
- conflicts are resolved or blocked;
- reviewer decision and rationale are recorded.

Forbidden:

- importer changing verified facts;
- automatic publication;
- hiding provenance.

## Published

Meaning:

- verified facts are approved for public projection.

Who moves it here:

- Publication workflow;
- authorized publisher.

Conditions:

- verified claim exists;
- publication decision exists;
- public projection can include evidence references or audit links.

Forbidden:

- publishing candidate claims;
- publishing compatibility without review;
- publishing facts without evidence.

## Archived

Meaning:

- product or fact is no longer active in the public/current model.

Who moves it here:

- Publication workflow;
- authorized reviewer/publisher;
- archive policy.

Conditions:

- archive reason is recorded;
- supersession or withdrawal is documented where available.

Forbidden:

- deleting history;
- removing audit trail;
- silently redirecting to a different product identity.

## Cross-State Rules

- State transitions are append-only events.
- A product can move backward for review, but history remains.
- Publication is not a side effect of verification.
- Completeness score may prioritize review but cannot transition to Published.
- AI can assist review, but cannot transition states.

## What Never Happens Automatically

- Discovered to Published.
- Extracted characteristic to Verified.
- Candidate Claim to Public Portal.
- Compatibility to Published.
- Conflict to resolved.
- Archived to deleted history.
