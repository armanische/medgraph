# Published Catalog transport resilience — 2026-08-02

## Incident class and corrective

The confirmed failure path was a temporary error from the Published Catalog
transport reaching the public render tree. DNS, TLS, mobile routing and iOS
browser APIs were not the cause. The permanent corrective adds bounded retry,
a validated public-only LKG snapshot, graceful fallback, a sanitized health
endpoint, structured correlation logging, corporate synthetic monitoring and
a mandatory build/CI reliability gate.

The LKG is captured during every Production build from project
`clbzibuusyuajsylcbvl`. The capture fails the build if the project binding is
wrong, the payload is invalid, or fewer than the already published baseline is
returned. Runtime validation rejects duplicate IDs/slugs, broken references,
draft status, empty/regressed projections and same-version document-checksum
drift.

## Reliability evidence

- retry policy: three attempts; 2.5 seconds each; 200/450 ms jittered backoff;
- retryable: network/timeout, 408, 425, 429 and 5xx only;
- fallback: tracked build snapshot plus newest validated warm-runtime snapshot;
- route/global error states remain finite and visible when no snapshot exists;
- health: `GET /internal/health/catalog`, sanitized and `no-store`;
- monitor owner: `cybermedicaooo@gmail.com`, every 15 minutes;
- synthetic scope: homepage, catalog, sitemap, stable Product Detail, request,
  RFQ method and legacy-shell markers;
- test corpus: 572/572 PASS;
- TypeScript/lint/diff check: PASS;
- Turbopack and Webpack builds: PASS;
- WebKit fault injection: 3 profiles × 5 routes PASS with all live requests
  forced to HTTP 503 and the LKG rendered.

## IDN-03 lifecycle checkpoint

Durable corporate Review verification passed for revision
`5801cde4-9341-4fe9-9e35-da47627754f9`, Review Item
`a0654fd4-d65f-450d-b8ed-2270408fdcbe`, Decision
`9b06ac1b-2108-40fa-96ac-ed7a8fc64fdb` and reviewer UUID
`7e90a993-8b30-4e0d-aff4-a257d5a4a179`. Outcome is `approve`, rationale is
present, the revision is current/non-stale, the checksum triad is exact, and
Approval/Publication Batch were zero before the controlled operation.

The corporate-only exact-manifest runner created Approval
`bc04a144-b3e8-4eae-a7d8-b4281ec35bd2` and Publication Batch
`99664f26-515b-40bc-90f0-f8d439fb33c4`. Replay returned
`already_complete` with the same identifiers and no duplicate lifecycle rows.
The canonical Product URL is
`/catalog/767632362-363181290312-inkubator-intensivnoi-terapii-novorozhde`.

The post-operation read-only transaction reported `transaction_read_only=on`
and completed with `ROLLBACK`. Durable totals are Products `79`, Published
`71`, Unpublished `8`, and Revisions/Decisions/Approvals/Publication Batches
`71/71/71/71`. Projection version is `73`, checksum is
`23f7f2b73d7c694584e85f0e910298930d555194bab26164f2988d9b74895898`.
All eight remaining Products are still draft.

## Production deployment evidence

- validated runtime SHA: `8c3f204bd2946d71b71b7bd3eb0cee39c56d2b30`;
- validated deployment: `dpl_C4UawMYTULC3BGcEVXd9vvUyvPpD` (`READY`);
- Production build LKG: 71 Products, projection version `73`;
- authoritative projection checksum prefix: `23f7f2b73d7c`;
- independent document checksum prefix: `bb8b94a5270b`;
- canonical synthetic: PASS, sitemap Product URLs `71`;
- health probe: `healthy`, live transport healthy, fallback inactive,
  snapshot Products `71`;
- canonical WebKit smoke: 3 profiles × 5 routes PASS;
- `www` redirect and IDN-03 Product Detail: PASS.
