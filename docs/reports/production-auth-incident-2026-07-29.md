# Production Auth Incident Record — 2026-07-29

**Classification:** security documentation record; no credentials included

## Incident summary

An earlier bootstrap path used an implicit flow and caused session credentials
to appear in browser history. That session was treated as untrusted. The trusted
Human Review session used the authorization-code/PKCE flow with a clean callback
and server-side session handling.

No access token, refresh token, cookie, authorization code, service-role key or
database credential is recorded here.

## Revocation status

`Revocation of the earlier implicit-flow session was not independently verified
in the available evidence.`

This record therefore does not claim revocation PASS.

## Post-launch actions

- complete the Auth/session containment review;
- remove the unsafe bootstrap path;
- document and test the revocation policy;
- run a credential leakage audit across browser, server logs, build output and
  documentation.

## References

- [Production launch baseline](./production-launch-baseline-2026-07-29.md)
- [Project release process](../00-project/RELEASE_PROCESS.md)
