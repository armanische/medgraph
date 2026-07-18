# Vercel Preview Deployment Workflow

**Scope:** Storefront visual review
**Preview branch:** `preview/storefront-ux-polish-v1`

## 1. Workflow

```text
feature branch / local changes
        ↓ isolated Storefront commit
preview/storefront-ux-polish-v1
        ↓ push to GitHub
Vercel Git integration or Vercel CLI Preview
        ↓ smoke-check
external Preview URL
        ↓ human visual approval
future production workflow (separate task)
```

Preview is an isolated review environment. It does not replace production,
change DNS, or move `cyber-medica.ru`.

## 2. Branch purpose

`preview/storefront-ux-polish-v1` contains only the reviewed Storefront UX
changes and deployment documentation. User-owned staged catalog and review
decision data are deliberately excluded from its commits.

## 3. Creating the Preview

Preferred flow:

1. Run tests, lint, TypeScript and the webpack production build.
2. Push the preview branch to the configured GitHub remote.
3. Let the existing Vercel Git integration create a Preview Deployment.
4. If Git integration is unavailable and the local project is already linked
   and authenticated, run `npx vercel` without `--prod`.

Never use `vercel --prod` for this workflow.

## 4. Opening and checking the Preview

Use the exact HTTPS Preview URL reported by Vercel. Check `/`, `/catalog`,
product routes, manufacturers, search, compare, `/sitemap.xml`, and
`/robots.txt` on desktop and mobile. Preview deployments must remain
non-indexable unless indexing is explicitly approved for production.

## 5. Updating the Preview

Create another isolated commit on the same preview branch and push it normally.
Do not force-push. Vercel should create a new immutable deployment and update
the branch Preview alias when the deployment succeeds.

## 6. Prohibited before visual approval

- merging or pushing to `main`;
- production deployments;
- changing DNS or assigning the production domain;
- enabling production indexing;
- changing production environment variables;
- committing secrets, `.env.local`, `.vercel/project.json`, screenshots, build
  output, or unrelated staged work.

## 7. Future production deployment

Production promotion is a separate approved task. It requires visual approval,
green checks, a reviewed merge into the production branch, a production smoke
test, and a rollback decision. DNS and domain changes require explicit approval.

## 8. Environment variables

Values are configured only in Vercel and are never committed.

| Variable | Preview requirement |
| --- | --- |
| `CYBERMEDICA_LEADS_WEBHOOK_URL` | Required only for a working lead form |
| `CYBERMEDICA_LEADS_WEBHOOK_TOKEN` | Optional server-only webhook token |
| `CYBERMEDICA_ALLOW_INDEXING` | Leave unset for Preview |
| `CYBERMEDICA_ENABLE_ADMIN` | Leave unset unless protected internal review is approved |
| `CYBERMEDICA_ENABLE_INTERNAL_REVIEW` | Leave unset unless protected internal review is approved |
| `CYBERMEDICA_ENABLE_IMPORT_CENTER` | Leave unset for public Preview |
| `CYBERMEDICA_ENABLE_WAVE2_DASHBOARD` | Leave unset for public Preview |
| `CYBERMEDICA_REVIEWER_ID` | Required only for enabled reviewer writes |
| `CYBERMEDICA_ENABLE_REVIEW_FIXTURES` | Development/test only; leave unset |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional for build; required for the FS510 projection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional for build; required for the FS510 projection |

Import-only variables (`CATALOG_RESEARCH_PROVIDER`, `CHROME_PATH`,
`PDFTOTEXT_PATH`, and `PYTHON_PATH`) are not configured for Preview UI.

## 9. Removing the Preview branch

After acceptance or rejection, first confirm that no further visual review is
needed. Then delete the remote preview branch with
`git push origin --delete preview/storefront-ux-polish-v1` and delete the local
branch from another branch. Removing a branch must not delete production
deployments, domains, or catalog data.
