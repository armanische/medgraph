# Legacy Hamilton Review Redirect Fix — 2026-07-31

## Scope

This corrective changes only internal review routing. It does not change Product
content, database schema, migrations, ENV, DNS, publication state, or the Wave 1
manifest.

## Result

- Default PKCE/login destination: `/internal/review`.
- Callback without an explicit approved destination: `/internal/review`.
- Generic review surface is protected by the internal auth proxy.
- `/internal/review/hamilton-t1` requires the trusted reviewer session and then
  redirects to `/internal/review`.
- The legacy Hamilton action is read-only and cannot create a new decision.
- Generic queue continues to fail closed on current `in_review`, unpublished
  products with no existing decision.

## Validation

- Tests: 506/506 PASS.
- Lint: PASS.
- TypeScript: PASS.
- Turbopack build: PASS.
- Webpack build: PASS.
- `git diff --check`: PASS.

No Review Decision, Approval, Publication, migration, or Product write was
performed by this corrective.
