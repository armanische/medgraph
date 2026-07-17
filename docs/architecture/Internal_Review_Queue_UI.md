# Consolidated Review Pipeline

RFC-019 makes Human Review the canonical review workflow. Review Queue remains
an upstream generated input and a read-only internal projection; it has no
decision business logic or independent decision model.

## Canonical boundary

The canonical runtime is `scripts/importers/catalog/review/`:

- `types.ts` owns statuses, decisions, snapshots, summaries, and store contracts;
- `state-machine.ts` owns allowed transitions and replay;
- `decision-store.ts` owns append-only decision history;
- `review-service.ts` validates explicit reviewer actions;
- `snapshot.ts` owns the unchanged snapshot format;
- `publication-policy.ts` owns the unchanged readiness policy;
- `lib/review/human-workspace.ts` builds the shared reviewer/read-only view model.

Both internal routes consume `HumanReviewerWorkspaceModel` through
`loadHumanReviewerWorkspace()`:

```text
generated Review Queue products ─┐
artifact/integrity inputs ────────┼─► Human Review workspace model
append-only decisions ────────────┘              │
                                                 ├─► /internal/reviewer (write)
                                                 └─► /internal/review-queue (read-only)
```

The optional workspace scope is presentation-only. `/internal/reviewer` keeps
its existing pilot scope. `/internal/review-queue` requests `scope: "all"` to
display all available canonical items. This does not change statuses,
transitions, snapshots, policies, or persisted decisions.

## Sole decision-write point

`/internal/reviewer` is the only UI that can submit review decisions. Its server
actions continue to use the Human Review service and append-only decision store.

`/internal/review-queue` contains no form, button, server action, mutation, or
decision processor. It displays canonical current statuses and histories from
the shared model. The legacy `decisions.manual.json` processor and
`process:review-decisions` command were retired because they represented a
second, incompatible decision workflow.

## Removed duplication

RFC-019 removed:

- the separate `lib/internal-review-queue.ts` loader;
- duplicated queue-page status and decision DTOs;
- the legacy generated decision-report model;
- the manual JSON decision parser, validator, and CLI command;
- direct route reads of `review-decisions.generated.json`.

The generated Review Queue item/report types remain because they are the stable
upstream handoff from Extraction to Human Review. They are not a second decision
workflow.

## Access and rendering

Both routes use the shared `internalReviewEnabled()` gate and noindex metadata.
When disabled, they call `notFound()`. `connection()` keeps the gate dynamic.
An enabled environment flag is not authentication; Preview/Production still
requires Deployment Protection or an equivalent external access boundary.

## Safety invariants

- no automatic approval or publication;
- no Verification or Supabase writes;
- no state-machine, decision-store, reviewer-action, policy, or snapshot-format
  changes;
- no public navigation or public Storefront dependency;
- Review Queue remains read-only;
- Review, Integrity, Extraction, Artifacts, Wave 2, and retained Publication
  runtimes remain present.
