# Resolved Group B Six — Content Preparation and Revision Gate — 2026-07-31

## Outcome

The seven Product Owner decisions were applied exactly. Six Products received
one atomic Catalog Admin patch each and one immutable publication revision each.
DIXION Instilar 1438 was excluded from every Product and lifecycle write and is
tracked separately as a duplicate candidate.

Production remains at 79 Products, 36 Published and 43 Unpublished. Lifecycle
totals after revision creation are Revisions 42, Decisions 36, Approvals 36 and
Publication Batches 36. The six new revisions are awaiting manual Human Review.

## Controlled scope

| Product | Product ID | Source UID | Canonical model | Revision | Review Item |
| --- | --- | --- | --- | --- | --- |
| Olympus CV-170 | `95af806c-3fbf-446e-a608-263aa290d548` | `740658724462` | `CV-170` | `d0095254-3b5b-4bea-8021-700e5af1c8d5` | `486bcae0-3b9a-4fae-a114-45fe671cbde7` |
| Olympus EVIS EXERA III CV-190 | `4e1a370b-4e53-4ee6-b590-823d1ad0e087` | `304432044232` | `CV-190` | `c629b5d2-7b13-4fda-9da6-d004b579fb18` | `07b79430-6420-4227-9dbc-f5335c663854` |
| Bionet BM5 | `3d31c64e-0cc0-40f9-bfed-cbc720781567` | `761217382341` | `BM5` | `7700d1ef-fd92-4d46-81d7-e1a981e939df` | `bb597579-1178-48f1-83c6-671cb78da16d` |
| Mindray BeneFusion SP5 | `76840838-c759-40eb-a1ef-e329e9091714` | `724985486041` | `BeneFusion SP5` | `676523c3-90bf-4a31-98d1-bd7c6af34c9f` | `f6d4baae-ec54-46bc-b4e3-1969eeeb1722` |
| Comen STAR5000 | `b352787f-36b3-4cae-b72d-7e9d130dd5f7` | `777813572261` | `STAR5000` | `d2ed13c0-43a9-468a-a19f-683c289b1e6f` | `ff2eff8c-e942-479d-ac4c-f39ff3b1379e` |
| Comen STAR5000C | `f798f9c1-4555-447e-b67c-66ba22f52c3e` | `116854129531` | `STAR5000C` | `26771e99-4d44-4d12-85f6-267187d77654` | `b7cd1dab-7c94-4169-8f89-42a8f45105c0` |

## Authoritative evidence and claim policy

- Olympus official evidence: [CV-170](https://www.olympus-europa.com/medical/en/Products-and-Solutions/Products/Product/CV-170.html),
  [EVIS EXERA III / CV-190](https://www.olympus-europa.com/medical/en/Products-and-Solutions/Products/Product/EVIS-EXERA-III-BF.html?cid=rl17redirect),
  and the official [surgical catalogue](https://www.olympus-europa.com/medical/rmt/media/Content/Content-MSD/Documents/Brochures/S00267EN_OEKG_SE_SD_Catalogue_0525_Surgical_Catalog_red.pdf).
  `OPTERA` and `CV-190 PLUS` identity/claims were excluded.
- Bionet official [BM5 page](https://www.ebionet.com/product/product01.php?prdcode=2410240005&ptype=view)
  and [catalogue](https://www.ebionet.com/upload/BM5_Catalogue.pdf) support the
  medical patient-monitor identity. Veterinary `BM5VET Elite` content was
  excluded.
- Mindray official material identifies a plain
  [BeneFusion SP5](https://www.mindray.com/in/innovation/customer-stories/mindray-our-trusted-partner-for-medical-advancement/).
  The current [5 Series](https://www.mindray.com/in/products/infusion-system/benefusion-5-series/)
  distinguishes TCI/DTCI variants, so TCI, DTCI and TIVA claims were excluded.
- Comen model evidence keeps `STAR5000` and
  [STAR5000C](https://www.comen.com.mx/monitores-fetales/) as separate Product
  identities. Public copy is limited to model-specific fetal or maternal/fetal
  monitoring claims.

## Patch and immutable evidence

The six patches used exact `expectedUpdatedAt`, canonical locale `ru`, and the
approved atomic Catalog Admin RPC. The preview contains exactly six Product IDs,
no lifecycle fields and no Instilar 1438 identity.

| Evidence | SHA-256 |
| --- | --- |
| Patch preview | `8996fe81c173ef2766c76604ed24df39062a3c25e40a7c077336695304d23b7a` |
| Patch results | `58e267154abe5844461ef72847b931227cd62dd5b5078adb96a40b34fb50c97f` |
| Post-patch verification | `432ba831d6c3f814c0edd2013480451301ed8a97aa1190e3ac70e5f303b0b611` |
| Revision preflight | `3be4db4a92fe2b905ce541697f6d040a28fb1e663ddf3acc079c52dad0b5d382` |
| Revision results | `9c52c32df85d22e7827e187e60d80f612f562ed2b911fceb35e5426ac81e8fce` |
| Durable revision verification | `0f23ba459a07e6b14243dde5a41510f36754c5193bd71fe356f0131b876bf79c` |

Every target has one canonical Russian description, SEO, three active
characteristics and at least one media asset. Candidate reads were deterministic
10/10 for every Product. Candidate, immutable payload and Product identity
checksums match the stored revisions. `rawSnapshot` and `sourceChecksum` are
unchanged. The hash of the existing 36 Published Product rows remains
`af7ed39eeb62a67f76cdd36b76f6fa0c`.

Warnings `missing_registration` and `missing_documents` remain non-blocking.
No Decision, Approval or Publication Batch exists for the six new revisions.
