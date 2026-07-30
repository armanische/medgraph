# CyberMedica Post-Launch Operational Baseline — 2026-07-30

## Executive summary

The post-launch operational checks completed against the canonical Production
environment without changing application code, migrations, Product data,
environment variables, DNS, or deployment. A fresh database backup was
created and independently restored in an isolated PostgreSQL environment. A
single owner-approved test RFQ was submitted through the public form and was
accepted by the Production API after the configured webhook returned success.

The baseline was captured while public indexing was intentionally closed. The
separate controlled indexing activation is recorded in
`controlled-indexing-activation-2026-07-30.md`; this operational report keeps
the pre-activation state immutable.

## Reviewed Production baseline

| Item | Observed value |
| --- | --- |
| Project ref | `clbzibuusyuajsylcbvl` |
| Canonical domain | `https://cyber-medica.ru` |
| Deployed commit | `201845a3fe5caab23ab72d31ac70d5704c53e1e4` |
| Vercel deployment | `dpl_HVumG217appC2rJDbzoH4J5uJ43u` (`READY / PROMOTED`) |
| Migration ledger | 26/26; latest `202607290003`; pending 0 |
| Product state at baseline capture | 79 total; 1 published; 78 unpublished |
| Published Product | Hamilton-T1 only |
| Projection | version 3; 3 characteristics; 3 media; SEO present; old claim 0 |

All database checks in this report were read-only except for the controlled
test RFQ permitted by the release runbook. No Product, publication, review,
approval, projection, ENV, DNS, or deployment writes were performed.

## Fresh Production backup

Backup ID:
`production-postlaunch-clbzibuusyuajsylcbvl-20260729T212955Z`

Creation time: `2026-07-29T21:29:55Z` (UTC). The local backup directory and
all backup artifacts are mode `0600` (directory `0700`). The previous backup
`production-postmigration-clbzibuusyuajsylcbvl-20260729T085925Z` remains
retained as a historical recovery point through migration `202607290002`.

| Artifact | SHA-256 |
| --- | --- |
| `manifest.json` | `1ebe3b7a6203f0837dd0d1922102692f553ba275bc2705234079be58657d590d` |
| `database.archive` | `1afba919caa65f260e97dec844669bb99d5e32c39cb109abe3db9a46304bedca` |
| `roles.sql` | `5913ed87407a73efb26be26ffc404f8d8f8b7f8b234fc99c178d92d66a945292` |

The manifest records PostgreSQL server `17.6` (`server_version_num 170006`),
`pg_dump` `17.10`, and the restore image
`supabase/postgres:17.6.1.156`. Each artifact hash was recalculated after
creation and matched the manifest; credential-pattern scanning found no
credentials in the manifest or roles archive.

### Independent restore

The archive was restored into a clean `restoredb` database in
`supabase/postgres:17.6.1.156` with Docker `network=none`. The final restore
exit code was 0 and the disposable container was removed after verification.
Expected built-in Supabase role/grant notices were reviewed; no fatal restore
error remained.

Restored checks:

- migrations 26/26, latest `202607290003`;
- Products 79, Published 1, Unpublished 78 at the original baseline capture;
  the current post-Mindray state is 79/2/77 in the linked publication report.
- Hamilton-T1 revision, decision, approval and publication batch each present
  and bound to the expected Product/revision;
- projection version 3, SEO present, 3 characteristics, 3 media, old claim 0;
- three immutable publication/projection triggers and RLS on the verified
  publication state tables;
- function ACL boundary: `anon` and `authenticated` execute denied for the
  verified internal function, `service_role` execute retained.

## Canonical RFQ E2E

Exactly one test-only submission was made through
`https://cyber-medica.ru/request`. No retry or real-customer payload was used.
The form displayed the Hamilton-T1 context, submitted successfully, and the
browser reached the Production confirmation page (`/thanks`, heading
“Спасибо, заявка принята”). The API returns `ok=true` only after the configured
leads webhook responds successfully, so public form → API → webhook acceptance
is PASS. The API generated an opaque `requestId`; the current client result
handler does not retain it after routing to `/thanks`.

The previously approved downstream Make/email gate remains the authority for
the configured notification path. A fresh mailbox read was not attempted in
this run because no mailbox connector is available in the execution
environment; no claim of independent mailbox delivery is made here. The
canonical test therefore has a documented evidence boundary: webhook
acceptance is directly established, while fresh mailbox observation is not.

## Read-only monitoring baseline

### Public HTTP/TLS smoke

| Check | Result |
| --- | --- |
| `/` | HTTP 200 |
| `/catalog` | HTTP 200 |
| Hamilton Product Detail (`/catalog/<slug>`) | HTTP 200 |
| `/request` | HTTP 200 |
| `/sitemap.xml` | HTTP 200 (`application/xml`) |
| `/robots.txt` | HTTP 200 (`text/plain`) |
| `GET /api/request` | HTTP 405 (expected unsupported method) |
| `www.cyber-medica.ru` | HTTP 301 → apex HTTPS |
| `http://cyber-medica.ru` | HTTP 308 → apex HTTPS |
| TLS certificate verification | `curl ssl_verify_result=0`; remote IP `216.198.79.1` |

The Hamilton route is canonical under `/catalog/<slug>`; a root-level
`/<slug>` request correctly returns 404 and is not a broken Product route.

### Database health snapshot

The read-only Production query observed 15 database sessions, 9 backends,
transaction counters `xact_commit=67657`, `xact_rollback=104304392`, and 3
audit rows in the last 24 hours. Product and projection counts remained 79 and
1. These counters are a baseline, not an SLO claim; alert thresholds are
defined below.

### Indexing control at baseline capture

At the time of this report, before the separate indexing activation,
`robots.txt` returned `Disallow: /` and public HTML returned `noindex,
nofollow`. The activation report is the authoritative post-change evidence.

## QA correction

The only code change removes the stale assumption that
`202607290002_publication_candidate_function_owner_alignment_v1.sql` must be
the terminal migration. The local QA runner now derives the terminal migration
from the sorted migration directory, validates its filename shape, and reports
the terminal file. It still applies and verifies the approved alignment
migration and all existing contract assertions.

Validation of the corrected runner:

- `npm run qa:publication-candidate-owner:local` — PASS;
- disposable PostgreSQL image: `public.ecr.aws/supabase/postgres:17.6.1.147`;
- detected migration count: 26;
- detected terminal migration: `202607290003_hamilton_storefront_projection_completeness_v1.sql`;
- remote connections/writes: 0; disposable databases removed: yes.

The first attempt encountered a transient disposable PostgreSQL shutdown during
container startup; the immediate retry passed without code changes.

The exact reconciliation commit already passed the complete baseline suite:
`npm test` 499/499, lint, TypeScript, Turbopack build, Webpack build, and
migration/integration checks (see the reconciliation report).

## Operational thresholds and next review

For the next 24-hour observation window, treat any of the following as an
incident requiring review: repeated public 5xx responses, a non-2xx RFQ
webhook response, a Product count other than 79, Published count other than 2,
Hamilton or Mindray missing from the projection, a third published Product, or any
unexpected database write outside the RFQ integration path. Re-run this
read-only baseline after the first 24 hours and before enabling indexing.

## Post-launch curation backlog — 2026-07-30

The complete read-only audit of the 77 unpublished Production Products is
recorded in [Third Product Selection](third-product-selection-2026-07-30.md).
Mindray SV300 is now published; no Product data, review, approval or
publication state for the remaining Products was changed by the audit.

The shortlist contains BeneVision N1, Fresenius Kabi Agilia SP MC, Olympus
CV-190 PLUS EVIS EXERA III, Logiq E9 GE and Canon Aplio i700. All five retain
the structural `missing_model` blocker, so no third Product was selected. A
future content task must resolve that field from an authoritative source before
the existing immutable Revision → Human Review → Approval → Publication
workflow can begin. Registration and document gaps remain warnings under
Publication Policy v2; they must not be filled with guesses.

## Release decision

Backup and restore: PASS. Public RFQ intake and webhook acceptance: PASS with
the mailbox-observation boundary documented above. Monitoring baseline: PASS.
Indexing: NOT READY while the intentional noindex/Disallow control remains in
place. No deployment, merge, migration, publication, ENV, DNS, or Product
mutation was performed.
