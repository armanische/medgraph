# Trusted Document Pilot Findings

MVP-022 tested the transition from discovery reports to trusted document processing.

The run used existing discovery outputs under `data/research/discovery/products`.

## Summary

- Product reports processed: 50
- Download attempts: 3
- Downloaded artifacts: 0
- Failed downloads: 3
- Document versions: 0
- Extracted fact candidates: 0
- Candidate claims: 0
- Products ready for review: 0

No fake data was created.

## Hamilton Seeds

### Hamilton T1

Discovery produced three document candidates:

- user manual candidate;
- datasheet candidate;
- brochure candidate.

All three currently point to the Hamilton product page URL rather than a direct downloadable PDF URL.

Download result:

- attempted: 3
- downloaded: 0
- failed: 3
- failure: controlled fetch failure in the current environment
- ready for extraction: no

Finding:

The source is useful for human document discovery, but the pipeline needs direct PDF/document URLs before artifact storage and extraction can proceed.

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

## What Blocked Extraction

- Current Hamilton T1 document candidates are not direct PDF artifacts.
- Ambu candidates do not yet include document URLs.
- Network access may fail in local preview conditions.
- No document version means no extraction and no candidate claims.

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
