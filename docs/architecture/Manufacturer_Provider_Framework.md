# Manufacturer Provider Framework

## Purpose

The Manufacturer Provider Framework supplies manufacturer-specific, deterministic strategies for finding official product and documentation entry points before document resolution. It is an extension layer around URL discovery and does not replace or mutate the existing Discovery, Resolver v2, Trusted Downloader, extraction, Review Queue, Verification or Publication pipeline.

The implementation lives in `scripts/importers/catalog/providers/`. Each provider is independent and can be selected with `providerForManufacturer(manufacturer)`.

## Contract

`ManufacturerProvider` exposes:

- `discoverOfficialPages()` — official `Products` and product-finder URLs;
- `discoverDocumentation()` — Resources, Support, Documentation, Library, Media, Professional and Technical Documentation URLs;
- `discoverDownloads()` — explicit download sections;
- `normalizeUrls()` — safe canonical normalization and duplicate removal;
- `resolveRegionalSites()` — locale detection without silently merging regional content;
- `detectDocumentPortals()` — document and customer-portal detection without authentication;
- `diagnostics()` — a deterministic audit record for the strategy run.

Methods receive URL candidates rather than fetching arbitrary sites. This keeps network policy, timeouts, HTML parsing and trusted download validation in their existing components.

## Providers

The registry includes Hamilton, Mindray, Ambu, Dräger, Philips, GE HealthCare and `DefaultProvider`. Selection accepts common manufacturer spelling variants and falls back conservatively when no configured manufacturer matches.

Provider configuration defines:

- manufacturer-name matchers;
- allowed official domains;
- a human-readable strategy name;
- priority document sections.

Subdomains of an official domain are allowed. A third-party URL is never promoted to an official candidate merely because its title contains a manufacturer name.

## URL normalization

Normalization performs these bounded operations:

1. use an explicitly supplied canonical URL when available;
2. accept only HTTP(S) public URLs;
3. upgrade HTTP to HTTPS;
4. lowercase the hostname and remove fragments;
5. remove known tracking parameters;
6. sort remaining query parameters;
7. remove redundant trailing slashes;
8. deduplicate after normalization.

Redirect targets are not guessed. The caller may pass the observed final URL as `canonicalUrl`. Regional path segments are reported, not erased, because regional pages can have different regulatory and document content.

## Portal handling

The framework detects documentation, technical-documentation, support, library and customer portals. Customer/partner portals are marked `requiresAuthentication=true`, `supported=false`. Providers must not submit credentials, bypass access controls or represent a gated portal as a downloaded document.

## Diagnostics

Every provider can report:

- provider name;
- strategy used;
- pages visited (official normalized URLs presented to the provider);
- candidate URLs;
- normalized URLs;
- duplicates removed;
- blocked URLs;
- unsupported portals.

Diagnostics are research metadata only. They cannot create Candidate Claims, Verified Claims, Review Decisions or publications.

## Adding a manufacturer

1. Add a class extending `BaseManufacturerProvider`.
2. Configure strict manufacturer matchers and official hosts.
3. Set the manufacturer-specific strategy and preferred sections.
4. Register the class before `DefaultProvider` in `providers/index.ts`.
5. Add selection, normalization, regional, portal and diagnostics tests.
6. Keep fetching and document validation in the existing resolver/downloader pipeline.

## Safety boundaries

The framework contains no Supabase client, publication writer, verification mutation, review-decision processor or authentication implementation. Its output remains candidate discovery metadata and requires the existing trust and human-review controls downstream.

## Limitations

- It does not execute searches or crawl websites by itself.
- It does not follow redirects; callers supply observed canonical targets.
- It cannot read JavaScript-only download widgets without resolver support.
- It does not authenticate to customer portals.
- Locale detection does not assert that two regional pages are equivalent.
- URL/title keyword classification remains conservative and may require manufacturer-specific refinement.
- Official-domain ownership must be configured and reviewed manually.
