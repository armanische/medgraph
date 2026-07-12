# Provider Diagnostics Pilot

**Task:** MVP-042 — Provider Diagnostics Integration  
**Status:** product and aggregate reports regenerated; existing discovery behavior preserved

## Pilot products

| Product | Selected provider | Candidate / normalized URLs | Fallback | Result |
| --- | --- | ---: | --- | --- |
| Hamilton T1 | `hamilton` | 1 / 1 | No | Strategy and URL decision persisted |
| Mindray A5 | `mindray` | 1 / 1 | No | Manual-seed report regenerated without crawling |
| Ambu aScope 5 Broncho | `ambu` | 1 / 1 | No | Manual-seed report regenerated without crawling |
| Dräger Atlan A300 | `drager` | 1 / 1 | No | Manual-seed report regenerated without crawling |
| Unknown manufacturer fixture | `default` | 1 / 1 | Yes | Original tier-3 source and URL remained unchanged; warning persisted |

Dräger and Draeger aliases select the same provider. GE HealthCare and General Electric Healthcare aliases select `ge-healthcare`.

## Aggregate diagnostics

The required unfiltered `npm run discover:catalog-sources` run processed 49 catalog products and produced:

- providers used: `ambu`, `default`, `ge-healthcare`, `hamilton`, `mindray`;
- products per provider: default 38, Hamilton 2, GE HealthCare 2, Mindray 6, Ambu 1;
- fallback products: 38;
- candidate URLs: 9;
- normalized URLs: 9;
- duplicates removed: 0;
- blocked URLs: 0;
- unsupported portals: 0.

The aggregate contains 15 unique fallback warnings: one for missing manufacturer data and fourteen for currently unconfigured manufacturers. These warnings expose coverage gaps without changing trust or readiness.

## What became transparent

- automatic provider selection is visible per product;
- the exact strategy name is persisted;
- original candidate URLs and normalized diagnostic URLs can be compared;
- fallback use is countable;
- blocked URL and deduplication outcomes have aggregate totals;
- authentication-gated portals have a structured, non-fatal representation.

## Portal and authentication blockers

The live catalog run exposed no authentication portal among its nine candidate URLs. Fixture coverage confirms that customer, partner and login-only portals are recorded with `requiresAuthentication=true`, `supported=false` and a reason, without any authorization attempt.

## Before Philips and GE

1. Add product fixtures containing real public support/documentation and gated portal links.
2. Pass observed canonical redirect targets from Resolver v2 rather than guessing them in providers.
3. Review the 38 fallback products and configure providers only where official-domain ownership is known.
4. Compare provider diagnostics counts with resolver attempts to detect shared-section candidate inflation.
5. Keep regional pages distinct until documentary equivalence is explicit.

## Safety confirmation

```text
publicationCreated = false
verifiedClaimsCreated = 0
supabaseWrites = false
verificationChanged = false
reviewDecisionsChanged = false
```

No crawling, authentication, Trusted Downloader behavior, Candidate Claim semantics, Review Queue logic, Verification, Publication, Supabase, public API, Portal or UI implementation was changed.
