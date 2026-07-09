# Tender Compliance Pilot

MVP-030 adds the first tender compliance prototype at:

```text
/tender
```

## Pilot Tender

Category:

- Аппарат ИВЛ.

Requirements:

- автономная работа ≥ 4 часа;
- экран ≥ 10";
- поддержка NIV;
- масса ≤ 7 кг.

## Compared Product

Product:

- Hamilton T1.

The pilot uses a mock/report layer with evidence references. It does not write
to Supabase and does not publish results.

## Pilot Results

| Requirement | Hamilton T1 value | Result |
| --- | --- | --- |
| Автономная работа ≥ 4 часа | 5.5 ч | matches |
| Экран ≥ 10" | 8.4 inch | does_not_match |
| Поддержка NIV | true | matches |
| Масса ≤ 7 кг | 6.5 kg | matches |

Summary:

- total requirements: 4;
- matches: 3;
- does not match: 1;
- partially matches: 0;
- not verified: 0.

## Limitations

- No tender document upload.
- No tender parsing.
- No product selector.
- No unit conversion.
- No evidence excerpts.
- No publication workflow.
- Candidate Claims are ignored.

## What v2 Needs

- deterministic requirement parser;
- reviewer workflow for parsed tender requirements;
- product selector;
- unit normalization;
- evidence excerpts and locators;
- PDF/CSV report export;
- category-specific compliance templates;
- integration with Search, Compare and Compatibility.

## Safety Findings

The pilot preserves CyberMedica boundaries:

- no LLM;
- no Candidate Claims;
- no automatic publication;
- no Verification changes;
- no Supabase writes;
- no `public_api` writes.

