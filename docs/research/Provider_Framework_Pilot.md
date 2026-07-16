# Provider Framework Pilot

**Task:** MVP-041 — Secure Manufacturer Providers Framework  
**Status:** framework and deterministic tests implemented; existing pipeline unchanged

## Pilot scope

The pilot introduced independent Provider Strategies for Hamilton, Mindray, Ambu, Dräger, Philips, GE HealthCare and an unknown-manufacturer fallback. It validates official-host boundaries and classifies common manufacturer sections:

- Products;
- Downloads;
- Resources;
- Support;
- Documentation;
- Library;
- Media;
- Professional;
- Technical Documentation;
- Customer Portal detection only.

## Findings

Manufacturer-specific URL strategy belongs before document resolution, while HTML parsing, document classification and trusted downloading should remain in the existing pipeline. Keeping providers pure and input-driven makes regional and portal behavior testable without live-network dependence.

Canonical normalization must happen before deduplication. Otherwise HTTP/HTTPS variants, tracking links, fragments and known redirect targets inflate candidate and download counts. Regional locale paths must remain visible because their document sets may differ.

Customer and partner portals require an explicit unsupported state. Detecting a portal is useful diagnostics; attempting authentication would violate the research import boundary.

## Test coverage

The pilot tests:

- automatic provider selection and aliases;
- fallback provider selection;
- HTTP-to-HTTPS and canonical URL normalization;
- tracking parameter removal;
- regional locale detection;
- duplicate removal after normalization;
- documentation/customer portal detection;
- diagnostics generation;
- independent Products, Documentation and Downloads discovery methods.

## Safety result

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No Review Queue, Candidate Claims, Verification, Publication, Supabase, public API, Portal or UI implementation was changed.

## Recommended follow-up

1. Feed observed redirect/canonical metadata into providers from Resolver v2 without moving network access into provider classes.
2. Persist provider diagnostics alongside resolver diagnostics in a future versioned report schema.
3. Add fixture-based manufacturer section tests before connecting providers to live discovery.
4. Add explicit domain-review governance for acquisitions and manufacturer domain migrations.
5. Measure candidate reduction per manufacturer before enabling provider filtering in production runs.

## Limitations

This pilot provides the framework and safe strategies, not a crawler. It does not bypass gated portals, resolve JavaScript-only widgets, download artifacts or decide evidence truth. Downstream trust validation and human review remain mandatory.
