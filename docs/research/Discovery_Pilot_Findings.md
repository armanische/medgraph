# Discovery Pilot Findings

**Status:** MVP-021 pilot findings  
**Scope:** manual-seed discovery for Hamilton and Ambu pilot products

## Products Covered

- HAMILTON-T1
- HAMILTON-C1
- Ambu aScope 4 Broncho
- Ambu aScope 5 Broncho

## Findings

### Hamilton T1

Manual seed discovery can capture:

- official manufacturer product page;
- manual listing on product page;
- technical specification listing on product page;
- brochure listing on product page.

Still missing:

- RU / regulator record;
- direct downloaded PDF artifacts;
- document hashes;
- PDF locators.

### Hamilton C1

Manual seed discovery currently captures only:

- official Hamilton products index.

Still missing:

- exact official product page;
- RU;
- IFU/manual;
- datasheet;
- direct document URLs.

### Ambu aScope 4 Broncho

Manual seed discovery captures:

- Ambu official website;
- Ambu pulmonology products page.

Still missing:

- exact aScope 4 product page;
- IFU from Ambu IFU portal;
- datasheet;
- RU;
- article/SKU mapping.

### Ambu aScope 5 Broncho

Manual seed discovery captures:

- official Ambu aScope 5 Broncho product page.

Still missing:

- IFU artifact;
- datasheet artifact;
- RU;
- article/SKU mapping.

## What Worked

- Manual official seeds produce deterministic discovery reports.
- Trust Tier 1 is assigned to official manufacturer pages and manufacturer
  document candidates.
- Missing document tasks clearly show blockers.
- Reports stay candidate-only and do not create publication data.

## What Needs Automation

- exact manufacturer product page discovery;
- RU/regulator search;
- download link extraction from manufacturer pages;
- PDF download with hash/version recording;
- language detection;
- article/SKU extraction for Ambu;
- category-specific required-document rules.

## Safety Boundaries Preserved

- no verified facts;
- no publication records;
- no Supabase writes;
- no Portal/UI changes;
- no Candidate Claims from snippets;
- no LLM-as-source behavior.
