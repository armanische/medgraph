# CyberMedica Launch Changelog

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

See [Production Launch Baseline](../reports/production-launch-baseline-2026-07-29.md)
and [Production Launch Evidence Index](../reports/production-launch-evidence-index-2026-07-29.md).
See [Post-Launch Operational Baseline](../reports/post-launch-operational-baseline-2026-07-30.md).
See [Controlled Indexing Activation](../reports/controlled-indexing-activation-2026-07-30.md).
