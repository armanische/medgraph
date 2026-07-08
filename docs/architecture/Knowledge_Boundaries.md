# Knowledge Boundaries

**Status:** MVP-018.5 design baseline  
**Scope:** authority boundaries between CyberMedica platform modules

## Purpose

This document defines what each platform layer may and may not do. It protects
the Verification and Publication boundaries as CyberMedica grows new modules.

## Importer

May:

- discover product candidates;
- fetch or receive source data;
- create raw artifacts;
- create normalized records;
- create Evidence Candidates;
- create Candidate Claims;
- record warnings, conflicts and missing data.

May not:

- create Verified Claims;
- change verified facts;
- publish facts;
- write public projections;
- resolve conflicts automatically;
- treat LLM output as source data.

## Knowledge Engine

May:

- parse normalized documents;
- extract candidate characteristics;
- group candidate claims;
- detect conflicts;
- detect missing information;
- calculate readiness and completeness signals;
- prepare review tasks.

May not:

- verify medical facts;
- publish facts;
- hide conflicts;
- invent missing values;
- make compatibility public;
- bypass Review Queue.

## Review

May:

- inspect evidence;
- accept, reject or request more evidence;
- resolve conflicts with rationale;
- approve claim revisions for publication review;
- author clinical, procurement or compatibility notes.

May not:

- mutate raw artifacts;
- publish automatically;
- use commercial priority as verification reason;
- accept AI output as evidence;
- delete history.

## Portal

May:

- display published product projections;
- show public evidence references where approved;
- provide search and navigation over published data;
- route users to request flow.

May not:

- read Candidate Claims directly;
- read importer internals;
- display unverified facts as public truth;
- expose private reviewer notes;
- resolve product identity.

## Search

May:

- index published projections;
- index approved public metadata;
- support internal search over candidates when explicitly scoped;
- expose filters based on published fields.

May not:

- bypass Verification;
- merge candidate and published facts in public results;
- rank products as verified based on completeness alone;
- use snippets as facts.

## AI

May:

- retrieve published facts;
- explain evidence and public product data;
- draft internal reviewer notes;
- summarize documents for human review with clear provenance;
- help users navigate published knowledge.

May not:

- be a source of data;
- publish facts;
- verify claims;
- invent characteristics;
- resolve conflicts;
- answer from Candidate Claims in public context;
- hide uncertainty.

## Publication

May:

- approve verified claim revisions for public projection;
- create publication records;
- supersede published facts;
- archive public facts or products;
- maintain audit trail.

May not:

- run automatically from importer output;
- publish candidate claims;
- publish facts without evidence;
- bypass human verification;
- delete source history.

## Future CMS

May:

- manage editorial copy that is not factual medical data;
- prepare public descriptions using published facts;
- manage landing pages, help pages and non-medical content;
- send factual changes into review workflow.

May not:

- edit published medical facts directly;
- change verification decisions;
- replace evidence;
- publish AI-generated medical claims without review.

## Product Compare

May:

- compare published facts;
- compare internal candidates only in reviewer context;
- show evidence and missing data indicators;
- explain non-equivalence.

May not:

- infer equivalence automatically;
- compare unverified candidate data publicly;
- hide context or units;
- treat alternatives as substitutes without review.

## Analytics

May:

- measure coverage, completeness and review throughput;
- report missing documents and categories;
- prioritize workflow.

May not:

- affect verification status;
- change publication status;
- rank trust based on business value.

## What Never Happens

- LLM is a source.
- AI publishes facts.
- Importer changes Verified data.
- Portal reads Candidate Claims directly.
- Search bypasses Verification.
- Publication runs automatically.
- Completeness Score becomes verification.
- Commercial priority changes truth status.
