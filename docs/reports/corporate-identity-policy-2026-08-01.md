# CyberMedica — Corporate Identity Policy Closure

**Date:** 2026-08-01
**Canonical email:** `cybermedicaooo@gmail.com`

## Canonical decision

`docs/00-project/PROJECT_GUIDE.md` is the Project Constitution. Version 1.1
establishes the corporate identity for new accounts, integrations, reviewers,
Git operations and infrastructure access. Exceptions are exact-operation only;
an identity mismatch fails closed as `CORPORATE IDENTITY POLICY BLOCKED`.

## Active configuration resolution

The former runtime debt was resolved in the corporate Auth/RBAC corrective:

- the active reviewer UUID/email now belongs to the corporate Auth user;
- login accepts no legacy email;
- callback and protected SSR routes require a live authorized profile;
- Product-specific routes for already published records are read-only;
- completed publication-operation surfaces require the corporate admin.

The database read boundary is additive, authenticated-only and derives identity
from `auth.uid()`. It does not expose direct profile table reads and does not use
service-role in the normal access check.

## Historical references retained

Historical Production launch, Auth incident, reviewer/session and publication
reports preserve the original reviewer email and UUID as audit evidence. They
were not rewritten. Existing Decisions retain their original reviewer binding.

## Secrets and invariance

No password, token, magic link, PKCE verifier, cookie, service key or connection
string is recorded. Corporate user/profile provisioning did not modify Product
data or historical lifecycle records. Deployment and migration evidence is
recorded only after the controlled Production gate completes.
