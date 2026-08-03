# Published Product Characteristics Wave 1 Patch — 2026-08-03

## Result

**SUPERSEDED — EXECUTED 15/15.** The initial contract gap was closed by the
exact-scope Characteristics Wave 1 RPC. See
[`product-characteristics-wave-1-controlled-patch-2026-08-03.md`](./product-characteristics-wave-1-controlled-patch-2026-08-03.md).

## Proven contract mismatch

The currently deployed tracked function
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` delegates to
`cloud.catalog_admin_patch_product`. Its allowlist contains only:

- `title`;
- `model`;
- `shortDescription`;
- `description`;
- `seoTitle`;
- `seoDescription`;
- `manufacturerId`;
- `categoryId`;
- `applicationAreaId`;
- `expectedUpdatedAt`.

Any other field raises `immutable or unsupported field`. The structured Product
Detail contract writes characteristics only as part of revision creation. Using
it here would violate the explicit prohibition on new revisions. Direct SQL and
a surprise migration are likewise prohibited.

## Safety result

| Check | Result |
| --- | --- |
| Patch calls attempted | 15 |
| Successful Product patches | 15/15 |
| Stale retries | 0 |
| Deterministic authoring drafts | 15 |
| Revision / Decision / Approval / Batch writes | `0 / 0 / 0 / 0` |
| Current published projection changed | No |
| Product Detail smoke | 15/15 HTTP 200 |
| Published / sitemap | `71 / 71` |
| `rawSnapshot` / `sourceChecksum` mutation | None |
| Final eight draft Products | unchanged |

The consolidated preview is a reviewed preparation artifact, not a runnable
payload. It intentionally contains `mutationPayload: null` for all 15 Products
and records blocker `CATALOG_ADMIN_CHARACTERISTICS_PATCH_UNSUPPORTED`.

## Revision readiness

The 105 new rows are applied. All 15 candidates passed deterministic reads
10/10 and checksum-triad generation; revision RPC was not called.

Required next state:

1. authorize and implement a narrow stale-protected characteristics patch RPC;
2. run migration and Catalog Admin contract tests separately;
3. refresh exact `updatedAt` and immutable provenance evidence;
4. execute atomic patches at concurrency two;
5. compute deterministic candidate checksum triads 10/10;
6. stop again before revision creation for explicit authorization.

No runner deployment or application build was performed: this was a
documentation/content-preparation change with zero executable Production
mutation payloads.
