# Hamilton T1 Research Report

**Status:** MVP-020 pilot research package  
**Product:** HAMILTON-T1  
**Category:** Transport ventilator / Аппарат ИВЛ  
**Manufacturer:** Hamilton Medical  
**Verification:** not verified  
**Publication:** not published

## Identity

- Manufacturer: Hamilton Medical
- Model: HAMILTON-T1 / Hamilton T1
- Category: transport ventilator, intensive care transport
- Golden Dataset priority: Critical
- Local catalog slug: `apparat-ivl-hamilton-t1`

## Documents Found

Observed official manufacturer page:

- `https://www.hamilton-medical.com/de_CH/Prehospital-transport/Products/HAMILTON-T1.html`

Observed downloadable document references on the manufacturer page:

- HAMILTON-T1 Bedienungshandbuch, software version 3.1.x, German, 8.51 MB, document id `10101880.02`
- HAMILTON-T1 technical specification for software version 3.1.x, German, 0.37 MB, document id `10101904.01`
- HAMILTON-T1 brochure, German, 5.51 MB, document id `ELO20260316N.00`

Observed official page facts:

- manufacturer page identifies the product as HAMILTON-T1;
- transport use is described for ground, water and air;
- page includes technical specs section;
- page exposes downloads for manual, technical specification and brochure.

## Missing Documents

- RU / Roszdravnadzor registration record not found in this pilot pass.
- Document files were not downloaded through the artifact store.
- Document hashes are missing.
- Service manual not found.
- Russian IFU/manual not found.

## Characteristics Found

Candidate facts from manufacturer page:

| Characteristic | Candidate value | Source | Auto-publish | Review | Conflict |
| --- | --- | --- | --- | --- | --- |
| Product type | transport ventilator | manufacturer page | No | Yes | No |
| Patient range | neonatal to adult | manufacturer page | No | Yes | No |
| Dimensions | 320 x 220 x 270 mm ventilation unit | manufacturer page | No | Yes | No |
| Weight | 6.5 kg | manufacturer page | No | Yes | No |
| Battery runtime | 4 h with one battery / 8 h with two batteries | manufacturer page | No | Yes | No |
| Environmental range | -15 to +50 C | manufacturer page | No | Yes | No |
| IP protection | IP54 | manufacturer page | No | Yes | No |
| Altitude | max 7,620 m | manufacturer page | No | Yes | No |
| Modes | pressure-controlled, volume-oriented, ASV, INTELLiVENT-ASV, NIV options, high-flow oxygen option | manufacturer page | No | Yes | Possible market/options caveat |
| Monitoring options | volumetric capnography, SpO2 monitoring | manufacturer page | No | Yes | Option-dependent |

## Characteristics Missing

- registration number;
- registration status;
- intended use from IFU;
- full alarm list;
- full accessories matrix;
- consumables list with article numbers;
- service interval;
- contraindications;
- complete software/options matrix.

## Compatibility

Candidate compatibility/accessory evidence:

- page references HAMILTON-H900, RS232, PDMS, SpO2 and/or CO2 sensors;
- consumables section references breathing circuit sets, NIV masks, airway filters and HME/HMEF.

Publication rule:

- compatibility is review-only;
- exact model/software/options context is required.

## Accessories

Candidate accessories:

- mounting and handle options;
- data interface board options;
- sensors and humidifier integration.

## Consumables

Candidate consumables:

- breathing circuit sets;
- NIV masks;
- airway filters and HME/HMEF.

## Conflicts

No factual conflict was confirmed. Potential ambiguity:

- several modes/features are marked optional or market-dependent;
- documents are German-language in observed download list;
- local RU identity is not connected yet.

## Candidate Claims

Candidate claims should be created only after document download and locator
capture:

- HAMILTON-T1 is a transport ventilator for neonatal to adult patients.
- Weight is 6.5 kg.
- Battery runtime is 4 h with one battery and 8 h with two batteries.
- IP protection is IP54.
- Specific modes/features require options and market context.

All candidate claims must be `verificationStatus: unverified` and
`autoPublish: false`.

## Evidence Chain

```text
Source: Hamilton Medical official product page
↓
Document: product page + linked manual/specification/brochure
↓
Document Version: not downloaded, hash missing
↓
Locator: page sections and download list observed
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

**60%**

Reason:

- official manufacturer page found;
- IFU/manual and datasheet references found;
- several characteristics sourced from official page;
- RU and document hashes missing;
- compatibility not reviewed.

What is needed for 100%:

- download manual and technical specification through artifact store;
- record hashes;
- find RU/regulator record;
- extract locators from documents;
- resolve option/market caveats;
- human review and publication decision.

## Next Actions

- Add official source seed for Hamilton T1.
- Implement/verify document downloader for Hamilton downloads.
- Add RU search task.
- Extract manual/specification text with locators.
- Route option-dependent claims to reviewer.

## Publication Readiness

Blocked. No verified facts and no publication action allowed.
