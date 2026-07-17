# RFC-016 — Publication Builder Audit

Date: 2026-07-17

Branch: `feature/publication-first-products`

Scope: static dependency and responsibility audit; no runtime, data, pipeline,
or UI changes

> Post-audit status (RFC-017): `publication/index.ts` and the three
> `publication:*` npm commands were removed. Tests now import retained modules
> directly. Builder and `types.ts` remain protected by Group B; Publisher and
> Candidates remain protected by Group C. Summary and Validator remain because
> those protected modules still import them.

## 1. Executive Summary

None of the seven audited Publication modules is imported by a Next.js route,
React component, Storefront service, sitemap helper, Supabase adapter, or other
production application entry point. The primary public catalog, search,
comparison, manufacturer pages, and product pages use `lib/storefront`.

The audited modules remain active through three npm CLI commands and through
tests. They are also coupled to the internal Review Pipeline and Wave 2 data:

- `publication-builder.ts` calls Review snapshot and publication-readiness
  policy functions;
- four Review modules reuse input contracts from `publication/types.ts`;
- `publisher.ts` reads Wave 2 review/integrity reports and human decisions;
- `publication-candidates.ts` and `publisher.ts` import the Review-owned list of
  five first-publication products;
- `publisher.ts` writes and synchronizes `data/public` when the build CLI runs.

The module graph is acyclic at runtime. There is an architectural back-edge
from Review to `publication/types.ts`, but every such import is type-only and is
erased at runtime. This coupling still blocks deletion of `types.ts` because it
would break TypeScript compilation for Human Review.

The correct next step is contract decoupling, not deletion: move shared Review,
artifact, and integrity input shapes to a Review-owned or neutral contract
module. After that, retire the candidates CLI if operations no longer need it,
then reconcile `data/public` with Storefront before removing Builder/Publisher.

Existing staged changes under `data/public` and `data/review-decisions` were
treated as user-owned state and were not modified by this audit.

## 2. Dependency Graph

### Actual module graph

```text
package.json
├── publication:build ───────────────┐
├── publication:audit ───────────────┤
└── publication:candidates ──────────┤
                                      ▼
                                  index.ts
                                  ├── publisher.ts
                                  │   ├── publication-builder.ts
                                  │   │   ├── publication-summary.ts
                                  │   │   ├── review/publication-policy.ts
                                  │   │   ├── review/snapshot.ts
                                  │   │   └── publication/types.ts
                                  │   ├── publication-validator.ts
                                  │   │   └── publication/types.ts
                                  │   ├── review/fixtures.ts
                                  │   ├── review/loader.ts
                                  │   └── publication/types.ts
                                  └── publication-candidates.ts
                                      ├── publication-builder.ts
                                      ├── publication-summary.ts
                                      ├── review/loader.ts
                                      └── publication/types.ts

review/loader.ts ────────────────┐
review/snapshot.ts ──────────────┼── type-only ──► publication/types.ts
review/fixtures.ts ──────────────┤
review/publication-policy.ts ────┘

tests/publication.test.ts ─────────► index.ts
tests/human-review.test.ts ─────────► index.ts
```

The linear sequence proposed in the RFC does not match the implementation.
Summary, Candidates, Validator, and Publisher are siblings or branches around
Builder rather than a single chain:

```text
Summary ──► Builder ◄── Candidates
                ▲             ▲
                │             │
             Publisher     CLI/index
                │
             Validator
                │
             CLI/index
```

More precisely:

- Builder **depends on** Summary.
- Candidates **depends on** Builder and Summary.
- Publisher **depends on** Builder and Validator.
- Validator does not call Publisher or Builder.
- Index/CLI invokes Publisher or Candidates depending on the command.
- Builder calls Review; Review does not call Builder in application runtime.
- Review imports only Publication input types.

### Cycle analysis

No executable import cycle was found among the seven Publication modules.

The apparent cycle is:

```text
publication-builder.ts
  └── review/publication-policy.ts and review/snapshot.ts
        └── publication/types.ts (type-only)
```

Because Review imports `publication/types.ts` with `import type`, the edge does
not exist in emitted JavaScript. It is nevertheless an ownership cycle:
Publication owns contracts required to compile Review, while Publication also
depends on Review behavior. Contract ownership must be corrected before
Publication removal.

## 3. Production Usage

There are **zero active production imports** of:

- `publication/index.ts`;
- `publisher.ts`;
- `publication-builder.ts`;
- `publication-validator.ts`;
- `publication-summary.ts`;
- `publication-candidates.ts`;
- `publication/types.ts`.

The following production surfaces were checked and use Storefront instead:

- `/`, `/catalog`, and `/catalog/[slug]`;
- `/manufacturers` and `/manufacturers/[slug]`;
- `/compare` and `/search`;
- Storefront React components and search/compare adapters;
- sitemap and static-parameter generation.

`/products/fs510` remains an active legacy route, but it reads a Supabase public
projection through `lib/public-product-page.ts`. It does not import or execute
the audited file-based Publication Builder.

The internal `/internal/reviewer` route is not counted as public production
usage. Its indirect coupling is documented in the next section.

## 4. Internal Usage

### Component-by-component inventory

| Component | Direct importers | Application production | CLI | Review Pipeline | Tests | Responsibility |
| --- | --- | --- | --- | --- | --- | --- |
| `publication/index.ts` | package scripts; `publication.test.ts`; `human-review.test.ts` | No | Yes, sole CLI entry point | No direct Review consumer | Yes | Barrel exports and dispatches `build`, `audit`, and `candidates`. |
| `publisher.ts` | `index.ts`; re-exported to tests through index | No | Yes | Reads Review reports, decisions, fixtures, pilot list, and integrity output | Yes | Loads inputs, validates before writes, synchronizes `data/public`, audits output, reads summary. |
| `publication-builder.ts` | `publisher.ts`; `publication-candidates.ts`; `index.ts` barrel; tests through index | No | Yes, via Publisher/Candidates | Calls Review policy and snapshot | Yes | Applies fail-closed item/product eligibility and builds catalog plus approval manifest. |
| `publication-validator.ts` | `publisher.ts`; `index.ts` barrel; tests through index | No | Yes, build preflight and audit | No direct Review dependency | Yes | Validates public schema, links, slugs, duplicates, internal metadata leakage, output parity, and manifest. |
| `publication-summary.ts` | `publication-builder.ts`; `publication-candidates.ts`; `index.ts` barrel; tests through index | No | Yes, transitively | No direct Review dependency | Yes | Creates deterministic IDs/slugs and manufacturer/category/knowledge indexes. |
| `publication-candidates.ts` | `index.ts`; tests through index | No | Yes, candidates command | Imports Review-owned first-product list | Yes | Produces a read-only readiness report for the five pilot products. |
| `publication/types.ts` | all Publication modules; Review loader, snapshot, fixtures, policy; `index.ts` barrel | No | Yes, compile-time contracts | Yes, type-only | Yes | Owns both internal Review input contracts and public catalog/audit contracts. |

### Review coupling

`publication-builder.ts` uses two Review runtime functions:

- `createReviewItemSnapshot()` to reject stale approvals and verify artifact,
  source, evidence, and integrity state;
- `evaluateProductPublicationPolicy()` to require a publishable product-level
  set of approved fields and reject unresolved conflicts.

Review uses these Publication-owned types:

- `PublicationReviewProduct` and `PublicationReviewItem`;
- `PublicationArtifact`;
- `PublicationIntegrityViolation`.

The consumers are `review/loader.ts`, `review/snapshot.ts`,
`review/fixtures.ts`, and `review/publication-policy.ts`. These types describe
Review/Wave 2 input, not public output, so Publication is the wrong ownership
boundary.

### Wave 2 coupling

`publisher.loadPublicationInput()` reads:

- `data/research/review/products/*.json`;
- `data/review-decisions/decisions/*.json`;
- `data/research/integrity/artifact-inventory.generated.json`;
- `data/research/integrity/evidence-integrity.generated.json`.

It also imports `FIRST_PUBLICATION_PRODUCT_SLUGS` from `review/loader.ts`.
`publication-candidates.ts` uses the same list and reports readiness for those
five products only. These dependencies block deletion until Wave 2/Review no
longer expects this handoff or the handoff is replaced with a neutral contract.

## 5. CLI Usage

| npm command | Index mode | Call path | Reads | Writes |
| --- | --- | --- | --- | --- |
| `publication:build` | `build` (default) | `index` → `publishCatalog` → Builder → Validator | Review reports, decisions, artifact inventory, integrity report | `data/public/products`, `manufacturers`, `categories`, `knowledge`, summary, internal manifest |
| `publication:audit` | `audit` | `index` → `auditPublication` → Builder + `auditPublishedCatalog` | Same inputs plus all `data/public` output | None |
| `publication:candidates` | `candidates` | `index` → load input → Candidates → Builder | Review reports, decisions, artifacts, integrity | None; JSON is printed to stdout |

Important operational characteristics:

- Build validates the in-memory catalog before replacing generated files.
- Build uses atomic `.publication.part` writes and rename.
- Directory synchronization removes stale JSON files inside the four
  `data/public` index directories.
- Audit rebuilds the expected catalog and detects stale output and manifest.
- Candidates never creates approvals (`automaticApprovalsCreated = 0`).
- The Next.js application does not invoke any of these commands at runtime.

## 6. Candidate Modules

No audited module is classified as **Safe now** because all seven are still
reachable from declared CLI entry points, tests, Review types, or Wave 2 input.

### Group A — Safe after migration

| Module | Required migration before removal |
| --- | --- |
| `publication-summary.ts` | Remove Builder/Candidates callers or move any still-useful slug/ID helpers to Storefront. Storefront already has its own identifiers and slugs. |
| `publication-validator.ts` | Confirm Storefront schema/audit tests cover public-safe fields; then remove Publisher and Publication-specific tests. |
| `publication/index.ts` | Remove all three `publication:*` scripts and any remaining imports after Publisher/Candidates retirement. |

These modules have no Review or Wave 2 input dependency of their own, but they
are not safe today because the CLI still reaches them.

### Group B — Requires Review

| Module | Review blocker |
| --- | --- |
| `publication/types.ts` | Four Review modules import its Review/artifact/integrity contracts. Move those contracts to `review/contracts.ts` or a neutral importer contract first. |
| `publication-builder.ts` | Calls Review snapshot and publication policy at runtime. Decide whether Review retains a readiness evaluator after file-based publication is retired. |

The public catalog/output types remaining in `publication/types.ts` can be
deleted with Builder/Validator after Review input contracts have moved.

### Group C — Blocked by Wave 2

| Module | Wave 2 blocker |
| --- | --- |
| `publisher.ts` | Loads Wave 2 review and integrity reports, human decisions, Review fixtures, and the selected pilot list; produces `data/public`. |
| `publication-candidates.ts` | Hard-codes the Review-owned first-publication product list and rebuilds eligibility from Wave 2/Review inputs. |

`publication/index.ts` is transitively blocked by Group C while its CLI scripts
remain, even though its own primary classification is Group A.

## 7. Risks

1. **Human Review compilation failure.** Removing `publication/types.ts` before
   moving shared contracts breaks Review loader, snapshot, fixtures, and policy.
2. **Approval semantics regression.** Replacing Builder without retaining stale
   snapshot, explicit approval, rejection, evidence, artifact, source,
   integrity, and conflict checks could weaken fail-closed behavior.
3. **Unexpected output deletion.** `publishCatalog()` synchronizes directories
   and unlinks stale JSON files. It must not be run casually during migration
   or against Storefront directories.
4. **Catalog divergence.** `data/public` and `data/storefront` are separate
   stores. Removing Publisher before reconciliation can discard approved product
   content not yet represented in Storefront.
5. **Operational contract loss.** The package scripts are explicit entry points
   even without production imports. Removing files before scripts and operating
   procedures are updated leaves broken commands.
6. **Test coverage loss.** Publication tests enforce deterministic output,
   stale-approval rejection, internal metadata exclusion, schema validation,
   idempotency, and audit parity. Equivalent Storefront/Review assertions must
   survive pipeline retirement.
7. **Misidentified cycle.** Treating the type-only back-edge as a runtime cycle
   could lead to unnecessary Review rewrites; ignoring its ownership problem
   would make later deletion impossible.

## 8. Recommendation

Proceed with bounded follow-up RFCs in this order:

1. **Decouple contracts.** Create a Review-owned or neutral contract module for
   Review products/items, artifacts, and integrity violations. Update Review,
   Builder, Publisher, and tests without changing serialized data or behavior.
2. **Audit and retire Candidates.** Confirm `publication:candidates` has no
   operational consumer, then remove the command and
   `publication-candidates.ts`. Keep Human Review selection/readiness behavior
   if it is still required internally.
3. **Reconcile stores.** Compare every `data/public` product with
   `data/storefront`, including fields, documents, compatibility, and active
   status. Do not delete generated Publication output until parity is explicit.
4. **Retire Publisher/Builder.** Remove `publication:build` and
   `publication:audit`, Publisher, Builder, Summary, Validator, remaining public
   output types, and pipeline-only tests in one fail-closed change. Preserve
   relevant validation rules in Storefront and Review tests.
5. **Archive documentation.** Mark Publication architecture and research reports
   retired; retain Human Review operating history and the RFC audits.

Do not include `/products/fs510` or its Supabase projection in these steps. It
is a separate Wave 2/SEO migration and does not depend on the audited Builder.
