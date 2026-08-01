# Group C Remediation Batch 2 Controlled Patch — 2026-08-02

## Execution result

The preview contained exactly 13 mutation payloads and two explicit
exclusions. The 13 patches ran sequentially (maximum concurrency 1) through
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)`, each with its exact
fresh `expectedUpdatedAt`. The actor was `cybermedicaooo@gmail.com`.

All 13 durable states matched the preview. Three UI responses were initially
ambiguous, so they were not replayed; a fresh read-only query proved those
transactions had already committed. There were no stale or failed patches.

| Result | Count |
| --- | ---: |
| Selected | 15 |
| Patched successfully | 13 |
| Stale | 0 |
| Failed | 0 |
| Excluded before patch | 2 |

## Post-patch invariants

- exact content match: `13/13`;
- immutable `sourceChecksum` and raw snapshot hash: `13/13` unchanged;
- `updated_by = cybermedicaooo@gmail.com`: `13/13`;
- canonical `ru = 1` and synchronized Product/description: `13/13`;
- SEO present, characteristics `>= 3`, media `> 0`: `13/13`;
- structural publication blockers: `0` for all 13;
- state: `draft`, unpublished, lifecycle `0/0/0/0` for all 13;
- Production totals: Products `79`, Published `50`, Unpublished `29`,
  lifecycle `50/50/50/50`.
- published projection: version `52`, checksum
  `0f966677a30ae913e2f1a0b428749891a114c5a26d1bc228cbef20aa34e48b33`,
  unchanged; therefore the public sitemap scope remains 50 Products.

## Revision-readiness evidence

The production dependency predicate passed for all 13. Ten independent reads
per Product produced one candidate checksum, one immutable payload fingerprint
and one Product identity checksum per Product.

| Source UID | Model | Candidate payload checksum | Immutable payload fingerprint | Product identity checksum | Chars / media |
| --- | --- | --- | --- | --- | ---: |
| `122386402842` | АПДН-01 | `394e6bf37e9cefab278b9b221782eafc6b0d96351edebb636c00d7dacd2116a1` | `4aa7931d41d099ee71a1a0197d3acfbdeeba8403590796199b995fbe609e7959` | `a3a9feee0671c8f928630482000f98fb2c7a7ab9782a5a8fc418aef8e7332f52` | 3 / 2 |
| `198869594712` | ЭК12Т-01-«Р-Д»/260 | `f3276d0bc39a25ad3ff3c09006570cee88c7b684abaa5d7b4f36510df89d3424` | `1ccdf6b91f6862791518b3712b8d91ffde4c5d90d57c9092e1844ab512109e4a` | `0d6660c4b9e1f8e9dd93541fd458ffe17ae1607906c8e66419d5e746ad7baeab` | 3 / 2 |
| `259394139301` | CM1200A | `7dac01ed1823275a809cdd46f6d79b7c460e8fd803c5901773806678f250a06c` | `8d9d5c0a164182a71b82081b3ce0f4887f378b52781d6b4f13101523cfeaf266` | `8615ae5728a5bf6d5f35894f75c708bd6a7aff96cabe6834fe869af4bbe9122d` | 3 / 1 |
| `279448521542` | КРТ | `ee4c538cea878cb8eb9517787c0dfc214c90e1063fe458eba80bbb58a1ce3a93` | `489b08dfcba263a10e51973b74c80067c8e6468264e08393caef16ee0bb06121` | `2b57776870521026fa1540913469eee653874ea84926f839d992a6a9f3121df7` | 3 / 1 |
| `344327759482` | Corometrics 259cx | `1185100ec79a9711cf5718ab53e6096d1e31ae68397e68bcd45e3b428ef1cede` | `e22f6a1e03688309678e2206e4738dcc65175ec9a8368389dd4cb39216ec9b5b` | `43f57827ef8ad372d3605243d7685e96d5bb6e9bcf16de63928e74a4997d7b5c` | 3 / 1 |
| `403689762041` | AXEON | `2b7ded19c92043770488ccb5fc40a01c5491c27d3dfc74774c33f10d9e56660e` | `28220dea61896627313485cee4b8e41d432b6a3d07b6f8ca9144b9965ab0e0f6` | `06bffbfce594a8541dc219f8c151b8e34bdba025ba5a46c22b2a99006d5c04fe` | 3 / 1 |
| `420215548801` | FB-15V | `39188dedd2f9a1cf306ff63e6a306e3cb09157425213f465ac40d21074e0bfc7` | `9733357bd589be3453d84571a98733785647fb9594ffea6e94ae86a455ff3249` | `c3a8aadc6e55d78cfee2c7bff025c202b1b666f8ca554f934b6a0692dce47393` | 3 / 2 |
| `485427737755` | ДФР-02 | `e2e0a054cd24e43a08efab40b0d3b8c9880318b29af7a0ba1ae8e273a85da8c1` | `f5e5722a94ae46c9109084efd28a95547e080a1e4d767362a2ae9b472ef679a4` | `005ae0c25c0801fe4fee9d9c44622815a99077660ada120d94ba84eaef648bb4` | 3 / 1 |
| `513492182572` | FG-29V | `bceda403cc2aeff294011e29c886417d1aea33bbc47afba5d574dc2efc6a9374` | `640cb3c4a773cd72602a1db882f39a7b2bcc633c2f5866d801cf5a17fdd3d895` | `22c723151243f7c1e9480d1bcd56db7f964d011c1997f08035838e3f52731dc8` | 3 / 3 |
| `571191341342` | OEC 9900 Elite | `d4c53fadec791809e6f17830c4892e7224cd3612f90539863ddac1d4c3f6f0dd` | `efb20267122f9765f77a3e6690ab52119c64a9d428efefc4621191723f29c532` | `240753065b27839975db51d7f4fd59e794757017e77555de55c49a9e1948eeab` | 3 / 1 |
| `694791065122` | УНИКОС-01 | `51832c9d91ed42dc358c92a66039f70e04949373f78400f8baa4ba8d9deae3a9` | `d452f1b7bbb820d2b69f8ef7ccedf8a00e54501ce6069f0199f9e5a3cc516231` | `7ab015ae89ef0f82181357e73c1e0b39f22f6dd4887ff6087c2745e447a98cce` | 3 / 1 |
| `860641516881` | ИДН-02 | `02e80f525d8030b221f1120b3c480a65f0aee2165f769e4b6f47e67518bc9527` | `46046095bcd2f2ad023bb0a3c23e3e25be6180c1ed959c2f62959a2eb1e0b3b7` | `9a0260543b48530801f3dc830ab9aebcb49fd35ca0510ee46dff2d37e1d5ad0b` | 3 / 1 |
| `939922758055` | FB-18RBS | `c309b5e9e29fdf6f9321376faf4c1b8a30fdeecc3423e96bbd9aa56288667ad4` | `e55dd3d2fcbbb051f0e6c74d219210fadd3f579e9bf1c3366374d90518ff7ddf` | `af319ea4b03dc059943999686b1052ab7e5344d32de65351265667a834e68a1e` | 3 / 2 |

Warnings for every row are `MISSING_REGISTRATION` and `MISSING_DOCUMENTS`;
they are not structural blockers under the approved publication contract.
Revision RPCs were not called.

## Exclusions and next operation

`Гемос-ПФ` (`576228046022`) and `Гемос` (`757604699272`) retain model `null`,
their original `updatedAt`, draft status and zero lifecycle records. The next
safe lifecycle operation is immutable revision creation for the 13 ready
Products only, after a new exact operation manifest is approved.
