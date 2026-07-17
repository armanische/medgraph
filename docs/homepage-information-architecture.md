# RFC-025 — Homepage Information Architecture

**Status:** Implemented  
**RFC:** RFC-025  
**Scope:** Public Storefront

## Executive Summary

The homepage is the primary entry point to the Storefront. Its role is to answer
three questions quickly: what CyberMedica offers, what the visitor can find,
and what action to take next. It guides users into catalog, search,
manufacturers, comparison, and product detail pages without trying to reproduce
the complete catalog on the homepage.

RFC-025 changes presentation and information architecture only. Storefront
Services remain the single data source. Storefront API, routes, metadata,
structured data, FS510, Review, Publication, and pipelines are unchanged.

## Previous State Audit

The previous homepage combined its value proposition, search, audience cards,
and catalog summary inside one large Client Component. That created several
problems:

- Hero and search did not have independent semantic or visual roles;
- the first screen exposed only one explicit action;
- categories appeared after products;
- no dedicated manufacturer discovery section existed;
- the separate statistics block repeated counts already shown in Hero;
- the whole first screen hydrated even though most of it was static content;
- comparison and manufacturer journeys were visually secondary.

The Storefront data itself was already sufficient. No new source, API, or
placeholder content was needed.

## Design Principles

The new homepage is:

- simple and task-oriented;
- explicit about the catalog value proposition;
- search-first without making search the entire Hero;
- based only on real active Storefront entities;
- progressively navigable by catalog, manufacturer, category, and product;
- conversion-oriented through repeated, distinct next actions;
- server-rendered except for the search interaction.

## Information Architecture

The implemented section order is:

1. Hero
2. Search
3. Featured Categories
4. Manufacturers
5. Popular Products
6. Platform Benefits
7. Final CTA

This order moves from orientation to intent, then narrows through taxonomy,
brands, and individual products before presenting benefits and a final action.

## Hero

The Hero now has one clear value proposition:

> Найдите оборудование для клиники и закупки

The short description explains the available content: products,
manufacturers, specifications, and documents. Primary and secondary actions
lead to the catalog and manufacturer directory. Supporting links jump directly
to homepage search and open comparison.

Real Storefront product, manufacturer, and category counts remain visible in a
compact server-rendered summary. The former standalone statistics section is no
longer rendered, avoiding repetition. The summary is hidden on narrow mobile
viewports so the primary search section follows the Hero without a long
intermediate block.

## Search

Search is now a dedicated section immediately after the Hero. It preserves the
existing Storefront `SearchService` autocomplete and `/search?q=` transition,
while improving semantics:

- native search form and submit behavior;
- visible section heading and description;
- associated input label;
- labelled search landmark;
- listbox semantics for results;
- live status semantics for empty results;
- keyboard-accessible result and popular-query buttons;
- direct advanced-search links in Hero and final CTA.

Only this section is a Client Component.

## Featured Categories

Categories come from `CategoryService.getCategories()`. Each card shows the
real Storefront name, short description, and current product count, and leads to
the existing catalog category URL. No category or count is fabricated.

## Manufacturers

The new manufacturer section uses active records returned by
`ManufacturerService.getManufacturers()`. Cards contain the public name,
country, short description, optional logo, and a product count calculated from
the products already loaded for the homepage. Each card links to the canonical
manufacturer route.

## Popular Products

The product section continues to use `productService.getFeaturedProducts()`.
The heading is now “Популярные товары” to make its homepage role clear. Cards
remain real Storefront Products and link directly to canonical product pages.

## Platform Benefits

The benefits section concisely describes the existing Storefront value:

- one equipment catalog;
- manufacturer navigation;
- technical characteristics and comparison;
- commercial-request workflow.

It does not introduce verification, research, review, or publication claims.

## Final CTA

The final dark CTA provides three explicit next actions:

- open the catalog;
- start a search;
- browse manufacturers.

These mirror the principal user journeys established at the top of the page.

## Accessibility

The page has one `h1` in Hero followed by section `h2` headings and card `h3`
headings. Major sections use `aria-labelledby`. Search and action groups use
labelled landmarks. Native links, buttons, and form submission preserve
keyboard navigation; custom interactive controls have visible focus styles.

## Performance

The homepage retains its async Server Component and the same four parallel
Storefront Service reads. No additional API, fetch, or filesystem operation was
introduced. Hero, categories, manufacturers, products, benefits, and CTA are
Server Components. Splitting static Hero content out of the previous client
search boundary reduces rather than expands hydration scope.

The route remains compatible with static generation. Structured data receives
the same homepage description and was not modified by this RFC.

## Future Work

Separate RFCs may consider:

- analytics for search and CTA journeys;
- personalized recommendations;
- A/B testing of Hero copy;
- curated category and manufacturer ordering;
- richer product collections when the Storefront contains enough products.

## Final State

The homepage is now a focused Storefront entry point. It establishes value on
the first screen, makes search immediately available, and provides a predictable
path through categories, manufacturers, products, benefits, and conversion
actions while preserving the existing data and SEO architecture.
