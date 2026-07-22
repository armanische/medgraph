# Product Detail Content Standard v1

**Status:** Implemented for presentation support
**Scope:** Launch Sprint 1 — Product Detail Experience v2
**Date:** 22 July 2026
**Normative basis:** [PROJECT_GUIDE](../00-project/PROJECT_GUIDE.md)

## Purpose

This standard defines the public content contract used by the commercial
product-detail experience. It does not modify Product Data, Cloud Foundation,
the Storefront repository contract, publication decisions, or the Catalog
Baseline. Empty optional content remains hidden or receives an explicit neutral
placeholder; the UI never invents missing facts.

## Product-detail presentation contract

The presentation layer supports:

- a concise public description;
- four to six key advantages;
- ten to fifteen decision-relevant specifications;
- ordered images and optional video;
- canonical manufacturer, country, category, and application areas;
- public documents and registration records;
- optional official manufacturer website;
- optional accessories and consumables.

The current Storefront `Product`, `Manufacturer`, and `Category` domain models
remain the source. `ProductDetailExperience` is a derived, read-only view model:
it limits content for scanning, filters duplicate metadata specifications, and
does not mutate the domain objects.

## Description standard

A product description should fit approximately five to ten lines and answer:

1. What is the product?
2. Who is it intended for?
3. Where is it used?
4. What are its principal differentiators?

Use direct factual language. Avoid generic marketing claims, unverified
performance claims, availability promises, and repeated specifications.

## Source priority (PB-011)

Characteristics and public claims must be supported in this order:

1. official manufacturer website;
2. official manufacturer datasheet;
3. official instructions for use or operator manual;
4. official local representative website;
5. corroboration from three to five established professional suppliers.

When sources conflict, official documentation has priority. A distributor may
help identify a candidate fact but cannot override an official datasheet or
manual. A disputed characteristic is not published until the conflict is
resolved. Absence is preferable to an inferred value.

## Presentation rules

- Hero badges use only explicit Storefront values.
- Patient category and equipment type are displayed only when an explicit
  specification with the corresponding label exists.
- Advantages retain source order and are limited to six.
- Technical specifications retain deterministic position order and are limited
  to fifteen.
- Document cards expose only title, kind, language, official status, and public
  URL.
- A single image does not render thumbnails.
- Multiple media items use a manually controlled horizontal thumbnail strip;
  there is no autoplay.
- Manufacturer data links to the canonical Storefront manufacturer route.
- Missing manufacturer information produces a neutral placeholder and no
  fabricated website, country, or logo.

## Out of scope

- mass content enrichment;
- changes to Product Data or immutable snapshots;
- Cloud writes, imports, migrations, publication, or review-state changes;
- changes to RFQ business logic;
- Production deployment.
