# CyberMedica Launch Changelog

## Corporate Auth/RBAC — 2026-08-01

- `cybermedicaooo@gmail.com` закреплена как единственная default identity для
  новых Auth, Review, Git и deployment operations.
- Corporate Auth UUID получил exact Production profile role `admin`.
- Runtime login/SSR callback теперь fail-closed требует corporate identity и
  live `admin`/`reviewer` profile через `auth.uid()` read contract.
- Legacy Product-specific review routes больше не могут создавать Decisions;
  исторические lifecycle records сохранены без перепривязки.

## CyberMedica Production Launch — 2026-07-29

- Launch scope: public Storefront with Hamilton-T1 as the only published Product.
- Deployed commit: `201845a3fe5caab23ab72d31ac70d5704c53e1e4`.
- Production deployment: `dpl_HVumG217appC2rJDbzoH4J5uJ43u`.
- Production database baseline: 26 migrations, latest `202607290003`, projection
  version 3; the live ledger and counts are preserved in the canonical launch
  baseline as prior controlled evidence.
- Hamilton-T1 revision, Human Review, approval, publication batch and checksum
  evidence are recorded in the launch baseline.
- Projection corrective work and Hamilton storefront projection completeness are
  part of the accepted launch chain.
- Production ENV binds the public source to `cloud_published`; service-role
  values remain server-only and are not documented.
- Canonical domain: `https://cyber-medica.ru`; `www` permanently redirects to
  the apex; TLS and mail records were retained through the DNS cutover.
- Public smoke: canonical HTTPS, Catalog, Hamilton Product Detail,
  characteristics, media and RFQ HTTP contract PASS.
- Post-launch operational baseline (2026-07-30): fresh backup and isolated
  restore PASS; one canonical-domain test RFQ reached the confirmation page
  and the configured webhook accepted it; read-only monitoring baseline PASS.
- Fresh backup: `production-postlaunch-clbzibuusyuajsylcbvl-20260729T212955Z`;
  artifact hashes and restore evidence are recorded in the post-launch
  operational report.
- The local publication-candidate QA runner now derives the terminal migration
  dynamically and recognizes `202607290003` without weakening its contract
  checks.
- Controlled indexing activation (2026-07-30): Production robots now allows
  public crawling while disallowing internal, Auth, API, admin, diagnostic and
  legacy knowledge surfaces. Sitemap is generated from the published
  projection only; Hamilton-T1 is the sole Product URL.
- RFQ confirmation polish (2026-07-30): `/thanks` now uses one compact,
  accessible confirmation state and one primary return-to-catalog action. The
  obsolete Knowledge Base action was removed from this page only; the RFQ API,
  Product binding and indexing contract remain unchanged.
- Canonical Thank You reconciliation (2026-07-30): the already-deployed
  `a697473e057a8ffe945c22fc364ca922bd1e13bb` was fast-forwarded into both
  `main` and `production`; no new deployment or database write was performed.
- Second-product curation (2026-07-30): all 78 unpublished Production
  Products were audited read-only. No Product was published; Mindray SV300 was
  selected for the next content-preparation pass.
- Mindray SV300 content preparation (2026-07-30): one authorized atomic
  Catalog Admin patch synchronized the Product and canonical Russian
  description, set the confirmed model, added source-grounded SEO, and removed
  unsupported active claims. The Product remains draft/unpublished; no
  revision, Review, Approval or Publication was executed. See [Mindray SV300
  Content Preparation](../reports/mindray-sv300-content-preparation-2026-07-30.md).
- Mindray SV300 publication (2026-07-30): one exact immutable revision passed
  Human Review, Approval and single-Product Publication. Production now has 2
  published Products and 77 unpublished Products; Hamilton-T1 and Mindray
  SV300 are the only public Products. See [Mindray SV300 Publication](../reports/mindray-sv300-publication-2026-07-30.md).
- Third-product selection (2026-07-30): all 77 unpublished Products were
  audited read-only. A five-Product shortlist was prepared, but every Product
  retains the structural `missing_model` blocker, so no third Product was
  selected and no lifecycle write was performed. See [Third Product
  Selection](../reports/third-product-selection-2026-07-30.md).
- Agilia SP MC content preparation (2026-07-30): Product Owner selected
  Fresenius Kabi Agilia SP MC as the third Product. One approved atomic Catalog
  Admin patch set the exact model, synchronized canonical Russian content and
  added source-grounded SEO. The Product remains draft/unpublished; no revision,
  Human Review, Approval or Publication was executed. See [Agilia SP MC Content
  Preparation](../reports/agilia-sp-mc-content-preparation-2026-07-30.md).
- Agilia SP MC publication (2026-07-30): exact immutable revision 1 passed one
  authenticated Human Review, Approval and single-Product Publication.
  Production now has 3 published Products and 76 unpublished Products; the
  public projection and sitemap contain only Hamilton-T1, Mindray SV300 and
  Agilia SP MC. See [Agilia SP MC Publication](../reports/agilia-sp-mc-publication-2026-07-30.md).
- Remaining catalog batch audit (2026-07-30): all 76 unpublished Products were
  inventoried read-only. No model was accepted without authoritative source
  evidence, so all remain Group C pending identity resolution; no patch,
  revision, review, approval or publication write was performed. See
  [Remaining Catalog Batch Preparation](../reports/remaining-catalog-batch-preparation-2026-07-30.md).
- Authoritative model resolution (2026-07-31): official manufacturer and
  documentation checks resolved 33 Products to High confidence, placed 7 in a
  short Product Owner decision queue and left 36 unresolved. No Product or
  lifecycle write was performed. See [Authoritative Model
  Resolution](../reports/remaining-catalog-authoritative-model-resolution-2026-07-31.md).
- Group A validation (2026-07-31): all 33 model-resolved candidates passed
  automated image URL checks, but exact visual model matching and claims review
  remain open. Final A1 is 0; no patch, revision, review, approval or
  publication write was performed. See [Group A Batch Content
  Preparation](../reports/group-a-batch-content-preparation-2026-07-31.md).
- Group A revised batch execution (2026-07-31): Product Owner policy accepted
  media without explicit contradiction, removed uncertain imported claims and
  treated missing registration as a warning. All 33 High-confidence Products
  received atomic Catalog Admin patches and immutable revision 1. No Human
  Review, Approval or Publication was performed. See [batch execution](../reports/group-a-minimal-batch-execution-2026-07-31.md)
  and [revision run](../reports/group-a-minimal-revision-run-2026-07-31.md).
- Generic Publication Review Queue (2026-07-31): added generic
  `/internal/review` and `/internal/review/[revisionId]` routes with existing
  authenticated access and cloud_api reads. The queue was deployed and used for
  the exact Group A Human Review decisions recorded by the lifecycle evidence.
- Resolved Group B six (2026-07-31): Product Owner accepted all seven closed
  decisions. Six exact Products received atomic canonical-content patches and
  immutable revision 1; all six await manual Human Review. Instilar 1438 was
  excluded as a likely duplicate of Instilar 1428 and remains lifecycle
  `0/0/0/0`. Published remains 36.
- Catalog Publication Wave 1 (2026-07-31): ten exact reviewed revisions were
  approved and published through a narrow server-only, service-role runner.
  Production now contains 13 Published and 66 Unpublished Products; projection
  version is 15 and sitemap contains exactly 13 Product URLs. The remaining 23
  reviewed revisions retain zero Approval and zero Publication Batch. See
  [Wave 1 closure](../reports/catalog-publication-wave-1-2026-07-30.md).
- Catalog Publication Wave 2 (2026-07-31): fifteen additional reviewed
  revisions were approved and published through a new immutable manifest and
  narrow server-only runner. Production now contains 28 Published and 51
  Unpublished Products; projection version and sitemap Product count are 30
  and 28. Replay returned already complete without duplicate writes. See
  [Wave 2 closure](../reports/catalog-publication-wave-2-2026-07-31.md).
- Catalog Publication Wave 3 (2026-07-31): the final eight reviewed Group A
  revisions were approved and published through a separate immutable manifest
  and narrow server-only runner. Production now contains 36 Published and 43
  Unpublished Products; projection version and sitemap Product count are both
  38 and 36 respectively. Replay returned already complete. See
  [Wave 3 closure](../reports/catalog-publication-wave-3-2026-07-31.md).
- Resolved Group B publication (2026-07-31): six Product Owner-resolved
  Products completed manual Human Review and were approved and published through
  the immutable `group-b-six-publication-v1` manifest and narrow server-only
  runner. Production now contains 42 Published and 37 Unpublished Products;
  projection version and sitemap Product count are 44 and 42. Replay returned
  already complete. Instilar 1438 remains draft with lifecycle `0/0/0/0`. See
  [publication closure](../reports/group-b-six-publication-2026-07-31.md).

See [Production Launch Baseline](../reports/production-launch-baseline-2026-07-29.md)
and [Production Launch Evidence Index](../reports/production-launch-evidence-index-2026-07-29.md).
See [Post-Launch Operational Baseline](../reports/post-launch-operational-baseline-2026-07-30.md).
See [Controlled Indexing Activation](../reports/controlled-indexing-activation-2026-07-30.md).
