# Characteristic Policy

**Status:** MVP-018 foundation  
**Scope:** rules for candidate characteristics, verification and publication readiness  
**Non-goal:** implementing scoring, extraction or publication logic

## Purpose

This policy defines how CyberMedica treats product characteristics discovered
from real-world documents. It protects the boundary between extracted data,
candidate claims, human verification and publication.

No characteristic is true because the enrichment pipeline extracted it. A
characteristic becomes publishable only after the required evidence and review
conditions are satisfied.

## General Rules

- Every characteristic must have a source document or source page.
- Every extracted value must keep locator, source title, URL and retrieval
  metadata.
- LLM output is never evidence.
- Search snippets are never evidence.
- Dealer catalogs are secondary hints unless a reviewer explicitly accepts them
  for a non-critical contextual field.
- Conflicting values remain unresolved until human review.
- Missing critical data must be shown as missing, not guessed.

## Publication Classes

| Class | Meaning | Automatic publication |
| --- | --- | --- |
| Regulator-confirmed | A regulator record confirms the field directly. | Allowed only for explicitly safe identity/status fields. |
| Document-supported | Manufacturer or official document supports the field. | No, human verification required. |
| Contextual | Useful for search, grouping or discovery. | No, review required before public use. |
| High-risk | Compatibility, clinical use, selection advice or safety-critical claims. | Never automatic. |

## Characteristic Matrix

| Characteristic | Preferred evidence | Publication | Conflict handling | Missing-data handling |
| --- | --- | --- | --- | --- |
| Registration number | Roszdravnadzor registration record | Yes, when exact match is confirmed from regulator data | Block publication and review registration identity | Mark as missing critical field |
| Registration status | Roszdravnadzor registration record | Yes, when status is taken directly from regulator data | Prefer no value until reviewer resolves | Mark as unknown, do not infer |
| Product name | Roszdravnadzor record, manufacturer IFU, manufacturer page | After review when sources differ | Keep all observed names and choose canonical in review | Use discovered name as draft only |
| Manufacturer | Roszdravnadzor record, manufacturer IFU, manufacturer website | After review | Keep ambiguity if brand, legal entity or distributor differ | Mark manufacturer candidate as unresolved |
| Country | Roszdravnadzor record, manufacturer documents | After review | Require reviewer decision with source note | Leave blank or unknown |
| Category | Regulator classification, manufacturer IFU, internal taxonomy mapping | After review | Reviewer maps to canonical category | Keep draft category only |
| Model | Manufacturer IFU, datasheet, product label in official documents | After review | Keep model variants, do not normalize automatically | Leave blank |
| Dimensions | Manufacturer IFU, service manual, datasheet | After review | Preserve unit and document context; reviewer chooses value | Mark as missing non-critical unless category requires it |
| Weight | Datasheet, IFU, service manual | After review | Preserve all values and units; reviewer resolves net/gross/device weight | Mark as missing non-critical |
| Power requirements | IFU, service manual, datasheet | After review | Treat as safety-relevant; reviewer required | Mark as missing critical for powered devices |
| Battery runtime | IFU, service manual, datasheet | After review | Preserve test condition; reviewer required | Mark as missing if relevant |
| Operating modes | IFU, service manual | After review | Require reviewer to preserve mode context | Mark as missing if device category requires it |
| Measurement range | IFU, datasheet | After review | Preserve units and conditions; reviewer required | Mark as missing critical for diagnostic devices |
| Accuracy | IFU, datasheet, service manual | After review | Do not combine values across contexts automatically | Mark as missing critical for measurement devices |
| Filtration efficiency | IFU, datasheet, test report | After review | Preserve test method and conditions | Mark as missing critical for filters |
| Resistance / pressure drop | IFU, datasheet | After review | Preserve flow rate and test condition | Mark as missing when clinically relevant |
| Dead space | IFU, datasheet | After review | Preserve unit and patient category | Mark as missing when relevant |
| Sterility | IFU, packaging document, regulator document | After review | Reviewer resolves packaging vs device status | Mark as missing if disposable/implantable |
| Single-use / reuse | IFU | After review | IFU controls; conflicting dealer text is ignored until review | Mark as missing critical |
| Service interval | Service manual, IFU | After review | Reviewer resolves model/version context | Mark as missing non-critical |
| Software version | Service manual, release note, device documentation | After review | Version-specific; no automatic merge | Mark as version unknown |
| Compatibility | IFU, manufacturer compatibility table, official accessory list | Human review only | Block publication until reviewer confirms exact model context | Mark as not established |
| Analogs | Reviewer comparison, official category and characteristic evidence | Human review only | Do not infer equivalence automatically | Leave empty |
| Indications / intended use | IFU, regulator record | Human review only | Highest-risk wording; reviewer required | Mark as missing critical |
| Contraindications | IFU | Human review only | Reviewer required; never summarize loosely | Mark as missing if IFU unavailable |
| Selection recommendations | Reviewer-authored note with evidence | Human review only | Not generated automatically | Leave empty |
| Common selection mistakes | Reviewer-authored note with evidence | Human review only | Not generated automatically | Leave empty |
| Product image | Manufacturer website, official document, licensed asset | After review | Confirm rights and product match | Use no image |

## Automatic Publication Allowlist

Only a narrow set of regulator-confirmed identity/status fields can be eligible
for automatic publication, and only if the existing Verification/Publication
system explicitly permits it:

- registration number;
- registration status;
- regulator record URL;
- regulator record retrieval date.

Even for these fields, automatic publication is forbidden when:

- the product identity is ambiguous;
- the registration number has multiple candidate matches;
- the regulator record conflicts with another official document;
- the source is not Roszdravnadzor or an approved regulator source;
- the publication pipeline has not approved the field.

## Conflict Policy

When two sources disagree:

1. Keep both values.
2. Preserve source priority, locator and document date.
3. Mark the characteristic as `needs_review`.
4. Do not choose based on confidence score alone.
5. Do not average, normalize or merge values unless a reviewer approves it.

Examples:

- Weight differs between IFU and dealer catalog: keep IFU candidate and dealer
  candidate, block publication.
- Compatibility list differs between datasheet and service manual: block
  publication until reviewer checks model/version context.
- Product name differs between regulator and manufacturer page: keep aliases,
  reviewer selects canonical display name.

## Missing Data Policy

When required data is missing:

- show the field as missing in internal readiness reports;
- add a missing-information item for the next enrichment pass;
- do not infer from similar products;
- do not use analogs to fill device-specific fields;
- do not publish placeholder values as facts.

Critical missing fields depend on category. For example:

- ventilators: modes, power, intended use, compatibility, service documents;
- monitors: measured parameters, accuracy/range where applicable, power;
- filters: filtration efficiency, resistance, dead space, intended use;
- incubators: temperature control, alarm/safety data, power, dimensions.

## Reviewer Checklist

Before a characteristic can move toward publication, reviewer confirms:

- the product identity matches the source;
- the document is official enough for the field;
- value, unit and context are preserved;
- conflicts are resolved or explicitly blocked;
- the field is allowed by this policy;
- the publication path will keep provenance visible.
