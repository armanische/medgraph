# Compatibility Pilot

MVP-029 adds the first evidence-backed compatibility pilot for FS510.

## Pilot Product

Primary product:

- FS510 — тепловлагообменный фильтр.

Related products:

- Hamilton T1;
- Hamilton C1;
- Mindray A8;
- WATO EX-35.

## Pilot Dataset

| Product | Type | Status | Display meaning |
| --- | --- | --- | --- |
| Hamilton T1 | Расходник ↔ аппарат | compatible | Подтверждено в границах документа |
| Hamilton C1 | Расходник ↔ аппарат | compatible_with_conditions | Требуется сверить условия применения |
| Mindray A8 | Расходник ↔ аппарат | compatible_with_conditions | Требуется сверка контура и сопротивления |
| WATO EX-35 | Расходник ↔ аппарат | not_verified | Нет подтверждённых данных |

All records use mock/report-layer evidence and must not be treated as an
automatic publication pipeline.

## Product Page Display

The FS510 product page now includes:

- product name;
- compatibility type;
- status;
- source;
- document version;
- last updated date;
- note;
- filters: Все, Подтверждено, При условиях, Нет подтверждения.

## Limitations

- The dataset is small and fixed.
- Evidence excerpts are not rendered yet.
- Compatibility is not connected to Supabase or `public_api`.
- There is no compatibility graph traversal.
- There is no conflict detection across multiple documents.
- No automatic compatibility extraction is performed.
- Candidate Claims are not used.

## What v2 Needs

- canonical compatibility policy per category;
- document locator support;
- source priority rules;
- conflict handling;
- reviewed/public compatibility datastore;
- product picker and graph view;
- integration with Search and Compare.

## Safety Findings

The pilot preserves CyberMedica boundaries:

- no Candidate Claims;
- no LLM-generated compatibility;
- no analogy-based inference;
- no Supabase writes;
- no Publication writes;
- no Verification changes.

