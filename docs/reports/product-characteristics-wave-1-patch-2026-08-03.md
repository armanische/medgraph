# Published Product Characteristics Wave 1 Patch — 2026-08-03

## Result

**NOT EXECUTED.** The operation stopped before Product writes because the
approved Catalog Admin RPC has no characteristics mutation contract.

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
| Patch calls attempted | 0 |
| Successful Product patches | 0/15 |
| Stale retries | 0 |
| Product writes | 0 |
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

The 105 rows are content-ready but zero Products are Production-candidate-ready:
the canonical Product records still contain the original three characteristics.
Candidate checksum triads and deterministic reads cannot be truthfully computed
until a compliant Product patch exists. Revision RPC was not called.

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
