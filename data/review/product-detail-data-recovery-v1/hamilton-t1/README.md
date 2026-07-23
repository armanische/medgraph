# Hamilton-T1 Product Detail data-recovery review candidate

This directory is a **review/debug artifact**, not a new source of truth and not a
publication payload. It points to the immutable legacy snapshot by Git commit,
file path and SHA-256. It contains no Cloud credentials and was created without a
Cloud/Supabase write.

`review-candidate.json` is deliberately status `needs_manual_approval_and_schema_change`:

- Every proposed feature and technical specification has legacy-only evidence.
- Legacy HTML may support a human review, but cannot be used as a Product Detail
  runtime fallback.
- The current schema has no key-features relation and no characteristic group
  field. The proposed groups are therefore editorial targets, not stored facts.
- Documents and registration records are intentionally empty because no confirmed
  source exists in the immutable snapshot or repository.

The package must be consumed by the existing review/approval process only after a
separate schema-and-service-only publication task is approved. It must not be
written to Cloud directly or treated as an approved review decision.
