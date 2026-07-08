# Future Modules

**Status:** MVP-018.5 planning baseline  
**Scope:** future CyberMedica modules and their knowledge-model dependencies

## Purpose

This document maps future platform modules to the Canonical Product Knowledge
Model. It helps plan MVPs without weakening evidence, verification or
publication boundaries.

Priority:

- P0: foundational for near-term product quality;
- P1: important once the canonical model stabilizes;
- P2: later scale and workflow expansion.

## Search

Purpose:

- help users find products, documents, manufacturers and categories.

Dependencies:

- published product projection;
- canonical identity;
- classification;
- published characteristics;
- approved metadata.

Priority: P0

Boundary:

- public search indexes published data only.

## Compare

Purpose:

- compare medical devices by category, characteristics, documents and evidence.

Dependencies:

- characteristic taxonomy;
- canonical units;
- published facts;
- missing-data indicators;
- compatibility policy.

Priority: P1

Boundary:

- compare must not infer equivalence automatically.

## Review Queue

Purpose:

- route candidate claims, conflicts and missing fields to reviewers.

Dependencies:

- Evidence Model;
- Product State Model;
- Characteristic Policy;
- completeness score;
- reviewer roles.

Priority: P0

Boundary:

- review can verify; it does not publish by itself.

## Admin

Purpose:

- manage internal product records, review tasks and operational visibility.

Dependencies:

- product state;
- evidence chain;
- audit history;
- user permissions.

Priority: P0

Boundary:

- admin actions must respect Verification and Publication workflows.

## Analytics

Purpose:

- measure coverage, completeness, review throughput and source quality.

Dependencies:

- completeness score;
- state transitions;
- source types;
- missing-data reports.

Priority: P1

Boundary:

- analytics does not change truth status.

## Import Center

Purpose:

- coordinate imports, source discovery, document discovery and enrichment jobs.

Dependencies:

- source priority;
- artifact identity;
- ImportManifest;
- Candidate Claim pipeline;
- Product State Model.

Priority: P0

Boundary:

- Import Center creates candidates, not verified facts.

## Manufacturer Dashboard

Purpose:

- allow manufacturers to see coverage, submit documents and suggest corrections.

Dependencies:

- source submission workflow;
- document review;
- manufacturer identity;
- audit trail.

Priority: P2

Boundary:

- manufacturer submissions are evidence candidates, not verified facts.

## Clinical Notes

Purpose:

- provide reviewed clinical context, selection risks and practical notes.

Dependencies:

- published facts;
- IFU evidence;
- reviewer authorship;
- clinical review policy.

Priority: P1

Boundary:

- clinical notes require human review and must not replace official IFU.

## Service Center

Purpose:

- organize service manuals, maintenance intervals, calibration and spare parts.

Dependencies:

- service documents;
- replacement parts;
- calibration fields;
- product versions.

Priority: P1

Boundary:

- service data must not become clinical claims.

## Tender Assistant

Purpose:

- help procurement teams prepare requirements, document checks and comparison
  questions.

Dependencies:

- published characteristics;
- procurement notes;
- compatibility review;
- alternative products;
- source evidence.

Priority: P2

Boundary:

- tender suggestions are advisory and must expose evidence/missing data.

## AI Assistant

Purpose:

- answer questions, explain evidence, guide users through product data and
  assist reviewers.

Dependencies:

- published projection for public answers;
- evidence model;
- boundaries;
- uncertainty labels;
- internal candidate access only in reviewer context.

Priority: P1

Boundary:

- AI is not a source, verifier or publisher.

## Future CMS

Purpose:

- manage editorial pages, educational content and non-factual product copy.

Dependencies:

- published product data;
- legal copy rules;
- editorial workflow.

Priority: P2

Boundary:

- CMS cannot edit verified medical facts directly.

## Public API

Purpose:

- expose approved product data to partners or future integrations.

Dependencies:

- publication projection;
- evidence references;
- versioning;
- access policy.

Priority: P2

Boundary:

- API never exposes candidate claims as public data.

## What Never Happens

- New modules do not get direct write access to verified facts by default.
- Modules do not read importer internals unless explicitly internal.
- Public modules do not read Candidate Claims.
- AI modules do not publish.
- Analytics does not verify.
- Manufacturer submissions do not bypass review.
