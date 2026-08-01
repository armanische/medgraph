# Group C Remediation Batch 1 Revision Runner — 2026-08-01

## Outcome

The narrow Production-only runner created immutable revision 1 for the exact
eight approved Products. It accepts only the fixed operation key and manifest
digest, resolves all Product scope server-side, requires the corporate admin
session and invokes only `cloud_api.create_product_publication_revision_v1`.

## Security boundary

- Corporate email: `cybermedicaooo@gmail.com`
- Corporate Auth UUID: `7e90a993-8b30-4e0d-aff4-a257d5a4a179`
- Required role: `admin`
- Operation key: `group-c-batch-1-revision-creation-v1`
- Manifest SHA-256: `2e8e165c7b27ac5b64a226916a7a26289711ff46b5bcded109e3029ca9f40ae9`
- Production runner deployment: `dpl_FTEUf4myuhg3eSp41CuVqA49X8Nu`
- Browser-supplied Product IDs: rejected by contract
- Maximum deterministic-read concurrency: 3
- Revision writes: sequential, exact idempotency key per Product

The runner serializes no service credential and exposes no generic lifecycle
endpoint. Preview execution fails closed before Auth client initialization.

## Preflight and execution

The operation verified the exact Product/source/model binding, draft state,
canonical Russian row, SEO, characteristics, media count, provenance,
candidate determinism (10/10) and checksum triad for all eight Products.
Published projection stayed at 42 Products and version 44. Immediate replay of
each per-Product idempotency key returned the same durable Revision and Review
Item binding without a duplicate.

Human Review, Approval and Publication were not called.
