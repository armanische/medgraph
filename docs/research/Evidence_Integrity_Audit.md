# Evidence Integrity Audit

Date: 2026-07-15

Scope: Wave 2 generated discovery, document, extraction, and review product reports.

## Result

| Measure | Before | After |
| --- | ---: | ---: |
| Stage-level violations | 4,632 | 0 |
| Unique missing evidence IDs | 1,544 | 0 |
| Broken document-version references | 0 | 0 |
| Broken source references | 0 | 0 |
| Broken artifact paths | 0 | 0 |
| Missing locators | 0 | 0 |
| Blocked or unrecoverable items | 0 | 0 |

The 4,632 violations were the same 1,544 missing evidence entities referenced at three stages: extracted facts, candidate claims, and review items.

## Root Cause

`explicitTextFacts()` calculated a canonical evidence ID and placed it on each extracted fact, but returned only the facts. The associated evidence objects were not propagated into `evidenceCandidates`. Candidate claims and review items correctly retained the same ID, so the serialization omission appeared at all three downstream stages.

The issue was not caused by unstable document-version IDs, artifact deduplication, mixed report runs, slug mismatches, or legacy IDs. Every affected ID matched the existing canonical SHA-256 formula and was backed by one unambiguous chain containing:

- a manufacturer source;
- a document candidate and document version;
- a content-addressed PDF artifact;
- a non-empty page/paragraph locator;
- the extracted raw text and fact value.

## Canonical Evidence ID

The existing ID formula is now exposed and reused by extraction and integrity repair:

```text
evidence_<sha256(documentVersionId + separator + rawText + separator + page + separator + paragraph)[0:24]>
```

It does not use `generatedAt`, absolute paths, array indexes, traversal order, temporary filenames, random values, or URL query parameters. Tests confirm stability across identical runs and reordered locator object properties.

## Baseline Breakdown

| Manufacturer | Unique IDs | Fact violations | Claim violations | Review violations | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dräger | 1,294 | 1,294 | 1,294 | 1,294 | 3,882 |
| Philips | 79 | 79 | 79 | 79 | 237 |
| Hamilton Medical | 73 | 73 | 73 | 73 | 219 |
| GE HealthCare | 70 | 70 | 70 | 70 | 210 |
| SLE | 18 | 18 | 18 | 18 | 54 |
| Mindray | 8 | 8 | 8 | 8 | 24 |
| SonoScape | 2 | 2 | 2 | 2 | 6 |
| **Total** | **1,544** | **1,544** | **1,544** | **1,544** | **4,632** |

Thirty-nine product reports and 533 document versions were affected. The complete per-entity baseline, including product, stage, entity ID, missing ID, document version, source, locator, report path, reason, and repairability, is stored in `data/research/integrity/evidence-integrity.generated.json`.

## Repair

The repair deterministically regenerated 1,544 evidence objects with their existing IDs. No ID replacement was necessary:

| Repair classification | Count |
| --- | ---: |
| Exact matches | 0 |
| Deterministic regenerations | 1,544 |
| Downstream references restored | 3,088 |
| Legacy IDs normalized | 0 |
| Blocked | 0 |
| Unrecoverable | 0 |

Checkpoint results followed the required order:

| Completed step | Violations before | Violations after |
| --- | ---: | ---: |
| Dräger | 4,632 | 750 |
| Philips | 750 | 513 |
| Hamilton Medical | 513 | 294 |
| GE HealthCare | 294 | 84 |
| SLE | 84 | 30 |
| Mindray | 30 | 6 |
| SonoScape | 6 | 0 |

Example repaired chain:

```text
official source
  -> existing document version and SHA-256 artifact
  -> existing page/paragraph locator
  -> regenerated EvidenceCandidate using the fact's canonical ID
  -> unchanged ExtractedFact reference
  -> unchanged CandidateClaim reference
  -> unchanged ReviewItem evidence ID plus propagated document-version/source links
```

The generator now serializes evidence created by `explicitTextFacts()`, preventing recurrence. The repair is idempotent: a second pass creates no additional evidence or changes.

## Ready-for-review Impact

The repair did not change review statuses, priorities, risks, or decisions. Propagating the now-valid document-version links made the affected 1,544 items structurally ready for human review, increasing the evidence-level ready count from 3,816 to 5,360. All items remain unverified and still require human review.

## Persisted Paths

Absolute user-specific paths in the Wave 2 aggregate summary were replaced with repository-relative paths. Runtime path resolution remains unchanged, and official source URLs were not modified. A regression test rejects absolute user paths in generated report values.

## Safety

```text
publicationCreated = false
verifiedClaimsCreated = 0
reviewDecisionsChanged = false
supabaseWrites = false
verificationChanged = false
```

No fake source, document version, locator, artifact, Verified Claim, Publication record, review decision, or Supabase write was created.
