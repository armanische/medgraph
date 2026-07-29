# Canonical Release-Branch Reconciliation — 2026-07-29

## Executive result

The launch graph is already linear. `origin/main` and `origin/production` are
both ancestors of the independently confirmed Production deployment commit.
The safe reconciliation is therefore fast-forward only; no merge commit,
cherry-pick, rebase or force push is required.

Production, Supabase, ENV, DNS and deployment state were not changed.

## Deployment evidence

Vercel API/CLI read-only metadata for deployment
`dpl_HVumG217appC2rJDbzoH4J5uJ43u` returned:

- project: `medgraph`;
- target: `production`;
- state: `READY` (promoted aliases include `cyber-medica.ru`);
- Git ref: `codex/hamilton-t1-storefront-projection-completeness-launch-v1`;
- exact Git SHA: `201845a3fe5caab23ab72d31ac70d5704c53e1e4`.

The deployment SHA is therefore authoritative and independently confirmed.

## Refs before reconciliation

| Ref | SHA | Role |
| --- | --- | --- |
| `origin/main` | `2ef6a576fc19352f5971bf3ac756360220093b1c` | canonical integration ref |
| `origin/production` | `66b0f97b0d37fc6fef808833a1a90b415975d5de` | canonical Production ref |
| deployed launch branch | `201845a3fe5caab23ab72d31ac70d5704c53e1e4` | exact deployed code |
| launch documentation | `bb8977a671a3b65cb6f02d62e561f59908f5f55a` | baseline closure |
| post-launch backup documentation | `adb752983268d49a38e0c9d203d364d693d7cda8` | verified recovery baseline |

`git fetch --all --prune` completed before this inventory. No untracked
credentials or local backup artifacts were added to the reconciliation tree.

## Commit inventory

All rows below are ancestors of the deployed SHA unless explicitly marked as
documentation descendants.

| SHA | Commit | Parent/placement | Relevant branch or source | In deployed code? |
| --- | --- | --- | --- | --- |
| `1b0e4c508fb46dd24e143186ef21a2b143b65457` | publication candidate SEO/characteristics completeness | linear launch parent | `origin/codex/publication-candidate-payload-completeness-corrective-v1` | yes |
| `16248359b74e4de8a320a61a1bd9f31780e51e1b` | publication candidate owner contract | child of `1b0e4c5` | `origin/codex/publication-candidate-owner-contract-alignment-v1` | yes |
| `47a747da928e8ceea63847cda654eec7a28f49b2` | Production canonical domain alignment | launch chain | local launch history | yes |
| `b7135695b45903ff4cc93b40bc03a4a8be92d172` | RFQ Product context preservation | launch chain | `origin/codex/controlled-production-release-preparation-v1` | yes |
| `9504521c05fe78a3aa2010d4611ad123be71f30f` | cloud function execution grant hardening | launch chain | local launch history | yes |
| `cfa5f20f3de4c8006da75ce165cc1ea51ee7b55f` | Catalog Admin description synchronization | launch chain | local launch history | yes |
| `23e54adbf61ad2a49d12dcc095b7cb2e78f90739` | safe Production Auth callback and PKCE review path | launch chain | local launch history | yes |
| `f3ac5d300a0f770a59b89a6cf951a20c20ee5bcb` | Production auth origin alignment | child of `23e54ad` | local launch history | yes |
| `c5fd4ef98e104070766beee3a84acbc2917c87bf` | async-only review server action exports | child of `f3ac5d3` | `origin/codex/production-auth-callback-corrective-v1` | yes |
| `9c89d32833965808301fd15cb853fb8fdbc684f6` | Hamilton storefront projection completeness | child of `c5fd4ef` | local launch history | yes |
| `201845a3fe5caab23ab72d31ac70d5704c53e1e4` | approved storefront characteristics UI | deployed commit | `origin/codex/hamilton-t1-storefront-projection-completeness-launch-v1` | yes; authoritative |
| `bb8977a671a3b65cb6f02d62e561f59908f5f55a` | production launch documentation closure | child of deployed SHA | `origin`/local documentation branch | documentation only |
| `adb752983268d49a38e0c9d203d364d693d7cda8` | verified post-launch backup documentation | child of `bb8977a` | local documentation branch | documentation only |

The complete intervening ancestry also contains the approved Product
Publication Foundation, Published Projection, CloudPublishedCatalogRepository,
Homepage, Catalog, Structured Fields and security corrective commits. No
equivalent patch was cherry-picked or duplicated.

## Strategy and execution

**Strategy A — fast-forward.** Both `origin/main` and `origin/production` are
ancestors of `adb7529…`:

```text
origin/main ─┐
             ├─ … ─ 201845a (deployed) ─ bb8977a ─ adb7529
origin/production ┘
```

The branch `codex/canonical-release-reconciliation-v1` was created from
`origin/production` and fast-forwarded to `adb752983268d49a38e0c9d203d364d693d7cda8`.
No conflicts occurred. No old→new SHA mapping is applicable because no
cherry-pick was used.

## Required launch content

- migration chain includes 26 files through `202607290003`;
- migration manifest contains 26 entries and all SHA-256 checksums match;
- `cloud_published` source, published mapper and fail-closed contracts are
  present;
- Product Detail, Catalog, RFQ, Auth/review utility and characteristics UI are
  present exactly as deployed;
- launch baseline and post-launch backup documentation are included;
- no local backup archive, secret, ENV value or database artifact is tracked.

## Validation

| Check | Result |
| --- | --- |
| migration files | 26 |
| migration manifest entries | 26 |
| migration checksum mismatches | 0 |
| `npm test` | PASS — 499/499 |
| `npm run lint` | PASS |
| `npx tsc --noEmit --pretty false` | PASS |
| `npm run build` | PASS — Next 16.2.9 Turbopack |
| `npm run build -- --webpack` | PASS |
| Product Publication local integration | PASS |
| Published Projection local integration | PASS |
| Catalog Admin description sync local integration | PASS |
| Structured Fields local integration | PASS |
| Candidate owner local harness | pre-existing harness mismatch: script requires `202607290002` to be the terminal local migration; current approved chain has 26 migrations through `202607290003`. The same owner contract is covered by the passing test suite and Catalog Admin integration evidence. No reconciliation regression. |
| `git diff --check` | PASS |

The first sandbox test invocation hit an environment-only loopback `EPERM`;
the escalated rerun passed 499/499. No test connected to Production.

## External canonical smoke (read-only)

Against `https://cyber-medica.ru`:

- `/` — HTTP 200;
- `/catalog` — HTTP 200;
- Hamilton-T1 detail — HTTP 200;
- `/request` with Hamilton context — HTTP 200;
- `/api/request` via unsupported GET — HTTP 405;
- `/sitemap.xml` and `/robots.txt` — HTTP 200;
- Hamilton title, SEO and projected characteristics present;
- media URLs present; sitemap contains the Hamilton product URL;
- old claim `более 9 часов` — 0 occurrences.

The smoke observed the already deployed Production metadata contract, including
its current indexing headers; no runtime change was made by reconciliation.

## Conflicts and resolution

No file conflicts occurred. The graph was resolved by ancestry proof and
fast-forward only. There was no side selection, conflict guessing, merge
commit, rebase or force operation.

## Final branch and rollback

The branch is ready for review with a clean working tree. Rollback is a normal
ref move/PR revert to the pre-reconciliation Production SHA
`66b0f97b0d37fc6fef808833a1a90b415975d5de`; no database rollback is part of
this task.

The branch must be pushed and merged under normal review. Do not promote,
deploy, migrate or update ENV/DNS as part of this reconciliation.

## Proposed next Git operations (not executed)

1. Push `codex/canonical-release-reconciliation-v1`.
2. Open a reviewed fast-forward PR from reconciliation branch to `production`.
3. After Production ref verification, open a separate reviewed fast-forward PR
   from the reconciled `production` ref to `main`.
