# Production Launch Evidence Index — 2026-07-29

This index preserves the audit trail without rewriting historical reports. Old
reports retain their original verdicts and evidence; the launch baseline is the
canonical reconciliation point.

## Evidence chain

| Stage | Canonical evidence | Status at launch |
| --- | --- | --- |
| Corrective architecture | `docs/reports/published-catalog-projection-corrective-fix-v4.md` | historical corrective evidence |
| Projection migration | `supabase/migrations/202607260002` through `202607270002` | 20/21 local projection chain evidence; Production ledger from prior controlled run |
| ACL and Admin corrections | `docs/reports/catalog-admin-product-description-synchronization-corrective-v1.md` and the `202607280001`/`202607280002` migrations | historical apply evidence |
| Candidate payload corrections | `docs/reports/publication-candidate-payload-completeness-corrective-v1.md` and `docs/reports/publication-candidate-function-owner-contract-alignment-v1.md` | historical evidence |
| Hamilton projection completeness | `202607290003_hamilton_storefront_projection_completeness_v1.sql` | latest launch-critical migration |
| Backup | [`post-launch-operational-baseline-2026-07-30.md`](./post-launch-operational-baseline-2026-07-30.md) | fresh backup `production-postlaunch-clbzibuusyuajsylcbvl-20260729T212955Z`; isolated restore PASS; current point includes `202607290003` |
| Canonical release reconciliation | [`canonical-release-reconciliation-2026-07-29.md`](./canonical-release-reconciliation-2026-07-29.md) | fast-forward graph; ready for reviewed branch merge |
| Immutable revision | Revision ID in the launch baseline | prior controlled evidence |
| Human Review | Review Item and Decision IDs in the launch baseline | prior controlled evidence |
| Approval | Approval ID in the launch baseline | prior controlled evidence |
| Publication | Batch ID and Product count in the launch baseline | prior controlled evidence |
| Projection | `cloud_published` public source and version 3 | prior controlled evidence; public HTTP smoke independently checked |
| Mindray publication | [`mindray-sv300-publication-2026-07-30.md`](./mindray-sv300-publication-2026-07-30.md) | exact revision, Decision, Approval and one-Product batch; projection version 4 |
| Third-product audit | [`third-product-selection-2026-07-30.md`](./third-product-selection-2026-07-30.md) | 77 unpublished Products audited read-only; no third Product selected |
| ENV | Vercel Production ENV contract | names/scope recorded; secret values intentionally omitted |
| DNS/TLS | REG.RU/Vercel records in the launch baseline | independently verified at closure |
| Public smoke | Canonical domain and generated deployment checks | HTTP/TLS checks PASS; one test-only RFQ accepted by API/webhook |

## Historical-report policy

Reports with earlier `BLOCKED`, `PARTIAL` or `PROPOSED` statuses remain historical
records. They are not rewritten into a false retrospective PASS. The final
launch baseline supersedes their release decision only for the 2026-07-29
public-launch scope.

## Independent verification boundary

Vercel deployment metadata, Git migration files/hashes, DNS, TLS and public HTTP
smoke were checked during the launch closure. For the post-launch backup,
Production migration ledger, catalog counts, publication evidence rows and
projection state were independently queried read-only; the new database and
roles archives were independently restored in a disposable network-none
PostgreSQL environment. No Production write was performed.

See [the canonical launch baseline](./production-launch-baseline-2026-07-29.md)
for exact IDs, hashes, counts and caveats.

See [the canonical release reconciliation report](./canonical-release-reconciliation-2026-07-29.md)
for the exact deployed SHA, commit inventory, validation results and proposed
branch merge sequence.

See [the post-launch operational baseline](./post-launch-operational-baseline-2026-07-30.md)
for the fresh backup hashes, isolated restore evidence, RFQ boundary and
monitoring thresholds.
