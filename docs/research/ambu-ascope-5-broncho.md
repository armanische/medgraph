# Ambu aScope 5 Broncho Research Report

**Status:** MVP-020 pilot research package  
**Product:** Ambu aScope 5 Broncho  
**Category:** single-use bronchoscope / Эндоскопия  
**Manufacturer:** Ambu  
**Verification:** not verified  
**Publication:** not published

## Identity

- Manufacturer: Ambu
- Model/family: aScope 5 Broncho
- Category: single-use bronchoscope
- Golden Dataset priority: High
- Local catalog slug: not currently present as generated product; related Golden Dataset target exists.

## Documents Found

Observed official manufacturer pages:

- `https://www.ambu.com/endoscopy/pulmonology/ascope-5-broncho-benefits`
- `https://www.ambu.com/endoscopy/pulmonology/bronchoscopes/product/ascope-5-broncho`

Observed official page facts:

- product identified as Ambu aScope 5 Broncho;
- page describes single-use concept;
- page lists size variants and working-channel-style size notation;
- page states aScope 5 Broncho is compatible with Ambu display/processing ecosystem in page context;
- page exposes clinical/marketing descriptions that require review before factual publication.

## Missing Documents

- RU / Roszdravnadzor registration record not found in this pilot pass.
- IFU PDF not downloaded.
- Datasheet not downloaded.
- Document hashes missing.
- Article/SKU mapping missing.

## Characteristics Found

| Characteristic | Candidate value | Source | Auto-publish | Review | Conflict |
| --- | --- | --- | --- | --- | --- |
| Product family | Ambu aScope 5 Broncho | manufacturer page | No | Yes | No |
| Device type | single-use bronchoscope | manufacturer page | No | Yes | No |
| Size variants | 5.6/2.8, 5.0/2.2, 4.2/2.2, 2.7/1.2 mentioned in page context | manufacturer page | No | Yes | Needs IFU/datasheet |
| Bending angles | 195/195 and 210/210 mentioned for variants | manufacturer page | No | Yes | Needs variant mapping |
| Imaging | high-resolution camera chip for selected sizes | manufacturer page | No | Yes | Variant-dependent |
| Single-use | page describes single-use concept | manufacturer page | No | Yes | Needs IFU confirmation |

## Characteristics Missing

- registration number;
- article/SKU list;
- exact variant table;
- outer diameter;
- working length;
- working channel by article;
- sterility statement from IFU;
- intended use from IFU;
- contraindications;
- complete compatible display/processors list.

## Compatibility

Candidate compatibility:

- Ambu ecosystem includes displaying and processing units;
- high-frequency tool compatibility is noted for selected sizes on the page;
- exact display/accessory compatibility requires official IFU/datasheet and review.

## Accessories

Candidate accessories:

- displaying and processing unit;
- endotherapy instruments are mentioned in use context but not as direct accessory claims.

## Consumables

Single-use bronchoscope itself is a consumable device. Article-level mapping is
required before procurement-ready publication.

## Conflicts

No direct conflict found. Ambiguities:

- variant-specific dimensions/features are not yet normalized;
- product page includes marketing/clinical benefit language that must not become fact without review.

## Candidate Claims

Candidate claims after document download:

- Ambu aScope 5 Broncho is a single-use bronchoscope family.
- Selected variants have stated bending angles.
- Selected variants support specified working-channel categories.
- Single-use and sterility claims require IFU.

All claims remain unverified and `autoPublish: false`.

## Evidence Chain

```text
Source: Ambu official product pages
↓
Document: product page and future IFU/datasheet
↓
Document Version: not downloaded, hash missing
↓
Locator: page sections observed
↓
Extracted Fact: candidate characteristics above
↓
Candidate Claim: not created in generated data
↓
Human Verification: required
↓
Publication: blocked
```

## Completeness Score

**40%**

Reason:

- official manufacturer page found;
- useful candidate facts found;
- IFU/datasheet/RU/document hashes missing;
- article-level identity missing.

What is needed for 100%:

- retrieve IFU from Ambu IFU portal;
- retrieve datasheet/specification;
- capture document hashes and locators;
- find RU/regulator record;
- map articles/SKUs;
- human review of single-use, sterility, compatibility and dimensions.

## Next Actions

- Add Ambu IFU portal workflow to source discovery.
- Add article/SKU extraction for Ambu products.
- Separate product-family claims from article-level claims.
- Route compatibility and sterility claims to reviewer.

## Publication Readiness

Blocked. No verified facts and no publication action allowed.
