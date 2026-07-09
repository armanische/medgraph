# Review Queue Pilot Findings

MVP-024 built a candidate-only Review Queue from the MVP-023 extraction output.

Input:

- `data/research/extraction/products/*.json`

Output:

- `data/research/review/review-queue.generated.json`
- `data/research/review/products/<slug>.json`

## Summary

- ReviewQueueItems created: 8
- Pending review: 8
- High priority: 2
- Missing evidence or document-version linkage: 1
- Conflicts: 0
- Ready for human review: 7
- Products with review items: 1

No Verified Claims were created.

No publication was performed.

No Supabase writes were performed.

## Product Coverage

### Hamilton T1

Hamilton T1 is the first product with reviewable items.

Queue items came from:

- downloaded technical specification PDF;
- downloaded user manual PDF;
- downloaded brochure PDF;
- extracted document metadata;
- one extracted technical term;
- one manufacturer candidate.

The queue grouped items by claim type:

- `document.title`
- `document.type`
- `technical.term`
- `product.manufacturer`

## Ready For Human Review

Seven items have:

- evidence candidate id;
- linked document version id;
- source URL;
- pending review status.

These are ready for a human reviewer to inspect, but not ready for publication.

## Missing Evidence / Linkage

One item has an evidence candidate id but no linked document version in the product report.

Recommended action:

- inspect the extraction evidence generation for the technical term;
- ensure every CandidateClaim evidence id maps to an `EvidenceCandidate`;
- keep the item pending until the evidence chain is complete.

## High Priority Items

Two items were high priority:

- identity/manufacturer claim;
- item with missing document-version linkage.

No clinical, compatibility, procurement, warning, contraindication, or safety claims were approved or published.

## What Worked

- CandidateClaims with evidence became ReviewQueueItems.
- Claims without evidence are skipped with warnings.
- Items are deterministic and idempotent.
- Product-level and aggregate reports are generated.
- The queue preserves candidate-only safety language in item reasons.

## What To Improve Before Review UI

- Add a human-readable reviewer screen over `ReviewQueueItem`.
- Show source PDF, document version, hash, locator, and extracted quote together.
- Add explicit filtering by risk, priority, and missing evidence.
- Add a manual decision storage layer that is still separate from Verification.
- Add conflict grouping when multiple candidate claims disagree.
- Improve extraction so all candidate claims have a complete evidence chain.

## MVP-025 Read-Only Prototype

MVP-025 added a protected internal screen:

```text
/internal/review-queue
```

It is enabled in production only with:

```text
CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1
```

The screen reads only generated Review Queue reports and shows:

- aggregate queue metrics;
- product grouping;
- pending candidate facts;
- priority and risk;
- evidence ids;
- document version ids;
- source URLs;
- reviewer guidance;
- warnings.

It does not create reviewer decisions, does not approve or reject facts, and does not publish data.

### Next Blockers Before Real Reviewer Workflow

- Internal authentication and authorization.
- Persistent reviewer decisions.
- Dedicated storage for decisions that is still separate from Verification.
- Side-by-side evidence excerpt and document preview.
- Better missing-evidence diagnostics.
- Conflict grouping and reviewer assignment.
- Explicit Verification handoff after human review.

## Safety Notes

The Review Queue is not a public data source.

The Portal must not read it directly.

Reviewer decisions must not publish data.

Only a future Verification handoff can convert approved review output into verified state, and Publication must remain a separate explicit boundary.
