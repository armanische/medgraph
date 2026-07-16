# Tender Workflow Pilot

## Scope

MVP-038 upgraded `/tender` from a static compliance table into a four-step workflow:

1. Product selection.
2. Manual tender requirement editor.
3. Rule-based analysis.
4. Result summary and mock export.

No AI, LLM, Supabase, Verification, Publication, Discovery or Review Queue changes were made.

## Pilot Products

The workflow currently exposes:

- Hamilton T1;
- Hamilton C1;
- Mindray A5;
- Mindray A7;
- FS510.

These are mock/published projection records for procurement workflow validation.

## Pilot Rules

Default pilot requirements:

- autonomous battery operation `>= 4 h`;
- screen `>= 10 inch`;
- NIV support `Boolean true`;
- weight `<= 7 kg`.

The editor also supports additional manual rules up to ten rows.

## Current Behavior

Hamilton T1 demonstrates mixed results:

- several requirements match;
- one requirement fails because the known display size is below the pilot threshold.

Mindray A5/A7 demonstrate missing evidence behavior:

- values without confirmed source/document become `not_verified`;
- candidate data cannot satisfy a tender rule.

FS510 demonstrates category mismatch behavior:

- many ventilator-style requirements have no confirmed data;
- the summary raises risk because of missing evidence.

## Risk Interpretation

- Low: all checked requirements match with evidence.
- Medium: some evidence is missing, but there are no mismatches and missing data is below 40%.
- High: at least one mismatch, or missing/unknown data is 40% or more.

## Limitations

- Manual requirements are typed in the browser only and are not persisted.
- Export is a UI mock; no PDF is generated.
- Product values are a mock published projection layer, not Supabase.
- No natural-language parsing is used.
- Units are not converted automatically.

## Next Steps

1. Add structured import for tender spreadsheets or DOCX tables.
2. Connect product values to the future verified publication projection.
3. Add evidence locator drill-down.
4. Add real PDF export after review.
5. Add side-by-side compliance across multiple products.
