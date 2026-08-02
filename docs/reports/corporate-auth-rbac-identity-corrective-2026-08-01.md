# CyberMedica — Corporate Auth and RBAC Identity Corrective

**Date:** 2026-08-01
**Canonical email:** `cybermedicaooo@gmail.com`
**Corporate Auth UUID:** `7e90a993-8b30-4e0d-aff4-a257d5a4a179`

## Durable Production identity

The corporate Supabase Auth user exists, is email-confirmed, has one linked
identity and a distinct UUID. Exactly one authorized Production profile was
created for that UUID with role `admin`. The transaction changed no other
profile and no Product or publication lifecycle record.

The legacy Auth user and profile remain unchanged for audit continuity. New
login and Review operations no longer authorize that identity in application
configuration; deleting or revoking its underlying Supabase account is outside
this corrective and requires separate authorization.

## Runtime corrective

- Corporate UUID/email is the only active application reviewer identity.
- Login allowlist accepts only the corporate email.
- Callback and protected SSR routes require both verified Auth identity and a
  live `admin`/`reviewer` profile result.
- The read contract takes identity only from `auth.uid()`, accepts no caller
  parameters, returns a minimal DTO and grants execution only to
  `authenticated`.
- Direct authenticated reads of `cloud.user_profiles` remain forbidden.
- Service-role is not part of the normal Auth/RBAC access check.
- Published Hamilton-T1, Mindray SV300 and Agilia SP MC legacy routes are
  read-only redirects; their old actions cannot create another Decision.

## Production invariance evidence

After the exact profile authorization:

- Products: 79;
- Published / Unpublished: 42 / 37;
- Revisions / Decisions / Approvals / Publication Batches: 42 / 42 / 42 / 42;
- projection version: 44;
- pending Review Items: 0;
- non-target profile hash: unchanged;
- Product and lifecycle writes: 0.

Production migration and deployment are not performed by the local preparation
commit. They require the controlled apply/deployment gate and post-apply smoke.

## ИДН-03 corporate lifecycle checkpoint — 2026-08-02

The exact corporate email, UUID and admin profile authorized the digest-bound
ИДН-03 revision runner. It created one immutable revision and one Review Item,
then stopped before Human Review. No legacy identity was used and all new
Decision/Approval/Publication counts for this Product remain zero.
