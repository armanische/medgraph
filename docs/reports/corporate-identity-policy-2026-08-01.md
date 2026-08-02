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

The Group C Batch 1 lifecycle closure verified the policy in Production: all
eight new Decisions were created by the corporate admin UUID, and the closed
Approval/Publication runner required the same live corporate session. No new
lifecycle record is bound to the legacy reviewer identity.

## Historical references retained

Historical Production launch, Auth incident, reviewer/session and publication
reports preserve the original reviewer email and UUID as audit evidence. They
were not rewritten. Existing Decisions retain their original reviewer binding.

## Secrets and invariance

No password, token, magic link, PKCE verifier, cookie, service key or connection
string is recorded. Corporate user/profile provisioning did not modify Product
data or historical lifecycle records. Deployment and migration evidence is
recorded only after the controlled Production gate completes.

## Group C Batch 2 revision operation

The Batch 2 runner revalidated the exact corporate email, UUID and `admin` role
before execution. It created only immutable revision and Review Item records;
no Human Review action was automated. All 13 pending records are reserved for
future decisions by the corporate identity through the generic Review Queue.

## Group C Batch 2 publication closure

All 13 Batch 2 Decisions and Approvals were independently verified against the
corporate admin UUID `7e90a993-8b30-4e0d-aff4-a257d5a4a179`. The closed
publication runner required the same active corporate session. No new Decision
or Approval used the legacy identity; historical bindings were unchanged.

## Group C Batch 3 revision operation

The Batch 3 runner required the exact corporate email, UUID, `admin` profile and
active same-origin session. It created only seven immutable Revisions and seven
Review Items. Decisions remain unchanged at 63; the legacy identity was not
used and no Review, Approval or Publication action was available.
