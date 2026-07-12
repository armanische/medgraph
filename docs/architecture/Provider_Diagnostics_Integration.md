# Provider Diagnostics Integration

## Position in the discovery lifecycle

Manufacturer Provider diagnostics run inside `discoverProduct()` after the configured `DiscoveryProvider` returns source candidates and before unsafe sources are filtered or Resolver v2 is called.

The lifecycle is:

1. obtain source candidates through the existing DiscoveryProvider;
2. select a ManufacturerProvider from the product manufacturer;
3. calculate provider diagnostics and URL normalization as an observational view;
4. continue the existing safe-source filtering, document discovery and Resolver v2 flow using the original candidates;
5. persist provider diagnostics in product and aggregate discovery reports.

Provider normalization never replaces `SourceCandidate.url`, changes trust tier, creates a source, or changes resolver/downloader input. This preserves existing discovery semantics while making provider decisions auditable.

## Product report contract

Every `DiscoveryProductReport` contains:

- `providerDiagnostics.providerName`;
- `providerDiagnostics.strategyUsed`;
- `providerDiagnostics.pagesVisited`;
- `providerDiagnostics.candidateUrls`;
- `providerDiagnostics.normalizedUrls`;
- `providerDiagnostics.duplicatesRemoved`;
- `providerDiagnostics.blockedUrls`;
- `providerDiagnostics.unsupportedPortals`;
- `providerDiagnostics.warnings`;
- `providerSelectedAutomatically`;
- `fallbackProviderUsed`.

An unsupported portal entry contains its URL, portal type, authentication requirement, support state and reason. Detection is non-fatal and does not attempt authentication.

## Aggregate contract

`discovery-report.generated.json` adds:

- `providersUsed` — unique provider names;
- `productsPerProvider` — product counts by provider;
- `fallbackProviderProducts`;
- `totalCandidateUrls`;
- `totalNormalizedUrls`;
- `totalDuplicatesRemoved`;
- `totalBlockedUrls`;
- `unsupportedPortalsDetected`;
- `providerWarnings` — unique provider warnings.

Existing discovery metrics remain unchanged and are not duplicated.

## Fallback behavior

Missing or unknown manufacturers select `DefaultProvider` automatically. The product report sets `fallbackProviderUsed=true` and records a warning. The fallback does not infer an official domain, promote trust tier or alter source readiness.

## Normalization boundary

Diagnostics normalization may upgrade HTTP to HTTPS, normalize hostname, remove fragments and known tracking parameters, remove redundant trailing slashes and deduplicate exact normalized URLs.

It may not rewrite path semantics, guess redirect targets, merge regional pages, infer trust, authenticate, or bypass a portal. A canonical URL is used only when explicitly supplied by the caller.

## Safety boundaries

The integration changes reporting only. It contains no Supabase writes, Publication or Verified Claim creation, Review Decision mutation, Candidate Claim semantic changes, portal authentication or Trusted Downloader rule changes.
