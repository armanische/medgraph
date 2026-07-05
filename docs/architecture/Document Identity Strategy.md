# CyberMedica Document Identity Strategy

Status: MVP strategy, subject to provider-specific strengthening.

## Purpose

Document identity answers a different question from content identity:

- `Document` — which logical regulatory document is this?
- `DocumentVersion` — which immutable content revision of that document is this?
- `RawArtifact` — which exact bytes were acquired?

SHA-256 identifies bytes and therefore a version. It must never be used as the
identity of the logical Document.

## Current MVP strategy

Roszdravnadzor currently builds a provisional `documentKey` from:

```text
provider
+ normalized registration number
+ semantic document type
+ normalized document title
+ ordinal among otherwise identical titles
```

Example:

```text
roszdravnadzor:ФСЗ2009/04992:ifu:инструкция-по-применению
```

The approach was selected because the public widget does not yet expose a
confirmed stable document identifier for every attachment. It is deterministic
for the same ordered registry response and keeps RU, application, IFU/manual,
certificate and other documents separate.

Within one `documentKey`:

- the same SHA-256 is a no-op;
- a new SHA-256 creates a new `DocumentVersion`;
- the new version records `previousSha256` and `supersedes`;
- the previous content-addressed artifact is never overwritten.

## Known failure modes

The provisional identity can be wrong when:

1. a provider changes the document title without changing the logical document;
2. several documents have the same type and title and their order changes;
3. one attachment is split into several files or several files are merged;
4. localized titles differ while the provider considers the document identical;
5. an internal file ID represents a version rather than a stable document.

For these cases the importer must mark identity as provisional during future
Factory ingestion. Human review remains authoritative.

## Evolution strategy

Provider adapters should resolve identity using the strongest available key:

1. stable provider document ID;
2. stable dossier/record document ID plus document role and locale;
3. canonical provider URL whose path is stable across versions;
4. provisional semantic composite used by the MVP.

The future neutral identity contract should contain:

```text
provider
registryRecordId
providerDocumentId
documentRole
locale
identityConfidence
identityStrategy
aliases[]
```

Provider-specific mapping examples:

| Provider | Preferred identity |
|---|---|
| FDA | submission/dossier ID + document ID + document role |
| EUDAMED | actor/device record ID + document identifier + language |
| EMA | procedure number + document ID + document type/language |
| NMPA | registration record ID + attachment ID |
| PMDA | approval number + review/document identifier |
| Health Canada | licence/application ID + document identifier |

When a provisional key is replaced by a stable provider ID, an alias maps the
old key to the canonical Document. Existing versions and SHA-256 artifacts are
not rewritten.

## Invariants

- A changed SHA-256 never mutates an existing version.
- Two document roles are never collapsed solely because their bytes match.
- A title change alone does not automatically prove a new Document.
- Provider adapters propose identity; Factory review ultimately confirms it.
- Publication and Verification are outside the importer.
