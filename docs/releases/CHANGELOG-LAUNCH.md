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

See [Production Launch Baseline](../reports/production-launch-baseline-2026-07-29.md)
and [Production Launch Evidence Index](../reports/production-launch-evidence-index-2026-07-29.md).
See [Post-Launch Operational Baseline](../reports/post-launch-operational-baseline-2026-07-30.md).
See [Controlled Indexing Activation](../reports/controlled-indexing-activation-2026-07-30.md).
