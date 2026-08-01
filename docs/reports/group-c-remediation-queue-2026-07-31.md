# Group C Remediation Queue — 2026-07-31

## Current scope

After publication of the resolved Group B six, 37 Products remain unpublished
and blocked from the publication lifecycle:

- 36 original unresolved Products from the authoritative model-resolution pass;
- DIXION Instilar 1438, retained as a duplicate candidate of Instilar 1428.

The original 36 identities remain defined by the authoritative
[model-resolution report](./remaining-catalog-authoritative-model-resolution-2026-07-31.md).
Instilar is governed by the separate
[dedup backlog](./instilar-1438-dedup-backlog-2026-07-31.md).

## Remediation order

| Priority | Scope | Required evidence | Блокирует запуск |
| --- | --- | --- | --- |
| 1 | Duplicate candidates, beginning with Instilar 1438 | Stable identity collision analysis and explicit dedup policy | Нет |
| 2 | Products with a likely official exact-model source | Manufacturer page, datasheet or IFU plus media contradiction audit | Нет |
| 3 | Products with ambiguous neighboring models | Product Owner A/B/BLOCK decision after primary evidence | Нет |
| 4 | Products without authoritative model evidence | New research only; remain blocked until evidence exists | Нет |

No Group C Product should receive a patch or lifecycle record until its exact
identity is resolved. Missing registration or documents alone remains a
warning, but identity ambiguity, duplicate identity and explicit media mismatch
remain blocking.

## Batch 1 progress — 2026-08-01

Eight remediated Products completed corporate Review, Approval and Publication
through the immutable Batch 1 manifest. VME-5B and EPK-i7010 remain blocked by
their media corrective, UNIKOS remains blocked by identity evidence, and
Instilar 1438 remains a separate unpublished Product with lifecycle `0/0/0/0`.
The next operation is a read-only selection of a safe Batch 2 from the remaining
29 Products.

## Production baseline

- Products: 79
- Published: 50
- Unpublished / Group C remediation scope: 29
- Revisions / Decisions / Approvals / Batches: `50 / 50 / 50 / 50`
- Projection version: 52
- Sitemap Product URLs: 50

## Batch 2 content checkpoint — 2026-08-02

The remaining 29 Products are now split into controlled streams:

| Stream | Count | State | Next action | Блокирует запуск |
| --- | ---: | --- | --- | --- |
| Batch 2 revision-ready | 13 | Patched, draft, lifecycle `0/0/0/0` | Exact immutable revision manifest | Нет |
| Batch 2 technical corrective | 2 | Гемос/Гемос-ПФ type characteristics cross-contaminated | Narrow characteristic corrective | Нет |
| Batch 3 queue | 10 | High-confidence, Medium-risk, unchanged | Content preparation | Нет |
| Special exclusions | 4 | Unchanged | Separate media/identity decisions | Нет |

The 13 safe patches are recorded in the
[Batch 2 patch report](./group-c-remediation-batch-2-patch-2026-08-02.md).
Production remains `79 / 50 / 29`; lifecycle totals remain `50/50/50/50`.
