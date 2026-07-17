# Catalog Research Pipeline — Retired

**Former scope:** MVP-007 V1
**Status:** retired by RFC-013 on 2026-07-17

The V1 Catalog Research Runtime and its per-product `.research.json` reports are
no longer available. Its npm commands, orchestrator, manifest, claim builder,
knowledge engine, tests, and generated aggregate were removed after RFC-012
confirmed that no production route imported them.

This retirement does not remove or replace the active operational boundaries:

- Discovery;
- Trusted Documents and Extraction;
- Review and append-only reviewer decisions;
- Evidence Integrity;
- Artifact Storage;
- Publication;
- Wave 2;
- Storefront Data Layer.

Use the explicit commands documented in
`scripts/importers/catalog/README.md`. Do not reintroduce the V1
`research:catalog-products` or `research:product` commands.
