# Ambu Wave 2 Execution Report

**Execution date:** 2026-07-15

**Branch:** `feature/wave2-expansion`

**Scope:** candidate-only research through the existing Discovery → Ambu Provider → Resolver v2 → Trusted Downloader → Category Extraction Profiles → Review Queue → Wave 2 reports pipeline

## 1. Scope

MVP-052 closes the previous Ambu evidence gap without changing provider, resolver, downloader, extraction, Review Queue, verification, publication, Supabase, public API, Portal, or Dashboard logic. Only official `ambu.com` product pages and public Ambu downloads were accepted.

## 2. Manufacturer Identity

All 13 product/family entries below are explicitly branded by Ambu A/S. The additional `wave2-ambu-products-index` entry is discovery-only and is not a medical-device model.

FS500 and FS510 were checked separately. They occur in legacy/public CyberMedica mock and product surfaces, but no official Ambu source found in this execution identifies either model as Ambu. They were therefore excluded from Ambu Wave 2. The protected public, Portal, compatibility mock, Tender, and canonical product areas were not changed.

## 3. Models Checked

| Requested scope | Evidence entry used | Identity result |
| --- | --- | --- |
| aScope 4 Broncho | aScope 4 Broncho | Current official family page and generation-specific datasheet |
| aScope 5 Broncho | aScope 5 Broncho | Current official family page and generation-specific datasheet |
| aScope Duodeno | aScope Duodeno 2 | Current generation retained explicitly; no cross-generation merge |
| aScope Gastro | aScope Gastro | Current official product |
| aScope Cysto | aScope 4 Cysto | Explicit fourth-generation model; aScope 5 Cysto HD remains a separate discovery finding |
| aView 2 Advance | aView 2 Advance | Independent displaying and processing unit |
| aBox 2 | aBox 2 | Independent displaying and processing unit |
| BronchoSampler | aScope 5 Broncho Sampler Set | Official packaged product; not generalized to earlier sampler sets |
| VivaSight | VivaSight 2 DLT | Current explicitly identified generation |
| BlueSensor family | BlueSensor BR | Representative official family member; facts remain BR-specific |
| Neuroline family | Neuroline Cup | Representative official family member; facts remain Cup-specific |
| Ambu Man family | AmbuMan Basic | Current official family member |
| Resuscitators | SPUR II | Official adult/paediatric/infant resuscitator family |

Additional official current models observed during discovery include aScope 5 Cysto HD, aScope 5 Uretero, aScope Gastro Large, VivaSight 2 SLT, AmbuMan Advanced, and additional BlueSensor/Neuroline variants. They were not promoted into the evidence set because MVP-052 only required discovery of additional models.

## 4. Current vs Archived Models

- `aScope Duodeno 2` is the current explicitly named entry. Earlier unqualified `aScope Duodeno` evidence is not transferred to it automatically.
- `VivaSight 2 DLT` is kept separate from VivaSight-DL/SL and VivaSight 2 SLT.
- The official Ambu Man page marks the older `Ambu Man` product obsolete; `AmbuMan Basic` is used for the current family check.
- aScope 4 and aScope 5 generations are separate entries and retain separate compatibility constraints.
- The discovery-only index is not counted as a device model in narrative model counts.

## 5. Official Sources

The evidence set contains 15 official source bindings across 14 entries. Principal pages are:

- [Ambu pulmonology products](https://www.ambu.com/endoscopy/pulmonology/products)
- [aScope 5 Broncho](https://www.ambu.com/endoscopy/pulmonology/bronchoscopes/product/ascope-5-broncho)
- [aScope Duodeno 2](https://www.ambu.com/endoscopy/gastroenterology/duodenoscopes/product/ambu-ascope-duodeno-2)
- [aScope Gastro](https://www.ambu.com/endoscopy/gastroenterology/gastroscope/product/ascope-gastro)
- [aScope 4 Cysto](https://www.ambu.com/endoscopy/urology/cystoscopes/product/ambu-ascope-4-cysto)
- [aView 2 Advance](https://www.ambu.com/endoscopy/monitors/product/aview-2-advance)
- [aBox 2](https://www.ambu.com/endoscopy/monitors/product/abox-2)
- [aScope 5 Broncho Sampler Set](https://www.ambu.com/endoscopy/pulmonology/bronchoscopes/product/ambu-ascope-5-broncho-sampler-set)
- [VivaSight 2 DLT](https://www.ambu.com/airway-management-and-anaesthesia/double-lumen-tubes/product/vivasight-2-dlt)
- [BlueSensor BR](https://www.ambu.com/cardiology/ecg-electrodes/product/ambu-bluesensor-br)
- [Neuroline Cup](https://www.ambu.com/neurology/eeg-electrodes/product/ambu-neuroline-cup)
- [AmbuMan Basic](https://www.ambu.com/emergency-care-and-training/training-manikins/product/ambu-man-basic)
- [SPUR II](https://www.ambu.com/emergency-care-and-training/resuscitators/product/ambu-spur-ii)

Regional links, social media, unsafe template URLs, third-party clinical pages, and off-site download hosts were rejected by the existing provider/resolver boundaries.

## 6. Document Candidates

Resolver v2 retained 369 official document bindings (183 unique URLs), including current and archived Ambu downloads. Twenty-five current documents were explicitly seeded for trusted processing: datasheets, IFUs, the BlueSensor catalogue, and the Ambu endoscopy-system compatibility table. The compatibility table remains conservatively classified as `unknown` because the current Discovery document enum has no compatibility type; its title and provenance are preserved for review.

No operator manual, public service manual, or registration certificate was promoted where Ambu did not expose one publicly. Archived IFUs remain candidates and were not treated as the current version automatically.

## 7. Downloads and Artifacts

| Model/entry | Attempts | Downloads / versions | Failed | Downloaded evidence |
| --- | ---: | ---: | ---: | --- |
| aScope 4 Broncho | 2 | 1 | 1 | Current regular datasheet; IFU timed out |
| aScope 5 Broncho | 1 | 1 | 0 | HD 5.0/2.2 datasheet |
| aScope Duodeno 2 | 1 | 1 | 0 | Datasheet |
| aScope Gastro | 2 | 1 | 1 | Datasheet; IFU timed out |
| aScope 4 Cysto | 2 | 2 | 0 | Datasheet and IFU V09 |
| aView 2 Advance | 2 | 2 | 0 | Datasheet and compatibility table |
| aBox 2 | 2 | 2 | 0 | Datasheet and compatibility table |
| aScope 5 Broncho Sampler Set | 2 | 1 | 1 | Datasheet; IFU timed out |
| VivaSight 2 DLT | 2 | 1 | 1 | Datasheet; IFU timed out |
| BlueSensor BR | 2 | 2 | 0 | Catalogue and datasheet |
| Neuroline Cup | 2 | 2 | 0 | Datasheet and IFU V02 |
| AmbuMan Basic | 1 | 1 | 0 | Datasheet |
| SPUR II | 2 | 2 | 0 | Datasheet and IFU V13 |
| Discovery index | 0 | 0 | 0 | Intentionally no artifact |

Totals: 23 attempts, 19 successful download/document-version bindings, four retryable timeouts, and 18 unique SHA-256 artifacts. Every saved Ambu document has a valid `%PDF-` signature. Ambu serves these endpoints as `application/octet-stream`; generated Ambu document reports were normalized to `application/pdf` only after signature verification so the existing extractor could read them. Downloader rules were not changed.

## 8. Extraction Profiles

Existing profiles only were used: `registry`, `endoscopy`, `consumables`, and `anesthesia`.

| Entry | Profiles | Coverage | Facts | Failed-field outcome |
| --- | --- | ---: | ---: | --- |
| aScope 4 Broncho | registry, endoscopy | 40% | 9 | working channel and some registry fields remain missing |
| aScope 5 Broncho | registry, endoscopy | 40% | 9 | working channel and registry identifiers remain incomplete |
| aScope Duodeno 2 | registry, endoscopy | 40% | 10 | sterile/single-use or registry fields not matched uniformly |
| aScope Gastro | registry, endoscopy | 40% | 10 | registry identifiers and some category fields remain missing |
| aScope 4 Cysto | registry, endoscopy | 47% | 15 | registration fields remain missing |
| aView 2 Advance | registry, endoscopy | 10% | 11 | endoscope-oriented fields do not describe a display fully |
| aBox 2 | registry, endoscopy | 0% | 8 | current profile has no display-specific expected-field set |
| Sampler Set | registry, endoscopy, consumables | 38% | 10 | connector/volume fields were not matched by current rules |
| VivaSight 2 DLT | registry, anesthesia, endoscopy | 17% | 5 | most endoscopy/anesthesia expected fields remain unmatched |
| BlueSensor BR | registry, consumables | 0% | 7 | patient group/connector patterns did not match current rules |
| Neuroline Cup | registry, consumables | 0% | 6 | connector/usage patterns remain unmatched |
| AmbuMan Basic | registry | 0% | 3 | no training-manikin profile exists |
| SPUR II | registry, anesthesia | 15% | 17 | adult/paediatric/neonatal patterns matched partially |
| Discovery index | registry | 0% | 0 | intentionally no document |

Average product coverage is 21% after rounding. Matched patterns include endoscopy diameter/length/sterile/single-use and anesthesia adult/paediatric/neonatal. Normalized units include 17 `mm` values and one `cm` value. Coverage is a triage signal, not evidence completeness.

## 9. Candidate Facts and Claims

Extraction produced 120 candidate facts, 120 candidate claims, and 120 serialized evidence objects. Facts originate from downloaded artifacts and carry document-version IDs, source URLs, SHA-256 references, and locators. Marketing snippets and product-page text were not converted into facts.

## 10. Review Queue

The 120 candidate claims produced 120 Review Items. All 120 have evidence IDs, document-version IDs, source URLs, and locators and are structurally ready for a human reviewer. No review decision was created or changed. The discovery-only index has no facts or Review Items.

## 11. Evidence Integrity

`npm run audit:evidence-integrity` reports:

- dangling evidence references: 0;
- broken document-version IDs: 0;
- broken source URLs: 0;
- missing evidence objects: 0.

No automatic repair was run for MVP-052.

## 12. Compatibility

Only explicit official statements were retained as findings:

- aScope 4 Broncho ↔ aView 2 Advance;
- aScope 5 Broncho ↔ aBox 2 and aView 2 Advance;
- aScope 4 Cysto ↔ aView 2 Advance;
- aScope Gastro and aScope Duodeno 2 ↔ aBox 2;
- VivaSight 2 DLT ↔ aView 2 Advance;
- aScope 5 Broncho Sampler Set only with the documented 5.6/2.8, 5.0/2.2, and 4.2/2.2 variants;
- the official compatibility table explicitly distinguishes display generations.

The Ambu pulmonology notice says aBox 2 is not compatible with VivaSight, aScope 4, or aScope 4 Rhino. No relationship was inferred from connector similarity, family name, or generation.

## 13. Blocked Models

All 14 entries remain blocked at the Discovery required-document gate because that gate requires a registration certificate plus IFU/manual and datasheet coverage. This is independent from Review Queue structural readiness. Four current IFUs timed out, the discovery index intentionally has no artifact, and publicly available registration/service documentation remains absent.

## 14. Evidence-level KPI

| KPI | Value |
| --- | ---: |
| Evidence entries | 14 |
| Device/family entries | 13 |
| Official source bindings | 15 |
| Document candidate bindings | 369 |
| Unique document URLs | 183 |
| Resolved document bindings | 362 |
| Trusted download attempts | 23 |
| Downloads / document versions | 19 |
| Unique artifacts | 18 |
| Failed downloads | 4 |
| Candidate facts | 120 |
| Candidate claims | 120 |
| Evidence objects | 120 |
| Review items / ready | 120 / 120 |
| Ready products | 13 |
| Discovery-blocked entries | 14 |
| Average extraction coverage | 21% |

## 15. Orchestration KPI

The deterministic Ambu summary reports 14 products, 15 sources, 20 documents, 13 downloads/artifacts, 32 candidate facts/review items, one blocked product, zero errors, and two warnings. All six stages are `completed`.

## 16. Metric Reconciliation

The previous Ambu summary reported ten planned products while the evidence layer contained only two product reports, no document versions, no facts, and no Review Items. This happened because `wave2-execution.ts` produces deterministic stage estimates from manufacturer configuration/seeds; it does not create product-level evidence reports.

After MVP-052, orchestration counts the 14 Ambu seeds, while evidence reports contain the same 14 slugs and 13 artifact-backed product/family entries. Counts still differ for documents, downloads, facts, and review items because orchestration metrics remain deterministic estimates. Dashboard values come from the orchestration summary and therefore show 14 products, 15 sources, 20 documents, 13 artifacts, 32 facts/items, one blocked product, and 100% orchestration progress. These values are intentionally not substituted with evidence KPI.

## 17. Risks

- Discovery retains many archived and repeated official Ambu bindings; only current explicit documents were selected for trusted processing.
- Four large IFUs timed out and remain blocked/retryable.
- `application/octet-stream` from the official portal requires signature-based generated MIME normalization for extraction.
- Existing category profiles do not fully cover display processors, electrodes, or training manikins, keeping coverage low.
- Product-page compatibility statements require artifact capture when not present in the downloaded compatibility matrix.
- FS500/FS510 manufacturer identity remains outside Ambu and must not be corrected in protected public/canonical layers as part of this task.

## 18. Recommendations

1. Retry the four current IFUs with the unchanged Trusted Downloader in a controlled network window.
2. Add category-profile improvements only in a separate extraction-profile task, especially for display processors, electrodes, and resuscitators.
3. Preserve exact generation/model keys for aScope, VivaSight, displays, and sampler sets.
4. Keep orchestration, evidence, Import Center, and Dashboard metrics visibly separate.
5. Resolve FS500/FS510 manufacturer identity in a dedicated canonical-data/public-product task with primary manufacturer evidence.

## Safety

- `publicationCreated = false`
- `verifiedClaimsCreated = 0`
- `supabaseWrites = false`
- `verificationChanged = false`
- `reviewDecisionsChanged = false`

No commit was created.
