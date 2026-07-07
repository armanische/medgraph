# Generated Data Policy

Status: Approved for MVP-007

## Purpose

Generated files are pipeline outputs. They support local demos, tests, and review, but they are not verified medical truth.

## Rules

- Generated draft catalog data may contain only draft products, Evidence Candidates, and Candidate Claims.
- Generated data must not contain Verified Claims, Verification decisions, Publication decisions, or Supabase Projection payloads unless produced by the approved publication pipeline.
- Tests must write generated outputs to temporary directories.
- Real generated files under `data/` may be updated only by explicit pipeline commands.
- Duplicate generated files such as `* 2.json` are not valid artifacts and must be removed before commit.
- Aggregate metrics must have one canonical representation. Do not store legacy aliases for the same metric.

## Allowed generated files

- `data/catalog-seed.generated.json`
- `data/catalog-import-report.generated.json`
- `data/catalog-products.generated.json`
- `data/catalog-research-report.generated.json`
- `data/research/products/*.research.json`

## Commit expectations

Generated files may be committed only when they are intentional outputs of the current MVP and pass validation. They must not be silently mutated by tests.
