# Group C Remediation Batch 3 Controlled Patch — 2026-08-02

## Execution

Seven patches ran sequentially through
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` with exact fresh
`expectedUpdatedAt` guards and corporate actor `cybermedicaooo@gmail.com`.

| Result | Count |
| --- | ---: |
| Frozen Batch 3 scope | 10 |
| Patched | 7 |
| Excluded before patch | 3 |
| Stale | 0 |
| Failed | 0 |

All seven rows remain draft and unpublished. Canonical `ru = 1`, Product and
description fields are synchronized, SEO is present, characteristics are 3,
media are present, `catalogQualityStatus = READY`, and lifecycle is `0/0/0/0`.
`sourceChecksum` and imported raw snapshot provenance were not mutation fields.

## Revision readiness

The dependency predicate passed for all seven rows. Ten independent reads per
Product produced one value for each checksum in the triad.

| Source UID | Candidate payload checksum | Immutable payload fingerprint | Product identity checksum | Reads | Chars / media |
| --- | --- | --- | --- | ---: | ---: |
| `300255468231` | `6d219c0fdd59cfb6300122a17029faab11dfe056b43639c5119fbceb41005b0d` | `8344fab1e98ea29321ca4eb965de6dae0b950ef2cd2abd48552f0eec8ee40741` | `73279cba77585f5a481b4c18456650ad35663e0ae21da33b1c91bf6aacf846d9` | 10/10 | 3 / 2 |
| `323650602021` | `ffeafe4bb2750e4f50ae1ccc69d86867b2bbc6b30fc62affeb8c13212fc0f7ce` | `e3ce44405b70e57e9a6afdd38cb732873eff789fc01842d2dd6134c243126ed2` | `a7a0a6b96b49b3f1f6efd7491b2f9c59379cd0e8ba040516f822728cf53e6378` | 10/10 | 3 / 2 |
| `358648454622` | `496890a87588762b3f94471b2c2b55e85de6b16a0ac56843cd721c95f2854c58` | `982b88801af229659e44f277d4d6f59ce55a35ee51d2f3a44d57068cb94090ee` | `5469a5ef5d85613384b4921640b752f67b56f3e759982c9367761d670556b76b` | 10/10 | 3 / 1 |
| `480491530831` | `12c721c48dc28631fe8549542d720923f5fbc4d311fb7e94422af16c791b2b69` | `18b2bb5899b0f74772489663c05a11c00fee79728c8475a26f824cab40536f8a` | `129fa8089e77c05edb204965cd95c7cf1e20612fd60fbf0d06af4f51c5e1f728` | 10/10 | 3 / 1 |
| `670271281172` | `84603ccb6dc429fd9116256bb2de7756225e4531402eb4ad1538b8ee0e4f9b83` | `ea0d50a3e693f0c82ee584ba081ba2211fc425b98439dabaab39b974a31421d9` | `e38f4197901f572def405eb5b44a80341fc37991751cf9ad70a31254c89219e0` | 10/10 | 3 / 2 |
| `868434933208` | `404e7526685ddd7f3c3f6252ccf72e38c59f5a9c71f3672a5fa22393b73966f4` | `9fc182ba39cf9e36c0b1aa4d614e8812b3237fe07e41941323c8e3ad198e6e2b` | `a594d0bad33876b3a1cbf95d4ade987d2b71b474cdbd6a46abaa685f0264d4c2` | 10/10 | 3 / 1 |
| `928472985221` | `e685d5bb6f689b53997bea434eb264510c0086805b47d8d46932afebcd3fb094` | `3459e79bbc2663b6f45f6979d6895ba189788c321b0aa3c8498065cd291c02c1` | `202aaf32c2990af1770b60a66a2b8534704bebe20ff54e635d041747b08d7ef1` | 10/10 | 3 / 1 |

Production remains `79/63/16`; lifecycle remains `63/63/63/63`; projection
version/checksum remain `65` / `e37f2096713807ff966b25998ff383d788c5dc686de66a6ef0da434a4487298f`;
the sitemap contains 63 Product URLs and no unpublished Batch 3 source UID.
Revision RPCs were not called.

## Revision handoff

The subsequent closed operation created seven immutable revisions and matching
Review Items without changing the patched Product content. Durable identifiers
are recorded in the [revision creation report](./group-c-remediation-batch-3-revision-creation-2026-08-02.md).
