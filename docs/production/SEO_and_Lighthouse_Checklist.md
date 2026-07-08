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
- `/sitemap.xml` includes the public landing, catalog, knowledge, product,
  manufacturer and request pages.

## Robots strategy

Preview deployments are closed by default:

```txt
User-Agent: *
Disallow: /
```

Public indexing is enabled only when `CYBERMEDICA_ALLOW_INDEXING=1`.
With the flag enabled, `robots.txt` allows crawling and exposes:

- `Host: https://cybermedica.ru`
- `Sitemap: https://cybermedica.ru/sitemap.xml`

The root metadata follows the same flag: preview pages receive `noindex`,
while public builds can be indexed.

## Before public beta

- Set `CYBERMEDICA_ALLOW_INDEXING=1` only for the public production domain.
- Verify that `https://cybermedica.ru/robots.txt` allows `/`.
- Verify that `https://cybermedica.ru/sitemap.xml` returns all expected URLs.
- Add a dedicated OpenGraph image before external announcements.
- Run Lighthouse on the public build, not only local preview.
- Check Google Search Console after the production domain is connected.
- Confirm legal copy for medical information, personal data and request forms.
