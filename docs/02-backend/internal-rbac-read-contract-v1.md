# Internal RBAC Read Contract v1

## Purpose

`cloud_api.current_internal_access_v1()` is the minimal authenticated read
boundary for server-rendered internal CyberMedica routes. It lets the next
Internal Auth & RBAC task evaluate the current Supabase user without a
service-role credential, browser access to `cloud.user_profiles`, or a
caller-provided identity or role.

This contract does not implement login, cookies, route guards, Catalog Admin
authorization, or Publication Review actions.

## Function contract

```sql
cloud_api.current_internal_access_v1() returns jsonb
```

The function accepts no arguments. The only identity source is `auth.uid()`.
Its exact DTO keys are:

```json
{
  "userId": "uuid-or-null",
  "role": "admin-or-reviewer-or-null",
  "displayName": "string-or-null",
  "allowed": true
}
```

Only `admin` and `reviewer` profiles return `allowed=true`, their role, and
their display name. A missing profile, unsupported role, or missing
authenticated identity returns `allowed=false`; role and display name are
`null`. The caller's own `userId` may still be returned because it is derived
from the authenticated session rather than profile data.

The current `cloud.user_profiles` schema has no active/inactive column.
Accordingly, v1 does not invent an active-state rule and does not alter the
table. If profile activation is introduced later, it requires a separate
contract change before this RPC can enforce it.

## Security boundary

The function is `STABLE SECURITY DEFINER` with fixed `search_path`:

```text
pg_catalog, auth, cloud
```

Its owner is the dedicated
`cybermedica_internal_access_reader` role. This role is `NOLOGIN`,
`NOINHERIT`, and `NOBYPASSRLS`; it has no members. It receives only:

- schema usage required to resolve the fixed objects;
- `EXECUTE` on `auth.uid()`;
- column-level `SELECT` on `cloud.user_profiles(id, role, display_name)`;
- a role-specific RLS policy restricted to `id = auth.uid()`.

The function contains a single static `SELECT`. It has no dynamic SQL and no
write path. It does not return email, Auth metadata, tokens, timestamps, or
other profile fields.

## Grants

| Principal | RPC execute | Direct `cloud.user_profiles` read |
|---|---:|---:|
| `anon` | No | No |
| `authenticated` | Yes | No |
| `service_role` | No | No new grant |
| dedicated NOLOGIN owner | Owns RPC | Three columns, own-user RLS only |
| `public` | No | No |

The application must call the RPC with the real authenticated user's
Supabase session. Service-role is not part of the normal RBAC path.

## Authorization outcomes

| Caller state | Result |
|---|---|
| anonymous | RPC permission denied |
| authenticated, no profile | `allowed=false` |
| authenticated, `admin` | own minimal DTO, `allowed=true` |
| authenticated, `reviewer` | own minimal DTO, `allowed=true` |
| authenticated, any other role | `allowed=false`, profile fields hidden |
| authenticated A while profile B exists | only A can be resolved |

## Invariants

- No Product, review, approval, publication, audit, or projection write is
  performed.
- No Publication Pipeline, Published Projection, Repository, ProductService,
  Storefront, or UI contract changes.
- No broad authenticated table grant or self-read policy is added.
- Production application of this migration requires a separate explicit
  release decision.

## Verification

The clean local migration-chain suite applies all 22 migrations, then checks
the authorization matrix, actual anonymous denial, actual direct-table denial,
fixed function metadata, constrained owner attributes, grants, RLS isolation,
minimal DTO shape, and before/after business-state equality.

Run:

```bash
npm run qa:internal-rbac:local
```

Existing Product Publication, Structured Fields, and Published Projection
local integration suites remain mandatory regression checks.
