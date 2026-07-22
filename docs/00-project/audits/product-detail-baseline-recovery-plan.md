# Product Detail Baseline Recovery Plan

**Дата:** 2026-07-23

**Audit branch:** `codex/product-detail-baseline-recovery-plan`

**Current baseline:** `origin/main` at `68ca9417c21e80f390c2ea231c339ec962c26d4a`

**Approved Product Detail baseline:** `a460698b5d4f7c1bc45e894b095149ca276ac473`

**Approved baseline tree:** `454bf8c46c4e5a8646986de28e6d18d5b8a3514e`

**Режим:** documentation-only audit; runtime и данные не изменялись

## Executive Summary

Product Detail regression возникла не из-за точечного удаления кнопок, revert
или merge conflict. Product Detail MVP (`2410d45`) был создан непосредственно
от PR4 (`8fae7b0`) и поэтому никогда не содержал три уже принятых commit:

```text
8fae7b0  Release 0.2 PR4
   ├── add3064  Launch Sprint 1.1
   │      └── 340ce6a  Launch Sprint 1.2
   │             └── a460698  final content acceptance
   └── 2410d45  Product Detail MVP
          └── 2d5ed59  Cloud Foundation integration
                 └── 68ca941  current origin/main
```

Настоящий утверждённый UI baseline — commit `a460698`, tree `454bf8c...`.
Он уже использовал текущие Storefront `Product`, `ProductService` и
`CatalogRepository`: SHA-256 этих трёх файлов полностью совпадают с текущим
`origin/main`. Следовательно, Cloud architecture не требует rollback или
замены; восстановление сосредоточено в presentation composition, client
interactions и acceptance contracts.

Точечное восстановление отдельных кнопок преждевременно по трём причинам:

1. Пропущенные commits меняли связанный контракт Hero, Summary, metadata,
   Advantages, Gallery, navigation, section surfaces и tests.
2. Product Detail MVP позже добавил semantic breadcrumbs, key specifications,
   отдельную regulatory information, корректный downloads split и разрешение
   related products. Слепой cherry-pick удалит или ухудшит эти возможности.
3. Финальный content review самого `a460698` признал механический генератор
   Summary/Advantages/Specifications слабым. UI contract нужно восстановить,
   но проблемную derivation logic — перепроектировать fail-closed, а не
   копировать буквально.

Целевой результат — не tree checkout и не визуальный rollback, а новый
составной baseline:

```text
Approved Product Detail UI contract
        +
Current Product Detail MVP semantic sections
        +
ProductService → CatalogRepository → Cloud Preview adapter
        +
Focused client islands for real interaction only
```

### Governance note

В актуальном `origin/main` `PROJECT_GUIDE.md` обозначен как version 1.0.
Version 2.0 найден в recovery branch at `d183e3c`; committed version 2.1 среди
доступных refs не найдена. Этот план применяет более строгую совокупность
ограничений текущей задачи, version 2.0 policies и ADR-001—ADR-004. Drift
Project Constitution в рамках данной задачи не исправляется.

## Baseline History

### 1. Release 0.2 PR4 — starting point

- Commit: `8fae7b01bb9de2f53a8c09d86e5c4e35eda7a706`
- Tree: `3f3fb3cbc50c1c5c10bfc628a90678fd49dba6c6`
- Scope: media-first 40/60 Hero, compact metadata, conditional sections,
  Product presentation/fail-closed rules.
- Status: ancestor текущего `main`; позднее осознанно развит Product Detail MVP.

### 2. Launch Sprint 1.1 — Product Detail Visual Completion

- Commit: `add30644888b32d24c64ab1ac57a192f9a7ed589`
- Parent: `8fae7b0`
- Tree: `00e27bc383f88b85278f33741df8306f8d18a2c1`
- Scope: 16 files, +1022/-262.
- Added: Product Detail read-only experience model, dedicated Gallery,
  Lightbox, navigation controls, Manufacturer/Documents/Specifications
  presentation components, Summary/Advantages composition, section cards,
  content standard, release report and contract tests.
- Acceptance: clean READY Preview `dpl_7M4F4snkLtHivmXFy8hoGjS7ZLXw`.

### 3. Launch Sprint 1.2 — Visual Polish

- Commit: `340ce6aa18d68aadbcb4c214eb52c713dad0ea8a`
- Parent: `add3064`
- Tree: `676f2064b71bf544fb8c626da87f2453c1e09731`
- Scope: 8 files, +153/-99.
- Added/changed: aligned Catalog card regions, metadata A/B presentation,
  always-visible full description, removal of duplicate application-area
  section, compact Advantage cards, icon-only magnifier and a new 400–700
  character generated Summary.
- Acceptance: corrected clean READY Preview
  `dpl_GuoSku6fGSdvEpbFfmUF8iw6mFM1`.

An earlier artifact `783f45d`/tree `b82cdb3` is superseded by `340ce6a` and is
not a recovery source.

### 4. Final content acceptance and Hero simplification

- Commit: `a460698b5d4f7c1bc45e894b095149ca276ac473`
- Parent: `340ce6a`
- Tree: `454bf8c46c4e5a8646986de28e6d18d5b8a3514e`
- Scope: default metadata Variant B (values only), labeled review mode via
  `?metadata=labels`, removal of the duplicate model pill and content review of
  ten Cloud products.
- Acceptance: clean READY Preview
  `dpl_478LyCq39mAU4B8K9UX4Vq7zBW3p`, `gitDirty=0`.

This is the final approved Product Detail UI baseline. The commit also records
known content-generator limitations; acceptance of the UI does not make those
limitations desirable recovery targets.

### 5. Product Detail MVP — modern branch

- Commit: `2410d457c2ec8479c3cd5eff63276c943e0af69b`
- Parent and merge base: `8fae7b0`
- Tree: `04e11a696f4158c4166944cb32f6a91776185d23`
- Added: semantic breadcrumbs, four key specifications in Hero, separate
  regulatory information, download filtering and stronger related-product
  resolution.
- It changed only Product Detail page and its contract test.
- It did not delete `add3064`—`a460698`; those objects were absent from its
  ancestry before work began.

### Source durability risk

The commits `add3064`, `340ce6a` and `a460698` are available in the clean
separate clone `/private/tmp/cybermedica-lc012`, but are not objects in the
primary repository backing current worktrees and are not on the inspected
GitHub branches. Before runtime recovery, their chain must be preserved as a
verified Git bundle or protected recovery ref with recorded SHA-256. This is a
precondition, not permission to merge or push the old branch into `main`.

## Architecture Compatibility

The following files are byte-identical between `a460698` and current
`origin/main`:

| Contract | SHA-256 | Conclusion |
|---|---|---|
| `lib/storefront/types.ts` | `62da1a91ad9e966e1658e876ef8fee568601908464008bda5fbedeab898b7189` | Approved UI already targets the current Storefront Domain Model |
| `lib/storefront/product-service.ts` | `370fe5a4b3d8a0d94f50037cbedb804f0172cf171fa7851646bedb804f017` | No service change is required |
| `lib/storefront/catalog-repository.ts` | `adfdaa13145abc43a0f28b75513b60c158bcae90bbac6512f524cb44d87ba78c` | No repository change is required |

The recovery boundary must therefore remain:

```text
Product route
  → ProductService
  → CatalogRepository
  → Storefront Domain Model
  → recovered presentation adapter/components
```

No direct Cloud/Supabase imports, repository changes, new domain fields or data
writes are justified.

## Overlap Classification

For changes introduced by the missed commits:

- **A — Fully absent:** no equivalent behavior exists in current `main`.
- **B — Partially present:** data or basic rendering exists, but accepted UX is incomplete.
- **C — Present in changed form:** current implementation covers the concern with a different contract.
- **D — Fully replaced:** a newer Product Detail MVP implementation should remain authoritative.

Features retained unchanged from PR4 are marked **Preserved** and are not
recovery candidates.

## Functional Matrix

| Feature | Approved Baseline | Current Main | Recovery Strategy | Notes |
|---|---|---|---|---|
| Hero layout | 40/60 media-first card | Same responsive 40/60 layout | IGNORE | Preserved from PR4; no reason to touch grid proportions |
| Hero status | Neutral incomplete-state badge | Same fail-closed status | IGNORE | Preserved; RFQ/Compare gating remains current authority |
| Hero description | Dedicated generated Summary | `shortDescription`, four-line CSS clamp | REIMPLEMENT | B: restore Summary role without copying flawed generator |
| Hero metadata | Value-only badges; labels remain screen-reader/review mode | Visible labels in a two-column definition list plus model | REIMPLEMENT | C: default values-only, accessible names, conditional non-duplicate model |
| Summary | 400–700 character generated overview | No independent Summary model | REIMPLEMENT | A: preserve acronyms/case, omit unknowns and do not promise absent sections |
| Full description | Separate, always-visible card | Visible below Hero, but plain section surface | REIMPLEMENT | C: retain current sanitization; restore approved hierarchy/surface, not `<details>` |
| Advantages | Compact 2/3-column cards, up to six | Simple bullets only when `keyFeatures` exists | REIMPLEMENT | B: fail closed; do not mechanically promote first six HTML list items |
| Image gallery | Selectable thumbnails, image/video support | Main media plus thumbnails opening external tabs | REIMPLEMENT | B: current data contract stays; interaction returns as a focused client island |
| Magnifier | Circular icon button with accessible zoom label | Absent | RESTORE | A: presentation-only and directly compatible with current media model |
| Lightbox | In-page dialog, close/backdrop/arrows/Esc/swipe | Absent | REIMPLEMENT | A: restore behavior and add focus trap, focus return, body-scroll lock |
| Back to Catalog | Explicit link above Hero | Breadcrumb link only | RESTORE | A: keep semantic breadcrumbs and add the accepted explicit action |
| Back to Top | Fixed control after 560px scroll | Absent | RESTORE | A: small client interaction; maintain keyboard/focus support |
| Application Areas | Primary area in Hero metadata; no duplicate lower block | All areas shown below description; absent from Hero | REIMPLEMENT | C: show all public values once in compact Hero metadata, without duplication |
| Category | Value-only Hero badge | Labeled Hero row and semantic breadcrumb | REIMPLEMENT | C: keep breadcrumb; restore values-only Hero presentation |
| Manufacturer | Hero badge plus dedicated manufacturer card | Hero link only | RESTORE | B: existing repository lookup already supplies the Manufacturer model |
| Model / SKU | Removed from Hero when it duplicates H1 | Always shown when presentation model exists | REIMPLEMENT | C: suppress duplicates; retain a unique model only when it adds information |
| Key specifications | Not part of final approved UI tree | Four structured specifications in current Hero | SUPERSEDED | D: current Product Detail MVP improvement must remain |
| Full specifications | Component plus fallback derivation from HTML list items | Structured `ProductSpecification` only, grouped in page | SUPERSEDED | D: keep structured source; never restore HTML-to-specification promotion |
| Registration information | Registration link in Hero/documents | Dedicated regulatory section plus Hero link | SUPERSEDED | D: current public-safe regulatory split is stronger |
| Downloads | One generic document component | Registration, accessories and downloads separated | SUPERSEDED | D: preserve current filtering; approved card styling may inform presentation only |
| Breadcrumbs | No semantic breadcrumb trail; explicit Back link | Home → Catalog → Category → Product | SUPERSEDED | D: keep current breadcrumbs and add Back as a complementary action |
| Section navigation | Conditional local anchors | Conditional local anchors | IGNORE | Preserved; update targets only as recovered sections change |
| Related/compatible products | Conditional current-domain rendering | Stronger service-resolved implementation | SUPERSEDED | D: current ProductService flow remains authoritative |
| Section card surfaces | Rounded cards with compact spacing | Border-separated long-form sections | REIMPLEMENT | C: restore approved commercial hierarchy around current semantic sections |
| Sticky behaviour | No sticky Hero/section navigation; only fixed Back-to-Top | None | IGNORE | Not an approved requirement; do not invent sticky UI |
| Mobile behaviour | Thumbnail overflow, swipe lightbox, no horizontal overflow | Responsive Hero but no swipe/lightbox | REIMPLEMENT | B: preserve current grid and add accepted interactions at 390px |
| Accessibility | Labeled controls/dialog and keyboard arrows/Esc | Semantic server page and breadcrumbs; no dialog controls | REIMPLEMENT | B: combine both and close baseline gaps in dialog focus management |
| Contract tests | Sprint 1.1/1.2 presentation contracts | PR4/MVP tests; some assert the superseded labeled/model UI | REIMPLEMENT | A/B: port intent, update tests that currently protect the regression |
| Metadata/JSON-LD/canonical | Unchanged by approved Sprint | Current Storefront infrastructure | IGNORE | Must remain byte-for-behavior compatible; no SEO scope |
| Catalog card alignment | Equal title/metadata/specification zones | PR2 layout without Sprint 1.2 alignment | IGNORE | Confirmed lost work, but outside Product Detail baseline recovery; separate Catalog task |

## Commit Analysis

### `add3064` — complete product detail experience

| Change | Current status | Strategy | Decision |
|---|---|---|---|
| `ProductGallery` client component | A | REIMPLEMENT | Same `ProductMedia` contract; restore behavior with complete dialog accessibility |
| `ProductPageNavigation` | A | RESTORE | Small, isolated and does not know Cloud or data source |
| `ProductManufacturer` | B | RESTORE | Uses current `Manufacturer`; keep neutral fail-closed placeholder |
| `ProductDocuments` | D | SUPERSEDED | Current regulatory/accessory/download split is more precise |
| `ProductSpecifications` visual grouping | C | REIMPLEMENT | May reuse visual grouping, but only over current structured specifications |
| HTML-derived specifications | D | SUPERSEDED | Final content review rejected this promotion as semantically unsafe |
| `ProductDetailExperience` read-only view | A/B | REIMPLEMENT | Keep adapter concept; rewrite content derivation according to final review |
| Summary from first four sentences | A | SUPERSEDED | Replaced in Sprint 1.2, and final generator also needs correction |
| Source-list Advantages fallback | B | REIMPLEMENT | Use conservative standalone-claim rules and hide when uncertain |
| Rounded section cards | C | REIMPLEMENT | Apply to current semantic sections, not to the old page wholesale |
| Content standard/release report | A | REIMPLEMENT | Preserve historical evidence, but update status and known limitations |
| Sprint 1.1 tests | A | REIMPLEMENT | Port behavioral intent to current page/components; add browser interaction tests |
| Catalog classification label | B | IGNORE | Out of Product Detail scope; track in separate Catalog recovery |

What must not return from this commit: collapsible full description after it was
superseded by Sprint 1.2, promotion of arbitrary HTML list items to technical
specifications, old document grouping and any old page copy that removes newer
MVP sections.

### `340ce6a` — polish storefront product experience

| Change | Current status | Strategy | Decision |
|---|---|---|---|
| Icon-only magnifier | A | RESTORE | Approved final UI and compatible with current gallery data |
| Full description always visible | C | RESTORE | Behavior already exists; restore approved visual hierarchy only |
| Application area removed from lower duplicate block | C | REIMPLEMENT | Move complete public values into Hero metadata, render once |
| Compact Advantage cards/icon geometry | B | RESTORE | Restore presentation; feed only validated advantage strings |
| 400–700 character generated Summary | A | REIMPLEMENT | Keep Summary objective, replace known-bad template |
| Metadata A/B rendering | A/C | REIMPLEMENT | Use final `a460698` default, not this commit's labels-default state |
| Model pill | C | SUPERSEDED | Removed by final content acceptance |
| Catalog card equal-height regions | A | IGNORE | Separate Catalog recovery task |
| Sprint 1.2 tests | A | REIMPLEMENT | Retain accepted intent and remove source-string-only fragility where possible |

What must not return: default visible labels from the intermediate state,
colored model pill, lowercase conversion of technologies/acronyms, generic
fallback category in Summary, claims about sections that do not exist and
fixed mechanical allocation of HTML list items.

### `a460698` — finalize launch sprint 1.2

| Change | Current status | Strategy | Decision |
|---|---|---|---|
| Metadata Variant B as default | A/C | RESTORE | Accepted presentation; labels remain available to assistive technology |
| `?metadata=labels` review mode | A | RESTORE | Useful deterministic acceptance mode; no data impact |
| Removal of duplicate model pill | C | REIMPLEMENT | Preserve unique model values only when not already represented by H1 |
| Ten-product content review | A | RESTORE | Becomes an input to corrected derivation tests, not Product Data writes |
| Generator improvement recommendations | A | REIMPLEMENT | Apply in presentation logic before declaring baseline complete |
| Hero simplification tests | A | REIMPLEMENT | Must coexist with current breadcrumbs, key specs and regulatory UI |

The commit is the baseline source of truth, but its review explicitly documents
remaining defects. Recovery means honoring both the accepted UI and the review
findings, not copying the known defects back into `main`.

## Recovery Strategy Summary

### RESTORE

- explicit Back to Catalog and Back to Top controls;
- circular magnifier affordance;
- value-only metadata as the default, with accessible labels/review mode;
- dedicated manufacturer presentation;
- visible full description and compact Advantage card visual language;
- historical acceptance intent in updated tests.

### REIMPLEMENT

- Product Detail read-only presentation adapter over current Storefront types;
- Summary derivation with case preservation, no invented fallback facts and no
  references to absent sections;
- conservative/fail-closed Advantages derivation;
- Hero metadata de-duplication and complete Application Areas presentation;
- Gallery/Lightbox with focus trap, focus restoration and scroll locking;
- section-card composition around current MVP sections;
- mobile and accessibility contract/browser tests.

### IGNORE

- Catalog card alignment inside this Product Detail task;
- unapproved sticky Hero or sticky section navigation;
- cosmetic changes outside Product Detail;
- old deployment/manual-preview mechanics.

### SUPERSEDED

- old ProductDocuments semantics;
- HTML-list-to-specifications promotion;
- intermediate labels-default metadata;
- colored model pill;
- collapsible description;
- old breadcrumbs replacement;
- old registration/download grouping;
- any code path bypassing ProductService/CatalogRepository.

## Recovery Plan

### Mandatory precondition — preserve baseline evidence

Before Phase 1, create and verify an immutable Git bundle containing
`8fae7b0..a460698` from the clean release clone. Record bundle SHA-256 and prove
that `a460698^{tree}` equals `454bf8c...`. Do not merge or push the historical
branch into `main`. This prevents `/private/tmp` cleanup from destroying the
only complete commit objects.

### Phase 1 — Reconstruct the server presentation baseline

Goal: establish one current-architecture presentation contract before adding
client interactions.

1. Add a read-only Product Detail presentation adapter using only current
   `Product`, `Manufacturer` and `Category` types.
2. Recompose Hero with safe Summary, value-only accessible metadata,
   non-duplicated model/application values and current key specifications.
3. Restore the dedicated manufacturer section, approved section-card hierarchy
   and compact Advantages fed by fail-closed derivation.
4. Keep current breadcrumbs, regulatory section, downloads split,
   compatibility/related resolution, RFQ gating, metadata and JSON-LD.
5. Add contract tests for exact visibility/de-duplication/fail-closed behavior.
6. Do not add Gallery client runtime, Back or Top in this phase.

Phase 1 is a presentation reconstruction over the existing service boundary;
it must not modify Storefront API, repository, Cloud mapper, Product Data or
schema.

### Phase 2 — Restore interaction and accessibility baseline

Goal: restore the accepted interactive shell as small client islands.

1. Add selectable Gallery thumbnails and icon-only magnifier.
2. Add in-page Lightbox with Esc, arrows, close button, backdrop click and
   mobile swipe.
3. Add dialog focus trap, focus return, body-scroll lock and accessible status.
4. Add Back to Catalog and scroll-aware Back to Top.
5. Verify 390px/768px/1440px layouts, no overflow, one H1 and zero console
   errors.
6. Add component/browser tests; do not rely only on source-regex tests.

### Phase 3 — Do not transfer / separate work

The following are explicitly excluded from Product Detail recovery:

- Catalog card equal-height changes: separate Catalog Experience recovery;
- mass Summary/Advantages rewriting or Cloud Product edits: separate Content
  Quality task with evidence and review;
- ProductService, CatalogRepository, Cloud Domain Model or mapper changes;
- new sticky navigation, Product Family or unrelated functionality;
- Publication, Review, imports, migrations or Supabase writes;
- Production deployment.

After Phases 1 and 2, release evidence/documentation is committed separately
from runtime in accordance with the stricter atomic-commit policy.

## Final Target

The recovered Product Detail baseline must have this composition:

```text
Semantic breadcrumbs + explicit Back to Catalog
  ↓
40/60 Hero
  ├── accessible Gallery / Lightbox
  └── H1
      + neutral incomplete state when applicable
      + concise evidence-safe Summary
      + value-only accessible metadata
      + Application Areas shown once
      + current structured key specifications
      + registration link
      + current RFQ/Compare gating
      + local section navigation
  ↓
Full description card
  ↓
Validated compact Advantages (or hidden)
  ↓
Current structured full specifications
  ↓
Current regulatory information
  ↓
Current accessories/downloads split
  ↓
Dedicated Manufacturer card
  ↓
Current compatible and related products
  ↓
Scroll-aware Back to Top
```

Technical properties of the target:

- public data comes only through ProductService and CatalogRepository;
- no extra Cloud query or N+1 access is introduced;
- no Product Data is inferred, mutated or written;
- optional sections fail closed;
- only Gallery and page navigation hydrate;
- metadata, canonical and JSON-LD remain current;
- mobile has no horizontal overflow;
- Lightbox is keyboard and touch operable;
- accepted behavior is protected by semantic/component/browser contracts;
- recovery commits and Preview are traceable to one immutable Git tree.

## Exact Next Recovery Task

### Product Detail Baseline Recovery — Phase 1: Presentation Contract

**Goal:** reconstruct the approved server-rendered Product Detail presentation
contract on current `origin/main`, while retaining every semantic addition from
Product Detail MVP.

**Preflight:**

1. Preserve `8fae7b0..a460698` as a verified Git bundle and record SHA-256.
2. Create a fresh feature worktree from the then-current `origin/main`.
3. Confirm Product/Service/Repository hashes and no user changes.

**Runtime scope:**

- add a read-only Product Detail presentation adapter;
- restore safe Summary and value-only accessible metadata;
- suppress duplicate model and Application Area presentation;
- restore compact, fail-closed Advantages;
- restore dedicated Manufacturer and section-card composition;
- preserve current breadcrumbs, key specifications, regulatory information,
  download filtering, related products, SEO and JSON-LD;
- add focused contract tests.

**Explicitly deferred:** Gallery/Lightbox, magnifier, Back/Top controls and
Catalog card alignment. They belong to Phase 2 or the separate Catalog task.

**Forbidden:** Product Data changes, Cloud/Supabase writes, schema/migrations,
repository/service/domain changes, cherry-pick of whole historical commits,
merge to `main` or Production deployment.

**Validation:** full tests, lint, TypeScript, webpack build, diff checks and
Cloud Preview read-only smoke. Runtime and release-documentation commits remain
separate.

This next task is specified here but was not executed during the audit.

## Safety Confirmation

- Runtime files changed: **0**.
- Product Detail implementation changed: **no**.
- `origin/main` changed: **no**.
- Cloud Catalog/Supabase writes: **0**.
- Migrations/import/publication: **not run**.
- Preview/Production deployments: **not run**.
