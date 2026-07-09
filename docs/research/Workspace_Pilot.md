# Workspace Pilot

MVP-031 adds the first procurement workspace at:

```text
/workspace
```

## Panels

The workspace contains four panels:

1. Поиск изделия;
2. Сравнение;
3. Совместимость;
4. Проверка соответствия ТЗ.

## Pilot Session

Current session:

- primary product: FS510;
- search query: `FS510`;
- comparison: Hamilton T1 vs Hamilton C1;
- compatibility: FS510 relationships;
- tender compliance: Hamilton T1 vs IVL tender requirements.

## Key Insights

The pilot produces rule-based insights such as:

- search found relevant products;
- comparison found differences between models;
- compatibility contains links without confirmation;
- tender compliance found a non-matching requirement.

No LLM is used.

## Recommendations

The pilot produces deterministic next actions:

- open product card;
- review comparison;
- check compatibility;
- review tender requirements;
- send request for quotation.

## Limitations

- No user persistence.
- No database writes.
- No chat interface.
- No LLM.
- No uploaded tender parsing.
- No product picker.
- Uses mock/report data from existing engines.
- Candidate Claims and Review Queue are not read.

## What v2 Needs

- product selection;
- workspace state persisted outside public surfaces;
- evidence drawers;
- tender upload and deterministic parsing;
- permission model;
- audit trail;
- AI explanation layer that cites existing deterministic results only.

## Safety Findings

The workspace preserves CyberMedica boundaries:

- no Supabase writes;
- no `public_api` writes;
- no Verification changes;
- no Publication changes;
- no Candidate Claims;
- no Review Queue;
- no LLM-generated conclusions.

