# Canonical Mobile Routing Incident — 2026-08-02

## Outcome

The reported public split between the current CyberMedica homepage and a
legacy Tilda/medvist catalog was not present in the canonical server routing.
All tested paths resolved to one READY Vercel deployment,
`975fwXLeVNN9mf2XmeprSvFJfGaW`, built from exact commit
`cb993257b1392f0f7275ead3a9e4b71c8480d18b` in project `medgraph`.

The apparent Tilda signal came from approved imported Product media hosted on
`static.tildacdn.com`. The HTML contained no `medvist.ru`, Tilda page-shell,
Tilda block, or registrar-forwarding marker. The repository contains no
external rewrite, user-agent branch, or service-worker registration. Live
`/sw.js`, `/service-worker.js`, and `/manifest.webmanifest` requests returned the
current Next.js 404 response, so a legacy service worker cannot own the route.

The real runtime incident was a transient Published Catalog transport failure.
Vercel recorded one sanitized
`CloudPublishedCatalogRepositoryError` (`code: transport`) for a Product Detail
request at `2026-08-02 19:44:35 +03:00`. The request still returned HTTP 200
through the fail-visible server shell. Subsequent clean WebKit and HTTP smokes
completed without a repeated transport error. No DNS, alias, cache, Product,
lifecycle, Supabase, ENV, or application-code change was required.

## DNS and domain state

The web-routing records were unchanged before and after the incident audit:

| Record | Durable value |
| --- | --- |
| Apex A | `216.198.79.1` |
| Apex AAAA | none |
| `www` CNAME | `1ac5094ae1c52b74.vercel-dns-017.com` |
| NS | `ns1.reg.ru`, `ns2.reg.ru` |
| Wildcard A | none |
| HTTPS/SVCB | none observed |

Vercel Domains showed `cyber-medica.ru` as the Production domain and
`www.cyber-medica.ru` as a 301 redirect to the apex. The current deployment
listed the canonical domain directly and was READY. Git Fork Protection was
enabled. No Tilda domain binding, stale Vercel alias, external proxy, or
registrar URL forwarding was found.

## Route evidence

Every canonical route returned a Vercel response with the expected Next.js
matched path:

| Route | Result |
| --- | --- |
| `/` | 200, current CyberMedica shell |
| `/catalog` | 200, current catalog with 70 Product links |
| `/request` | 200 |
| `/api/request` GET | 405 |
| `/sitemap.xml` | 200, 70 unique Product URLs |
| ten sampled `/catalog/[slug]` routes | 10/10 HTTP 200 |
| `/internal/login` | 200 |
| `/internal/review` anonymous | 303 to `/internal/login?error=AUTH_SESSION_REQUIRED` |
| `/internal/review` corporate session | 200, one pending IDN-03 card |
| `www.cyber-medica.ru` | 301 to `https://cyber-medica.ru/` |

All dynamic HTML responses were private/no-store and contained current Next.js
assets. No legacy Tilda/medvist shell marker appeared in the inspected HTML.

## iPhone/WebKit verification

The Production origin was exercised with Playwright WebKit 1.61.0 using fresh,
isolated contexts for iPhone Safari portrait, iPhone Chrome landscape (WebKit),
and desktop Safari/WebKit. The smoke covered `/`, `/catalog`, `/request`, a
Product Detail route, and `/internal/login`. Each route rendered visible text,
returned HTTP 200, left no streaming loader mounted, and produced no client
console or page error.

An additional clean iPhone Safari context blocked service workers and verified
direct navigation, menu navigation, 70 catalog Product links, Product Detail,
reload, back navigation, and `/request`. The test completed without a white
screen, hydration failure, redirect loop, or runtime exception.

## Production invariance

A Production transaction used `BEGIN`, `SET TRANSACTION READ ONLY`, SELECT-only
queries, and `ROLLBACK`. It confirmed:

- Products: 79;
- Published / Unpublished: 70 / 9;
- Revisions / Decisions / Approvals / Publication Batches: 71 / 70 / 70 / 70;
- Published projection version: 72;
- projection checksum:
  `e2d948c7fd63819099b88431592a643856e50284abebc9a1cf0781c42c2de446`;
- IDN-03 lifecycle: one immutable Revision and zero Decision, Approval, or
  Publication Batch;
- sitemap Product URLs: 70.

The difference between 71 Revisions and the 70 published lifecycle records is
the already-created, still-unpublished IDN-03 revision. Human Review remained
frozen throughout this incident task. Product data, immutable source fields,
migrations, ENV, DNS, corporate identity policy, and historical records were
not changed.

## Corrective disposition

The canonical deployment and aliases were already correct when the incident
was audited, so no destructive cache action, alias reassignment, DNS edit, or
runtime rollback was justified. The safe corrective is evidence reconciliation:
retain the current READY deployment, record the transient transport incident,
and fast-forward canonical Git refs to this descendant after validation.
