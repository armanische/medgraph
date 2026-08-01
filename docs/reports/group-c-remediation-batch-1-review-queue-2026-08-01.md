# Group C Remediation Batch 1 Review Queue — 2026-08-01

## Queue contract

The generic `/internal/review` queue is bound to the eight durable Revision and
Review Item pairs recorded in the static publication revision manifest. Detail
routes use Revision ID. Runtime reads fail closed unless Product identity,
model, current `in_review` state, SEO, characteristics and media satisfy the
tracked manifest.

Expected queue order is manifest order:

1. EPK-i5000
2. HD-350
3. HD-500
4. Dialog+
5. BabyGuard 1120
6. JAY-10
7. Discovery RF180
8. CM1200B

All cards display three characteristics, the tracked media count and warnings
`missing_documents` and `missing_registration`. Anonymous access redirects to
the internal login. New Review actions require the corporate email, UUID and
live `admin` profile; historical reviewer identities remain audit-only.

No Human Review action was performed during creation or queue verification.

## Queue closure

The corporate Product Owner later completed all eight Review actions. Durable
verification found exactly one positive Decision per revision, all bound to the
corporate admin identity; the queue is closed. Approval and Publication evidence
is recorded in the
[Batch 1 publication report](./group-c-remediation-batch-1-publication-2026-08-01.md).
