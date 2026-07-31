# Catalog Publication Wave 1 — 2026-07-31 closure

## Status

**PASS.** Ten reviewed Products were approved and published through the
server-only Wave 1 runner. The operation used the existing service-role
lifecycle RPC boundaries, exact immutable manifest scope and per-Product
idempotency. It did not create Review Decisions or change Product content.

## Controlled operation

| Item | Evidence |
| --- | --- |
| Production project | `clbzibuusyuajsylcbvl` |
| Runner source SHA | `e878629733b33585ae9a333f2731e67609b467d4` |
| Preview deployment | `dpl_HpHDn3mXwV8uzrSvxguAK7tzPUfp` — READY, no writes |
| Production deployment | `dpl_FLKWjKVVZ3xxYx9vfdygLCQ4TwT9` — READY |
| Operation key | `catalog-publication-wave-1-v1` |
| Manifest | `lib/operations/catalog-wave-1-manifest.ts` |
| Manifest SHA-256 | `45694001e0652a23977de759a5b6ca86dbfe893fd8c38a1c151739be13c42405` |
| Expected reviewer | `0a5270ac-66f2-4711-9701-e0557fcff73a`, role `admin` |
| Service credential | Production scope present; server-only; value never serialized |
| Execution completion | `2026-07-31T14:18:11Z` (projection clock) |

The runner accepts only the operation key and manifest digest. Product,
revision, Review Item, Decision and checksum identities are resolved from the
tracked ten-entry manifest. Calls to approved lifecycle RPCs are sequential and
fail closed. The route cannot accept arbitrary Product IDs.

## Durable lifecycle evidence

| Product | Revision | Approval | Publication Batch |
| --- | --- | --- | --- |
| Hamilton-C1 | `45f10d39-7204-4cef-bee4-a6e644671a08` | `47190492-6f93-4012-bec2-6617dd84aff8` | `7b8973ae-7f80-4d16-8b83-5f4abf0f9833` |
| Hamilton-C3 | `cdce4e6c-3788-4e43-b73a-d61c870bdd71` | `191ac1b8-3a41-4221-a6e8-c6dd213173f7` | `8ff4eb6c-8adc-4ecb-9889-3b920632d80a` |
| Instilar 1428 | `0fcedfbd-bc41-41e2-b6c5-fadae6ef4918` | `f1dc9a4c-6b92-4aa9-9f2d-57374eed2211` | `88e2471e-2d3b-4e6c-a09c-ddae2fd5130f` |
| BeneHeart D3 | `c811034f-cb9d-44ac-8cf7-b2f6cb223c1e` | `88e6f2f9-e308-4764-bd60-1a5394fab13d` | `f16d51c4-1713-4482-a169-2d1a2bef9087` |
| Vacus 7308 | `d96aade7-9733-41ad-965f-b60ddcd9187e` | `026048e2-5efa-4869-817d-cc3a6287117e` | `875422ea-371d-4321-b915-dd8a8c3b88a5` |
| BeneVision N17/N15/N12 | `3a510da7-13b9-40ae-9791-2d7475577dd3` | `8e1f344a-1973-4c2d-86df-47ed0f34d51a` | `64302f24-d558-48bc-b7f3-6ed67068a748` |
| Bionet BM3 | `6c61405f-2765-484d-8dbb-27581e12397e` | `004a4a9e-db9f-4216-ba87-b4edae42cc33` | `1f7b2156-3b34-4342-8d32-99c0873e0fe9` |
| Storm 5800 | `f150f4bc-c8d7-4069-ab45-c73c15d091dc` | `0abbd93b-4935-460a-adf1-06a5552d6c11` | `56c5d9c8-074a-41ac-a47d-55c49fe56e51` |
| BeneVision N1 | `df13433f-7461-40fd-9c9c-e026254f9ec4` | `54925194-fcc0-40d9-a605-3790f02e3010` | `20ac794f-5ff2-4401-8ab9-b1e4de875f0d` |
| GE Versana Essential | `a84e9afe-0245-429a-ba4a-acc9926d49d0` | `9a13022d-3e11-429a-bd86-b07a84d41292` | `c53b80b6-37fe-453e-8a55-3d746f1d46eb` |

Each batch has action `publish`, publication version `1`, the exact candidate
revision and Approval, and idempotency key
`catalog-wave-1-publish-<product-id>`. Durable checks confirmed all ten
Decision bindings and checksum triads match the immutable manifest.

## Counts and projection

| State | Before | After |
| --- | ---: | ---: |
| Products | 79 | 79 |
| Published | 3 | 13 |
| Unpublished | 76 | 66 |
| Revisions | 36 | 36 |
| Review Decisions | 36 | 36 |
| Approvals | 3 | 13 |
| Publish batches | 3 | 13 |
| Reviewed, unpublished and unapproved | 23 | 23 |
| Sitemap Product URLs | 3 | 13 |

Projection state is initialized at version `15`, changed at
`2026-07-31T14:18:11.079164Z`, checksum
`dd868af4ebe3fc0bbaf786c18388c6bfaef2ac290552e4ee81f3b7900b052ceb`.
All ten projected Products have SEO and canonical Russian description, exactly
three characteristics, and between two and four media records.

## Published URLs and smoke

All URLs returned HTTP 200:

- `/catalog/767632362-691798585131-apparat-ivl-hamilton-s1`
- `/catalog/767632362-709309498991-apparat-ivl-hamilton-s3`
- `/catalog/767632362-385537759549-dvuhshpritsevoi-infuzionnii-nasos-instil`
- `/catalog/767632362-725867191732-defibrillyator-monitor-mnogofunktsionaln`
- `/catalog/767632362-791348718821-meditsinskii-otsasivatel-aspirator-vacus`
- `/catalog/767632362-317877821321-monitor-patsienta-benevision-n17n15n12`
- `/catalog/767632362-472096036091-monitor-patsienta-bionet-bm-3`
- `/catalog/767632362-211207666761-monitor-patsienta-storm-5800`
- `/catalog/767632362-159912360691-portativnii-monitor-patsienta-benevision`
- `/catalog/767632362-256598838332-uzi-apparat-ge-versana-essential`

`/catalog`, `/request` and `/sitemap.xml` returned HTTP 200; unsupported
`GET /api/request` returned 405. Sitemap contains exactly the prior three and
the Wave 1 ten Product URLs. No unpublished, internal, Auth or API URL appears.

## Replay and invariance

A second authenticated execution returned `already complete; no duplicate
writes were created`. Approvals, batches, projection version and checksum
remained `13 / 13 / 15 /
dd868af4ebe3fc0bbaf786c18388c6bfaef2ac290552e4ee81f3b7900b052ceb`.

Hamilton-T1, Mindray SV300 and Agilia SP MC retained their existing lifecycle
bindings. The other 23 reviewed revisions remain `in_review`, each with one
positive Decision, zero Approval and zero Publication. Group B (7), Group C
(36), Product content, `rawSnapshot`, `sourceChecksum`, migrations, ENV values,
DNS and `gitForkProtection=true` were not changed.
