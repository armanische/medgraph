# Wave 2 Release Readiness Report

Date: 2026-07-16

Branch: `feature/wave2-expansion`

Audit: MVP-050, updated by MVP-051, MVP-052, and MVP-055

## 1. Executive Summary

Wave 2 has completed all ten deterministic orchestration runs, and its generated JSON and downloaded PDF artifacts are physically readable. The evidence blocker found by this audit has been remediated: all 1,544 missing evidence entities were regenerated from existing canonical IDs and complete document chains, reducing 4,632 stage-level violations to zero without changing facts, claims, review decisions, verification, or publication. MVP-052 also closes the Ambu report/product gap: Ambu now has 14 evidence entries, 19 document versions, 120 candidate facts/claims/Review Items, and a complete execution report.

The branch is also unusually large: the working tree is 2.4 GB, `data/research` is 844 MB, artifacts are 789 MB, and loose Git objects occupy about 831 MiB. The Wave 2 Dashboard's 100% value represents orchestration completion only; it does not establish evidence completeness, verification, publication, or merge readiness.

| Area | Score |
| --- | ---: |
| Architecture | 8/10 |
| Data Integrity | 9/10 |
| Test Coverage | 9/10 |
| Security | 8/10 |
| Deployment Readiness | 5/10 |
| Documentation | 8/10 |
| Merge Readiness | 7/10 |

### MVP-055 Preview hardening addendum

Wave 2 data and pipeline behavior remain unchanged. Preview hardening now applies a self-only CSP and standard security headers to every route, disables `X-Powered-By`, closes `/thanks` to indexing, documents every environment flag, and adds `npm run qa:preview-smoke -- <BASE_URL>`. Disabled internal routes retain their env gates and `notFound()` behavior, but use generic disabled metadata and explicitly state that a feature flag is not authentication. Enabling any internal route in Preview requires Vercel Deployment Protection or an equivalent external access boundary.

The PostCSS advisory remains a temporary accepted Moderate risk because Next.js 16.2.9 and the available 16.2.10 patch both bundle `postcss@8.4.31`. Owner: Platform Engineering with Security. Review date: 2026-08-16 or the first compatible patch that removes the vulnerable version, whichever is earlier. No downgrade was performed.

## 2. Audit Scope

The audit covered Git history and branch state, generated reports, artifact hashes and signatures, evidence/review linkages, all ten manufacturers, KPI reconciliation, protected internal routes, the Wave 2 Dashboard, repository size, build trace assumptions, secrets, documentation, and the required build/test commands. It did not change pipeline, resolver, downloader, extraction, review decision, verification, publication, Supabase, or public API logic.

## 3. Git and Branch State

The initial working tree was clean and the active branch was `feature/wave2-expansion`. `HEAD` was `ec775d3`, exactly synchronized with `origin/feature/wave2-expansion` (ahead 0, behind 0). Relative to `main`, the branch is ten commits ahead and zero behind; no merge commits were found.

History contains repeated manufacturer execution/checkpoint commits and one unrelated tender-assistant feature affecting public UI (`app/tender`, `components/tender`, and `lib/tender`). The branch diff contains 926 paths and approximately 1.97 million additions. This is too broad for an uncomplicated as-is merge. The post-audit working tree is intentionally dirty because this report and the listed safe fixes are uncommitted.

## 4. Build and Test Results

| Check | Result | Notes |
| --- | --- | --- |
| `npm ci` | PASS | 358 packages installed; no deprecated-package warning; funding notice only |
| `npm run build -- --webpack` | PASS | Next.js 16.2.9; 79 pages; `/admin` and internal routes dynamic; no route or hydration warning |
| `npm run lint` | PASS | No errors or warnings |
| `npm test` | PASS | 234 passed; 0 failed/skipped after Preview hardening |
| `npx tsc --noEmit --pretty false` | PASS | No errors or warnings |
| `git diff --check` | PASS | No whitespace errors |

MVP-055 local production smoke passed 28/28 GET checks and 29/29 with the optional invalid request probe. Evidence and artifact audits were rerun after `npm ci`; both outputs retained identical SHA-256 hashes, evidence violations remained zero, and no artifact was changed.

No audit can be upgraded to merge-ready unless every required check passes. Preview deployment remains untested.

## 5. Wave 2 Manufacturer Matrix

The counts below are recalculated from product-level evidence reports, not copied from the orchestration summaries. “Blocked” is the number of blocked product entries.

| Manufacturer | Execution report | Products | Official sources | Documents | Artifacts | Candidate facts | Review items | Ready | Blocked | Errors | Warnings | Avg. coverage | Status |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Hamilton | Yes | 12 | 12 | 28 | 20 | 186 | 186 | 186 | 12 | 3 | 44 | 33% | Complete with blockers |
| Mindray | Yes | 23 | 22 | 6 | 1 | 181 | 181 | 181 | 23 | 5 | 35 | 6% | Complete with blockers |
| Ambu | Yes | 14 | 15 | 369 | 18 | 120 | 120 | 120 | 14 | 4 | 52 | 21% | Complete with blockers |
| Dräger | Yes | 15 | 15 | 755 | 138 | 4,234 | 4,234 | 4,234 | 15 | 57 | 58 | 64% | Complete with blockers |
| Philips | Yes | 16 | 16 | 371 | 25 | 301 | 301 | 301 | 16 | 338 | 40 | 56% | Complete with blockers |
| GE HealthCare | Yes | 22 | 20 | 7,921 | 31 | 242 | 242 | 242 | 22 | 7 | 53 | 16% | Complete with blockers |
| SonoScape | Yes | 19 | 20 | 20 | 5 | 44 | 44 | 44 | 19 | 0 | 15 | 1% | Complete with blockers |
| Comen | Yes | 17 | 15 | 2 | 0 | 0 | 0 | 0 | 17 | 2 | 29 | 0% | Complete with blockers |
| SLE | Yes | 13 | 35 | 28 | 5 | 47 | 47 | 47 | 13 | 22 | 26 | 3% | Complete with blockers |
| Dixion | Yes | 15 | 28 | 159 | 21 | 125 | 125 | 125 | 15 | 113 | 20 | 7% | Complete with blockers |

Every manufacturer now has a Wave 2 summary, discovery/document/extraction/review reports, Import Center metrics, a Dashboard entry, and an execution report. Ambu orchestration and evidence still use different metric semantics, but they now cover the same 14 seeded slugs; the execution report explains the remaining differences.

## 6. Generated Data Integrity

- 770 JSON files were parsed successfully; none was empty or truncated, and checked product reports had their expected top-level structure.
- All 264 unique artifact paths referenced by evidence reports exist.
- All 276 stored PDFs are non-zero and start with `%PDF-`; all 19 Ambu document-version references also match their reported SHA-256. No HTML masquerading as PDF was detected.
- No same-hash/different-content collision was found.
- Document-version and candidate-claim/review-item ID links are intact.
- The initial audit found 1,544 evidence IDs missing at each of the candidate-fact, candidate-claim, and review-item layers (4,632 stage-level violations). Deterministic remediation reduced all three counts to zero.
- Repaired evidence entities by manufacturer: Hamilton 73, Mindray 8, Dräger 1,294, Philips 79, GE HealthCare 70, SonoScape 2, and SLE 18.
- Twelve unreferenced artifacts were identified. They were not deleted because provenance cannot be established safely from the generated reports alone.
- Nine byte-identical suffixed review JSON copies and one byte-identical `.part` file were removed after their canonical counterparts and hashes were verified.
- Local ignored `.DS_Store` and `.next/* 2.json` files remain cleanup items, not tracked release content.

The generated Wave 2 aggregate paths have been normalized to repository-relative values. Runtime filesystem resolution and official source URLs were not changed.

## 7. KPI Reconciliation

### Evidence-level totals

| KPI | Recalculated value |
| --- | ---: |
| Manufacturers | 10 |
| Product entries | 166 |
| Official source bindings | 198 |
| Unique official source URLs | 172 |
| Document candidate bindings | 9,659 |
| Unique document URLs | 1,416 |
| Download attempts | 1,452 |
| Document versions | 901 |
| Unique referenced artifacts | 264 |
| Candidate facts | 5,480 |
| Candidate claims | 5,480 |
| Review items | 5,480 |
| Structurally ready for human review after remediation | 5,480 |
| Blocked product entries | 166 |
| Failed downloads | 551 |
| Warnings | 372 |
| Weighted average extraction coverage | 19% |

### Orchestration, Import Center, and Dashboard totals

The deterministic orchestration summaries report 10 completed manufacturers, 157 products, 198 official pages, 312 documents, 205 downloads/artifacts, 479 candidate facts/review items, 19 blocked products, 0 errors, and 14 warnings. Import Center reproduces these orchestration metrics, and the Dashboard calculates 100% as `completed manufacturers / 10 planned manufacturers`.

These values differ because the execution orchestrator uses deterministic/mock stage metrics, while the evidence-level reports contain the actual collected evidence graph. The Dashboard is therefore a stage-run monitor, not a data-completeness dashboard. UI copy was clarified accordingly without changing formulas or logic.

## 8. Review Queue Integrity

The fact → claim → review-item chain is structurally one-to-one for 5,480 entries. All evidence, document-version, source, locator, and referenced artifact links now resolve. Propagating document-version/source links increased structural ready-for-human-review from 3,816 to 5,360 during MVP-051; the Ambu execution then added 120 structurally complete items. Statuses and review decisions did not change.

No auto-approved item was found. `autoPublish` is false, verified claim count is zero, and both review-decision files contain zero decisions. The safety results are:

```text
publicationCreated = false
verifiedClaimsCreated = 0
reviewDecisionsChanged = false
```

## Evidence Integrity Remediation

| Measure | Value |
| --- | ---: |
| Violations before | 4,632 |
| Unique missing evidence IDs | 1,544 |
| Deterministic evidence regenerations | 1,544 |
| Downstream references restored | 3,088 |
| Exact repairs | 0 |
| Legacy IDs normalized | 0 |
| Blocked/unrecoverable | 0 |
| Violations after | 0 |

Root cause: `explicitTextFacts()` assigned a correctly calculated evidence ID to facts but did not serialize the corresponding evidence object into `evidenceCandidates`. Every affected fact retained a unique canonical match backed by an existing source, document version, artifact, and non-empty locator. The generator now propagates those evidence objects, and the repair command restored the missing entities in manufacturer order with an audit checkpoint after every step.

No fact, claim, review status, review decision, verified claim, or publication record changed. The derived ready-for-human-review count increased by 1,544 because previously empty document-version/source links were deterministically propagated. Full details are in `docs/research/Evidence_Integrity_Audit.md` and the generated integrity reports.

## 9. Safety Boundaries

The Wave 2 changes do not modify verification, publication, Supabase schema/write paths, `public_api`, authentication, review-decision semantics, or candidate-claim semantics. No Supabase write, automatic publication, automatic verification, authentication bypass, or LLM-as-source behavior was found in the audited Wave 2 paths. Official evidence/download hosts resolve to manufacturer-owned domains; no dealer, marketplace, forum, or SEO host was treated as official evidence.

The branch does include a separate tender-assistant public feature relative to `main`; it is a scope/merge-composition concern rather than a Wave 2 safety-boundary change.

## 10. Internal Routes

| Route | Gate | noindex | Boundary |
| --- | --- | --- | --- |
| `/internal/review-queue` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1` | Yes | Read-only queue |
| `/internal/reviewer` | `CYBERMEDICA_ENABLE_INTERNAL_REVIEW=1` | Yes | Client-side draft only; no persisted decisions |
| `/internal/import-center` | `CYBERMEDICA_ENABLE_IMPORT_CENTER=1` | Yes | Read-only reports |
| `/internal/wave2` | `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD=1` | Yes | Read-only reports |
| `/admin` | `CYBERMEDICA_ENABLE_ADMIN=1` | Yes | Internal route; external protection required when enabled |

Disabled routes call `notFound()` in production. No public-header link to these routes was found. Empty/corrupt report states are bounded and do not expose stack traces. All internal flags and import-only environment variables are documented in `.env.example`. Disabled metadata is generic and the UI copy requires Deployment Protection when a flag is enabled. The remaining soft-404 HTTP 200 behavior is documented and tested by body/metadata leakage checks rather than a brittle status workaround.

## 11. Dashboard Review

The Dashboard includes all ten planned manufacturers, status filters, detail selection, aliases for Dräger/Drager and GE HealthCare/GE, report links when present, missing/corrupt-report handling, horizontal overflow, keyboard-operable buttons, pressed-state accessibility, and labelled progress bars. Ambu now resolves its execution-report link and displays 14 products, 15 sources, 20 documents, 13 artifacts, 32 candidate facts/Review Items, one blocked product, and 100% orchestration progress.

The heading and warning now explicitly label the percentage as **orchestration progress** and state that it is not evidence completeness, verification, publication, or release readiness.

## 12. Repository and Artifact Size

| Measure | Value |
| --- | ---: |
| Working tree | 2.4 GB |
| `data/research` | 844 MB |
| `data/research/artifacts` | 789 MB |
| Artifact files | 276 |
| Loose Git objects | 5,266 / 831.12 MiB |
| PDFs over 10 MB | 17 |
| PDFs over 25 MB | 7 |
| PDFs over 50 MB | 0 |
| PDFs over 100 MB | 0 |
| Largest artifact | about 39 MB |

No individual artifact crosses GitHub's 100 MB hard file limit, but the aggregate branch/repository size materially increases clone, CI, Preview deployment, and Git object growth risk. `Artifact_Storage_Policy.md`, the deterministic inventory, and `npm run audit:artifact-storage` now exist. External immutable migration was not attempted. The Git footprint is a condition, not a blocker for a protected Preview; history rewrite or deletion remains prohibited until a successful Preview, backup/restore proof, and separate approval.

## 13. Deployment Readiness

Next.js build traces for the internal Wave 2 and Import Center routes include the ten manufacturer summaries and the aggregate summary, so their server-side filesystem reads are packaged for deployment. PDFs are not imported into the frontend bundle. Internal routes are server-rendered and environment-gated.

The production build passes. `npm run qa:preview-smoke -- <BASE_URL>` checks public routes, global security headers, robots, sitemap, `/thanks`, unknown-route 404, and all disabled internal/admin routes without browser automation or secrets. Its optional request validation mode sends only invalid JSON and never submits a real lead. Deployment Protection is classified as `protected_preview`, not an application failure. Deployment is not considered fully validated until the command and manual browser smoke run against a real Vercel Preview.

## 14. Security and Secrets

A safe tracked-file scan for common API key, token, password, private-key, service-role, bearer-token, cookie, and session patterns produced no secret finding. Only `.env.example` is tracked; local environment files remain ignored. Internal pages are noindexed and production-gated. No credential values were printed during the audit.

All routes now receive CSP, `X-Content-Type-Options: nosniff`, strict referrer policy, `X-Frame-Options: DENY`, restricted Permissions Policy, and `Cross-Origin-Opener-Policy: same-origin`; `X-Powered-By` is disabled. CSP deliberately retains `'unsafe-inline'` for the current static Next runtime and declares no external browser origin. Supabase and webhook traffic remain server-side. HSTS and actual header delivery must still be verified on Vercel/custom domain.

## 15. Documentation Quality

The pre-remediation documentation audit checked all then-existing Markdown files for relative links and found no broken link. Core Wave 2, Provider, Resolver, Extraction Profile, Dashboard, and all ten manufacturer execution reports are now present. Existing legacy trailing whitespace was not bulk-rewritten. User-specific paths in generated Wave 2 summaries were normalized during evidence remediation and the Ambu rerun aggregate was rebuilt with repository-relative paths.

The final execution documentation's headline KPI values agree with the recalculated evidence-level totals, but orchestration and evidence metrics must remain explicitly labelled to avoid contradiction.

## 16. Technical Debt

- Keep the evidence-integrity audit in release QA to prevent recurrence.
- Retry four timed-out Ambu IFUs and preserve conservative generation-specific compatibility handling.
- Keep generated report paths repository-relative in future pipeline changes.
- Determine ownership of the twelve orphan artifacts before retaining or deleting them.
- Define artifact retention and Git LFS/external-storage policy.
- Separate deterministic orchestration fixtures from evidence KPI presentation.
- Clean ignored local `.DS_Store` and duplicate `.next` output outside the tracked release diff.

## 17. Risks

| Risk | Severity | Impact |
| --- | --- | --- |
| Evidence serialization regression | Mitigated | Auditor, deterministic repair, and regression tests now cover the repaired chain |
| 831 MiB loose Git object set / 789 MB artifacts | High | Clone, CI, GitHub, and Vercel operational cost/failure risk |
| Dashboard deterministic/evidence mismatch | Medium | Stakeholders may infer false data completeness |
| Ambu IFU timeouts and low profile coverage | Low/Medium | Four IFUs remain retryable; display/electrode/manikin profiles remain incomplete |
| Unrelated tender feature in branch | Medium | PR scope and rollback are harder to review |
| Twelve orphan artifacts | Low/Medium | Storage and provenance debt |
| Preview deployment not run | Medium | Runtime packaging and environment behavior not independently proven |

## 18. Merge Blockers

1. Produce a clean, committed, pushed PR branch and pass CI plus a Vercel Preview smoke test.
2. Separate the unrelated tender-assistant changes or explicitly include them in the PR scope and review.
3. Record explicit acceptance of the current Git artifact footprint and temporary PostCSS advisory for Preview. Storage migration itself is not a protected-Preview blocker.

## 19. Recommended Merge Strategy

Use a selective squash/rebase: isolate the tender-assistant feature from Wave 2, consolidate checkpoint/generated-data commits into reviewable units, and retain a clear audit/fix commit. Merge remains conditional on artifact-storage approval, clean CI, and a Vercel Preview. Do not rewrite history automatically without coordinating with branch owners.

## 20. Final Release Checklist

Before Pull Request:

- [ ] working tree clean
- [ ] branch pushed (the pre-audit HEAD was synchronized; audit changes are not pushed)
- [x] local production build passed (remote CI not run)
- [x] all tests passed
- [x] JSON syntax/structure integrity passed
- [x] artifact path/hash/signature integrity passed
- [x] no tracked duplicate/temp data files after verified cleanup
- [x] no secrets
- [x] internal routes gated
- [x] security headers configured and `X-Powered-By` disabled
- [x] `/thanks` noindex
- [x] deterministic Preview smoke command implemented
- [x] no publication
- [x] no verification changes
- [x] no Supabase writes
- [x] documentation current for all 10 Wave 2 manufacturers
- [ ] repository size acceptable
- [ ] Preview Deployment passed
- [x] local manual smoke test passed

## 21. Final Verdict

# READY WITH CONDITIONS

Wave 2 orchestration, manufacturer execution documentation, evidence-reference integrity, and minimal Preview hardening are complete. Merge remains conditional on clean PR scope, CI, real protected Preview smoke, artifact-footprint acceptance, and temporary advisory disposition. Ambu's four timed-out IFUs remain a data-completeness follow-up, not a structural release-record blocker.
