# RFC-026 — Storefront Conversion

**Status:** Implemented  
**RFC:** RFC-026  
**Scope:** Public Storefront

## Executive Summary

RFC-026 improves conversion through clearer next actions and stronger internal
linking. It does not alter Storefront models, repositories, services, routes,
SEO, structured data, FS510, Review, or Publication.

Every new destination is derived from an existing Storefront entity or points
to an established public route. No product, manufacturer, compatibility, or
commercial claim is fabricated.

## Journey Audit

| Journey | Previous friction | Implemented result |
| --- | --- | --- |
| Homepage → Catalog | Available | Preserved as primary Hero and final CTA |
| Homepage → Search | Available | Preserved as direct section and `/search` action |
| Homepage → Manufacturers | Available | Preserved through Hero, cards, and final CTA |
| Homepage → Product | Featured cards existed | Preserved through real featured Storefront Products |
| Catalog → Product | Product cards existed | Preserved; filtered empty state now provides recovery actions |
| Product → Manufacturer | Manufacturer was plain text | Manufacturer name now links to its canonical page |
| Product → Compare | No product-page action | Product Hero now exposes “Открыть сравнение” |
| Product → Compatible product | Compatibility was text-only | A link is shown only when an explicit compatible ID resolves to an already loaded related Storefront Product |
| Product → Catalog | Existing secondary action | Preserved in Hero and route-specific not-found state |
| Manufacturer → Product | Product card linked correctly | Link remains explicit and gains a comparison action |
| Compare → Product | Names were plain text | Product names and cards now link to product details |
| Compare → Manufacturer | Manufacturer was plain text | Manufacturer names now link to canonical manufacturer pages |

## Product CTAs

The product detail Hero now exposes three visually ordered actions:

1. request a commercial proposal;
2. return to catalog;
3. open product comparison.

Manufacturer fields in both product summaries are canonical links. Related
product cards separate “open product” and “compare products” actions, avoiding
nested links and preserving keyboard focus order.

Compatibility remains fail-closed. `ProductCompatibility` text is not turned
into a link unless `compatibleProductId` resolves to a Storefront Product that
is already present in the page's related-product data. Current records without
such an ID remain plain text.

## Comparison

Comparison remains a static Server Component and continues to use
`CompareService`. RFC-026 deliberately does not introduce query-driven or
client-side selection because that would either make the existing static route
dynamic or add a new hydration boundary.

The route now provides direct actions to catalog and search. Compared product
cards and table cells link back to product and manufacturer pages. If no
comparable products exist, the page explains the state and offers catalog and
search recovery actions.

Product and manufacturer pages link to the existing comparison route without
inventing a selection model that does not exist in the Storefront API.

## Internal Linking

The resulting public link graph is:

```text
Homepage
├── Catalog ── Product ── Manufacturer
├── Search ─── Product ── Compare
├── Manufacturers ─────── Product
└── Featured Product ──── Catalog / Compare
```

Catalog category and manufacturer query values are now passed into
`CatalogExplorer`. Existing homepage category links therefore initialize the
real Storefront filter rather than opening an unfiltered catalog.

## Empty States

### Empty search

- initial search invites the user to enter a query;
- actions open catalog or manufacturers;
- zero results offer “Очистить поиск” and “Перейти в каталог”.

### Empty catalog result

- hard-coded example searches were removed;
- “Сбросить фильтры” clears query, category, and manufacturer;
- secondary actions open global search and manufacturers.

### Empty comparison

- explains that no comparable products are currently available;
- actions open catalog and search.

### Missing or empty entities

- route-specific product not-found state links to catalog and search;
- route-specific manufacturer not-found state links to manufacturer directory
  and catalog;
- manufacturer without products links to catalog, search, and all
  manufacturers;
- empty manufacturer directory links to catalog and search.

## CTA Consistency

Primary actions use `cm-button-primary`. Secondary recovery or exploration
actions use `cm-button-secondary`. Text links are reserved for contextual
navigation inside cards and summaries. Labels consistently use:

- “Открыть каталог” / “Вернуться в каталог”;
- “Начать поиск”;
- “Производители” / “Все производители”;
- “Открыть карточку”;
- “Открыть сравнение”.

## Accessibility

New CTA controls are native `Link` or `button` elements. Route-specific and
empty-state sections use labelled headings. Comparison links and manufacturer
product comparison actions have descriptive `aria-label` text. No positive
`tabIndex`, custom focus trap, or click-only container was introduced. Card
actions are separate siblings, preventing nested interactive elements and
preserving predictable keyboard focus order.

## Performance

- no new API or filesystem source was added;
- existing Storefront Service reads are reused;
- product compatibility links use already loaded related products;
- no new Client Component was created;
- homepage, product, manufacturer, and compare static-generation behavior is
  preserved;
- no query-driven comparison was introduced because it would make `/compare`
  dynamic;
- client bundles receive no new service or comparison runtime.

## Out of Scope

- new comparison-selection model;
- personalization or recommendations;
- analytics and A/B testing;
- new lead forms or CRM integration;
- new routes or data models;
- changes to SEO or structured data.

## Final State

The Storefront now offers continuous, recoverable navigation between homepage,
catalog, search, products, manufacturers, and comparison. Empty states provide
real next steps, while every entity-level link remains grounded in existing
Storefront data.
