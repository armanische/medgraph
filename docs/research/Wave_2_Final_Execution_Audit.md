# Wave 2 Final Execution Audit

**Audit date:** 2026-07-15
**Scope:** current generated reports for Hamilton, Mindray, Ambu, Dräger, Philips, GE HealthCare, SonoScape, Comen, SLE, and Dixion
**Mode:** read-only audit; no verification, publication, Review Decision, Supabase, public API, Portal, or UI mutation

## Audit conclusion

The deterministic Wave 2 orchestrator completed all six report stages for all 10 planned manufacturers, so the internal Dashboard reports **10/10 completed and 100%**. This does **not** mean evidence completeness. After the Ambu completion run, the current product-level evidence reports contain 166 non-duplicate entries, and every entry remains blocked by the Discovery required-document gate because a complete registration + IFU/manual + datasheet set is not present. The evidence graph itself is intact and all 5,480 Review Items are structurally ready for a human reviewer.

## Evidence-level KPI by manufacturer

“Official sources” and “documents” are bindings; unique URL counts are shown separately where useful. “Ready” means Review Items structurally ready for a human reviewer. “Blocked” means the Discovery evidence-readiness gate is not satisfied. “Errors” are failed trusted downloads. “Warnings” are unique report-warning texts across Discovery, download, and extraction.

| Manufacturer | Evidence status | Entries | Official sources | Document candidates | Downloads | Unique artifacts | Facts/claims | Review items | Ready | Blocked | Errors | Warnings | Avg coverage | Execution report |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Hamilton | In Progress | 12 | 12 | 28 | 25 | 20 | 186 / 186 | 186 | 186 | 12 | 3 | 44 | 33% | yes |
| Mindray | In Progress | 23 | 22 | 6 | 1 | 1 | 181 / 181 | 181 | 181 | 23 | 5 | 35 | 6% | yes |
| Ambu | In Progress | 14 | 15 | 369 | 19 | 18 | 120 / 120 | 120 | 120 | 14 | 4 | 52 | 21% | yes |
| Dräger | In Progress | 15 | 15 | 755 | 698 | 138 | 4234 / 4234 | 4234 | 4234 | 15 | 57 | 58 | 64% | yes |
| Philips | In Progress | 16 | 16 | 371 | 33 | 25 | 301 / 301 | 301 | 301 | 16 | 338 | 40 | 56% | yes |
| GE HealthCare | In Progress | 22 | 20 | 7921 | 53 | 31 | 242 / 242 | 242 | 242 | 22 | 7 | 53 | 16% | yes |
| SonoScape | In Progress | 19 | 20 | 20 | 20 | 5 | 44 / 44 | 44 | 44 | 19 | 0 | 15 | 1% | yes |
| Comen | Blocked | 17 | 15 | 2 | 0 | 0 | 0 / 0 | 0 | 0 | 17 | 2 | 29 | 0% | yes |
| SLE | In Progress | 13 | 35 | 28 | 6 | 5 | 47 / 47 | 47 | 47 | 13 | 22 | 26 | 3% | yes |
| Dixion | In Progress | 15 | 28 | 159 | 46 | 21 | 125 / 125 | 125 | 125 | 15 | 113 | 20 | 7% | yes |

The GE candidate count is much larger than its 60 trusted download attempts because Resolver v2 retained repeated URL bindings while the downloader deduplicated within product reports. This is a current diagnostics/aggregation limitation, not thousands of unique downloaded documents.

## Aggregate evidence-level KPI

| KPI | Result |
| --- | ---: |
| Manufacturers audited | 10 |
| Entries/products | 166 |
| Official source bindings | 198 |
| Unique source URLs | 172 |
| Document candidate bindings | 9,659 |
| Unique document URLs | 1,416 |
| Trusted download attempts | 1,452 |
| Successful download bindings/document versions | 901 |
| Unique SHA-256 artifacts | 264 |
| Candidate facts | 5,480 |
| Candidate claims | 5,480 |
| Review items | 5,480 |
| Ready for human review | 5,480 |
| Evidence-blocked entries | 166 |
| Failed trusted downloads/errors | 551 |
| Unique warnings (summed per manufacturer) | 372 |
| Weighted average extraction coverage | 19% |

The evidence-level aggregate is calculated from the current per-product reports and only joins downstream reports whose slug exists in the corresponding manufacturer Discovery set. It is intentionally separate from the execution summaries.

## Deterministic Wave 2 orchestration metrics

| Manufacturer | Status | Products | Sources | Documents | Downloads | Artifacts | Candidate facts | Review items | Blocked | Errors | Warnings |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hamilton | Completed | 12 | 12 | 26 | 17 | 17 | 42 | 42 | 1 | 0 | 1 |
| Mindray | Completed | 22 | 22 | 48 | 32 | 32 | 77 | 77 | 3 | 0 | 1 |
| Ambu | Completed | 14 | 15 | 20 | 13 | 13 | 32 | 32 | 1 | 0 | 2 |
| Dräger | Completed | 15 | 15 | 32 | 21 | 21 | 52 | 52 | 2 | 0 | 1 |
| Philips | Completed | 16 | 16 | 35 | 23 | 23 | 46 | 46 | 2 | 0 | 1 |
| GE HealthCare | Completed | 20 | 20 | 43 | 28 | 28 | 70 | 70 | 2 | 0 | 1 |
| SonoScape | Completed | 16 | 20 | 23 | 15 | 15 | 46 | 46 | 2 | 0 | 2 |
| Comen | Completed | 15 | 15 | 22 | 15 | 15 | 44 | 44 | 2 | 0 | 2 |
| SLE | Completed | 12 | 35 | 35 | 23 | 23 | 35 | 35 | 2 | 0 | 1 |
| Dixion | Completed | 15 | 28 | 28 | 18 | 18 | 35 | 35 | 2 | 0 | 2 |
| **Total** | **10/10 Completed** | **157** | **198** | **312** | **205** | **205** | **479** | **479** | **19** | **0** | **14** |

These values are deterministic orchestration estimates produced by `wave2-execution.ts`; they are not derived from downloaded evidence and must not be compared one-for-one with the evidence-level table.

## Dashboard audit

The `/internal/wave2` loader returns:

- planned manufacturers: 10;
- completed manufacturers: 10;
- remaining: 0;
- overall progress: 100%;
- Ambu: Completed, 100%, 14 products, 15 official sources, 20 documents, 13 artifacts, 32 candidate facts, 32 review items, 1 blocked, 0 errors, 2 warnings.
- Dixion: Completed, 100%, 15 products, 28 documents, 18 artifacts, 35 candidate facts, 35 review items, 2 blocked, 0 errors, 2 warnings.

The 100% progress value is stage completion (`completed manufacturers / planned manufacturers`), not evidence completeness. The Dashboard currently reads deterministic manufacturer summaries and therefore can display Completed when every entry is still blocked by the evidence-level required-document gate. This is a known status-model limitation; Dashboard logic was not changed.

## Execution-report availability

Execution reports now exist for all 10 planned manufacturers, including `docs/research/Ambu_Wave2_Execution_Report.md`.

## Principal limitations and next actions

1. Complete IFU/operator manual, technical specification, and registration evidence discovery before any verification claim.
2. Investigate resolver candidate multiplication, especially GE and Dräger, while preserving source/document bindings.
3. Separate “stage completed” from “evidence ready” in a future Dashboard/status-model task.
4. Retry the four timed-out Ambu IFUs and continue Comen evidence acquisition without weakening downloader rules.
5. Treat coverage as a triage metric. It does not measure completeness, and some category matcher false positives remain.
6. Reconcile duplicate/legacy identity entries without publishing or auto-merging product families.

## Safety audit

- `publicationCreated = false`
- `verifiedClaimsCreated = 0`
- `supabaseWrites = false`
- `verificationChanged = false`
- `reviewDecisionsChanged = false`

No commit was created.
