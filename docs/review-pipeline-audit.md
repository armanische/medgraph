# RFC-018 — Legacy Review Pipeline Audit

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: dependency, entry-point, and ownership audit only; no runtime, data,
pipeline, route, or UI changes

> **Post-audit status (RFC-019):** Human Review is now the canonical workflow.
> `/internal/review-queue` consumes the shared Human Review workspace model as a
> read-only projection. The duplicate queue UI loader/types and legacy manual
> decision processor/CLI were retired. The state machine, append-only decision
> store, reviewer actions, policy, snapshot format, generated Review Queue
> builder, Integrity, Extraction, Artifacts, Wave 2, and Publication were not
> changed or removed.

## 1. Executive Summary

The public Storefront does not import the Review Pipeline. Review is still an
active internal and operational subsystem through two protected Next.js routes,
five direct Review npm commands, upstream extraction/integrity commands, and a
large test surface.

The repository contains two distinct Review implementations:

1. **Generated Review Queue** — `review-queue.ts` deterministically converts
   extraction reports into `data/research/review` product/aggregate reports. It
   also contains an older manual-JSON decision processor. The read-only
   `/internal/review-queue` route loads these generated files through a separate
   duplicated TypeScript model in `lib/internal-review-queue.ts`.
2. **Human Review** — `review/` loads the generated product reports, artifact
   inventory, and integrity report, then stores append-only decisions under
   `data/review-decisions`. `/internal/reviewer` uses this system for real
   reviewer actions, state transitions, stale-snapshot protection, readiness,
   summary, and audit.

These systems share generated Review Items but do not share a decision store or
status model. The manual `data/research/review/decisions.manual.json` path is not
the same as the append-only `data/review-decisions/decisions` path. Removing or
merging either path without an explicit decision-history migration risks
changing review semantics.

The linear graph proposed in the RFC is not the implementation graph. Wave 2
does not import and execute Review, Integrity, Extraction, or Artifact modules;
its orchestrator writes deterministic summary metrics and labels those stages.
The actual data pipeline runs through explicit CLI commands and generated JSON.
Integrity observes several stages in parallel, and retained Publication modules
consume Review rather than sitting downstream in the active public Storefront.

No whole subsystem is **Safe now**. A bounded next RFC can consolidate the
read-only Review Queue UI into Human Review and retire the legacy manual
decision command, but the Review Queue builder, Human Review core, integrity,
extraction, artifacts, Wave 2, and retained Publication dependencies remain
protected.

Existing staged changes under `data/public` and `data/review-decisions` were
treated as user-owned state and were not changed.

## 2. Dependency Graph

### Actual data and runtime graph

```text
Discovery reports
       │
       ▼
Trusted Documents download ─────────► content-addressed artifacts
       │                                      │
       ▼                                      │
Extractor + Category Profiles                 │
       │                                      │
       ▼                                      │
data/research/extraction/products             │
       │                                      │
       ▼                                      │
review-queue.ts                               │
       │                                      │
       ├──► review/products/*.json             │
       ├──► review-queue.generated.json        │
       └──► legacy review-decisions report     │
                │                              │
                ├──────────────┐               │
                ▼              ▼               ▼
      /internal/review-queue  Evidence Integrity  Artifact Storage Audit
                               │               │
                               └──────┬────────┘
                                      ▼
                              review/loader.ts
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
             Review snapshot    Review policy    Decision store
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                              Human Review service
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
               /internal/reviewer          review summary/audit
                                                   │
                                                   ▼
                                      data/review-decisions

Retained Publication Builder/Publisher
       ├──► Review snapshot/policy
       ├──► Review loader/fixtures
       └──► publication/types.ts ◄── type-only imports from Review

Wave 2 orchestrator ──► data/research/wave2 summaries ──► Wave 2 Dashboard
                                 ▲
                                 └── integrity repair may refresh aggregate metrics
```

### Important non-dependencies

- Wave 2 orchestration does not import `review-queue.ts`,
  `evidence-integrity.ts`, `trusted-documents.ts`, the extractor, or artifact
  storage. Stage names in its summary are not runtime calls to those modules.
- The public Storefront does not import Review or its generated reports.
- `/internal/review-queue` reads generated JSON directly and does not call the
  Review Queue builder.
- `/internal/reviewer` does not call extraction or integrity commands; it reads
  their persisted outputs through `review/loader.ts` and reads extraction detail
  directly for display.
- Human Review actions do not publish, verify, run Wave 2, or write Storefront.

### Cycles

No executable module cycle was found inside Review, Integrity, Extraction,
Artifacts, or Wave 2.

There is one cross-boundary ownership cycle:

```text
Publication Builder ──runtime──► Review snapshot/policy
Review loader/snapshot/fixtures/policy ──type-only──► publication/types.ts
```

The Review-to-Publication edge is erased at runtime, but `publication/types.ts`
is still required for Review compilation. This is a contract-ownership blocker,
not a runtime cycle.

## 3. Production Usage

### Public production routes

No public Storefront route imports Review, Integrity, Extraction, Artifact
Storage, or Wave 2 runtime modules. `/products/fs510` uses a separate Supabase
projection and is outside this Review graph.

### Internal production routes

| Route | Loader/action graph | Usage | Status |
| --- | --- | --- | --- |
| `/internal/review-queue` | page → `lib/internal-review-queue.ts` → generated review JSON | Read-only view of generated queue and legacy decision report. | Active, env-gated, noindex. |
| `/internal/reviewer` | page → `lib/review/human-workspace.ts` → loader/store/snapshot/policy/state machine | Human reviewer workspace over pilot reports and append-only decisions. | Active, env-gated, noindex. |
| `/internal/reviewer` actions | server action → review service → decision store → review summary | Validates explicit action, snapshot, state transition, reviewer identity, then writes append-only decision and summary. | Active write path. |
| `/internal/import-center` | derived report loader | Displays aggregate Review/Wave 2 metrics but does not import Review runtime. | Read-only consumer. |
| `/internal/wave2` | `lib/wave2-dashboard.ts` → Wave 2 summary JSON | Displays orchestration progress, not actual review completion. | Read-only consumer. |

### Human Review module inventory

| Module | Production/internal | CLI | Tests | Responsibility |
| --- | --- | --- | --- | --- |
| `review/types.ts` | Internal UI/service type contract | Re-exported by Review CLI | Human Review and UI tests | Statuses, decisions, snapshots, summaries, audit and store interfaces. |
| `review/state-machine.ts` | Reviewer workspace/service/summary | Transitively | Human Review tests | Fail-closed transition and replay rules. |
| `review/decision-store.ts` | Workspace, service, summary | Transitively | Human Review tests | Append-only file decisions, indexes, locking/idempotency support. |
| `review/loader.ts` | Workspace/service/summary | Transitively | Human Review and Publication tests | Loads generated review products plus artifact/integrity state and selects pilot reports. |
| `review/snapshot.ts` | Workspace/service/summary; retained Publication Builder | Transitively | Human Review and Publication tests | Canonical snapshot hash and evidence/artifact/integrity validity. |
| `review/publication-policy.ts` | Workspace/service/summary; retained Publication Builder | Transitively | Human Review and Publication tests | Item/product readiness policy; name is legacy but behavior remains active. |
| `review/review-service.ts` | Reviewer server action | Transitively | Human Review tests | Reviewer identity, current item lookup, snapshot/status checks, decision creation. |
| `review/review-summary.ts` | Reviewer server action | Direct Review CLI | Human Review tests | Summary/index rebuild and append-only history audit; still reads `data/public` for published-state compatibility. |
| `review/fixtures.ts` | Retained Publisher imports it behind a development flag | Transitively | Human Review/Publication tests | Deterministic review/publication fixture input. Not test-only at source-graph level. |
| `review/index.ts` | No route import | Direct Review CLI | Human Review/Publication tests use barrel exports | Barrel plus `review:summary` and `review:audit` dispatcher. |

## 4. Internal Usage

### Generated Review Queue

`review-queue.ts` has three responsibilities in one file:

1. Convert `TrustedDocumentExtractionProductReport` and Candidate Claim handoff
   data into Review Items and product reports.
2. Write aggregate/product reports under `data/research/review` and provide
   summary loading.
3. Parse `decisions.manual.json` into a separate legacy decision report.

The builder is upstream of both internal Review pages because Human Review also
loads its product reports. The legacy manual decision processor is not used by
the Human Reviewer server action.

`lib/internal-review-queue.ts` duplicates many queue/report interfaces instead
of importing a neutral schema. It is used only by `/internal/review-queue` and
`ReviewQueueView`. The route is read-only and has no decision action.

### Human Review

`review/loader.ts` joins three persisted inputs:

- generated Review Queue product reports;
- artifact inventory;
- evidence-integrity violations.

The workspace additionally reads extraction reports for raw text/profile/
locator display and `data/public/summary.generated.json` for a legacy published
status. Decisions are read and written only through `FileReviewDecisionStore`
under `data/review-decisions`.

### Integrity

`evidence-integrity.ts` imports trusted-document evidence helpers and the Review
Queue product-report type. It reads discovery, document, extraction, review,
artifact, integrity, and Wave 2 generated data. Audit is read-only apart from
its requested generated report; repair can deterministically rewrite extraction
and Review evidence references and refresh aggregate reports. It is not a
Review-only helper and must not be removed with Review UI.

Artifact Storage Audit independently scans the content-addressed artifact tree
and research references, verifies hashes/signatures, and generates the artifact
inventory consumed by Human Review. The Review Pipeline does not import its
implementation, only its generated output shape through Publication-owned
types.

### Extraction

Trusted Documents writes DocumentVersions, evidence candidates, extracted fact
candidates, Candidate Claim handoff, and extraction profile summaries.
`review-queue.ts` imports these types and consumes the persisted extraction
reports. Extraction and Category Profiles are therefore upstream data
producers, not Review modules safe to delete.

### Publication

The executable Publication CLI was removed by RFC-017, but retained Builder,
Publisher, and Candidates still import Review loader, fixtures, snapshot, and
policy. Review imports `publication/types.ts` type-only. These retained modules
keep part of the old Review-to-Publication handoff alive in tests and source
code, although no public route executes it.

## 5. CLI Usage

| Command | Module | Reads | Writes / effect |
| --- | --- | --- | --- |
| `build:review-queue` | `review-queue.ts build` | Extraction product reports | Review product and aggregate reports. |
| `review:queue-summary` | `review-queue.ts summary` | Review aggregate, or extraction if missing | May rebuild queue when summary is absent. |
| `process:review-decisions` | `review-queue.ts decisions` | Legacy manual decisions and queue products | Legacy generated decision report; not append-only Human Review. |
| `review:summary` | `review/index.ts summary` | Review context and append-only decisions | Decision indexes and Human Review summary. |
| `review:audit` | `review/index.ts audit` | Review context, decisions, published-state compatibility | Read-only audit result and exit status. |
| `audit:evidence-integrity` | `evidence-integrity.ts audit` | Cross-stage generated graph | Integrity report. |
| `repair:evidence-references` | `evidence-integrity.ts repair` | Cross-stage generated graph | Deterministic extraction/review/integrity repair outputs. |
| `audit:artifact-storage` | artifact-storage CLI | Artifacts and research references | Generated artifact inventory only. |
| `download:discovered-documents` | Trusted Documents CLI | Discovery reports/network | Documents and content-addressed artifacts. |
| `extract:discovered-documents` | Trusted Documents CLI | Documents/artifacts | Extraction/evidence/Candidate Claim reports. |
| `process:trusted-documents` | Trusted Documents CLI | Discovery/documents/artifacts | Download plus extraction outputs. |
| `wave2:execute` | Wave 2 orchestrator | Manual seeds and existing summaries | Wave 2 manufacturer and aggregate summaries only. |

The removed `publication:*` commands are not Review entry points and were not
restored.

## 6. Test Usage

| Test file | Covered subsystem |
| --- | --- |
| `catalog.test.ts` | Extraction adapter, Review Queue construction, grouping, deterministic reports, manual decision parsing/linking/idempotency, and safety boundaries. |
| `human-review.test.ts` | State machine, decision store, identity, locking/idempotency, stale snapshots, policy, summary/audit, and retained Publication handoff. |
| `reviewer-workspace.test.ts` | Internal route gating, workspace wiring, source display, controls, and noindex behavior. |
| `publication.test.ts` | Review snapshot/policy integration with retained Builder/Publisher. |
| `evidence-integrity.test.ts` | Cross-stage audit, repair classification, deterministic repair, absolute paths, and forbidden writes. |
| `extraction-profiles.test.ts` | Category profile selection, field coverage, patterns, unit normalization, and failed fields. |
| `artifact-storage.test.ts` | Artifact verification, manifest/references, duplicates, HTML/zero-byte/path checks, idempotency. |
| `wave2-execution.test.ts` | Summary generation, retries, supported manufacturers, determinism, and safety flags. |
| `wave2-dashboard.test.ts` | Read-only aggregate/manufacturer projections and internal route safety. |
| `import-center.test.ts` | Aggregate display of review and Wave 2 metrics. |
| `preview-hardening.test.ts` | Internal route protection and Preview smoke behavior. |

No core Review module is test-only. `review/fixtures.ts` is fixture-oriented,
but retained Publisher imports it in application source, so it cannot yet be
classified as test-only.

## 7. Candidate Modules

No candidate below is safe for immediate deletion. Group A means safe only
after the stated migration and route/command confirmation.

### Group A — Safe after migration

| Candidate | Required migration |
| --- | --- |
| `/internal/review-queue`, `ReviewQueueView`, `lib/internal-review-queue.ts` | Consolidate any still-needed aggregate/read-only information into `/internal/reviewer`, preserve noindex/env gating, then remove the duplicate route and types. |
| Legacy manual decision functions in `review-queue.ts` and `process:review-decisions` | Confirm append-only Human Review is canonical; archive or explicitly migrate any manual decision input/report still required. Keep Review Queue build functions. |
| `review/index.ts` barrel/CLI dispatcher | Move `review:summary` and `review:audit` to explicit entry points or retire those commands after internal actions provide the required summary/audit lifecycle; update tests to direct imports. |
| Duplicated Review Queue interfaces in `lib/internal-review-queue.ts` | Move to a neutral read schema if the route remains; otherwise delete with the route. |

### Group B — Requires Review

| Candidate | Review blocker |
| --- | --- |
| `review/types.ts`, `state-machine.ts`, `decision-store.ts` | Define append-only Human Review semantics and persisted decision compatibility. Active internal writes depend on them. |
| `review/loader.ts`, `snapshot.ts`, `review-service.ts` | Required for current item lookup, artifact/integrity gates, stale approval protection, explicit transitions, and reviewer identity. |
| `review/review-summary.ts` | Used by server actions and both Review CLI commands; includes index rebuilding and history audit. |
| `review/publication-policy.ts` | Used by Human Review workspace/service/summary and retained Publication Builder. Rename or split only after readiness semantics are reassigned. |
| `lib/review/human-workspace.ts`, `human-types.ts`, `/internal/reviewer`, `ReviewerWorkspace` | Active protected reviewer experience; cannot be deleted without replacing the workflow. |

### Group C — Blocked by Wave 2

| Candidate | Wave 2 / cross-stage blocker |
| --- | --- |
| Review Queue build portion of `review-queue.ts` and generated product reports | Consumes extraction/Candidate Claim output and supplies Integrity, Human Review, Import Center, and retained Publication input. |
| `evidence-integrity.ts` and integrity reports | Joins and may repair extraction/review/document/artifact references; Human Review consumes its result. |
| Trusted Documents, extractor, and extraction profiles | Produce DocumentVersions, evidence, facts, claims, and profiles required by Review Queue. |
| Artifact store and artifact-storage audit/manifest | Artifact validity and inventory are hard gates for Human Review snapshots. |
| `wave2-execution.ts`, Wave 2 data, dashboard, and Import Center metrics | Explicitly protected Wave 2 orchestration/reporting surfaces. |
| `review/fixtures.ts` | Retained Publisher imports it; tests and development fixture mode also depend on it. Remove only after Publication and Review fixture migration. |
| Retained Publication Builder/Publisher/Candidates and `publication/types.ts` | Depend on Review runtime/types and Wave 2 generated inputs; governed by RFC-016/017 boundaries. |

## 8. Risks

1. **Two decision semantics.** Legacy manual queue decisions and append-only
   Human Review decisions use different files, statuses, IDs, and validation.
   Treating them as interchangeable can lose history or approve the wrong item.
2. **Generated-data contract breakage.** Review product reports are consumed by
   Integrity, Human Review, retained Publication, internal UI, tests, and
   reports. Schema changes have a wide blast radius.
3. **Stale approval weakening.** Removing snapshot/artifact/integrity checks can
   turn an old approval into an eligible current decision.
4. **Repair side effects.** Evidence repair is intentionally capable of
   rewriting extraction and Review references. It must not be bundled with a UI
   cleanup or treated as read-only audit code.
5. **Wave 2 metric confusion.** Wave 2 stage completion is orchestration
   progress, not evidence completeness or Human Review completion.
6. **Internal route exposure.** Both Review routes rely on env gating plus
   external Preview protection; migration must preserve noindex and access
   boundaries.
7. **Type ownership coupling.** Review cannot compile without retained
   `publication/types.ts`; Publication cannot be removed cleanly until contracts
   move to Review or a neutral module.
8. **Artifact dependency.** Deleting inventory/audit code or reports breaks
   artifact validity gates even though Review does not import the storage module
   directly.
9. **Test safety loss.** Removing legacy tests wholesale could discard active
   fail-closed, deterministic, path-safety, and no-publication guarantees.

## 9. Recommendation

Proceed through small RFCs:

1. **Select the canonical Review workflow.** Formally designate append-only
   Human Review as canonical and inventory any meaningful legacy manual decision
   data before changing commands or files.
2. **Consolidate internal Review UI.** Move useful aggregate/read-only queue
   information into `/internal/reviewer`, then remove `/internal/review-queue`
   and its duplicated loader/types as one bounded UI-internal change.
3. **Retire legacy manual decisions.** Remove only the manual decision parser,
   command, and generated decision report path from `review-queue.ts`; preserve
   queue generation and product report schemas.
4. **Decouple contracts.** Move Review item/product/artifact/integrity input
   contracts out of `publication/types.ts`; then rename publication readiness to
   a Review-owned concept without altering stored decision history.
5. **Audit Review CLI/barrel.** Decide whether summary/audit remain operational
   commands. If yes, give them explicit entry points; if no, preserve equivalent
   checks in internal actions/tests before deleting `review/index.ts`.
6. **Leave cross-stage systems intact.** Do not remove Review Queue generation,
   Integrity, Extraction, Artifacts, Wave 2, Import Center, or retained
   Publication modules until their dedicated audits and data migrations are
   complete.

The safest next RFC is the read-only Review Queue UI consolidation or a
decision-store reconciliation audit. Deleting the whole `review/` directory is
not safe.
