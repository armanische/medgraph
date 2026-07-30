# Agilia SP MC Immutable Revision — 2026-07-30

## Result

**PASS — one immutable Product Publication revision created.** The revision
was created in Production through the approved service-only RPC after a
read-only stable-identity and candidate preflight. Human Review, Approval and
Publication were not executed.

## Scope and source

| Field | Value |
| --- | --- |
| Production project | `clbzibuusyuajsylcbvl` |
| Content source branch | `codex/agilia-sp-mc-content-preparation-v1` |
| Content source commit | `a2b1cb81a3a2fae086ce4c4de54bee01d0b3c86a` |
| Product ID | `b7f07e3e-5cdd-4988-b2a4-423bed321f46` |
| Stable source UID | `865619140091` |
| Slug | `767632362-865619140091-shpritsevoi-nasos-fresenius-kabi-agilia` |
| Model | `Agilia SP MC` |
| Manufacturer | `Fresenius Kabi` |
| Source checksum | `521684120f9b21884e5cc05d11ae84de5d3692695ac2b228c8cc044f5b07ec19` |
| Idempotency key | `agilia-sp-mc-initial-production-revision-v1` |

## Preflight evidence

- Stable identity matched exactly one Production Product.
- Product was `draft` / `pending`, with no current revision or approval pointer.
- Agilia lifecycle before write: revision/decision/approval/batch `0/0/0/0`.
- Candidate reads: 10/10 identical.
- Candidate payload checksum: `d14d6199641cec398e2d9ab48e86583fcab1575bd904e03d4fa4d7c0d8060747`.
- Immutable payload fingerprint: `3a00677a295110252d1f963c4296b099de78c36af4ea152d6e655944dedf0472`.
- Product identity checksum: `7e17a8f60997dc9fae5843ef4857e6e634fbd6741baa6ff5e034842c956a9d7e`.
- Canonical `ru` description: 1; characteristics: 3; media: 2.
- Structural blockers and unresolved critical import errors: 0.
- Editorial warnings retained: `missing_registration`, `missing_documents`.

## Durable revision evidence

| Field | Value |
| --- | --- |
| Revision ID | `e09f69c9-fbc5-4f6e-a240-05372e959510` |
| Review Item ID | `a656c3aa-47e8-4985-8d3a-c3af0478829c` |
| Revision number | `1` |
| Schema version | `1` |
| Revision state | `in_review` |
| Review Item state | `in_review` |
| Created at | `2026-07-30T17:45:25.635339+00:00` |
| RPC response idempotent | `false` |
| Current revision pointer | points to Revision ID above |
| Current approval pointer | `null` |

The immutable snapshot includes the Agilia SP MC identity, SEO title and
description, one canonical Russian description, 3 characteristics, 2 media,
zero documents and zero registrations. No other locale or Agilia variant is
present.

## Checksum triad

| Checksum | Value |
| --- | --- |
| Candidate payload | `d14d6199641cec398e2d9ab48e86583fcab1575bd904e03d4fa4d7c0d8060747` |
| Immutable payload | `3a00677a295110252d1f963c4296b099de78c36af4ea152d6e655944dedf0472` |
| Product identity | `7e17a8f60997dc9fae5843ef4857e6e634fbd6741baa6ff5e034842c956a9d7e` |

All three values independently match the approved preparation baseline. A
post-write candidate read returned the same candidate checksum and the
content-only hash remained `3a63b47be1760a0dffb3e50daa0aab880706d292ab22b3c9ec9d89b996218400`.
The immutable source metadata and source checksum were unchanged.

## Production invariance

- Products: 79; Published: 2; Unpublished: 77.
- Published Products remain Hamilton-T1 and Mindray SV300 only.
- Total lifecycle counts after write: revisions/decisions/approvals/batches
  `3/2/2/2`.
- Agilia lifecycle: 1 revision, 1 Review Item, 0 decisions, 0 approvals, 0
  publication batches.
- Hamilton-T1 and Mindray SV300 candidate fingerprints are unchanged.
- Aggregate fingerprint for the other 76 Products is unchanged.
- Published RPC returns exactly 2 products; Agilia is absent from the public
  projection and sitemap surface.
- Projection state remains version 4 with the same generated timestamp and
  payload checksum.
- No migration, Product content mutation, ENV, DNS, indexing, Approval,
  Publication or Human Review call occurred.

## Next operation

The authorized lifecycle completed on 2026-07-30. Revision
`e09f69c9-fbc5-4f6e-a240-05372e959510` received authenticated Decision
`cf368fda-42db-4504-8107-0c67bd14caa7`, Approval
`be59cc6f-8c2e-4227-a221-b1f6e6913b3b` and single-Product publication batch
`25f14744-dc76-40fc-ae64-678f516a7826`. See
[Agilia SP MC Publication](./agilia-sp-mc-publication-2026-07-30.md) for the
post-publication projection, sitemap and invariance evidence.
