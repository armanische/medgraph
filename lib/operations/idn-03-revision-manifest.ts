import "server-only";

import { createHash } from "node:crypto";

export const IDN_03_REVISION_OPERATION_KEY = "idn-03-revision-creation-v1";
export const IDN_03_REVISION_MANIFEST_SHA256 =
  "666b2ec919182fce60c625d2642db1f1b2daba522833e7a583e58e8bca78963f";

export type Idn03RevisionManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  rawSnapshotSha256: string;
  sourceChecksum: string;
  characteristics: 3;
  media: 1;
  warnings: readonly ["missing_documents", "missing_registration"];
}>;

export type Idn03RevisionCompletionEvidence = Readonly<{
  productId: string;
  revisionId: string;
  reviewItemId: string;
}>;

/**
 * Immutable one-Product scope approved for IDN-03 revision creation.
 * Browser callers submit only the operation key and digest.
 */
export const IDN_03_REVISION_MANIFEST = Object.freeze({
  version: "idn-03-revision-creation-v1",
  createdAt: "2026-08-02T00:00:00Z",
  operationKey: IDN_03_REVISION_OPERATION_KEY,
  manifestSha256: IDN_03_REVISION_MANIFEST_SHA256,
  productCount: 1,
  sourceArtifacts: Object.freeze({
    correctivePreviewSha256:
      "92ffb9fb76f517bc4b9532380044bead7887ed4ca099b2447ec0cfd02e56e395",
  }),
  entries: Object.freeze([
    {
      productId: "24ac72fc-5c64-4f4e-9f92-cd4eca58e426",
      sourceUid: "363181290312",
      model: "ИДН-03",
      candidatePayloadChecksum:
        "85dda33600089199c2075edf08cd75f77b474e9bcee424de254f3431b3347540",
      payloadChecksum:
        "de5abe9eff70f515ab3d2908ff91f02888b46e60c0667c3b96c83fffe09a4b80",
      productIdentityChecksum:
        "855dff5fab9e9531e2063550b4bf9641f0ef12efac50d26adb743dd902faa561",
      rawSnapshotSha256:
        "7c5f6212e32720b029a91b220c6efd97ab1f1ca597c7946c9af6eb82bb2c3a7d",
      sourceChecksum:
        "0e42fe5b05c1960d36e3a5eef9175f730b687228060f667360b641e77c23985e",
      characteristics: 3,
      media: 1,
      warnings: ["missing_documents", "missing_registration"],
    },
  ] satisfies readonly Idn03RevisionManifestEntry[]),
} as const);

/** Populated after the first durable Production execution; excluded from digest. */
export const IDN_03_REVISION_COMPLETION_EVIDENCE:
readonly Idn03RevisionCompletionEvidence[] = Object.freeze([]);

export function idn03RevisionManifestDigestInput() {
  return {
    version: IDN_03_REVISION_MANIFEST.version,
    createdAt: IDN_03_REVISION_MANIFEST.createdAt,
    operationKey: IDN_03_REVISION_MANIFEST.operationKey,
    productCount: IDN_03_REVISION_MANIFEST.productCount,
    sourceArtifacts: IDN_03_REVISION_MANIFEST.sourceArtifacts,
    entries: IDN_03_REVISION_MANIFEST.entries,
  };
}

export function calculateIdn03RevisionManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(idn03RevisionManifestDigestInput()))
    .digest("hex");
}

export function validateIdn03RevisionOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === IDN_03_REVISION_OPERATION_KEY
    && record.manifestSha256 === IDN_03_REVISION_MANIFEST_SHA256;
}
