# Product Characteristics Wave 1 controlled patch — 2026-08-03

## Result

Exact 15/15 deterministic authoring drafts were applied through the approved
Production server boundary. Built-in replay returned an equivalent durable
result with `Applied now = 15`, `Already applied = 0` on the first run and no
duplicate draft/audit records.

- Operation version/key: `product-characteristics-wave-1-patch-v1`.
- Immutable operation manifest digest:
  `8d045b48864c2ca1d4de0c4403edb7eb6e508345cc84afa2594cd42a69db24c1`.
- Tracked manifest file SHA-256:
  `e1695d841800a9e185e562651a5cb21ddd0c2d17580ff6d723ca126a2a11e423`.
- Preparation preview SHA-256:
  `1a46847aaa4859ede519070af5b890190f9d6ba4eaed77de04e14f57248d9978`.
- Scope: 15 unique Product IDs / 15 unique source UIDs.
- Characteristics: `45 → 150`; new authoritative rows: `105`.
- Draft audit rows: 15.
- Stale/failure: `0/0`.
- Concurrency: maximum 2.

Each draft has canonical locale `ru`, exact base `updatedAt`, ten unique ordered
characteristics and evidence references. Product rows and canonical published
revision payloads remain immutable until a separate revision operation.

## Invariance

| Check | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published / Unpublished | 71 / 8 | 71 / 8 |
| Revisions / Decisions / Approvals / Batches | 71 / 71 / 71 / 71 | 71 / 71 / 71 / 71 |
| Projection version | 73 | 73 |
| Projection checksum | `23f7f2b7…5898` | `23f7f2b7…5898` |
| Sitemap Product URLs | 71 | 71 |

Exact 15 Product-row hash remained
`fa0f359b0d97ee4e80abfab5d7c57f0588369e2b1f586e7563ee084d123d113c`;
non-target hash remained
`f8733478392bcd8fc2bebf43a5491b8061a4605442414cbe6b7424502a0453b5`.

Canonical synthetic returned `status=pass`, `productUrls=71`,
`fallbackActive=false`. Homepage, Catalog, Request and sitemap returned 200;
GET `/api/request` returned 405; exact 15 Product Detail URLs returned 15/15
HTTP 200.

## Hamilton-T1

The evidence-grounded short/full descriptions and SEO cleanup are stored in
the exact Hamilton authoring draft together with ten characteristics. The
current public revision and URL remain unchanged until reviewed republish.
