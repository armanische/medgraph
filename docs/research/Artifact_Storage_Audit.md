# Artifact Storage Audit

## Executive result

The repository-backed artifact store was fully scanned on 2026-07-16. All 276 stored files match their content-addressed SHA-256 paths. Every `.pdf` file has a PDF signature, and every `.aspx` artifact currently contains PDF bytes. No duplicate content, HTML masquerade, zero-byte file, temporary file, or absolute research path was found.

Twelve artifacts have no document-version reference and are classified as orphan candidates. They were not removed or changed.

## Precheck

- Branch: `feature/wave2-expansion`
- Initial working tree: clean
- Initial HEAD: `ac07de3 Complete Ambu Wave 2 execution and repair release readiness`
- Audit mode: read-only for artifacts and business data

## Storage footprint

| Measurement | Result | Method |
| --- | ---: | --- |
| Repository disk footprint | approximately 2.45 GiB | `du -sk .`; includes `.git`, dependencies, and build cache |
| Git loose object size | 852.54 MiB | `git count-objects -vH` |
| `data/research` disk footprint | approximately 845 MiB | `du -sk data/research` |
| Artifact logical bytes | 827,123,221 bytes (788.81 MiB) | sum of file sizes |
| Artifact disk footprint | approximately 789.35 MiB | `du -sk data/research/artifacts` |
| Artifact count | 276 | complete recursive scan |

Uncommitted audit files are not part of Git object size. Repository disk footprint is environment-sensitive because it includes ignored dependencies and build output.

## Size distribution

| Size | Files | Logical bytes |
| --- | ---: | ---: |
| 0–1 MiB | 137 | 71,975,461 |
| 1–5 MiB | 102 | 232,662,534 |
| 5–10 MiB | 19 | 126,072,485 |
| 10–25 MiB | 11 | 164,988,592 |
| 25–50 MiB | 7 | 231,424,149 |
| >50 MiB | 0 | 0 |

## Integrity findings

| Check | Findings |
| --- | ---: |
| SHA-256/path mismatch | 0 |
| Invalid `.pdf` signature | 0 |
| Duplicate hash groups | 0 |
| Redundant duplicate files | 0 |
| Orphan artifacts | 12 |
| HTML masquerading as a document | 0 |
| Zero-byte files | 0 |
| `.part`, `.tmp`, `.bak` | 0 |
| Absolute paths in research JSON | 0 |

The extension is not used as proof of content type. Eighteen `.aspx`-named artifacts were identified as PDF by their byte signature and therefore are not HTML findings.

## Orphan candidates

The following digests have no reference in documents, extraction, review, or any other research JSON outside the generated inventory:

- `03d3e0136b1e2d09dbd2417568430b545fb63516acf6639e9914285d44f1a192`
- `26dd49b642e94d51ec98a79d2fc55e61a37ef699ab7d044656e9e7280e0d9eae`
- `9c9176bb520ac3ea0afb8189345369ace2cd6354c9eff3f49b79bb74fc90c6cb`
- `a6c5bdfc52189ebf302049bb49114ee00cc50143b6287ba1f7a450675dea99a3`
- `aac809acf1851603195b1b141509c733cd5b2b65dac000281684763f949e86fb`
- `c77aebbc54df2709d671ed981480c7be327c049503292df3f7a9b53f56bf9c53`
- `d312e970c115d265d5b3656d887762a0e3d7747f36e669ea0c5c75d8ad3193c4`
- `d338e32e78b68fa414679f19ea1d418e01f975fbfe49ae96538b69026302596f`
- `e011ee8cde96bf70460e3ba62b57dfc28ad3251446c988f230acbde9bad4a18c`
- `ec33a7ae20792bea201d24e109fc5e78fb4c25c71e5adb2adf3c7af8114d509b`
- `f21fdae155085c77a5aeb36679b44fa74df757f896401a89c4c5fa23a36c048b`
- `fe5af1e868ee6431a4911599c69b3845c6f5dee079b890abcefe74746f511dcd`

An orphan classification is an audit signal only. Evidence ownership and retention must be reviewed before any future disposition.

## Largest artifacts

| Rank | Size | Digest | Manufacturer / reference |
| ---: | ---: | --- | --- |
| 1 | 38.98 MiB | `da2d9034c138…` | Drager, six products |
| 2 | 32.59 MiB | `1bb4e8e3caff…` | Drager, five products |
| 3 | 32.57 MiB | `b0eafff853ef…` | Drager, three products |
| 4 | 32.56 MiB | `571aaefa328d…` | Drager, six products |
| 5 | 28.02 MiB | `2474e05f14c0…` | Drager, eight products |
| 6 | 28.00 MiB | `768a91be7cc3…` | Drager, eight products |
| 7 | 27.99 MiB | `bfdc6d78ac3f…` | Drager, eight products |
| 8 | 20.23 MiB | `a2e80682de56…` | Drager Atlan A350 |
| 9 | 20.12 MiB | `9eda16f31546…` | Philips, four IntelliVue products |
| 10 | 15.75 MiB | `8bea5af2f371…` | Drager, eight products |

The complete top 50, including exact paths and byte sizes, is stored in `topLargestFiles` in `data/research/integrity/artifact-inventory.generated.json` and printed by the audit command.

## Inventory semantics

References from documents and extraction reports are deduplicated by `versionId`. Review references are resolved through each review item's `documentVersionIds`. `referenceCount` is the sum of unique referenced document versions and unique referenced review items; product and manufacturer fields are derived labels and are not counted twice.

`orphan = true` means that no document version references the artifact. It does not mean the artifact is safe to delete.

## Limitations and recommendations

- Signature inspection proves the PDF header, not full semantic PDF conformance. A future offline validator may add structural validation without changing evidence identity.
- Repository size includes local caches and is not a clone-size forecast.
- Review all 12 orphan candidates against retention and provenance records before any future migration disposition.
- Treat the generated manifest as a release audit artifact, not as a source of verified clinical claims.
- Use the migration gates in the roadmap; do not cut over reads until every referenced digest has been independently copied and verified.

## Safety confirmation

No artifact was deleted, renamed, rewritten, uploaded, or migrated. No Git history rewrite, Git LFS, cloud SDK, Verification, Publication, Supabase, Review Queue, Evidence ID, Wave 2 metric, Downloader, or Resolver change was made.
