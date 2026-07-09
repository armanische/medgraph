# Resolver v2 Pilot

## Scope

MVP-037 introduced a manufacturer adapter layer for official document discovery. The pilot focused on safe, deterministic HTML parsing and first-hop resource/download pages.

No public UI, Supabase, Review Queue logic, Verification or Publication code was changed.

## What Changed

Resolver v2 now supports:

- manufacturer adapters for Hamilton, Mindray, Ambu, Dräger, Philips and GE Healthcare;
- generic official document keyword detection;
- conservative document classification;
- resolver-local confidence;
- first-hop retry through downloads/resources/support/media/library pages;
- duplicate URL cleanup;
- diagnostics in discovery reports.

## Test Coverage

Added coverage for:

- manufacturer adapters;
- Mindray resources and Safety Information;
- Ambu IFU and Quick Guide;
- Hamilton downloads regression;
- document classification;
- resolver confidence;
- retry chain;
- duplicate cleanup;
- no-network regressions through existing test suite.

## Pilot Observations

### Hamilton

Hamilton pages already expose direct PDF links and download buttons. Resolver v2 preserves existing behavior and adds better diagnostics.

### Mindray

Mindray requires stronger resource/download-page handling. Resolver v2 can identify Safety Information and Clinical Information candidates and follow Resources pages through HTTP. Some Mindray document candidates may still fail at trusted download, which is correct: resolver confidence does not bypass artifact validation.

### Ambu

Ambu IFU links and data-download buttons are now handled explicitly. Quick Guide candidates are mapped to `user_manual` with a resolver label in reasons.

### Dräger, Philips, GE Healthcare

Adapters are in place with manufacturer-specific keywords. They are ready for Wave 2 manufacturer runs, but still need product-level pilot data.

## Remaining Limits

- Dynamic download widgets can still hide URLs from plain HTTP.
- Resolver v2 does not use browser automation by design.
- It does not infer missing documents.
- It does not create facts from product page copy.
- It does not rank documents for publication.

## Next Steps

1. Re-run Wave 2 manufacturers after Resolver v2 and compare document-candidate counts.
2. Add product-level pilot reports for Ambu, Dräger, Philips and GE Healthcare.
3. Improve trusted downloader handling for official non-PDF download pages.
4. Add manufacturer document-center seeds where product pages remain sparse.
5. Keep all outputs candidate-only until human review and Verification.
