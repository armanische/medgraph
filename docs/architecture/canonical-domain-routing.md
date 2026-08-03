# Canonical domain routing

## Invariant

The apex `cyber-medica.ru` is the only public application host. `www` performs
one permanent redirect to the apex. REG.RU DNS points the apex to Vercel and
`www` to its Vercel DNS target. There is no AAAA, wildcard web record, external
rewrite, fallback origin, service worker, or registrar forwarding in the
application contract.

Every application route carries a sanitized build-time fingerprint:

- `X-CyberMedica-Origin: medgraph`;
- `X-CyberMedica-Deployment: <Vercel deployment id>`;
- `X-CyberMedica-Release: <Git commit SHA>`.

The external gate accepts a release only when all tested routes have the same
fingerprint, Vercel headers, canonical final host, valid content, and matching
catalog/sitemap counts. A Git SHA of `untracked` is not canonical-ready.

## Legacy marker policy

The gate rejects Tilda page-shell markers, `Made on Tilda`, `tilda.cc`,
`medvist.ru`, and the historical 2019 footer. It deliberately removes exact
`https://static.tildacdn.com/...` Product media URLs before this scan so that
approved published media cannot create a false routing incident.

## Promotion

Only a Git deployment from the protected `production` branch may own the
canonical aliases. Preview and manual CLI deployments are immutable test
artifacts and MUST NOT be promoted to `cyber-medica.ru`.
