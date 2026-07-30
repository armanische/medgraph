# Group A Immutable Revision Run — 2026-07-31

## Result

All 33 patched Products passed the read-only revision preflight and received
one immutable revision through the existing service-only
`cloud_api.create_product_publication_revision_v1(uuid,text)` wrapper.

| Check | Result |
| --- | ---: |
| Candidate deterministic reads | 10 per Product, 33/33 PASS |
| Revision preflight | 33/33 PASS |
| Revisions created | 33 |
| Revision number | 1 for every target |
| Review Items | 33, all `in_review` |
| Decisions | 0 for this batch |
| Approvals | 0 for this batch |
| Publication Batches | 0 for this batch |
| Idempotent retries required | 0 |

Idempotency keys used the approved form:
`remaining-catalog-v2-<source_uid>-revision-1`.

Result artifact (outside Git, mode `0600`):

`/tmp/group-a-minimal-batch-revision-results-2026-07-31.json`

SHA-256: `ca97d63691db03bbfbe30b330e45004ae4fc03ea73ce61a6a8c167d15929cb5f`

The read-only preflight artifact is:

`/tmp/group-a-minimal-batch-revision-preflight-2026-07-31.json`

SHA-256: `66c8d6d4e576e8b9cb90fa33317d38b3ffb0a31a621a594463e8ad6c2fa17ca7`

## Production invariance

After the run: Products `79`, Published `3`, Unpublished `76`, Revisions `36`,
Decisions `3`, Approvals `3`, Publication Batches `3`. The 33 new Products are
`in_review` and unpublished; no existing published Product changed.

No Human Review, Approval or Publication was executed.
