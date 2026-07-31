# Resolved Group B Six — Publication Closure — 2026-07-31

## Outcome

The Product Owner manually approved all six immutable revisions through the
generic Review Queue. The exact six were then approved and published through a
new immutable manifest and narrow Production-only server runner. Codex did not
create Human Review Decisions.

Production moved from 36 to 42 Published Products. The remaining 37 Products
are unpublished. DIXION Instilar 1438 remained outside every patch, revision,
review, approval and publication scope.

## Deployment and immutable operation

| Field | Value |
| --- | --- |
| Runtime commit | `f65a55b45e433290df116715165acbd045d1abf3` |
| Production deployment | `dpl_8BMNWHLjztmCw5pb7BfQX5xXN575` — READY / PROMOTED |
| Manifest version | `group-b-six-publication-v1` |
| Operation key | `group-b-six-publication-v1` |
| Manifest SHA-256 | `15c69beef95257ac62778860f14360b360ae5bf49a984740e35297f3961c6879` |
| Product count | 6 |
| `gitForkProtection` | `true` |

The runtime accepts no caller-supplied Product identity. The authenticated
admin invokes one server action; the runner resolves the exact tracked scope
server-side and uses only the approved lifecycle RPC adapters.

## Lifecycle evidence

| Product | Decision | Approval | Publication Batch | Product URL |
| --- | --- | --- | --- | --- |
| Olympus CV-170 | `baba1928-0bc7-4b88-9374-170e91f35450` | `7c590175-4430-4335-a0c6-4fb1a2d763c9` | `63608aea-a601-483e-9ee3-739dd60a98ff` | `/catalog/767632362-740658724462-videoendoskopicheskaya-sistema-olympus-c` |
| Olympus EVIS EXERA III CV-190 | `22f5e7f2-648f-4395-8972-3ce032d68cac` | `45aae489-32aa-4feb-bc1b-cfdd33f5ce35` | `ef18e2cb-9cf0-430d-9776-727d49607762` | `/catalog/767632362-304432044232-videoendoskopicheskaya-sistema-olympus-c` |
| Bionet BM5 | `5c95b785-9b02-49ec-9d0e-42e3a0fb038b` | `b5b1e70e-c4d7-42d3-9a7d-b1f7dcbd574d` | `5dceb071-b0ad-4c3b-bbb3-81315b833cfd` | `/catalog/767632362-761217382341-monitor-patsienta-bionet-bm-5` |
| Mindray BeneFusion SP5 | `c6ba4cca-1838-446a-a0ed-afa74f2b686e` | `e0e171e0-67e1-4b05-922b-44c1d69d0948` | `4acb582a-3cbb-4506-8fa4-187c77dd4498` | `/catalog/767632362-724985486041-odnoshpritsevoi-infuzionnii-nasos-benefu` |
| Comen STAR5000 | `7eba6054-7660-4574-a3f6-4b9249c007be` | `33b4cb18-bf2a-426f-8a91-c593113b4f26` | `4fa424eb-0974-42e1-9a10-d8e2ad02c949` | `/catalog/767632362-777813572261-fetalnii-monitor-comen-star5000` |
| Comen STAR5000C | `94ec02d5-b026-4069-8678-beecd0f0faea` | `f5a1a607-d0c5-400e-a889-964dd4a8bb74` | `f13b3c8f-1182-4412-a456-731cba9acb9a` | `/catalog/767632362-116854129531-fetalnii-monitor-comen-star5000c` |

Every revision was current and non-stale, had exactly one positive Decision by
reviewer `0a5270ac-66f2-4711-9701-e0557fcff73a` with role `admin`, and retained
matching candidate, immutable payload and Product identity checksums. Before
Approval, all six had Approval/Batch counts `0/0`.

## Projection and public verification

| Check | Result |
| --- | --- |
| Products / Published / Unpublished | `79 / 42 / 37` |
| Revisions / Decisions / Approvals / Batches | `42 / 42 / 42 / 42` |
| Projection version | `44` |
| Projection checksum | `2638564c7a2c86f6fce24bc7ca3d8389c2b9080745b2539f8bcf83a2285b32b3` |
| Sitemap Product URLs | `42`, all unique |
| New Product Detail routes | `6/6` HTTP 200 |
| Homepage / Catalog / RFQ | `200 / 200 / 200` |
| `GET /api/request` | `405` |

All six projections contain canonical Russian content, SEO, exactly three
approved characteristics and one to three media assets. Visible Product Detail
content contains no unsupported `OPTERA`, `CV-190 PLUS`, veterinary BM5,
TCI/DTCI/TIVA, or neighboring-model claims. STAR5000 and STAR5000C retain
separate canonical identities and URLs.

The sitemap contains all six new URLs, no duplicates, and no internal, Auth or
API URL. The other 37 unpublished Products remain absent.

## Replay and invariance

Replay of `group-b-six-publication-v1` returned `already complete`. Approval,
Publication Batch and Published counts stayed `42`; projection version and
checksum stayed `44` and
`2638564c7a2c86f6fce24bc7ca3d8389c2b9080745b2539f8bcf83a2285b32b3`.

The hash of the previous 36 Published Product rows remained
`8e5ede5385c1829611a6e98d97bc459c17383a39a49040a78ebbe069d77c5bc0`.
Instilar 1438 remains draft with lifecycle `0/0/0/0` and identity checksum
`5317f84902affaf7bbcbb8428b47a7267772346d4a4548dc51d37eea48de3351`.
Migrations, ENV and DNS were not changed.

## Next recommendation

Proceed with a read-only Group C remediation program. Prioritize exact-model
identity, duplicate detection and explicit media contradictions. Do not weaken
the publication boundary or infer models from titles.
