# Artifact Storage Policy

## Status and scope

This policy defines how CyberMedica evidence artifacts are identified, checked, retained, and eventually served from external immutable storage. It applies to downloaded source documents and their manifests. It does not change Verification, Publication, Review Queue, Evidence IDs, or source-document semantics.

The current implementation remains local and repository-backed. This change adds audit and read-only manifest capabilities only; it does not migrate, delete, upload, or rewrite an artifact.

## Core invariants

1. An artifact is immutable after its SHA-256 identity is established.
2. The artifact key is its lowercase SHA-256 digest, sharded as `sha256/<first two>/<next two>/<sha256>.<extension>`.
3. A stored byte sequence must hash to the digest encoded in its path. A mismatch is an integrity failure, never a reason to silently rename or overwrite the file.
4. Metadata and human-friendly names are manifest attributes, not storage identities.
5. References remain repository-relative and portable. Absolute workstation paths are prohibited.
6. A manifest is generated deterministically from stored bytes and existing research references.
7. Reads may be served from a verified cache, but cache contents are not authoritative.

## Immutable storage model

The future authoritative store should expose objects by digest and deny in-place overwrite. A repeated write of identical bytes may be treated as idempotent; different bytes for an existing digest must fail. Object versioning or equivalent write-once controls should be enabled where available, but no vendor-specific SDK is part of the repository model.

The logical object key is independent of provider and region:

```text
artifacts/sha256/ab/cd/abcdef...<64 hex>.<extension>
```

Extensions are descriptive and must not be trusted as MIME evidence. SHA-256 and content inspection remain authoritative.

## Checksum verification

- Verify SHA-256 while ingesting, after durable write, on cache fill, and during scheduled audit.
- Compare the full digest and both shard directories with the path.
- Check the `%PDF-` signature for PDF artifacts and flag HTML payloads returned by blocked portals.
- Never repair a checksum mismatch automatically. Quarantine the reference for investigation while retaining the bytes.
- Duplicate content is reported by digest. Deduplication is a future, separately approved operation.

## Manifest

`artifact-storage-manifest-v1` is the portable inventory contract. Every entry records digest, repository-relative path, byte size, extension, detected MIME, PDF signature result, manufacturer, product references, document-version references, review-item references, reference count, and orphan status.

The manifest also records size buckets, duplicate groups, integrity findings, temporary files, absolute-path findings, and the 50 largest objects. It contains no credentials, signed URLs, workstation paths, reviewer decisions, or mutable verification state.

Manifest generation must be deterministic for an unchanged artifact tree and unchanged reference reports. Validation checks schema version, portable paths, unique entries, valid SHA-256 values, and internally consistent totals.

## Retention and lifecycle

Lifecycle states are policy concepts for a future external store:

- **Active:** referenced by a document version or review item and immediately readable.
- **Retained:** no longer active but held through the evidence retention period.
- **Orphan candidate:** no current reference; retained until an explicit evidence-owner review and approved disposition.
- **Quarantined:** checksum, MIME, or path integrity problem; readable only for investigation.
- **Expired:** retention and legal requirements are satisfied and an approved deletion record exists.

No automatic transition may delete evidence. Retention periods must be approved by compliance and legal owners before enforcement. Holds override lifecycle expiration.

## Cache policy

Local artifacts may become a bounded read-through cache after migration. Cache keys are digests, cache fills require checksum verification, and eviction may remove only cache copies—not the authoritative object. A cache miss must not alter evidence identity or review state.

Cache metadata should include digest, verified byte size, verification time, and authoritative object locator. Signed access URLs must never be persisted in manifests.

## Access control

- Pipeline readers receive least-privilege object-read access.
- Audit jobs receive list/read metadata and object-read access, without delete or overwrite.
- Migration writers, if later approved, use a short-lived dedicated identity and cannot change application data.
- Human access is logged and limited to support, compliance, and incident-response roles.
- Credentials remain outside Git and outside generated reports.

## Backup and recovery

The authoritative store must have an independent backup or replication boundary, periodic restore tests, checksum-based reconciliation, and retained manifest snapshots. Backups preserve immutable object keys and must not replace primary checksum validation.

Disaster recovery should restore in this order: manifest snapshot, referenced active artifacts, retained artifacts, then caches. Recovery is complete only after manifest validation and a byte-level checksum audit. RPO/RTO values require production ownership approval before cutover.

## Operational audit

Run `npm run audit:artifact-storage` before release preparation and after any approved storage operation. The command reads the artifact tree and research references, writes only the requested generated inventory, and reports anomalies. It does not modify artifacts or business records.

Any orphan, duplicate, invalid PDF, HTML masquerade, zero-byte file, temporary file, checksum mismatch, or absolute path is a review finding. Findings do not authorize deletion or mutation.
