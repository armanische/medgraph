# Generic Review Queue — 2026-07-31

## Status

**NOT IMPLEMENTED.** There are no current `in_review` revisions to display.
Implementing and deploying a queue in this task would add runtime scope before
the content and media gates pass.

The next runtime task, after a non-empty A1 revision set exists, should provide
the generic routes `/internal/review` and `/internal/review/[revisionId]` using
the existing authenticated PKCE/SSR and `cloud_api` boundary. No hardcoded
Product route or direct `cloud` schema access is authorized.
