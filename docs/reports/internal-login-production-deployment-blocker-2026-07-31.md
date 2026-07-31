# Internal Login Production Deployment Blocker — 2026-07-31

## Scope

This report records the deployment-control-plane blocker for the reviewed internal login fix. No application, Supabase, Product, lifecycle, ENV or DNS changes were made by this report.

Source commit: `4ea297fd1aece8e434b31dbe7983b9462bb66731`

## Root cause

Vercel rejected both CLI-created deployments because the commit author is not a member of the `medgraph` team:

> Git author `armansmarkosyan@gmail.com` must have access to the team `medgraph` to create deployments.

Affected deployments:

- `dpl_A59JsaLipe3qtqM7mT9iWxYS83Kp`
- `dpl_3HAdUuiJLdvdZ8m2gayjHSdEiGAR`

Both were `BLOCKED`, had no build output, and had `gitSource = null`. The source metadata identified the exact reviewed commit and branch.

## Configuration comparison

The linked project is the approved `medgraph` project (`prj_emEZsTDpPLEaXuC8cM9URmmG0zX8`) with Next.js, root directory `.`, Node.js `24.x`, and the standard `npm run build` command. The project has `gitForkProtection = true`.

The last successful Production deployment (`dpl_5LLDsV9XwLYracEsYincnu8qgY1i`) used the same author email before the current team-access check was enforced. It contained a populated build output and `githubCommitSha`; the blocked CLI deployments did not.

## Corrective attempt and safety decision

The existing Vercel owner is `cybermedicaooo@gmail.com`. A standard invitation for the commit author was attempted, but Vercel rejected it because the team is on the Hobby plan and team members are not permitted.

Deployment protection was not disabled, no billing or plan change was made, and no Git history was rewritten. Metadata overrides do not bypass the author-access check.

## Current state

- Canonical Production remains on the prior READY deployment.
- No Production deployment of the login fix was completed.
- No OTP was sent through the unchanged Production runtime.
- No Supabase or Product lifecycle writes occurred.

## Required owner decision

To deploy the exact commit safely, the Product Owner must either provide an approved Vercel team-access/billing path for the commit author or separately authorize a temporary, reversible Git fork-protection exception with an explicit rollback plan. Neither action was taken automatically.
