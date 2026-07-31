# Group B Product Owner Decision Sheet — 2026-07-31

## Purpose and guardrails

This sheet converts the seven remaining Group B identity/media ambiguities into
seven closed Product Owner decisions. It is based on stable Production identity,
the current canonical `ru` row, imported media, and primary manufacturer
evidence. Product names were not used as the sole identity key.

This was a read-only analysis. No Product content, revision, Review Decision,
Approval, Publication Batch, migration, ENV, DNS, or deployment state was
changed.

## Verified scope

The exact scope is seven unpublished Products. Every Product has one canonical
`ru` row, three characteristics, a source UID and source checksum. All seven
have `missing_model`, `missing_registration`, and `missing_documents`; none has
a critical import error. None has a revision, Approval, or Publication Batch.

1. Olympus CV-170 OPTERA — Product `95af806c-3fbf-446e-a608-263aa290d548`,
   source UID `740658724462`, source checksum
   `ecd480abe02fa713f43984553a65f4b3244db05b5c680c9241a89cd1c1448286`.
2. Olympus CV-190 PLUS EVIS EXERA III — Product
   `4e1a370b-4e53-4ee6-b590-823d1ad0e087`, source UID `304432044232`, source
   checksum `bb2cbbdc8e43fd472e59086f2d53f4c65b86d5943796f8bd972af4a373144eb1`.
3. Bionet BM 5 — Product `3d31c64e-0cc0-40f9-bfed-cbc720781567`, source UID
   `761217382341`, source checksum
   `9702bfe4fb112dd673b8ac46fb735ee14bc5bbef57f57c53af56c1b7d972c5dc`.
4. Mindray BeneFusion SP 5 — Product
   `76840838-c759-40eb-a1ef-e329e9091714`, source UID `724985486041`, source
   checksum `2821940a8f55085e9df1bad06c242b096ceadbf7dafe8006c4c02a7511f783dc`.
5. DIXION Instilar 1438 — Product `e7a54ec6-986d-422a-aca8-862d4d00a421`,
   source UID `532456144899`, source checksum
   `de6449738e1af8ce192df069b38edff249b4d7a8702ba3b36ab016f83e1f802d`.
6. Comen Star5000 — Product `b352787f-36b3-4cae-b72d-7e9d130dd5f7`, source
   UID `777813572261`, source checksum
   `570ad8ef2d8826e94ab24cce7af0b64c8ba4ca854b28fe11213d87898a4818a0`.
7. Comen Star5000C — Product `f798f9c1-4555-447e-b67c-66ba22f52c3e`, source
   UID `116854129531`, source checksum
   `796fa407019cdded7a9a9719536cd70c700d57f20ee13a2959ccf0f256352d6a`.

## Evidence summary

- Olympus identifies the official models as
  [CV-170](https://www.olympus-europa.com/medical/en/Products-and-Solutions/Products/Product/CV-170.html),
  [CV-190 PLUS](https://www.olympus-europa.com/medical/en/Products-and-Solutions/Products/Product/CV-190-PLUS.html),
  and the separate EVIS EXERA III processor
  [CV-190](https://www.olympus-europa.com/medical/en/Products-and-Solutions/Products/Product/EVIS-EXERA-III-BF.html?cid=rl17redirect).
  The current CV-170 gallery asset is marked `CV-170`; no reviewed primary
  source uses `OPTERA`. The current CV-190 gallery asset is marked `CV-190`,
  not `CV-190 PLUS`.
- Bionet's official [BM5 page](https://www.ebionet.com/product/product01.php?prdcode=2410240005&ptype=view)
  and [BM5 catalogue](https://www.ebionet.com/upload/BM5_Catalogue.pdf) identify
  a human multiparameter patient monitor. `BM5VET Elite` is a separate
  veterinary model. All three imported assets show `BM5 Patient Monitor` and
  no veterinary marking.
- Mindray's official material recognizes a plain
  [BeneFusion SP5 syringe pump](https://www.mindray.com/in/innovation/customer-stories/mindray-our-trusted-partner-for-medical-advancement/),
  while the current [BeneFusion 5 Series](https://www.mindray.com/in/products/infusion-system/benefusion-5-series/)
  page separately identifies `SP5 TCI/DTCI`. Both imported assets are marked
  `BeneFusion SP5`; they do not prove the TCI/DTCI execution.
- DIXION's official [Instilar 1428 page](https://dixion.de/de/products/doppel-spritzenpumpe-dixion-instilar-1428/)
  and manufacturer catalogue identify `Instilar 1428`; no reviewed primary
  source identifies `Instilar 1438`. A separate Production Product already
  represents Instilar 1428, so silently renaming this row would create a
  duplicate identity.
- The imported Comen images distinguish the devices: the Star5000 asset is
  marked `STAR5000`, while the Star5000C asset is a different maternal/fetal
  configuration. Comen's regional official page identifies
  [STAR 5000C](https://www.comen.com.mx/monitores-fetales/); the current global
  portfolio has moved to the
  [CF Series](https://en.comen.com/products/CFSeries), so claims for these
  legacy models must remain limited to model-specific evidence.

## Compact decision table

| № | Product | Product ID | Вопрос | Вариант A | Вариант B | Рекомендация | Confidence | Последствие решения |
|---:|---|---|---|---|---|---|---|---|
| 1 | Olympus CV-170 OPTERA | `95af806c-3fbf-446e-a608-263aa290d548` | Зафиксировать официальную модель `CV-170` без неподтверждённого суффикса или сохранить `CV-170 OPTERA`? | `CV-170`; имя: «Видеоэндоскопическая система Olympus CV-170»; оба media оставить | `CV-170 OPTERA`; до официального источника оставить blocked | **A** | High | A → Group A, patch/revision preparation; B/BLOCK → Group C до primary evidence |
| 2 | Olympus CV-190 PLUS EVIS EXERA III | `4e1a370b-4e53-4ee6-b590-823d1ad0e087` | Следовать exact media `CV-190` или сохранить заявленное исполнение `CV-190 PLUS`? | `CV-190`; имя: «Видеоэндоскопическая система Olympus EVIS EXERA III CV-190»; оба media оставить | `CV-190 PLUS`; media карантин до изображения с exact PLUS marking | **A** | High | A → Group A, patch/revision preparation; B → Group B media remediation; BLOCK → Group C |
| 3 | Bionet BM 5 | `3d31c64e-0cc0-40f9-bfed-cbc720781567` | Зафиксировать медицинский `BM5` или ветеринарный `BM5VET Elite`? | `BM5`; имя: «Монитор пациента Bionet BM5»; три media оставить | `BM5VET Elite`; текущий medical content/media отклонить | **A** | High | A → Group A; B/BLOCK → Group C и отдельная veterinary identity/content проверка |
| 4 | Mindray BeneFusion SP 5 | `76840838-c759-40eb-a1ef-e329e9091714` | Зафиксировать plain `BeneFusion SP5` или анестезиологическое исполнение `SP5 TCI/DTCI`? | `BeneFusion SP5`; имя: «Шприцевой инфузионный насос Mindray BeneFusion SP5»; не заявлять TCI/TIVA | `BeneFusion SP5 TCI/DTCI`; требуется exact execution evidence | **A** | Medium | A → Group A с generic source-grounded claims; B/BLOCK → Group C до IFU/execution proof |
| 5 | DIXION Instilar 1438 | `e7a54ec6-986d-422a-aca8-862d4d00a421` | Считать запись ошибочным дублем официального `Instilar 1428` или сохранять `Instilar 1438`? | Duplicate candidate `Instilar 1428`; Product не публиковать и передать в dedup backlog | Сохранить `Instilar 1438`; требуется новый primary source | **A** | High | A/B/BLOCK → Group C; Production data не менять до отдельного dedup/evidence решения |
| 6 | Comen Star5000 | `b352787f-36b3-4cae-b72d-7e9d130dd5f7` | Зафиксировать `STAR5000`, как указано на exact media, или считать карточку вариантом `STAR5000C`? | `STAR5000`; имя: «Фетальный монитор Comen STAR5000»; media оставить | `STAR5000C`; текущий media отклонить и проверить duplicate с Product №7 | **A** | Medium | A → Group A с ограниченными model-specific claims; B/BLOCK → Group C |
| 7 | Comen Star5000C | `f798f9c1-4555-447e-b67c-66ba22f52c3e` | Зафиксировать отдельную модель `STAR5000C` или объединить её с generic `STAR5000`? | `STAR5000C`; имя: «Фетальный и материнский монитор Comen STAR5000C»; media оставить | Generic `STAR5000`; отклонить текущую identity и проверить duplicate с Product №6 | **A** | Medium | A → Group A с warning по РУ; B/BLOCK → Group C |

## Ready-to-send Product Owner answer

```text
1 — A/B/BLOCK
2 — A/B/BLOCK
3 — A/B/BLOCK
4 — A/B/BLOCK
5 — A/B/BLOCK
6 — A/B/BLOCK
7 — A/B/BLOCK
```

Recommended response:

```text
1 — A
2 — A
3 — A
4 — A
5 — A
6 — A
7 — A
```

## Resolution mapping

1. **CV-170** — A removes `OPTERA`, preserves the two exact/compatible media,
   permits only official CV-170 claims, retains `missing_registration` and
   `missing_documents` as warnings, and moves to Group A. B keeps the current
   identity blocked until a primary OPTERA source exists.
2. **CV-190** — A aligns the model/name with the exact-marked imported media,
   uses only official CV-190/EVIS EXERA III claims, retains regulatory/document
   warnings, and moves to Group A. B preserves PLUS but quarantines both media
   pending exact PLUS evidence, so it remains Group B. BLOCK moves it to Group C.
3. **BM5** — A uses the human patient-monitor identity, keeps all three exact
   media, excludes all BM5VET claims, keeps the regulatory/document warnings,
   and moves to Group A. B or BLOCK moves it to Group C.
4. **BeneFusion SP5** — A keeps the exact media and generic syringe-pump
   identity, explicitly excludes TCI/TIVA/DTCI claims, retains warnings, and
   moves to Group A. B or BLOCK requires an exact variant IFU and stays Group C.
5. **Instilar** — A records a duplicate candidate against the already existing
   Instilar 1428 Product. No content patch or lifecycle record is permitted; the
   Product moves to Group C/dedup backlog. B and BLOCK also stay Group C until a
   primary `1438` source is produced.
6. **STAR5000** — A follows the exact product marking in the imported media,
   keeps that one asset, limits claims to STAR5000 evidence, keeps warnings, and
   moves to Group A. B/BLOCK moves it to Group C to prevent collision with №7.
7. **STAR5000C** — A preserves a separate C execution, keeps its one
   configuration-compatible asset, uses only 5000C evidence, retains warnings,
   and moves to Group A. B/BLOCK moves it to Group C.

For every BLOCK answer the Product remains unpublished in Group C, Production
data remains unchanged, and the exact unresolved identity/media reason is kept
in backlog.

## Batch forecast

If all recommendations are accepted, six Products move to Group A and one
(Instilar 1438) moves to Group C/dedup backlog. Expected next scope: six
controlled Catalog Admin patches, six immutable revisions after separate
readiness PASS, and a publication wave of at most six Products after Human
Review/Approval. Estimated effort: **M** (up to one workday), driven by six
canonical content/SEO packages and deterministic media/claims checks.

## Production invariance

The final read-only Production verification returned Products 79, Published
36, Unpublished 43, and Revisions/Decisions/Approvals/Publication Batches
36/36/36/36. Sitemap Product URLs remain 36. Product writes and lifecycle
writes were zero. Product content, migrations, ENV, DNS, and Vercel deployment
settings were not changed; `gitForkProtection` remains enabled.
