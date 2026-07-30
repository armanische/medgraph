# Generic Review Queue — 2026-07-31

## Status

**IMPLEMENTED (not deployed).** The generic routes are now present:

- `/internal/review`
- `/internal/review/[revisionId]`

They use the existing authenticated PKCE/SSR session and the service-only
`cloud_api.catalog_admin_product` / `cloud_api.catalog_admin_references`
readers. The revision manifest is data for the 33 controlled revision results,
not a Product-specific route. Unknown ids and any Product state drift return a
safe empty queue or 404. No direct `cloud` schema access, new RPC, migration or
automatic Human Review is present.

The Human Review action is available only after the reviewer explicitly submits
the detail form; this task did not submit any decision.
