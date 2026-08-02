# Published Catalog transport resilience

## Constitutional reliability principle

> Transient Published Catalog transport failures must not make the public
> CyberMedica storefront unavailable when a validated last-known-good
> published snapshot exists.

The public Storefront uses one server-only path: Production Supabase
`cloud_api.cloud_published_storefront_catalog_v1` → bounded transport wrapper →
strict public projection validation → Storefront mapper. Credentials and
lifecycle rows never enter the snapshot.

## Runtime contract

- each attempt has a 2.5 second timeout;
- at most three attempts are made;
- backoff is 200 ms then 450 ms with ±20% jitter;
- only timeouts, network failures, HTTP 408/425/429 and 5xx are retried;
- authentication, authorization, schema and validation failures are not retried;
- a live response is accepted only after strict schema, referential, identity,
  slug, summary, monotonicity and document-checksum checks;
- invalid, empty, partial or regressed responses never replace LKG;
- Production builds capture a complete public-only LKG from the exact project;
- warm runtimes retain the newest validated projection in process memory;
- without a valid snapshot, route/global error boundaries render a finite,
  visible server error state.

The sanitized health endpoint is `GET /internal/health/catalog`. It reports
only health state, projection metadata prefix, snapshot age/count and fallback
activation. It never returns Product payload, raw upstream error or secrets.

## Deployment gate

`prebuild` runs the LKG capture and transport fault suite. The repository CI
gate adds WebKit/iPhone navigation with live transport forced unavailable.
Production promotion additionally requires canonical Chromium/WebKit smoke and
the scheduled corporate synthetic monitor.
