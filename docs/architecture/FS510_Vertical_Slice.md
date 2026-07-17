# FS510 Vertical Slice

RFC-021 isolates the legacy `/products/fs510` experience from shared platform
modules without changing its URL, UI, data contract, caching, or Supabase
schema.

## Boundary

FS510-specific runtime code lives in two explicit namespaces:

```text
lib/verticals/fs510/
  public-product-page.ts
  sitemap.ts
  supabase-projection.ts
  types.ts

components/verticals/fs510/
  ProvenanceChain.tsx
```

The route remains at `app/products/fs510`. Static assets remain under
`public/products/fs510`. Storefront product data remains in the existing
Storefront catalog and is not owned by this vertical.

## Dependency direction

```text
app/products/fs510
       |
       +--> components/verticals/fs510
       |
       +--> lib/verticals/fs510
                     |
                     +--> Next server primitives
                     +--> public_api.product_pages

app/sitemap
       +--> shared Storefront sitemap
       +--> FS510 vertical sitemap
```

The application composition root may combine shared and vertical outputs.
Shared Storefront modules do not import the FS510 vertical and do not contain
its legacy `/products/fs510` or `/knowledge/fs510` route exceptions.

The intended rule is:

```text
FS510 vertical -> platform primitives
platform modules -X-> FS510 vertical
```

## Projection adapter

`supabase-projection.ts` is deliberately local to the vertical. It:

- is server-only;
- reads `public_api.product_pages` through REST `fetch`;
- uses the existing anon-key/RLS boundary;
- requests the `public_api` profile;
- uses `cache: "no-store"`;
- exposes no mutation method;
- preserves the current not-found and error behavior.

The projection payload parser and its types are local to the same vertical.
They are not general Storefront or platform contracts.

## Sitemap composition

The shared Storefront sitemap owns generic Storefront routes and catalog-derived
product/manufacturer URLs. The FS510 vertical owns only its legacy special
routes:

- `/products/fs510`;
- `/knowledge/fs510`.

`app/sitemap.ts` composes both lists and passes the same last-modified value, so
the emitted URLs, priorities, frequencies, and timestamps are unchanged.

## Non-goals

RFC-021 does not:

- migrate `/products/fs510` to Storefront;
- redirect or change canonical URLs;
- change the UI or provenance presentation;
- change Review, Publication, Verification, or Wave 2;
- change the Supabase schema, RLS, fixture, or SQL smoke test;
- remove the vertical or any database asset.

## Future removal boundary

If a future RFC migrates the route to Storefront and retires public provenance,
the isolated vertical can be evaluated as one bounded unit. Until then, its
loader, adapter, payload types, component, sitemap entries, SQL contract, and
environment variables remain required.
