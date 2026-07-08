# Characteristic Taxonomy

**Status:** MVP-018.5 design baseline  
**Scope:** canonical value types for product characteristics

## Purpose

CyberMedica characteristics must be typed before they can be searched,
compared, reviewed or explained. This taxonomy defines the canonical value
types used by Importers, Knowledge Engine, Review Queue, Search, Compare, AI
Assistants and the Public Portal.

Type does not imply verification. A numeric value can still be unverified.

## Common Fields For All Characteristics

Every characteristic should conceptually carry:

- key;
- display label;
- group;
- value type;
- value;
- unit when applicable;
- context;
- source evidence;
- extraction status;
- review status;
- publication status.

## Numeric

A single numeric value with optional unit.

Examples:

- weight: `27 g`;
- display size: `15 inch`;
- battery runtime: `240 min`;
- oxygen concentration: `21-100%` if represented as separate min/max.

Rules:

- unit is mandatory when the number is physical;
- do not strip test condition;
- do not average conflicting values.

## Boolean

A yes/no value.

Examples:

- has battery;
- supports touch screen;
- sterile;
- single-use;
- MRI compatible.

Rules:

- boolean values are risky when the source wording is conditional;
- "not mentioned" is not `false`;
- compatibility booleans require human review.

## Enum

One value from a controlled list.

Examples:

- registration status: active, expired, suspended, unknown;
- power type: mains, battery, hybrid;
- device category: ventilator, monitor, incubator;
- risk class.

Rules:

- enum mapping must preserve original wording;
- unknown is allowed when evidence is missing;
- importer must not invent enum values silently.

## Text

Free text or reviewer-authored description.

Examples:

- intended use;
- warning;
- procurement note;
- reviewer note;
- product description.

Rules:

- text should keep source and authorship;
- high-risk text requires review;
- AI-generated text cannot be published without human approval and evidence.

## Range

A minimum and maximum value with unit and condition.

Examples:

- tidal volume: `100-2000 ml`;
- operating temperature: `10-40 C`;
- pressure range;
- measurement range.

Rules:

- min and max must use the same unit;
- condition is part of the value;
- ranges must not be inferred from separate unrelated values.

## Calculated

A value computed from other verified or candidate values using an explicit
formula.

Examples:

- completeness score;
- derived footprint area;
- normalized weight class.

Rules:

- formula must be visible;
- calculated values inherit the weakest verification status of inputs;
- calculated values do not become source evidence.

## Derived

A classification or conclusion derived from multiple facts or policies.

Examples:

- review priority;
- category completeness;
- "requires service manual";
- possible analog group.

Rules:

- derivation rule must be deterministic;
- derived values are internal unless reviewed;
- derived values cannot replace source-backed facts.

## Reference

A link to another canonical entity.

Examples:

- manufacturer reference;
- compatible product reference;
- accessory reference;
- document reference;
- alternative product reference.

Rules:

- reference identity must be stable;
- unresolved references remain candidates;
- reference does not imply compatibility unless typed and reviewed.

## Attachment

A file or asset connected to the product or evidence chain.

Examples:

- PDF document;
- product image;
- certificate scan;
- manual;
- brochure.

Rules:

- attachment must have provenance;
- raw artifacts are immutable;
- public use depends on rights, review and publication status.

## Composite

A structured object with multiple typed fields.

Examples:

- dimensions: width, height, depth, unit;
- display: size, resolution, type;
- battery: chemistry, runtime, charge time;
- connectivity: interface, protocol, version.

Rules:

- each subfield keeps type and evidence;
- partial composite data is allowed but must be visible as incomplete;
- composite values should not hide conflicts.

## List

An ordered or unordered set of typed values.

Examples:

- ventilation modes;
- measured parameters;
- compatible modules;
- included accessories;
- certificates.

Rules:

- source may support the whole list or individual items;
- list order should not imply priority unless source says so;
- compatibility lists require review.

## Temporal

A date, date range or time-bound value.

Examples:

- registration issue date;
- registration expiry date;
- document publication date;
- service interval;
- calibration interval.

Rules:

- distinguish source date, retrieval date and publication date;
- stale dates must be reviewable;
- never infer expiry if not stated.

## Characteristic Groups

Canonical groups:

- Identity;
- Classification;
- Electrical;
- Mechanical;
- Clinical;
- Display;
- Ventilation;
- Monitoring;
- Connectivity;
- Physical;
- Environmental;
- Compatibility;
- Consumables;
- Accessories;
- Replacement Parts;
- Software;
- Maintenance;
- Calibration;
- Service;
- Procurement;
- Safety.

## What Never Happens Automatically

- Type conversion does not verify a fact.
- Unit normalization does not resolve conflicts.
- Missing values are not guessed.
- Calculated and derived values are not evidence.
- AI output is not accepted as a characteristic source.
- Search snippets are not characteristics.
