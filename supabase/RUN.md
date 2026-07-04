# Migration 001

1. Apply `migrations/202607020001_fs510_vertical_slice.sql`.
2. Run `tests/001_fs510_smoke.sql` on a disposable Supabase database.
3. Run `fixtures/202607020001_fs510_mvp.sql` to publish the MVP card.
4. Configure the Portal Data API to expose `public_api` only.
5. Add the project URL and anon key to `.env.local`.

The smoke test rolls back its fixtures and verifies:

- Document → Evidence → Claim → Verification → Publication;
- immutable Evidence;
- active Product Page visibility for `anon`;
- immediate disappearance after Publication suspension.

Do not expose `core`, `catalog`, `source`, `governance`, `knowledge`, `publication`, `projection`, `private` or `factory_api` to the Portal.

Migration 001 intentionally excludes full Workflow, procurement, search, AI, pgvector and Knowledge Graph projections.

The public page is available at `/products/fs510`. It reads only
`public_api.product_pages`; it does not query Factory schemas.
