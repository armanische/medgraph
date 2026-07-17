# RFC-027 — Catalog Content Standard

**Status:** Implemented  
**RFC:** RFC-027  
**Scope:** Public Storefront content and future bulk-import requirements  
**Date:** 2026-07-17

## 1. Executive Summary

This document defines the canonical content standard for CyberMedica's public
Storefront. Its purpose is to make product, manufacturer, and category records
consistent, useful, and ready for future bulk ingestion without changing the
current Storefront architecture.

The existing domain model and Zod validation already provide a strong
structural boundary: strict objects, normalized identifiers, public URL rules,
unique IDs/slugs, referential integrity, and catalog-summary consistency. They
do not yet constitute a content-readiness gate. Arrays may be empty, asset
existence is not checked, and several nested uniqueness and editorial-quality
rules are not enforced.

RFC-027 therefore distinguishes three levels:

1. **Schema-valid** — accepted by the current Storefront Zod schemas.
2. **Catalog-ready** — meets the minimum public card standard below.
3. **Enhanced** — contains recommended content that improves discovery,
   comparison, and conversion.

This RFC documents the contract only. It does not change models, validators,
data, UI, routes, SEO, structured data, or import pipelines.

## 2. Current Storefront Contract

The filesystem repository reads deterministic JSON files from:

```text
data/storefront/
├── products/*.json
├── manufacturers/*.json
├── categories/*.json
└── catalog-summary.json
```

Every entity file contains exactly one strict domain object. Unknown fields are
rejected. The repository loads the complete dataset and validates it as a
single `StorefrontCatalog` before exposing records through Storefront Services.

### Current structural guarantees

- IDs and slugs are non-empty lowercase Latin identifiers containing only
  letters, digits, and hyphens.
- Required text is trimmed and non-empty.
- Timestamps are ISO 8601 datetimes with an offset.
- Public URLs are HTTPS or root-relative paths; external manufacturer URLs are
  HTTPS.
- Product, manufacturer, and category IDs and slugs are unique within their
  entity type.
- Product manufacturer/category references must resolve.
- Related and compatible product IDs must resolve and cannot reference the
  product itself.
- Category parent IDs must resolve and cannot reference the category itself.
- Catalog summary counts must equal the loaded dataset.
- Objects are strict: undeclared internal fields cannot leak into Storefront
  records.

## 3. Field Classification

“Required by schema” means the key must exist with the declared type. It does
not imply that a collection must contain an item. “Catalog-ready” defines the
minimum content expected for a useful public card.

### Product fields

| Field | Schema | Catalog-ready | Notes |
| --- | --- | --- | --- |
| `id` | Required | Required | Stable internal Storefront identifier; immutable after creation |
| `slug` | Required | Required | Stable canonical route key; unique and lowercase kebab-case |
| `manufacturerId` | Required | Required | Must resolve to an existing manufacturer |
| `categoryId` | Required | Required | Must resolve to an existing category |
| `name` | Required | Required | Public product name; include model only when that is the conventional name |
| `model` | Required | Required | Manufacturer model/designation, not an invented SKU |
| `shortDescription` | Required | Required | One concise, standalone sentence for cards and metadata |
| `description` | Required | Required | Product-specific public description, not a copy of the short description |
| `status` | Required | Required | `active`, `on_request`, `discontinued`, or `hidden` |
| `featured` | Required | Required | Editorial boolean; never inferred from data completeness |
| `applicationAreas` | Required array | Recommended | Controlled, deduplicated public use contexts |
| `keyFeatures` | Required array | At least 1 | Prefer 3–6 concise, product-specific features |
| `specifications` | Required array | At least 1 | Normalized technical values grouped for display/comparison |
| `media` | Required array | At least 1 image | Public image with useful alt text; additional media is optional |
| `documents` | Required array | At least 1 official document | Publicly accessible official document appropriate to the product |
| `compatibility` | Required array | Conditional | Empty is valid; add only when explicitly supported by source content |
| `relatedProductIds` | Required array | Optional | Curated Storefront relationships; empty is valid |
| `createdAt` | Required | Required | Stable creation timestamp |
| `updatedAt` | Required | Required | Timestamp of the latest public content change |

### Nested product fields

#### `ProductSpecification`

- `group`, `label`, and `value` are required non-empty public text.
- `unit` is nullable. Use `null` for dimensionless or categorical values; do
  not use an empty string.
- `position` is a non-negative integer and controls deterministic presentation.
- Store the numeric/text value separately from the unit whenever the source
  permits it.
- Do not repeat the same semantic specification under multiple spelling
  variants in one product.

#### `ProductMedia`

- `type` is `image` or `video`.
- `url` is an HTTPS URL or root-relative public path.
- `alt` describes the visible product/media purpose; filenames and empty alt
  text are not acceptable for catalog-ready product imagery.
- `position` is a non-negative integer. The lowest-position image is the
  primary product image.

#### `ProductDocument`

- `title`, `kind`, `publicUrl`, and `language` are required.
- `kind` must use the existing `PRODUCT_DOCUMENT_KINDS` enum.
- `language` should use a consistent BCP 47-style value such as `ru-RU` or
  `en`; a future validator may formalize this.
- `isOfficial` must reflect the actual source. Catalog readiness requires at
  least one official document.
- Internal paths, artifact paths, hashes, evidence IDs, and review metadata are
  prohibited.

#### `ProductCompatibility`

- `label` and `note` are required public text.
- `compatibleProductId` is nullable because an explicitly named compatible
  item may not yet exist in Storefront.
- Set `compatibleProductId` only when the target record exists and the
  relationship is explicitly supported; never infer compatibility by category,
  manufacturer, model family, or analogy.

## 4. Product Content Standard

A product may be considered **catalog-ready** only when all of the following
are true:

### Identity and classification

- stable unique `id` and `slug`;
- existing manufacturer and category references;
- non-empty public name and explicit model;
- a valid public status.

### Descriptions

- short description explains what the product is in one sentence;
- full description explains purpose and differentiating characteristics;
- neither description contains unsupported commercial, registration,
  verification, availability, or performance claims;
- no placeholder text such as “TBD”, “coming soon”, or copied filename.

### Features and specifications

- at least one key feature;
- at least one normalized technical specification;
- labels and units use category-consistent terminology;
- duplicate labels, conflicting values, and duplicated positions are resolved
  before activation.

### Documents and media

- at least one official public document;
- at least one usable public product image;
- every root-relative file exists under `public/` before promotion;
- media type, extension/MIME, and actual content agree;
- document links do not point to internal JSON or local filesystem paths.

### Relationships

- related and compatible IDs resolve to other products;
- self-references and duplicate relationship IDs are prohibited;
- compatibility is optional and fail-closed: absence is preferable to an
  inferred relationship.

### Enhanced product content

The following are recommended but do not block an otherwise complete record:

- 3–6 key features;
- specifications covering the category's primary decision fields;
- multiple official document types and relevant languages;
- additional images/views with deterministic positions;
- application areas;
- curated related products;
- resolvable compatibility links when documented.

## 5. Manufacturer Content Standard

### Schema-required fields

The current `Manufacturer` model requires:

- `id`;
- `slug`;
- `name`;
- `country`;
- `shortDescription`;
- `description`;
- `logoUrl` (nullable);
- `websiteUrl` (nullable);
- `status`;
- `createdAt` and `updatedAt`.

### Catalog-ready manufacturer

A catalog-ready manufacturer must have:

- stable unique ID and slug;
- canonical public name;
- non-empty country;
- concise card description and distinct full description;
- active or hidden status chosen explicitly;
- valid timestamps.

Recommended enrichment:

- a stable public logo URL with an accessible rendering context;
- the official HTTPS website when it is intended for public use;
- consistent country naming across the catalog.

Logo and website remain nullable. Missing values must be represented as `null`,
never as empty strings, generic placeholders, distributor URLs, or guessed
domains.

## 6. Category Content Standard

Although not explicitly requested as a separate profile, category quality is a
prerequisite for mass product import. A category must have a unique ID/slug,
public name, short and full descriptions, deterministic position, explicit
status, valid timestamps, and a valid nullable parent reference.

Recommended enrichment includes a stable public image and an agreed category
specification vocabulary. Category trees must be acyclic; the current validator
rejects direct self-parenting but does not yet detect multi-node cycles.

## 7. Current Catalog Baseline

The audit covered the current `data/storefront` dataset:

| Measure | Result |
| --- | ---: |
| Products | 2 |
| Products with short/full descriptions | 2 / 2 |
| Products with key features | 2 / 2 |
| Products with specifications | 2 / 2 |
| Products with at least one official document | 2 / 2 |
| Products with at least one image | 1 / 2 |
| Products with compatibility entries | 1 / 2 |
| Manufacturers | 2 |
| Manufacturers with complete descriptions/country | 2 / 2 |
| Manufacturers with logo | 0 / 2 |
| Manufacturers with official website | 1 / 2 |
| Categories | 2 |
| Categories with image | 0 / 2 |

Observed readiness gap:

- `Ambu VivaSight 2 DLT` has no product image and therefore does not meet the
  catalog-ready media baseline defined by this RFC.
- Both manufacturers rely on the UI initial fallback because `logoUrl` is
  `null`; this is valid but not enriched.
- Both categories have `imageUrl: null`; valid, but not enriched.
- The FS510 compatibility record names an external model but has no resolvable
  Storefront `compatibleProductId`. It must remain text-only until a target
  record exists and compatibility remains explicitly supported.

No duplicate entity IDs/slugs or broken aggregate references are present, and
the current summary matches the dataset. Root-relative FS510 media/documents
exist in `public/products/fs510/`. External URL reachability was not tested by
this repository-only audit.

## 8. Validation Rules

### Existing blocking validation

The current `validateStorefrontCatalog()` correctly blocks:

- malformed or unknown fields;
- empty schema-required text;
- invalid identifiers and status/document/media enum values;
- invalid URL protocols;
- malformed timestamps;
- duplicate entity IDs or slugs;
- missing manufacturer/category/related/compatible/parent references;
- self-related/self-compatible/direct self-parent records;
- incorrect catalog summary counts.

### Required pre-import quality validation

Future bulk-import tooling should add a separate quality-validation stage. This
stage must not weaken or replace the current Zod aggregate validation.

#### Blocking errors

- missing catalog-ready identity or description field;
- duplicate ID or slug within the incoming batch or existing catalog;
- unresolved foreign key;
- invalid or unsafe URL;
- missing root-relative asset;
- media/document content inconsistent with declared type;
- duplicate related/compatible ID or self-reference;
- duplicate document URL or media URL within a product;
- duplicate specification identity within a product;
- duplicate/conflicting presentation positions within the same collection;
- category cycles of any length;
- invalid timestamp ordering (`updatedAt < createdAt`);
- summary mismatch after applying the batch;
- unknown field or internal metadata in a public record.

#### Readiness errors for public statuses

For `active` and `on_request` records:

- no key features;
- no specifications;
- no official document;
- no usable image.

An import may retain an incomplete record only as `hidden`; it must not silently
promote incomplete content to a public status.

#### Warnings

- missing manufacturer logo or official website;
- missing category image;
- fewer than three key features;
- only one product document;
- compatibility label without a resolvable product ID;
- repeated editorial wording across short/full descriptions;
- inconsistent vocabulary or units relative to the category profile;
- external asset/link availability not confirmed during the current run.

## 9. Bulk Import Readiness

### Accepted format

Bulk import should produce the existing Storefront format, not a parallel
schema:

- UTF-8 JSON;
- one strict entity object per file;
- products, manufacturers, and categories in their existing directories;
- one recomputed `catalog-summary.json` using schema version `1`;
- deterministic lowercase kebab-case filenames matching the entity slug;
- ISO 8601 timestamps with offsets;
- only existing enum values and public-safe fields.

If an upstream CSV, spreadsheet, CMS export, or vendor feed is accepted, it must
be transformed into this canonical JSON shape before Storefront validation. The
transport format is not a Storefront domain model.

### Import phases

```text
Acquire batch
    ↓
Parse and map to canonical Storefront objects
    ↓
Per-record structural validation
    ↓
Normalization and deterministic deduplication
    ↓
Aggregate reference and uniqueness validation
    ↓
Content-readiness and asset checks
    ↓
Recompute summary in staging
    ↓
Full validateStorefrontCatalog() validation
    ↓
Review error report
    ↓
Atomic promotion or safe partial promotion
```

### Error handling

Every rejected record should yield a deterministic issue containing:

- severity (`error` or `warning`);
- stable rule code;
- entity type;
- entity ID/slug when available;
- source file/row;
- JSON path;
- human-readable message.

Critical parse, schema, uniqueness, reference, asset, or summary errors block
promotion. No invalid data may be written into the canonical directories.

### Partial application

Atomic all-or-nothing promotion is the default and safest behavior. Partial
application is acceptable only when rejected records and every record that
depends on them are excluded as a closed set. The retained subset must pass the
complete aggregate schema and summary validation independently. A partial
import must never leave broken references or stale summary metrics.

### Rollback

Before promotion, preserve the previous canonical catalog snapshot or Git tree
state. Promotion should replace the validated set atomically. Rollback restores
the previous complete snapshot, not individual files selected ad hoc. Import
reports must identify the input batch and resulting catalog revision without
exposing internal Review, Publication, Evidence, or artifact metadata.

### Idempotency and determinism

- identical input against the same base catalog produces identical entity
  content and summary;
- file order cannot affect the result;
- repeated imports do not create duplicate IDs, slugs, media, documents, or
  relationships;
- generated timestamps must not change solely because validation was rerun;
- normalization rules are versioned and reported.

## 10. Quality Principles

Storefront content must be:

- **accurate** — no unsupported facts or inferred compatibility;
- **consistent** — category vocabulary, units, languages, and naming follow one
  convention;
- **complete** — public records meet the catalog-ready baseline;
- **public-safe** — no internal IDs beyond Storefront entity relationships, no
  evidence/review metadata, filesystem paths, hashes, or private notes;
- **deterministic** — order and identifiers remain stable;
- **usable** — descriptions, media, documents, and specifications serve a clear
  catalog task;
- **SEO/structured-data ready** — public fields can be reused without inventing
  missing claims.

## 11. Known Gaps and Recommendations

### Safe next step

Create a separate read-only catalog content audit command that reports the
documented readiness errors and warnings without changing the domain schema or
canonical data. It should reuse `validateStorefrontCatalog()` for structural
validation, then apply quality rules.

### Before mass import

1. Agree category-specific required specification labels and unit vocabulary.
2. Define deterministic nested uniqueness keys for specifications, documents,
   media, and relationships.
3. Add local asset existence/signature checks and bounded external URL checks.
4. Define a staging directory and atomic promotion boundary.
5. Define stable error codes and a batch report contract.
6. Require the full catalog-ready gate before assigning a public status.
7. Add fixture-based tests for invalid batches, safe partial application,
   idempotency, and rollback metadata.

These are future implementation steps. RFC-027 performs no importer or
validation-code change.

## 12. Out of Scope

- UI or route changes;
- Storefront API/model/schema changes;
- modifications to current Storefront data;
- SEO or structured-data changes;
- FS510, Review, Publication, Evidence, or Wave 2 changes;
- implementation of a bulk importer, audit command, promotion, or rollback.

## 13. Final State

CyberMedica now has a documented content-readiness standard layered on top of
the existing structural Storefront contract. It defines the minimum public
product and manufacturer content, current validation guarantees, missing
quality rules, canonical bulk-import format, error policy, safe partial
application, determinism, and rollback expectations without changing the
running architecture.
