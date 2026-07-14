# Wave 2 Final Execution Audit

**Audit date:** 2026-07-14  
**Scope:** current generated reports for Hamilton, Mindray, Ambu, Dräger, Philips, GE HealthCare, SonoScape, Comen, SLE, and Dixion  
**Mode:** read-only audit; no verification, publication, Review Decision, Supabase, public API, Portal, or UI mutation

## Audit conclusion

The deterministic Wave 2 orchestrator completed all six report stages for all 10 planned manufacturers, so the internal Dashboard reports **10/10 completed and 100%**. This does **not** mean evidence completeness. The current product-level evidence reports contain 154 entries, and every entry remains blocked by the Discovery required-document gate because a complete registration + IFU/manual + datasheet set is not present.

## Evidence-level KPI by manufacturer

“Official sources” and “documents” are bindings; unique URL counts are shown separately where useful. “Ready” means Review Items structurally ready for a human reviewer. “Blocked” means the Discovery evidence-readiness gate is not satisfied. “Errors” are failed trusted downloads. “Warnings” are unique report-warning texts across Discovery, download, and extraction.

| Manufacturer | Evidence status | Entries | Official sources | Document candidates | Downloads | Unique artifacts | Facts/claims | Review items | Ready | Blocked | Errors | Warnings | Avg coverage | Execution report |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Hamilton | In Progress | 12 | 12 | 28 | 25 | 20 | 186 / 186 | 186 | 113 | 12 | 3 | 44 | 33% | yes |
| Mindray | In Progress | 23 | 22 | 6 | 1 | 1 | 181 / 181 | 181 | 173 | 23 | 5 | 35 | 6% | yes |
| Ambu | Blocked | 2 | 3 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 2 | 0 | 4 | 0% | no |
| Dräger | In Progress | 15 | 15 | 755 | 698 | 138 | 4234 / 4234 | 4234 | 2940 | 15 | 57 | 58 | 64% | yes |
| Philips | In Progress | 16 | 16 | 371 | 33 | 25 | 301 / 301 | 301 | 222 | 16 | 338 | 40 | 56% | yes |
| GE HealthCare | In Progress | 22 | 20 | 7921 | 53 | 31 | 242 / 242 | 242 | 172 | 22 | 7 | 53 | 16% | yes |
| SonoScape | In Progress | 19 | 20 | 20 | 20 | 5 | 44 / 44 | 44 | 42 | 19 | 0 | 15 | 1% | yes |
| Comen | Blocked | 17 | 15 | 2 | 0 | 0 | 0 / 0 | 0 | 0 | 17 | 2 | 29 | 0% | yes |
| SLE | In Progress | 13 | 35 | 28 | 6 | 5 | 47 / 47 | 47 | 29 | 13 | 22 | 26 | 3% | yes |
| Dixion | In Progress | 15 | 28 | 159 | 46 | 21 | 125 / 125 | 125 | 125 | 15 | 113 | 20 | 7% | yes |

The GE candidate count is much larger than its 60 trusted download attempts because Resolver v2 retained repeated URL bindings while the downloader deduplicated within product reports. This is a current diagnostics/aggregation limitation, not thousands of unique downloaded documents.

## Aggregate evidence-level KPI

| KPI | Result |
| --- | ---: |
| Manufacturers audited | 10 |
| Entries/products | 154 |
| Official source bindings | 186 |
| Unique source URLs | 160 |
| Document candidate bindings | 9,290 |
| Unique document URLs | 1,233 |
| Trusted download attempts | 1,429 |
| Successful download bindings/document versions | 882 |
| Unique SHA-256 artifacts | 246 |
| Candidate facts | 5,360 |
| Candidate claims | 5,360 |
| Review items | 5,360 |
| Ready for human review | 3,816 |
| Evidence-blocked entries | 154 |
| Failed trusted downloads/errors | 547 |
| Unique warnings (summed per manufacturer) | 324 |
| Weighted average extraction coverage | 19% |

The evidence-level aggregate is calculated from the current per-product reports and only joins downstream reports whose slug exists in the corresponding manufacturer Discovery set. It is intentionally separate from the execution summaries.

## Deterministic Wave 2 orchestration metrics

| Manufacturer | Status | Products | Sources | Documents | Downloads | Artifacts | Candidate facts | Review items | Blocked | Errors | Warnings |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hamilton | Completed | 12 | 12 | 26 | 17 | 17 | 42 | 42 | 1 | 0 | 1 |
| Mindray | Completed | 22 | 22 | 48 | 32 | 32 | 77 | 77 | 3 | 0 | 1 |
| Ambu | Completed | 10 | 4 | 14 | 9 | 9 | 23 | 23 | 1 | 0 | 2 |
| Dräger | Completed | 15 | 15 | 32 | 21 | 21 | 52 | 52 | 2 | 0 | 1 |
| Philips | Completed | 16 | 16 | 35 | 23 | 23 | 46 | 46 | 2 | 0 | 1 |
| GE HealthCare | Completed | 20 | 20 | 43 | 28 | 28 | 70 | 70 | 2 | 0 | 1 |
| SonoScape | Completed | 16 | 20 | 23 | 15 | 15 | 46 | 46 | 2 | 0 | 2 |
| Comen | Completed | 15 | 15 | 22 | 15 | 15 | 44 | 44 | 2 | 0 | 2 |
| SLE | Completed | 12 | 35 | 35 | 23 | 23 | 35 | 35 | 2 | 0 | 1 |
| Dixion | Completed | 15 | 28 | 28 | 18 | 18 | 35 | 35 | 2 | 0 | 2 |
| **Total** | **10/10 Completed** | **153** | **187** | **306** | **201** | **201** | **470** | **470** | **19** | **0** | **14** |

These values are deterministic orchestration estimates produced by `wave2-execution.ts`; they are not derived from downloaded evidence and must not be compared one-for-one with the evidence-level table.

## Dashboard audit

The `/internal/wave2` loader returns:

- planned manufacturers: 10;
- completed manufacturers: 10;
- remaining: 0;
- overall progress: 100%;
- Dixion: Completed, 100%, 15 products, 28 documents, 18 artifacts, 35 candidate facts, 35 review items, 2 blocked, 0 errors, 2 warnings.

The 100% progress value is stage completion (`completed manufacturers / planned manufacturers`), not evidence completeness. The Dashboard currently reads deterministic manufacturer summaries and therefore can display Completed even when evidence-level downloads are absent (Ambu/Comen) or every entry is blocked by missing required documents. This is a known status-model limitation; Dashboard logic was not changed.

## Execution-report availability

Reports exist for Hamilton, Mindray, Dräger, Philips, GE HealthCare, SonoScape, Comen, SLE, and Dixion. Ambu has no `docs/research/Ambu_Wave2_Execution_Report.md` in the current workspace.

## Principal limitations and next actions

1. Complete IFU/operator manual, technical specification, and registration evidence discovery before any verification claim.
2. Investigate resolver candidate multiplication, especially GE and Dräger, while preserving source/document bindings.
3. Separate “stage completed” from “evidence ready” in a future Dashboard/status-model task.
4. Re-run Ambu and Comen evidence acquisition; their current product reports contain no successful artifacts or review items.
5. Treat coverage as a triage metric. It does not measure completeness, and some category matcher false positives remain.
6. Reconcile duplicate/legacy identity entries without publishing or auto-merging product families.

## Safety audit

- `publicationCreated = false`
- `verifiedClaimsCreated = 0`
- `supabaseWrites = false`
- `verificationChanged = false`
- `reviewDecisionsChanged = false`

No commit was created.

