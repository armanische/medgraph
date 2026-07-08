# CyberMedica Knowledge Ontology

**Status:** MVP-018.5 constitution  
**Scope:** canonical ontology for CyberMedica product knowledge  
**Authority:** all future product, evidence, review, search, compare, AI and public modules should follow this document

## Purpose

CyberMedica is an evidence platform for medical devices. The platform must be
able to ingest real-world data, extract candidate knowledge, support human
review and publish trustworthy product facts without mixing those stages.

This document is the constitution for the CyberMedica knowledge model.

## Constitutional Principles

1. No public fact exists without evidence.
2. LLM output is not evidence.
3. Importers create candidates, not verified facts.
4. Knowledge Engine extracts and organizes candidates, not truth.
5. Human Verification decides whether a claim is true enough.
6. Publication decides whether verified knowledge becomes public.
7. Public Portal reads only published projection.
8. Search must not bypass Verification.
9. AI may explain, draft and retrieve; it must not invent, verify or publish.
10. Conflicts are preserved until reviewed.
11. History is append-only.
12. Compatibility, analogs and clinical notes require human review.

## High-Level Diagram

```text
External Sources
  ├─ Regulator records
  ├─ Manufacturer documents
  ├─ Manuals / IFU / Datasheets
  └─ Secondary sources
        │
        ▼
Importer / Enrichment
  ├─ Source Candidate
  ├─ Document Candidate
  └─ Raw Artifact
        │
        ▼
Evidence Layer
  ├─ Source
  ├─ Document
  ├─ Document Version
  └─ Locator
        │
        ▼
Knowledge Engine
  ├─ Extracted Fact
  ├─ Candidate Characteristic
  ├─ Candidate Claim
  ├─ Conflict
  └─ Missing Information
        │
        ▼
Review Queue
  ├─ Human Verification
  ├─ Claim Decision
  └─ Reviewer Rationale
        │
        ▼
Publication
  ├─ Published Fact
  ├─ Product Projection
  └─ Audit History
        │
        ▼
Public Consumers
  ├─ Portal
  ├─ Search
  ├─ Compare
  ├─ AI Assistant
  └─ Public API
```

## Product Model

The canonical product is `Medical Device`.

Required conceptual sections:

- Identity;
- Classification;
- Documents;
- Technical Characteristics;
- Compatibility;
- Consumables;
- Accessories;
- Replacement Parts;
- Software;
- Warnings;
- Contraindications;
- Maintenance;
- Calibration;
- Service;
- FAQ;
- Procurement Notes;
- Alternative Products;
- Clinical Notes;
- History;
- Evidence;
- Publication Status;
- Review Status;
- Sources.

The product model supports both internal candidate data and public published
data, but these must remain separated by state and boundary.

## Identity

Identity defines what the product is:

- Manufacturer;
- Brand;
- Model;
- Variant;
- SKU;
- Article;
- Registration Number;
- Registration Status;
- Country.

Identity is reviewed when sources disagree. Registration data helps identity,
but does not automatically verify all product facts.

## Classification

Classification defines how the product is grouped and used:

- Category;
- Device Type;
- Risk Class;
- Medical Specialty;
- Intended Use.

Classification drives search, compare, completeness requirements and review
priority.

## Characteristics

Characteristics are typed facts. They belong to groups such as Electrical,
Mechanical, Clinical, Display, Ventilation, Monitoring, Connectivity, Physical,
Environmental, Accessories, Maintenance and Safety.

Canonical value types:

- Numeric;
- Boolean;
- Enum;
- Text;
- Range;
- Calculated;
- Derived;
- Reference;
- Attachment;
- Composite;
- List;
- Temporal.

Rules:

- type conversion does not verify;
- unit normalization does not resolve conflicts;
- calculated values are not evidence;
- derived values are internal unless reviewed.

## Evidence Model

Evidence follows this chain:

```text
Source
→ Document
→ Document Version
→ Locator
→ Extracted Fact
→ Candidate Claim
→ Human Verification
→ Published Fact
```

Responsibilities:

- Source identifies origin and trust type.
- Document describes the logical evidence material.
- Document Version is immutable file/content identity.
- Locator points to the exact evidence location.
- Extracted Fact is raw candidate data.
- Candidate Claim is reviewable but unverified.
- Human Verification records reviewer decision.
- Published Fact is public only after Publication.

No layer may skip the next boundary when moving toward public truth.

## Product State Model

Product lifecycle:

```text
Discovered
→ Research Started
→ Documents Found
→ Characteristics Extracted
→ Candidate Claims Ready
→ Human Review
→ Verified
→ Published
→ Archived
```

State rules:

- Discovered products are not public truth.
- Research can create candidates only.
- Extracted characteristics remain unverified.
- Candidate claims are not public.
- Verified does not automatically mean Published.
- Published data has an audit trail.
- Archived does not delete history.

## Boundaries

### Importer

Can create candidates and artifacts. Cannot verify, publish or mutate verified
facts.

### Knowledge Engine

Can extract, normalize, detect conflicts and create reviewable claims. Cannot
decide truth.

### Review

Can accept, reject or request more evidence. Cannot publish as a side effect.

### Publication

Can publish verified facts into projection. Cannot publish candidates or facts
without evidence.

### Portal

Can display published projection. Cannot read Candidate Claims directly.

### Search

Can index published data. Cannot mix public results with unverified candidates.

### AI

Can retrieve, explain and assist. Cannot be a source, verifier or publisher.

### Future CMS

Can manage editorial surfaces. Cannot edit verified medical facts directly.

## Source Trust Order

Official trust order:

1. Регистрационное удостоверение Росздравнадзора
2. Инструкция производителя
3. Service Manual
4. IFU
5. Datasheet
6. Manufacturer Website
7. Каталог производителя
8. Дилерский каталог
9. Научные публикации
10. Другие источники

Source priority supports review. It does not publish facts automatically.

## Product Completeness

Product Completeness Score is a readiness signal, not verification.

Suggested weighting:

- Documents: 30%;
- Characteristics: 30%;
- Compatibility: 20%;
- Images: 10%;
- Sources: 10%.

The score answers: "Is this record ready for review?" It never answers: "Is this
record verified?"

## Future Module Alignment

Future modules depend on this ontology:

- Search uses published identity, classification and characteristics.
- Compare uses typed published facts and missing-data indicators.
- Review Queue uses candidate claims, conflicts and evidence locators.
- Admin manages workflow without bypassing boundaries.
- Analytics measures coverage but does not affect truth.
- Import Center coordinates candidates and artifacts.
- Manufacturer Dashboard receives submissions as evidence candidates.
- Clinical Notes require reviewer authorship.
- Service Center uses service evidence without turning it into clinical claims.
- Tender Assistant uses published facts and visible evidence.
- AI Assistant retrieves and explains but does not publish.
- Future CMS manages editorial content, not verified facts.

## What Never Happens

- LLM is treated as a source of data.
- AI publishes facts.
- AI verifies claims.
- Importer changes Verified data.
- Knowledge Engine resolves conflicts automatically.
- Portal reads Candidate Claims directly.
- Search bypasses Verification.
- Publication runs automatically from extraction.
- Compatibility is published without human review.
- Analog equivalence is inferred automatically.
- Missing values are guessed from similar products.
- Dealer catalog text becomes verified without review.
- Completeness Score changes publication status.
- Commercial priority changes truth status.
- History is deleted to make data look clean.

## Related Documents

- `Canonical_Product_Knowledge_Model.md`
- `Characteristic_Taxonomy.md`
- `Evidence_Model.md`
- `Product_State_Model.md`
- `Knowledge_Boundaries.md`
- `Future_Modules.md`
- `Real_Data_Enrichment_Pipeline.md`
- `Characteristic_Policy.md`
