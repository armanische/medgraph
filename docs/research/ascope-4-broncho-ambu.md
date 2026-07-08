# Ambu aScope 4 Broncho Research Report

**Status:** MVP-020 pilot research package  
**Product:** Ambu aScope 4 Broncho  
**Category:** single-use bronchoscope / Эндоскопия  
**Manufacturer:** Ambu  
**Verification:** not verified  
**Publication:** not published

## Identity

- Manufacturer: Ambu
- Model/family: aScope 4 Broncho
- Category: single-use bronchoscope
- Golden Dataset priority: Critical
- Local catalog slug: `odnorazovyi-endoskop-ascope-4-broncho-ambu`

## Documents Found

Observed official manufacturer context:

- `https://www.ambu.com/`
- `https://www.ambu.com/endoscopy/pulmonology/products`

Observed source notes:

- Ambu site navigation contains pulmonology bronchoscopes and products.
- Ambu page references aScope 4 Broncho in clinical/product context.
- Ambu page notes aBox 2 compatibility caveat: aBox 2 is compatible with aScope 5 and SureSight, not aScope 4/aScope 4 Rhino.
- Ambu page references physician preference study involving aScope 4 Broncho and aView monitor.

## Missing Documents

- exact aScope 4 Broncho product page not captured in this pilot pass;
- RU / regulator record missing;
- IFU missing;
- datasheet missing;
- document hashes missing;
- article/SKU mapping missing.

## Characteristics Found

| Characteristic | Candidate value | Source | Auto-publish | Review | Conflict |
| --- | --- | --- | --- | --- | --- |
| Manufacturer | Ambu | official site context | No | Yes | No |
| Product family | aScope 4 Broncho | official site context | No | Yes | No |
| Device type | single-use bronchoscope candidate | official site context | No | Yes | Needs IFU |
| Compatibility caveat | aBox 2 not compatible with aScope 4/aScope 4 Rhino | Ambu products page | No | Yes | No |
| Related display | aView monitor mentioned with aScope 4 Broncho | Ambu products page | No | Yes | Needs exact model context |

## Characteristics Missing

- registration number;
- intended use;
- sterility;
- single-use confirmation from IFU;
- dimensions;
- working channel;
- field of view;
- compatible display units;
- contraindications;
- packaging and article list.

## Compatibility

Compatibility has a useful negative candidate:

- aBox 2 is stated as not compatible with aScope 4/aScope 4 Rhino in Ambu page context.

This is review-only and should be preserved as a compatibility caveat, not
published automatically.

## Accessories

Candidate accessory/display:

- aView monitor mentioned in relation to aScope 4 Broncho.

## Consumables

The product is likely a single-use device, but IFU evidence is required before
publication.

## Conflicts

No confirmed conflict. Main ambiguity:

- aScope 4 Broncho product family and display compatibility need exact
  document-backed mapping.

## Candidate Claims

Potential claims after document retrieval:

- aScope 4 Broncho is an Ambu bronchoscope product family.
- aBox 2 is not compatible with aScope 4/aScope 4 Rhino.
- aView monitor relationship requires exact evidence.

All claims remain unverified and `autoPublish: false`.

## Evidence Chain

```text
Source: Ambu official site and product context page
↓
Document: product page context; IFU/datasheet not captured
↓
Document Version: not downloaded, hash missing
↓
Locator: observed page lines for compatibility caveat
↓
Extracted Fact: candidate identity and compatibility caveat
↓
Candidate Claim: not created in generated data
↓
Human Verification: required
↓
Publication: blocked
```

## Completeness Score

**20%**

Reason:

- manufacturer official source context found;
- exact product page, IFU, RU, datasheet and hashes missing;
- only candidate identity and compatibility caveat captured.

What is needed for 100%:

- find exact aScope 4 Broncho IFU/product page;
- download IFU/datasheet through artifact store;
- record hashes;
- find RU/regulator record;
- map articles/SKUs and display compatibility;
- human review.

## Next Actions

- Add Ambu IFU portal query for aScope 4 Broncho.
- Add compatibility-negative claim support.
- Add article-level extraction.
- Compare aScope 4 vs aScope 5 without inferring equivalence.

## Publication Readiness

Blocked. No verified facts and no publication action allowed.
