# Published Catalog transport incident runbook

1. Check `/internal/health/catalog`: live state, fallback flag, LKG age and
   Product count.
2. Confirm `/`, `/catalog`, one Product Detail, `/request` and `/sitemap.xml`
   remain accessible on the canonical domain.
3. Compare catalog and sitemap Product counts. Treat divergence, zero count or
   stale fallback as an incident.
4. Inspect sanitized Vercel `published_catalog_read` events by correlation ID;
   confirm retry count, source and error class.
5. Do not change DNS or aliases without independent routing evidence. Image
   assets from `static.tildacdn.com` are not evidence of Tilda page routing.
6. Verify the projection transport and metadata before changing application
   runtime. Never republish Products to repair a read outage.
7. Roll back only when the deployed runtime itself is proven faulty and the
   rollback contains the current published catalog and corporate Auth/RBAC.
8. Recovery is complete when live transport is healthy, fallback is inactive,
   catalog/sitemap counts match and Chromium plus WebKit smoke pass.

Alerts are actionable after consecutive failures, a prolonged fallback,
missing LKG, count divergence, public 5xx or WebKit failure. One recovered
transient retry is logged but does not page the operator.
