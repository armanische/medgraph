# Canonical routing P0 runbook

1. Freeze Product patches, migrations, revisions, Review, Approval, and
   Publication.
2. Capture DNS, redirect chain, headers, body hash, and legacy markers for `/`,
   `/catalog`, `/request`, `/sitemap.xml`, Product Detail, and internal login.
3. Compare authoritative REG.RU answers with at least four public resolvers.
4. Confirm `server: Vercel`, `x-vercel-id`, final apex host, and one matching
   CyberMedica deployment/release fingerprint on every route.
5. Treat `static.tildacdn.com` only as published media provenance. It does not
   prove that a Tilda page served the navigation response.
6. Inspect Vercel Domains, Production deployment provenance, Next.js redirects,
   rewrites, Proxy, service-worker scope, and registrar forwarding.
7. Correct only a proven record, alias, rewrite, forwarding rule, or deployment.
   Never change MX, Supabase, Product data, or lifecycle to repair routing.
8. Run the canonical HTTP gate and clean iPhone WebKit direct-navigation smoke.
9. Resume Product work only after catalog and sitemap counts match, all legacy
   markers are absent, and the synthetic monitor is green.

If server probes are canonical but one device still shows Tilda, capture that
device's Safari Network response and response headers before clearing it. A
stale tab snapshot or browser cache cannot be called the server root cause
without that evidence.
