# Source and Document Discovery

**Status:** MVP-021 foundation  
**Scope:** safe source/document discovery for catalog research  
**Non-goals:** Verification, Publication, Portal UI, Supabase writes

## Purpose

Source and Document Discovery finds candidate official pages, regulatory
records and product documents before extraction. It exists because many Golden
Dataset products remain `needs_source` when official sources are not discovered
reliably.

Discovery output is candidate-only. It must not create Verified Claims,
Publication records or public facts.

## Lifecycle

```text
Product candidate
↓
Source discovery
↓
SourceCandidate ranking
↓
Document discovery
↓
DocumentCandidate ranking
↓
MissingDocumentTask generation
↓
Discovery report
↓
Future extraction / Candidate Claims
```

## SourceCandidate

Represents a possible source for a product.

Fields:

- `sourceId`
- `productSlug`
- `manufacturer`
- `productName`
- `sourceType`
- `url`
- `title`
- `snippet`
- `discoveredBy`
- `confidence`
- `trustTier`
- `requiresHumanReview`
- `reasons`

Allowed source types:

- `official_manufacturer_page`
- `manufacturer_document`
- `regulator_record`
- `distributor_page`
- `scientific_publication`
- `unknown`

Rules:

- snippet is never a fact;
- LLM output is never a source;
- every source requires human review before verification;
- Tier 3/4 sources cannot support publication.

## DocumentCandidate

Represents a possible product document discovered from a source.

Fields:

- `documentId`
- `sourceId`
- `productSlug`
- `documentType`
- `url`
- `title`
- `language`
- `confidence`
- `trustTier`
- `requiresHumanReview`
- `reasons`

Allowed document types:

- `registration_certificate`
- `ifu`
- `user_manual`
- `service_manual`
- `datasheet`
- `brochure`
- `certificate`
- `unknown`

Rules:

- a document candidate is not evidence until downloaded/identified;
- document hash and locator are required later in the evidence chain;
- brochure cannot replace IFU/manual for critical facts.

## MissingDocumentTask

Created when required category documents are absent.

Fields:

- `productSlug`
- `requiredDocumentType`
- `priority`
- `reason`

Current baseline requirements:

- registration certificate or regulator record;
- IFU/user manual;
- datasheet/technical specification.

## Trust Tiers

### Tier 1

- regulator official registry;
- manufacturer official page;
- manufacturer-hosted PDF.

### Tier 2

- authorized distributor with exact manufacturer document;
- official conference/manual repository if manufacturer-owned.

### Tier 3

- dealer pages;
- catalogs;
- secondary sources.

### Tier 4

- random SEO pages;
- marketplaces;
- unverifiable PDFs.

## Safety Boundaries

Discovery must never:

- publish facts;
- create Verified Claims;
- write to Supabase;
- write to `public_api`;
- use Tier 3/4 for publication;
- use snippets as facts;
- use LLM as source;
- auto-resolve conflicts.

## Relation To Evidence And Candidate Claims

Discovery is before Evidence.

```text
SourceCandidate
→ DocumentCandidate
→ downloaded Document Version
→ Locator
→ Extracted Fact
→ Candidate Claim
→ Human Verification
→ Publication
```

Only later pipeline stages may create Evidence Candidates and Candidate Claims.
Even then, Candidate Claims remain unverified and `autoPublish: false`.

## Reports

Per-product reports are written to:

`data/research/discovery/products/<slug>.json`

Aggregate report is written to:

`data/research/discovery/discovery-report.generated.json`

Reports include:

- product identity;
- source candidates;
- document candidates;
- missing document tasks;
- trust summary;
- readiness flags;
- warnings.

## Integration Point

Future research pipeline stages may read discovery reports as source/document
input. If a discovery report is missing, research must continue using existing
provider behavior.

Discovery reports are not generated catalog data for Portal display and must not
be treated as verified knowledge.
