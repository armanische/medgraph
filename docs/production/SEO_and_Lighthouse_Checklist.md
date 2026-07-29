# SEO and Lighthouse Checklist

## Pages to verify

- `/`
- `/catalog`
- `/catalog/[slug]`
- `/products/fs510`
- `/knowledge/fs510`
- `/manufacturers`
- `/manufacturers/[slug]`
- `/request`
- `/thanks`

## Lighthouse categories

- Performance
- Accessibility
- Best Practices
- SEO

Run the checks on desktop and mobile viewports. For mobile, confirm that forms,
tables, catalog cards and CTA blocks do not create horizontal overflow.

## Metadata checks

- Page title is concise, Russian-language and not duplicated with the site name.
- Description explains the page value for medical engineers, clinicians or
  procurement specialists.
- OpenGraph and Twitter previews render without broken image URLs.
- Canonical URL points to the final public path.
- `/sitemap.xml` contains only routes exposed by the active catalog source. In
  Production this is the published projection: public landing, catalog,
  manufacturer/reference routes, request entry point, and published Products.

## Robots strategy

Preview deployments are closed by default:

```txt
User-Agent: *
Disallow: /
```

Production indexing is enabled only for the exact Vercel Production
deployment bound to `cloud_published` and the approved Production Supabase
project (`clbzibuusyuajsylcbvl`). Preview and local environments remain
globally disallowed. Production `robots.txt` allows public crawling and
disallows internal, auth, API, diagnostic, legacy and completion routes; it
exposes:

- `Host: https://cybermedica.ru`
- `Sitemap: https://cybermedica.ru/sitemap.xml`

Root and public Storefront metadata follow the same exact binding: Preview and
local pages receive `noindex`, while the approved Production public pages can
be indexed.

## Before public beta

- Verify the Production Vercel environment is `cloud_published` and bound to
  the approved Production Supabase project; no mutable indexing flag is used.
- Verify that `https://cyber-medica.ru/robots.txt` allows `/` and disallows
  private/legacy surfaces.
- Verify that `https://cyber-medica.ru/sitemap.xml` contains only published
  projection URLs and no draft/static Product routes.
- Add a dedicated OpenGraph image before external announcements.
- Run Lighthouse on the public build, not only local preview.
- Check Google Search Console after the production domain is connected.
- Confirm legal copy for medical information, personal data and request forms.
