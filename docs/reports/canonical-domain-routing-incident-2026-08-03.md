# Canonical domain routing incident — 2026-08-03

## Incident status

The reported legacy `/catalog` response was not reproduced by independent
cache-busted HTTP, mobile Safari User-Agent, clean browser, DNS, or saved Vercel
deployment probes. The server-side split-routing root cause therefore remains
unproven. No DNS record, redirect, rewrite, Tilda binding, or Product state was
changed on assumption.

A separate proven control-plane weakness was found: the canonical aliases were
assigned to manual Production deployment
`dpl_CTFVEoHqU3eMCEz7uGBA4UKVH4kx`, whose Vercel source is `vercel deploy`
rather than a Git commit. Its current content is canonical, but an untracked
Production artifact makes alias changes insufficiently auditable and prevents
the release process from proving that every canonical route belongs to the
approved Git release.

## Evidence before corrective

| Check | Result |
| --- | --- |
| Authoritative NS | `ns1.reg.ru`, `ns2.reg.ru` |
| Apex A | `216.198.79.1` |
| Apex AAAA | none |
| `www` CNAME | `1ac5094ae1c52b74.vercel-dns-017.com` |
| Wildcard A | none |
| Public resolver divergence | none across Cloudflare, Google, Quad9, Yandex |
| Vercel Domains | apex valid Production; `www` valid 301 to apex |
| `/catalog` desktop/mobile | 200; Vercel; Next.js matched path; 71 Products |
| Legacy page-shell markers | 0 `Made on Tilda`; 0 `medvist.ru`; 0 2019 footer |
| Sitemap | 71 unique canonical Product URLs |

`static.tildacdn.com` appears only in approved published Product media. The
scanner excludes those exact media URLs before checking the routing surface.

Current and six retained Production deployment URLs were also probed directly.
Every `/catalog` returned the Next.js catalog with zero legacy page-shell
markers. This rules out the available Vercel artifacts as the source of the
reported Tilda page.

## Corrective

- all routes now expose one release/deployment/origin fingerprint;
- the release gate rejects mismatched route fingerprints and untracked releases;
- catalog, sitemap, health, Product Detail, RFQ, login, and anonymous Review
  routing are checked together;
- the corporate synthetic interval is five minutes;
- clean iPhone WebKit checks blank rendering, runtime errors, legacy shell, and
  horizontal overflow;
- manual `vercel --prod` promotion is prohibited in the release constitution.

The corrective Preview was deployed from Git as
`dpl_AMFrKK5FxCGA8NzvfYEpknAYLPyE` at commit
`3ff09d5247528ae648e3712ee3deb0723e5bd4eb`. It returned the same deployment,
release, and `medgraph` origin fingerprint on the tested routes. The catalog
contained 71 published Products and no legacy page-shell markers. Clean WebKit
validation passed three iPhone profiles across five direct routes.

## Production invariance

This corrective contains no Product, lifecycle, Supabase, migration, ENV, DNS,
or MX change. The pre-corrective public baseline remained Products 79,
Published 71, sitemap 71, projection 73, lifecycle 71/71/71/71.

## Remaining evidence condition

If the same iPhone still shows `Made on Tilda`, its Safari Network response and
headers are required before a server root cause can be declared. Browser data
must not be cleared before that capture. The permanent gate ensures a future
server-side split cannot remain silent.
