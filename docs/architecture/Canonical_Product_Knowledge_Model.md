# Canonical Product Knowledge Model

**Status:** MVP-018.5 design baseline  
**Scope:** canonical knowledge model for medical devices across CyberMedica  
**Non-goals:** implementation, Supabase schema changes, importer changes, UI changes

## Purpose

The Canonical Product Knowledge Model defines the complete conceptual shape of a
medical device in CyberMedica. It is the shared target model for Importers,
Knowledge Engine, Review Queue, Search, Product Compare, AI Assistants, Public
Portal and future CMS.

The model is evidence-first. It can contain draft, candidate, verified and
published knowledge, but those states must remain separate.

## High-Level Entity

```text
Medical Device
├─ Identity
├─ Classification
├─ Documents
├─ Technical Characteristics
├─ Compatibility
├─ Consumables
├─ Accessories
├─ Replacement Parts
├─ Software
├─ Warnings
├─ Contraindications
├─ Maintenance
├─ Calibration
├─ Service
├─ FAQ
├─ Procurement Notes
├─ Alternative Products
├─ Clinical Notes
├─ History
├─ Evidence
├─ Publication Status
├─ Review Status
└─ Sources
```

## Medical Device

The root object. Represents one product-level medical device record, including
its identity, documents, characteristics, compatibility, review status and
published projection. A Medical Device is not automatically public.

## Identity

Identity answers: "What exactly is this product?"

Fields:

- Manufacturer
- Brand
- Model
- Variant
- SKU
- Article
- Registration Number
- Registration Status
- Country

Purpose:

- prevent duplicate records;
- distinguish model, variant and article-level differences;
- connect regulator records with manufacturer documents;
- support search, compare and review.

Rules:

- identity can have multiple observed names and aliases;
- canonical identity is a review decision;
- registration number is strong evidence but not the whole product identity;
- distributor names must not replace manufacturer identity.

## Classification

Classification answers: "What kind of device is this and where is it used?"

Fields:

- Category
- Device Type
- Risk Class
- Medical Specialty
- Intended Use

Purpose:

- category browsing;
- product comparison groups;
- category-specific characteristic requirements;
- review priority and completeness scoring.

Rules:

- intended use is high-risk and must come from official evidence;
- category may be draft, but public category must be reviewed;
- risk class must not be inferred from similar products.

## Documents

Documents are citable materials connected to the device.

Document types:

- Registration Certificate
- IFU
- User Manual
- Service Manual
- Datasheet
- Brochure
- Certificates

Purpose:

- provide evidence;
- allow reviewer inspection;
- support extraction of characteristics;
- maintain document version history.

Rules:

- documents and document versions are separate concepts;
- raw artifacts are immutable;
- dealer brochures are secondary unless reviewed;
- document presence does not equal verification.

## Technical Characteristics

Technical Characteristics are structured facts about the device. They must keep
source, unit, context and review state.

Groups:

### Electrical

Power supply, voltage, frequency, battery, consumption, protection class.

### Mechanical

Construction, moving parts, mounting, load, adjustment mechanisms.

### Clinical

Intended clinical use, measured parameters, patient population, performance
claims and clinically relevant limits.

### Display

Screen size, resolution, display type, touch support, alarm display.

### Ventilation

Modes, flow, pressure range, tidal volume, oxygen settings, trigger, alarms.

### Monitoring

Measured parameters, ranges, accuracy, sampling frequency, modules.

### Connectivity

Ports, network interfaces, protocols, export formats, integration options.

### Physical

Dimensions, weight, materials, color, mounting, footprint.

### Environmental

Operating temperature, humidity, storage conditions, IP rating, noise.

### Accessories

Bundled or compatible items that are not consumables or replacement parts.

Rules:

- characteristics are typed;
- values must not lose units;
- context matters as much as value;
- conflicts are preserved until review.

## Compatibility

Compatibility describes which devices, accessories, modules, consumables or
software versions can work together.

Purpose:

- prevent unsafe substitutions;
- support procurement checks;
- support compare and AI-assisted explanation.

Rules:

- compatibility is never auto-published;
- exact model/version context is required;
- connector match alone is not compatibility;
- human review is mandatory.

## Consumables

Consumables are repeat-use procurement items connected to the device:
breathing circuits, filters, electrodes, tubing, sensors, cartridges and other
replaceable clinical supplies.

Rules:

- consumables require compatibility evidence;
- disposable/reusable status must come from IFU or official documents;
- analog consumables require review.

## Accessories

Accessories extend or support the product but are not consumed during normal
use: stands, modules, probes, adapters, mounts and kits.

Rules:

- accessory compatibility is reviewed;
- package contents must be distinguished from optional accessories.

## Replacement Parts

Replacement Parts are service or repair items: batteries, valves, boards,
sensors, panels and mechanical parts.

Rules:

- service manual is preferred evidence;
- public display may be restricted if parts are service-only;
- replacement does not imply compatibility with all variants.

## Software

Software includes firmware, application modules, licenses, algorithms, versions
and update requirements.

Rules:

- software version is part of compatibility context;
- claims about algorithms require evidence;
- software changes may supersede characteristics.

## Warnings

Warnings are safety-relevant instructions or limitations from official
documents.

Rules:

- never summarize loosely without review;
- preserve source wording and context;
- do not generate warnings with AI.

## Contraindications

Contraindications are restrictions on use from IFU or regulator documents.

Rules:

- high-risk;
- human review only;
- no automatic publication.

## Maintenance

Maintenance describes routine care, inspection, cleaning and preventive tasks.

Rules:

- source must be IFU, user manual or service manual;
- interval and responsibility must be explicit;
- do not infer from product family.

## Calibration

Calibration describes procedures, intervals, tolerances and tools needed to keep
device measurements valid.

Rules:

- critical for measurement and monitoring devices;
- must keep conditions and version context;
- human review required.

## Service

Service includes repair procedures, service intervals, spare parts and service
restrictions.

Rules:

- service manuals are primary evidence;
- public portal may expose only safe summaries;
- service-only claims must not become clinical claims.

## FAQ

FAQ provides reviewer-approved answers to common questions.

Rules:

- answers must reference evidence or published facts;
- AI may draft internally but cannot publish;
- clinical or compatibility answers require review.

## Procurement Notes

Procurement Notes support закупки: what to request, which documents to verify,
and where substitutions may be risky.

Rules:

- notes are advisory, not legal guarantees;
- tender-specific logic must remain evidence-backed;
- commercial relationships must not affect verification.

## Alternative Products

Alternative Products are possible comparables or substitutes.

Rules:

- alternatives are not equivalence claims by default;
- analog/equivalence requires human review;
- comparison criteria must be visible.

## Clinical Notes

Clinical Notes explain usage context, risks and selection considerations.

Rules:

- must be reviewed;
- must not replace official instructions or clinical judgment;
- AI cannot publish clinical notes.

## History

History is append-only information about changes:

- source discovery;
- document versions;
- extracted candidate facts;
- verification decisions;
- publication events;
- supersession and archive events.

Rules:

- history is never overwritten;
- corrections create new decisions or versions.

## Evidence

Evidence connects facts to sources, documents, versions and locators.

Purpose:

- make every public fact auditable;
- show why a claim is trusted;
- support conflict review.

Rules:

- no evidence, no public fact;
- evidence is not the same as a published claim;
- source priority helps review but does not publish.

## Publication Status

Publication Status describes whether a reviewed fact or product projection is
visible publicly.

Example states:

- unpublished;
- ready for publication review;
- published;
- superseded;
- archived.

Rules:

- publication is a separate action after verification;
- generated data cannot become public directly.

## Review Status

Review Status describes internal editorial state.

Example states:

- pending;
- needs evidence;
- needs conflict resolution;
- verified;
- rejected;
- ready for publication.

Rules:

- review status is internal;
- portal must not read candidate claims directly.

## Sources

Sources are origins of information: regulator, manufacturer, document host,
scientific publication, dealer catalog or other cited material.

Rules:

- sources must be typed and ranked;
- source discovery does not verify facts;
- LLM output is not a source.

## What Never Happens Automatically

- LLM becomes a source of data.
- AI publishes facts.
- Importer changes Verified data.
- Portal reads Candidate Claims directly.
- Search bypasses Verification.
- Publication runs automatically from extraction.
- Compatibility is published without review.
- Conflicts are resolved by confidence score alone.
- Missing data is filled from similar products.
