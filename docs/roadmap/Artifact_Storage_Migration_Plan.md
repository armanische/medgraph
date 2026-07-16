# Artifact Storage Migration Plan

## Purpose

This roadmap describes possible future work to move evidence artifacts from Git-backed local storage to external immutable storage. It is planning material only. No migration, upload, deletion, provider selection, credential configuration, Git history rewrite, or application cutover is included in the current change.

## Entry conditions

Migration work may start only after:

- Artifact Storage Policy approval by engineering, security, compliance, and operations.
- Explicit retention periods and legal-hold behavior are defined.
- The current inventory has no unexplained checksum, MIME, or absolute-path issue.
- Every orphan candidate has an owner and recorded disposition decision.
- Recovery targets and an independently tested backup location are approved.

## Future stages

### Stage 1 — Storage-neutral contract

Define a provider-neutral immutable object adapter behind the existing artifact lookup boundary. Keep digest, manifest, evidence IDs, document versions, and Review Queue semantics unchanged. Add contract tests for idempotent put, verified get, missing object, checksum mismatch, and access denial.

Exit gate: local and candidate external adapters pass identical contract and failure-mode tests.

### Stage 2 — Production storage provisioning

Select and provision an immutable object service through infrastructure review. Configure encryption, least-privilege identities, object versioning or write-once controls, audit logging, replication, backup, retention, and cost alerts. Keep application traffic on local storage.

Exit gate: security review and restore drill pass; no production artifact has been copied yet.

### Stage 3 — Dry-run migration manifest

Freeze a signed inventory snapshot, classify active/retained/orphan candidates, estimate transfer volume, and produce a deterministic copy plan keyed only by SHA-256. Reconcile the plan with all document-version and review-item references.

Exit gate: source count, logical bytes, and reference graph reconcile exactly; unresolved items block continuation.

### Stage 4 — Copy and verify

Copy bytes without deleting or mutating local files. After each copy, independently read the destination object and recompute SHA-256. Record immutable object keys and verification results in a migration ledger separate from business data.

Exit gate: 100% of referenced active artifacts and their backup copies pass byte-level verification; no checksum exception is waived.

### Stage 5 — Shadow reads

Exercise external reads in non-authoritative shadow mode and compare bytes, MIME detection, latency, availability, and access logs with local reads. Continue serving the current local source.

Exit gate: reconciliation remains exact through the agreed observation window and disaster-recovery rehearsal.

### Stage 6 — Controlled read cutover

Switch the artifact resolver to the external immutable store behind a reversible configuration flag. Keep the repository copy as rollback protection for an approved stabilization period. Do not change evidence IDs, document-version paths, candidate claims, review decisions, Verification, or Publication.

Exit gate: operational approval after successful monitoring, rollback rehearsal, and manifest audit.

### Stage 7 — Cache introduction

Introduce an optional bounded read-through cache keyed by SHA-256. Verify every cache fill, measure hit rate, and prove that eviction affects only cache copies.

Exit gate: cache corruption and eviction tests demonstrate that the authoritative object is unaffected.

### Stage 8 — Repository footprint decision

After retention and rollback windows close, prepare a separate decision record for the Git repository. Options may include leaving history intact, creating a new artifact-free baseline repository, or a separately approved history-cleaning program. This stage must include stakeholder notice, backup, clone rehearsal, and explicit authorization.

No Git history rewrite or artifact deletion is authorized by this roadmap or the current task.

## Rollback principles

Before cutover, rollback means continuing local reads. After cutover, the resolver flag returns reads to the verified local copy while external objects remain immutable for investigation. Rollback never changes evidence IDs or reviewer state.

## Completion criteria

Migration is complete only when all referenced digests reconcile across source, authoritative store, backup, and manifest; restore tests pass; access logging is operational; and the stabilization period closes with formal approval. Orphan disposition and any repository-size reduction remain separate governed decisions.
