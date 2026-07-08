# Trusted Document Pilot Findings

MVP-022 tested the transition from discovery reports to trusted document processing.

The run used existing discovery outputs under `data/research/discovery/products`.

MVP-023 added a manufacturer document link resolver before the download step. This resolved the main MVP-022 blocker: some manual seeds pointed to official product pages, not direct document URLs.

## Summary

- Product reports processed: 50
- Download attempts: 6
- Downloaded artifacts: 3
- Failed downloads: 3
- Document versions: 3
- Extracted fact candidates: 8
- Candidate claims: 8
- Products ready for review: 1

No fake data was created.

## Hamilton Seeds

### Hamilton T1

Discovery initially produced three manual document candidates that pointed to the product page URL. MVP-023 then resolved three direct PDF candidates from the official Hamilton page:

- technical specification / datasheet PDF;
- user manual PDF;
- brochure PDF.

The original product-page candidates were preserved for traceability, but trusted download rejected them as `text/html`.

Download result:

- attempted: 6
- downloaded: 3
- failed: 3
- document versions: 3
- extracted fact candidates: 8
- candidate claims: 8
- ready for review: yes, candidate-only

Finding:

The resolver successfully turned official product-page links into direct PDF `DocumentCandidate` records. Registration certificate remains missing, so the product is not publication-ready.

### Hamilton C1

Discovery found an official manufacturer source candidate, but no document candidates.

Download result:

- attempted: 0
- downloaded: 0
- ready for extraction: no

Finding:

The next research step is to locate official direct documents: registration certificate, IFU or user manual, and datasheet.

## Ambu Seeds

### Ambu aScope 4 Broncho

Discovery found official Ambu source candidates, but no document candidates.

Download result:

- attempted: 0
- downloaded: 0
- ready for extraction: no

Finding:

The product page is useful as a source candidate, but document discovery must identify direct IFU/datasheet files.

### Ambu aScope 5 Broncho

Discovery found an official Ambu product source candidate, but no document candidates.

Download result:

- attempted: 0
- downloaded: 0
- ready for extraction: no

Finding:

The pilot confirms that manual product-page discovery is not enough for extraction. Direct document discovery remains the required next step.

## What Worked

- Discovery reports were consumed without changing generated catalog data.
- Tier gating was applied before download.
- Duplicate candidates are deduped before download.
- Failed downloads did not stop the run.
- The report shape now carries document versions, extracted facts, candidate claims, warnings, and review readiness.
- Candidate claim handoff remains unverified and non-publishing.
- MVP-023 resolver found same-host Hamilton PDF links from the official product page.
- Offsite PubMed and social URLs were rejected by host policy.

## What Blocked Extraction

- Some legacy manual Hamilton candidates still point to HTML product pages and are rejected by trusted download.
- Ambu pages timed out in the pilot run and did not produce document candidates.
- Network access may fail in local preview conditions.
- Products without document versions still produce no extraction and no candidate claims.

## Automation Recommendations

Next importer work should focus on:

- direct PDF link discovery from official product pages;
- manufacturer download-page parsing;
- language and region selection rules;
- document title normalization;
- retryable failure classification;
- per-manufacturer playbooks for hidden document libraries.

## Safety Notes

The pilot preserved these boundaries:

- no publication;
- no verified claims;
- no Supabase writes;
- no UI/API changes;
- no LLM extraction;
- no OCR;
- no use of snippets as evidence;
- no automatic conflict resolution.
