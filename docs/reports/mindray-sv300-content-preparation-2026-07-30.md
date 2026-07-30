# Mindray SV300 Content Preparation — 2026-07-30

## Executive summary

**Result: PASS for controlled content preparation.** One authorized Production
Catalog Admin patch was applied to Mindray SV300. The patch changed only the
Product scalar content and the canonical Russian description through the
approved `cloud_api.catalog_admin_patch_product(uuid,jsonb,text)` contract.
No revision, Human Review, Approval, Publication, migration, projection,
Storefront, ENV, DNS or RFQ operation was performed.

The Product is now ready for a separate immutable revision-creation task. It
is still `draft`/unpublished and remains outside the public catalog.

## Scope and identity

| Field | Value |
| --- | --- |
| Branch | `codex/mindray-sv300-content-preparation-v1` |
| Base | `c576a96e36d7a4723011f3d567ba9728abc4cadc` |
| Production project | `clbzibuusyuajsylcbvl` |
| Product ID | `00e3f62b-797b-40ff-bf9f-9d1750828ca4` |
| Stable source UID | `401374530532` |
| Slug | `767632362-401374530532-apparat-ivl-mindray-sv300` |
| Source checksum | `e21b040448319d2611e1090dea0f0cc20416b3b0fc0c64b623fe8b7289f53fe4` |
| Manufacturer / category | Mindray / `Аппараты ИВЛ` |
| Application area | `Реанимация` |
| Source type | `immutable_source_snapshot_v1` |
| Pre-patch `updatedAt` | `2026-07-28T21:18:16.645683+00:00` |
| Post-patch `updatedAt` | `2026-07-30T12:12:24.372528+00:00` |

The patch was invoked once with the mandatory optimistic-concurrency token
`expectedUpdatedAt` equal to the pre-patch value. No retry was made after the
command output was truncated; the durable state was confirmed with independent
read-only queries.

## 1. Findings before preparation

Before the patch the selected Product had an empty `model`, no SEO metadata,
imported promotional/technical claims requiring editorial review, and the
workflow blockers `review_not_approved` and `publication_not_approved`. The
editorial warnings were `MISSING_REGISTRATION` and `MISSING_DOCUMENTS`.

The Product already had an exact manufacturer, category, application area,
three legacy characteristics and three media records. No unresolved import
blocking error was present.

## 2. Evidence sources and claim policy

Only official or regulatory sources were used:

| Source | Supported facts used | Confidence |
| --- | --- | --- |
| [Mindray Russia — SV300](https://www.mindray.com/ru/products/ventilators/sv300) | ventilator for pediatric/adult patients; ICU/recovery use; manufacturer-listed functions; bedside/transport use; interface and autoclavable flow components | High |
| [Mindray SV300 operator manual](https://www.mindray.com/content/dam/xpace/en_gb/resources/downloads/education/education-svseries/SV300-Operators-Manual.pdf) | manufacturer documentation boundary for product operation | High |
| [Mindray SV300 brochure](https://www.mindray.com/content/dam/xpace/en/resources/brochure/SV300_Ventilator_Product_Brochure.pdf) | manufacturer product terminology and configuration caveat | High |
| [Roszdravnadzor registration document](https://www.stomart.ru/upload/iblock/14e/mxd3r5nr01xbixco7ei0ui85e3gyhirr/ru-mindray-sv300-apparat-ivl.pdf) | `Аппарат искусственной вентиляции лёгких SV 300 с принадлежностями`; RU № РЗН 2019/8072 dated 31 January 2019; Shenzhen Mindray Bio-Medical Electronics Co., Ltd., China | High |

No unsupported battery, autonomy, dimensions, weight, compatibility or exact
configuration claims were added. The old imported promotional wording was not
carried into the prepared description.

## 3. Controlled content patch

The approved patch used only these allowed keys:

```json
{
  "expectedUpdatedAt": "2026-07-28T21:18:16.645683+00:00",
  "model": "SV300",
  "shortDescription": "Mindray SV300 — аппарат искусственной вентиляции лёгких для пациентов детского и взрослого возраста. Производитель указывает применение в отделениях интенсивной терапии и палатах пробуждения.",
  "description": "source-grounded Russian description with purpose, manufacturer-listed capabilities, interface/service, configuration caveat and regulatory identification",
  "seoTitle": "Mindray SV300 — аппарат ИВЛ | CyberMedica",
  "seoDescription": "Mindray SV300 — аппарат ИВЛ для детей и взрослых в интенсивной терапии и палатах пробуждения. CyberMedica поможет запросить КП."
}
```

The full description is source-grounded and records the regulatory
identification without asserting that every mode, module or accessory is
included in every delivery. `cloud.product_descriptions.locale = 'ru'` was
updated atomically with `cloud.products`; other locales were not touched.

The patch actor was the explicit operational actor string
`catalog-admin-mindray-sv300-content-preparation-v1`. This operation did not
create a review decision or publication audit record.

## 4. Post-patch content state

| Check | Result |
| --- | --- |
| Model | `SV300` |
| Canonical `ru` description | present; synchronized with Product |
| SEO title | present |
| SEO description | present |
| Product state | `draft`, `published = false` |
| Catalog quality | `READY` |
| Active identity blocker | none |
| Editorial warnings | `MISSING_REGISTRATION`, `MISSING_DOCUMENTS` |
| Old unsupported SV300 claims | removed from active Product and `ru` description |
| Characteristics | 3 existing legacy rows, unchanged |
| Media | 3 existing rows (1 primary PNG, 1 gallery PNG, 1 gallery JPG), unchanged |
| Application areas | 1 existing row (`Реанимация`), unchanged |
| Documents / registration links | 0 / 0; no direct update path used |

The registration document was verified as source evidence, but no registration
link was inserted because this task is limited to the approved scalar/description
patch contract. The warning therefore remains fail-closed and visible to the
future review workflow.

## 5. Revision preflight (read-only)

The read-only candidate builder
`cloud.product_publication_candidate_payload_v1(product_id)` was invoked; the
revision writer was **not** called.

| Check | Result |
| --- | --- |
| Candidate payload | complete for current contract |
| Characteristics | 3 |
| Media | 3 |
| Application areas | 1 |
| SEO | title and description present |
| Candidate checksum | `2f95e154efaecf4daf3a9a475572059e5440db58bd8c0a13b0de5eff13fc5d4c` |
| Deterministic reads | 10/10 identical checksum; 1 distinct value |
| Revision count for SV300 | 0 |
| Review decisions for SV300 | 0 |
| Approvals for SV300 | 0 |
| Publication batches for SV300 | 0 |

The candidate is therefore suitable for a later immutable revision creation,
subject to the normal Human Review and Approval workflow. No workflow state was
advanced by this preflight.

## 6. Production invariance

Read-only checks after the patch confirmed:

- migration ledger remains 26/26; latest `202607290003`;
- Products remain 79: Published 1, Unpublished 78;
- Hamilton-T1 remains the only published Product and its source checksum is
  unchanged (`92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb`);
- SV300 remains unpublished;
- total revision/decision/approval/batch counts remain 1/1/1/1 (Hamilton only);
- the other 78 Product rows retain the captured pre-patch fingerprint
  `69dd3ea98e13b3ff47a516cb1695c45d`;
- SV300 source checksum and immutable source snapshot fingerprint remain
  unchanged (`e21b040448319d2611e1090dea0f0cc20416b3b0fc0c64b623fe8b7289f53fe4`
  and `c3dd8601558b8c7114a380702a42a026`);
- no characteristics, media or application-area rows were created or updated
  during the patch timestamp window;
- no migrations, ENV, DNS, Storefront, Projection or RFQ operations were run.

The captured pre-patch fingerprints were retained for the selected Product,
canonical description, media, characteristics, application-area relation,
related rows and source snapshot. Post-patch row counts/identities and the
explicit immutable-source checks confirm the contract changed only the intended
active content fields.

## 7. Readiness decision

**Content preparation: PASS.**

**Ready for immutable revision creation: YES.** This is not an Approval or
Publication decision. The next task must create one immutable revision and stop
for the separately authorized Human Review checkpoint.

### Not executed by design

- immutable revision creation;
- Human Review;
- Approval;
- Publication;
- projection refresh;
- Storefront or Production deployment;
- migration, ENV or DNS changes;
- edits to any other Product.
