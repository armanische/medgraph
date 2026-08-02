# Group C Batch 2 Secure Revision Runner — 2026-08-02

## Result

The narrow server-only runner accepted only operation key
`group-c-batch-2-revision-creation-v1` and manifest SHA-256
`54cd498122a1cc205f8c071e85d73922a81053fc2913dbeb519fe6126befd3cd`.
Its scope was fixed in Git to 13 Products; browser input could not supply Product
IDs. Same-origin, Production environment, corporate email/UUID/role and
service-only database binding were all required.

Production deployment `dpl_6ui2QNEvMaZGukccUNsLGHecXL3J` was READY on exact
runtime commit `f1f25d21d0dd130e080a6f08a84314b3d67ae613`. The operation was
authorized by `cybermedicaooo@gmail.com` (`7e90a993-8b30-4e0d-aff4-a257d5a4a179`,
role `admin`). No credential material was recorded.

The first two diagnostic preflights stopped before write. They proved that
source UID and source checksum were unchanged and isolated a JSONB digest
representation mismatch. The final guard reproduces PostgreSQL `jsonb::text`
serialization byte-for-byte; no Product or provenance correction was made.

## Security and validation

- exact scope and manifest digest: PASS;
- wrong operation key / changed digest: rejected by request validation tests;
- ten deterministic reads per Product: PASS;
- approved RPC only: `create_product_publication_revision_v1`;
- Human Review, Approval and Publication calls: zero;
- full tests: `548/548` PASS;
- lint, TypeScript, Turbopack and Webpack: PASS;
- secret/privacy scan and `git diff --check`: PASS;
- `gitForkProtection`: remained enabled.
