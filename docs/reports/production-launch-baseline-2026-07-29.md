# CyberMedica Production Launch Baseline — 2026-07-29

**Status:** canonical documentation baseline

**Public launch date:** 2026-07-29

**Scope:** documentation-only reconciliation after the first public launch.
Production, code, schema, ENV, DNS and publication state were not changed by
this document.

## 1. Source-of-truth audit

| Evidence | Source | Closure result |
| --- | --- | --- |
| Deployed application commit and deployment | Vercel Production API, project `medgraph` | Independently verified: `201845a3fe5caab23ab72d31ac70d5704c53e1e4`, `dpl_HVumG217appC2rJDbzoH4J5uJ43u`, `READY/PROMOTED` |
| Repository migration chain | Git tree and `supabase/tests/structured-fields-migration-chain-v1.json` | Independently verified: 26 files and pinned hashes |
| Production migration ledger and live business counts | Read-only Production preflight for post-launch backup | Independently verified: 26/26, latest `202607290003`, Products 79, Published 1, Unpublished 78 |
| Publication lifecycle evidence | Read-only Production preflight for post-launch backup | Independently verified and bound to Hamilton-T1 exact Product/revision |
| Backup and restore | Post-launch backup manifest and disposable restore | Independently verified: current backup and restore PASS; prior backup retained as historical baseline |
| Vercel domain binding | Vercel Domain Config API | Independently verified: apex and `www` verified; `www` redirect is 301 |
| Public DNS and TLS | REG.RU/authoritative DNS and HTTPS read-only checks | Independently verified at closure |
| Existing reports and constitutional documents | Git history and tracked `docs/` | Historical evidence retained; index below reconciles the chain |

The Vercel API is the authoritative source for the deployed commit. The
Production branch ref is not silently substituted for that deployment: remote
`production` remains `66b0f97b0d37fc6fef808833a1a90b415975d5de`, while the deployed
launch commit is the approved feature-branch commit above. This reconciliation
is an explicit post-launch action, not an undocumented assumption.

### Git release refs at closure

| Ref | SHA | Meaning |
| --- | --- | --- |
| `origin/main` | `2ef6a576fc19352f5971bf3ac756360220093b1c` | remote integration ref |
| `origin/production` | `66b0f97b0d37fc6fef808833a1a90b415975d5de` | remote Production branch ref |
| Vercel Production deployment | `201845a3fe5caab23ab72d31ac70d5704c53e1e4` | actual deployed launch artifact |

The deployed launch commit is not yet an ancestor of either canonical remote
release ref. No merge, rebase or ref update was performed by this closure.

## 2. Launch identity

- Product: CyberMedica.
- Canonical domain: `https://cyber-medica.ru`.
- `https://www.cyber-medica.ru` permanently redirects to the canonical apex.
- Production Supabase project ref: `clbzibuusyuajsylcbvl`.
- Vercel project: `medgraph`.
- Vercel project ID: `prj_emEZsTDpPLEaXuC8cM9URmmG0zX8`.
- Independently verified deployed commit: `201845a3fe5caab23ab72d31ac70d5704c53e1e4`.
- Independently verified Production deployment: `dpl_HVumG217appC2rJDbzoH4J5uJ43u`.
- Vercel deployment branch metadata: `codex/hamilton-t1-storefront-projection-completeness-launch-v1`.
- Previous projection baseline: `9c89d32833965808301fd15cb853fb8fdbc684f6`.

## 3. Production database baseline

The following values were re-verified read-only against Production while
creating the current post-launch recovery point. No Production write operation
other than the approved read-only backup workflow was performed.

| Property | Launch baseline |
| --- | --- |
| Migration count | 26 |
| Latest migration | `202607290003_hamilton_storefront_projection_completeness_v1.sql` |
| Latest migration SHA-256 | `f24f4ae1a0a51ebc4bc95f19aaa149c6611f0d00c0e8570a4f4c996341cc51be` |
| Products | 79 |
| Published | 1 |
| Unpublished | 78 |
| Published product | Hamilton-T1 only |
| Published projection version | 3 |

Latest launch-critical migration files and repository-pinned hashes:

| Version | Purpose | SHA-256 |
| --- | --- | --- |
| `202607290001` | publication candidate payload completeness | `38f3f9c0180960675eade1dded1b705f55e9bfa390ee12af0eaded34350fc309` |
| `202607290002` | publication candidate function owner alignment | `80605a02e4f747cd169f0fe50d494eb6599a848bc18ff847a0eb4d27a3898b7f` |
| `202607290003` | Hamilton storefront projection completeness | `f24f4ae1a0a51ebc4bc95f19aaa149c6611f0d00c0e8570a4f4c996341cc51be` |

The local manifest and SQL tree independently confirm the 26-file chain and
these three hashes. They do not, by themselves, prove the remote ledger.

## 4. Hamilton-T1 stable identity

| Field | Value |
| --- | --- |
| Production-local Product ID | `e66a1165-030b-4aa4-a400-959f1ac70fe3` |
| Slug | `767632362-330695211247-apparat-ivl-hamilton-t1` |
| Source UID | `330695211247` |
| Source checksum | `92d2302078a65870a3ef1de35e510e3e206f5093c826b8cd9d19a6f3331e9ebb` |
| Model | Hamilton-T1 |

The UUID is an environment-local identity. Cross-environment matching uses
approved stable/natural keys such as source UID, slug and source checksum.

## 5. Publication lifecycle evidence

These IDs are the controlled launch evidence supplied by the publication run;
the exact bindings were independently queried read-only in Production during
the post-launch backup preflight.

- Revision: `8d48a2b5-0842-4796-803f-4e4daf6f6e17`.
- Review Item: `68926883-2923-4dce-acea-cdb13ea08ded`.
- Review Decision: `7d23140c-a67e-4886-af63-31e8bc85864d`.
- Approval: `74b44936-a403-4b92-9fd6-ea125a34553a`.
- Publication Batch: `16c78699-6041-45d8-9c18-2da57c72159d`.
- Reviewer UUID: `0a5270ac-66f2-4711-9701-e0557fcff73a`.
- Reviewer email: `armansmarkosyan@gmail.com`.
- Service principal: `2b1a8543-1ea1-43c8-ad7f-013833b0ecac`.

No session, access token, refresh token, cookie or service-role key is included.

## 6. Integrity contract

The three checksums have different meanings:

| Value | Meaning |
| --- | --- |
| `candidate_payload_checksum` | checksum of the candidate publication payload before immutable revision creation |
| `payload_checksum` | checksum stored by the immutable publication revision |
| `product_identity_checksum` | checksum of stable Product identity fields |

Authoritative values:

- `candidate_payload_checksum`: `70bca4a6707b0b3f52e5bd9535075ca68a31257514e1bf34535e04510a18b562`.
- immutable `payload_checksum`: `f391551c5eede060365d23440f79dce518d41e7197cee01511a63587da97c2bf`.
- `product_identity_checksum`: `495e2a41c1527df3748e6ac0cc770bc4321d8044f121416e6792b2597fc3aea2`.

`create_product_publication_revision_v1` is the normal lifecycle transition
`draft / pending → in_review / in_review`. Creating an immutable revision does
not change Product content.

## 7. Content baseline

Approved content baseline:

- canonical editable locale: `ru`;
- SEO title and description: present;
- public characteristics: 3;
- media: 3;
- canonical `ru` rows: 1;
- other locales: 0;
- old claim occurrences: 0;
- approved expanded claim occurrences: 5.

The five approved claim paths are:

1. `product.shortDescription`;
2. `product.fullDescription`;
3. `product.seoDescription`;
4. `descriptions[0].shortDescription`;
5. `descriptions[0].fullDescription`.

The public characteristic rows are:

1. Категория;
2. Тип товара;
3. Страна производства.

Expanded technical parameters remain a post-launch content task and did not
block the approved first-product launch.

## 8. Backup and recovery

### Current preferred post-launch recovery point

- Backup ID: `production-postlaunch-clbzibuusyuajsylcbvl-20260729T201629Z`.
- Created: `2026-07-29T20:16:29Z`; completed: `2026-07-29T20:40:48Z`.
- Manifest SHA-256: `7a7210a30ca4917509cae8afc419ca54b42edde427561b4630ec359df9301faa`.
- Database archive SHA-256: `0f1790524f4c0d08c8f114a9752b723e6962c05415cf0f9213844d617eb7d924`.
- Roles archive SHA-256: `3749edf4ed6c59c3aac37a4d210a8be4194c8a723ba920f277008298a6579bb4`.
- Artifact permissions: `0600` for archive, roles, manifest and checksum file.
- Tooling: `postgres:17-alpine`, `pg_dump 17.10`; Production server PostgreSQL 17.6.
- Archive scope: application and Supabase auth/storage schemas required for
  faithful restore; DNS, Vercel, ENV and credentials are intentionally
  excluded from the database archive.
- Production preflight: migration ledger 26/26, latest `202607290003`,
  Products 79, Published 1, Unpublished 78, Hamilton-T1 only.
- Lifecycle evidence: revision `8d48a2b5-0842-4796-803f-4e4daf6f6e17`,
  decision `7d23140c-a67e-4886-af63-31e8bc85864d`, approval
  `74b44936-a403-4b92-9fd6-ea125a34553a`, batch
  `16c78699-6041-45d8-9c18-2da57c72159d`; exact Product/revision bindings
  verified.
- Projection: version 3; Published RPC summary 1 product, 25 manufacturers,
  19 categories and 7 application areas; SEO title/description present;
  3 characteristics; 3 media; old claim occurrences 0.
- Checksum triad restored exactly: candidate
  `70bca4a6707b0b3f52e5bd9535075ca68a31257514e1bf34535e04510a18b562`, payload
  `f391551c5eede060365d23440f79dce518d41e7197cee01511a63587da97c2bf`, identity
  `495e2a41c1527df3748e6ac0cc770bc4321d8044f121416e6792b2597fc3aea2`.
- Independent restore: PASS in disposable PostgreSQL 17.10 with Docker
  network mode `none`; `pg_restore` exit code 0. Restored migration and
  catalog/lifecycle/projection checks all matched the Production preflight.
- Security baseline: restored `cloud_api`/`cloud` schema boundary,
  publication evidence triggers/constraints and ACL metadata matched the
  read-only Production checks. No credentials were present in the manifest or
  operational report.
- Restore warnings: only expected non-fatal conflicts from replaying built-in
  role/grant statements in the disposable role archive; database archive
  restore itself completed without fatal errors.

### Historical recovery point

The previous backup remains valid and unchanged as a historical baseline:

- Backup ID: `production-postmigration-clbzibuusyuajsylcbvl-20260729T085925Z`.
- Manifest SHA-256: `37b05232bd4472e1362baa52ef6c88b9f280ff749e2a0b34f0c161b376e08a80`.
- Database archive SHA-256: `d7fe4af532cd2e18ee8bd99ee73293d926aa1a101dec81a752e0d98b037bffe8`.
- Roles archive SHA-256: `a165e347fef4862122328f44449b30e42dcd939f8d574176191a79a0d4471959`.
- Scope: migrations through `202607290002`; retained for historical recovery,
  not the preferred current restore point.

## 9. Vercel ENV contract

Only names and scope are documented:

| Variable | Scope | Contract |
| --- | --- | --- |
| `CATALOG_DATA_SOURCE` | Production-only | `cloud_published` |
| `CYBERMEDICA_SUPABASE_URL` | Production-only | secret value not documented |
| `SUPABASE_SERVICE_ROLE_KEY` | Production-only | server-only; value not documented |

Static fallback is not active in Production. No secret value is present in
this documentation branch or in this document.

## 10. DNS/TLS baseline

Independently verified at closure:

- Registrar: REG.RU.
- Nameservers: `ns1.reg.ru`, `ns2.reg.ru`.
- Apex A: `216.198.79.1`.
- `www` CNAME: `1ac5094ae1c52b74.vercel-dns-017.com.`.
- `www` response: HTTP 301 to `https://cyber-medica.ru/`.
- Apex response: HTTP 200.
- Vercel domain binding: verified for apex and `www`; no conflict reported.
- TLS: valid Let's Encrypt certificate for `cyber-medica.ru`.

Mail records observed at closure:

- MX priority 10: `mx.yandex.net.`;
- SPF: `v=spf1 redirect=_spf.yandex.net`;
- Yandex verification TXT: present;
- `mail` CNAME: `domain.mail.yandex.net.`.

No DKIM private key or registrar credential is documented.

## 11. Public launch smoke

Canonical read-only smoke at closure:

| Check | Result |
| --- | --- |
| `https://cyber-medica.ru/` | HTTP 200 |
| `https://www.cyber-medica.ru/` | HTTP 301 to apex |
| Hamilton Product Detail | HTTP 200 |
| Product H1 | exactly one |
| SEO title | present |
| Approved characteristics | 3 displayed |
| Media | 3 displayed |
| Old claim `более 9 часов` | 0 occurrences |
| `/request` with Hamilton context | HTTP 200 |
| unsupported `GET /api/request` | HTTP 405 |
| Product-not-found contract | verified in prior launch smoke; live read not re-run in this closure |
| RFQ downstream POST | previously confirmed PASS; not re-submitted after launch |

The canonical page is served by Vercel. Approved media may retain
`static.tildacdn.com` source URLs; that is an external media origin, not Tilda
serving the canonical HTML or domain.

## 12. Auth incident status

The launch record includes the following security incident:

- an earlier bootstrap used an implicit flow;
- session credentials were exposed in browser history;
- that session was treated as untrusted;
- the trusted Human Review session used authorization-code/PKCE flow;
- credentials are not included in this documentation.

`Revocation of the earlier implicit-flow session was not independently verified
in the available evidence.`

Post-launch containment work remains:

- complete Auth/session containment review;
- remove the unsafe bootstrap path;
- confirm revocation policy;
- run a credential leakage audit.

## 13. Post-launch backlog and release reconciliation

Immediate operational tasks:

1. Create a fresh post-launch backup including migration `202607290003`.
2. Confirm search-engine indexing setup.
3. Review Production monitoring and errors.
4. Verify RFQ POST end-to-end on the canonical domain.
5. Confirm mail delivery after the DNS cutover.
6. Reconcile the deployed launch commit into the canonical release branch under
   the normal promotion policy.

Product backlog remains separate: Internal Auth/RBAC corrective, Review
Workspace, Catalog Admin, targeted import contract, publication of the remaining
78 Products, richer technical characteristics, Thank You Page polish, Knowledge
Base visibility and general responsive/UI polish.

## 14. References

- [Production launch evidence index](./production-launch-evidence-index-2026-07-29.md)
- [Production launch decisions](../00-project/production-launch-decisions-2026-07-29.md)
- [Auth incident record](./production-auth-incident-2026-07-29.md)
- [UI Constitution](../00-product/ui-constitution.md)
- [ADR-006](../00-project/ADR/ADR-006-product-publication-foundation.md)
- [Published Catalog Projection](../04-data/published-catalog-projection-v1.md)
