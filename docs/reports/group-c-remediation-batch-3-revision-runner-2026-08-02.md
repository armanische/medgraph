# Group C Remediation Batch 3 Revision Runner — 2026-08-02

## Closed operation surface

The Production-only route accepts only operation key
`group-c-batch-3-revision-creation-v1` and manifest SHA-256
`38542b94baaf6593ac80e03d8c9227c9e6f051e91993bb27806a6a48306ca934`.
All seven Product identities and per-Product idempotency keys are resolved from
the tracked server manifest. Browser-supplied Product IDs are not accepted.

Corporate authorization requires email `cybermedicaooo@gmail.com`, Auth UUID
`7e90a993-8b30-4e0d-aff4-a257d5a4a179`, role `admin`, a live session and a
same-origin Production request. The runner calls only
`cloud_api.create_product_publication_revision_v1`; it has no Human Review,
Approval or Publication method.

## Provenance guard corrective

The first Production attempt stopped before writes with
`catalog_product_raw_snapshot_hash_drift`. The Batch 3 patch preview hashes
used a different JSON serialization from the PostgreSQL `jsonb` digest used by
the runner. Exact source UIDs and `sourceChecksum` values matched.

The corrective preserved the immutable check and replaced only the seven
expected raw snapshot hashes with DB-native SHA-256 values from the prior
read-only Production inventory. Product scope and checksum triads were not
changed. Corrective commit `3305a172c592bc43a01f5fc4d027951a0a5d6959`
passed tests, lint, TypeScript, Turbopack and Webpack. Production deployment
`dpl_DjhA6HkYsp1EDEcLyznXUcoWiok8` reached READY on the exact commit.

The runner rejects a modified digest, a wrong operation key, a non-corporate
session, stale or pre-existing lifecycle state, candidate nondeterminism,
checksum drift and any Product outside the frozen scope. `gitForkProtection`
remained enabled.
