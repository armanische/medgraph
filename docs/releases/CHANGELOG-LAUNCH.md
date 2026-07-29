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
- Non-blocking warnings: RFQ POST was not re-submitted in this documentation
  closure; the next backup must include `202607290003`; deployed launch commit
  still requires reconciliation into the canonical release branch.
- Recovery baseline: prior backup/isolated restore evidence is linked from the
  launch baseline; the backup predates `202607290003`.

See [Production Launch Baseline](../reports/production-launch-baseline-2026-07-29.md)
and [Production Launch Evidence Index](../reports/production-launch-evidence-index-2026-07-29.md).
