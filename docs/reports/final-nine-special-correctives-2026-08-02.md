# Final Nine Special Correctives — 2026-08-02

## Outcome

The exact nine remaining unpublished Products were re-audited against fresh
Production state and authoritative evidence. One safe Catalog Admin corrective
was executed for `ИДН-03`. No media or characteristic row was changed because
Production has no approved narrow boundary for those mutations. No Product was
published and no lifecycle record was created.

Corporate execution identity was `cybermedicaooo@gmail.com`, Auth UUID
`7e90a993-8b30-4e0d-aff4-a257d5a4a179`, role `admin`. Git author/committer is
`cybermedica <cybermedicaooo@gmail.com>`, the Vercel account is corporate, the
active guarded Production session passed, and Git Fork Protection was enabled.

## Exact Production inventory

All rows had one canonical `ru` description, three characteristics, a source
checksum, draft status and lifecycle `0/0/0/0`. SEO was absent before this
operation for every row.

| Product | Product ID | Source UID | Manufacturer | Model after task | Chars / media | Source checksum | Raw snapshot SHA-256 | State |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| AOHUA VME-5B | `d7506879-32fc-48ae-9ea6-8561f2c5868a` | `275089738610` | AOHUA | `null` | 3 / 3 | `f46baeb10eb5573c9f1fcc81e848b87fa5567e38f6674f5557cf47c000f9adc2` | `3faeaac86eb29898b5331365de5b49acdf1b9aa31f790335e46271aef16d6f85` | draft, blocked |
| ИДН-03 | `24ac72fc-5c64-4f4e-9f92-cd4eca58e426` | `363181290312` | УОМЗ | `ИДН-03` | 3 / 1 | `0e42fe5b05c1960d36e3a5eef9175f730b687228060f667360b641e77c23985e` | `7c5f6212e32720b029a91b220c6efd97ab1f1ca597c7946c9af6eb82bb2c3a7d` | draft, revision-ready |
| Combined УНИКОС-02/03 | `7efe1eb2-6551-4f0b-9310-c898cbcfdf7a` | `412668785772` | УНИКОС | `null` | 3 / 1 | `1ebc93d457006728cded185bb232b0cceaef2c5bdf7c9e8835bf97e1147c63cb` | `e92dca7b808237b8dba1ff8e77b3d92632fe4a535b99f932e13344935e965f93` | draft, owner decision |
| PENTAX EPK-i7010 | `860306a1-e01e-4f10-b980-93490e446d37` | `529970599662` | PENTAX Medical | `null` | 3 / 2 | `229364a6ea9ba3f13af8ac6395de3d30fbe252682b43759780af7296094915dd` | `82ef1edd48b49f9f5121531533022f34173d2bbe6653e8ad64a0c096a1f9185b` | draft, blocked |
| DIXION Instilar 1438 | `e7a54ec6-986d-422a-aca8-862d4d00a421` | `532456144899` | DIXION | `null` | 3 / 2 | `de6449738e1af8ce192df069b38edff249b4d7a8702ba3b36ab016f83e1f802d` | `8e4dbe7b094e33e59ffcadcc59c2951c42ff2d2bf96b1108d7e63db8d8354f41` | draft, keep unpublished |
| Гемос-ПФ | `46340003-dffa-4321-b5c1-cb3f4a5cf317` | `576228046022` | Биотех-М | `null` | 3 / 1 | `4d51546a5463a7bffb9748f59c40816466f5bc5e728d1491c1154b1f19b6785d` | `fe4ed0f6d1d3c0fa572c594fc0a5311af5bbf542ab2ccd12d4f401cdd61c2ef9` | draft, blocked |
| HUGER FB-53A | `db6da513-24dc-45e3-8e18-c6033825adce` | `632825146024` | HUGER | `null` | 3 / 2 | `b5881aefc00e9a2151ed082c1f46eac4adb49d2af68f10b8deba049e6a24ae3f` | `1df227bf195455d0f45e83baecf75fb47bde2dec435fd0caf62967686d839c61` | draft, blocked |
| PRIMEDIC Defi-B | `5c41e1d8-6311-4a63-bb99-41b8ae17d8a1` | `754023648801` | Mindray (incorrect) | `null` | 3 / 2 | `7d3ad93f9d342a36f4b3e7e63a3a5284f3d1e8d1586cea2faca1749ec9a13ced` | `8d08279eba338705a75080acb1f7611c0a4c300425e7632741d3bfd9e1fdf9ed` | draft, blocked |
| Гемос | `f3053ed8-d29a-41ff-b9e1-a873dd6b77f1` | `757604699272` | Биотех-М | `null` | 3 / 1 | `d6fa67e6d87d7f19263616d26021d6ff94efbd530b4338614055da2a5fbf52a1` | `44df084d77fa57a8ee47c386aca856c2248f3983f3fd5caed86f0b0c9d8dd5eb` | draft, blocked |

## Evidence and taxonomy

| Product | Category | Authoritative evidence | Exact finding | Disposition |
| --- | --- | --- | --- | --- |
| ИДН-03 | A — safe metadata/content | [Rostec product card](https://rostec.ru/directions/healthcare/products-projects/inkubator-intensivnoy-terapii-dlya-novorozhdennykh-idn-03/) and [official release](https://rostec.ru/en/media/pressrelease/rostec-expands-medical-technology-cooperation-with-turkey/) | Exact model, UOMZ manufacturer and intended use confirmed; existing media has no visible contradiction | Corrected |
| VME-5B | B — media | Existing Production media audit | Gallery assets `004.jpg` and `vme-5b_4.jpg` visibly carry `SupFire`; only the AOHUA primary asset remains usable | Blocked pending approved media removal |
| EPK-i7010 | B — media | [PENTAX OPTIVISTA](https://spotlight.pentaxmedical.com/pentax-medical-optivista-downloads) | Exact EPK-i7010 identity is supported; primary media visibly says `EPK-i7000` | Blocked pending approved media removal |
| HUGER FB-53A | B — media | Existing Production media audit | Gallery asset `84333084.png` is a different rigid instrument; exact primary manufacturer evidence remains insufficient | Blocked |
| PRIMEDIC Defi-B | C — manufacturer | [PRIMEDIC history](https://hk.primedic.com/en/pages/about) and [PRIMEDIC/METRAX Defi-B instructions](https://www.gimaitaly.com/DocumentiGIMA/Manuali/EN/M33380EN.pdf) | Defi-B/M110 and METRAX are supported; Production has only Mindray and no published PRIMEDIC/METRAX reference | Blocked pending reference corrective |
| Гемос-ПФ | C — characteristic identity | [Biotech-M product family](https://www.gemos.ru/products/) | Current base type is `Аппарат для гемосорбции`; it belongs to neighbouring Гемос | Blocked pending approved characteristic corrective |
| Гемос | C — characteristic identity | [Biotech-M product family](https://www.gemos.ru/products/) | Current base type is `Аппарат для плазмафереза`; it belongs to neighbouring Гемос-ПФ | Blocked pending approved characteristic corrective |
| Combined УНИКОС-02/03 | D — Product Owner decision | [Official Roszdravnadzor record](https://elk.roszdravnadzor.gov.ru/widget/med-product/193050) | Both executions exist, but the combined source/media does not identify which one this row represents | Owner decision required |
| Instilar 1438 | E — keep unpublished | [DIXION product page](https://dixion.ru/goods/sostavnoy-shpritsevoy-nasos-Dixion-Instilar-1438.html) and Roszdravnadzor 2016 notice | Separate model evidence exists, but the official notice reports a registration/name/configuration mismatch for the identified device | Keep unpublished pending regulatory resolution |

Taxonomy counts are A `1`, B `3`, C `3`, D `1`, E `1`, F `0`.

## Executed controlled corrective

Only Product `24ac72fc-5c64-4f4e-9f92-cd4eca58e426` was patched through
`cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` with the exact stale
guard `2026-07-28T21:18:16.645683+00:00` and actor
`cybermedicaooo@gmail.com`.

- title: imported marketing title → `Инкубатор интенсивной терапии для новорожденных ИДН-03 УОМЗ`;
- model: `null` → `ИДН-03`;
- canonical Russian descriptions: replaced with neutral manufacturer-grounded copy;
- SEO: absent → present;
- new `updatedAt`: `2026-08-02T15:14:50.439756+00:00`;
- canonical `ru`: one row, synchronized with Product;
- structural blockers: zero;
- warnings retained: `MISSING_REGISTRATION`, `MISSING_DOCUMENTS`;
- source checksum and raw snapshot hash: unchanged;
- lifecycle: `0/0/0/0`.

The immutable preview is
`/tmp/final-nine-special-correctives-preview-2026-08-02.json`, SHA-256
`92ffb9fb76f517bc4b9532380044bead7887ed4ca099b2447ec0cfd02e56e395`,
permissions `0600`.

## Production invariance

After the patch, Production remains Products `79`, Published `70`, Unpublished
`9`, lifecycle `70/70/70/70`, projection version `72`. The public sitemap has
exactly 70 Product URLs and contains none of the nine source UIDs. No revision,
Decision, Approval, Publication Batch, migration, ENV or DNS change occurred.

## Validation

- Catalog Admin, candidate, runner, structured-field and regression test corpus:
  `557/558` passed in the restricted sandbox; the sole blocked assertion needed
  a temporary loopback listener and its complete file passed `9/9` with that
  permission. There was no assertion failure.
- IDN-03 dependency predicate: PASS; candidate reads: deterministic `10/10`.
- Preview schema, exact one-Product scope and SHA-256: PASS.
- Changed-document local links: PASS.
- `git diff --check`: PASS.
- credential/privacy scan: PASS.
- unpublished canonical URL leak scan: PASS.
- Application build: not required because runtime code did not change.

## Subsequent lifecycle checkpoint

The separately authorized corporate operation created immutable revision
`5801cde4-9341-4fe9-9e35-da47627754f9` and Review Item
`a0654fd4-d65f-450d-b8ed-2270408fdcbe` for ИДН-03. It stopped before Human
Review; Decisions/Approvals/Publication Batches remain `0/0/0` for this Product.
See the [revision evidence](./idn-03-revision-creation-2026-08-02.md).
