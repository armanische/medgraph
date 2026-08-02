import "server-only";

import { createHash } from "node:crypto";

export const GROUP_C_BATCH_3_REVISION_OPERATION_KEY =
  "group-c-batch-3-revision-creation-v1";
export const GROUP_C_BATCH_3_REVISION_MANIFEST_SHA256 =
  "38542b94baaf6593ac80e03d8c9227c9e6f051e91993bb27806a6a48306ca934";

export type GroupCBatch3RevisionManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  rawSnapshotSha256: string;
  sourceChecksum: string;
  characteristics: 3;
  media: number;
  warnings: readonly ["missing_documents", "missing_registration"];
}>;

export type GroupCBatch3RevisionCompletionEvidence = Readonly<{
  productId: string;
  revisionId: string;
  reviewItemId: string;
}>;

/**
 * Immutable server-side scope approved for Group C Remediation Batch 3.
 * Browser callers submit only the operation key and digest; Product identity
 * and per-Product idempotency keys are resolved from this tracked manifest.
 */
export const GROUP_C_BATCH_3_REVISION_MANIFEST = Object.freeze({
  version: "group-c-batch-3-revision-creation-v1",
  createdAt: "2026-08-02T00:00:00Z",
  operationKey: GROUP_C_BATCH_3_REVISION_OPERATION_KEY,
  manifestSha256: GROUP_C_BATCH_3_REVISION_MANIFEST_SHA256,
  productCount: 7,
  sourceArtifacts: Object.freeze({
    patchPreviewSha256:
      "cf90e9cf9068e27bf15dabf0b33c2e1b82a5b658c594dd3747556c3fc0bce035",
  }),
  entries: Object.freeze([
    { productId: "64b8a4a0-9d45-472d-aa85-f47c5b593fcd", sourceUid: "300255468231", model: "HD-1", candidatePayloadChecksum: "6d219c0fdd59cfb6300122a17029faab11dfe056b43639c5119fbceb41005b0d", payloadChecksum: "8344fab1e98ea29321ca4eb965de6dae0b950ef2cd2abd48552f0eec8ee40741", productIdentityChecksum: "73279cba77585f5a481b4c18456650ad35663e0ae21da33b1c91bf6aacf846d9", rawSnapshotSha256: "4a2458127ea81b2d8d27a34696cc4f0777db6b1cdde2b283eab141d81a85bd9f", sourceChecksum: "03a6e3a8bb81a070bbdffb833b26e6c4c27f21ba0bdbb60ab7acc8507b416fcf", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "8ac30c51-503e-404c-9912-0ec4dc68920c", sourceUid: "323650602021", model: "Овертон 6200", candidatePayloadChecksum: "ffeafe4bb2750e4f50ae1ccc69d86867b2bbc6b30fc62affeb8c13212fc0f7ce", payloadChecksum: "e3ce44405b70e57e9a6afdd38cb732873eff789fc01842d2dd6134c243126ed2", productIdentityChecksum: "a7a0a6b96b49b3f1f6efd7491b2f9c59379cd0e8ba040516f822728cf53e6378", rawSnapshotSha256: "3d035f28a8a8f1b8bd7e09027474b0f9102bc534a2a541d25cd7a45e6126d57a", sourceChecksum: "1b6aa89461b077d20b5daaa8aa81b8d7a57f1f1d869e5493d7cae6d6008d1c9b", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "cb139c6c-5cbc-4dc0-aa80-3114856d3dd1", sourceUid: "358648454622", model: "Versana Premier", candidatePayloadChecksum: "496890a87588762b3f94471b2c2b55e85de6b16a0ac56843cd721c95f2854c58", payloadChecksum: "982b88801af229659e44f277d4d6f59ce55a35ee51d2f3a44d57068cb94090ee", productIdentityChecksum: "5469a5ef5d85613384b4921640b752f67b56f3e759982c9367761d670556b76b", rawSnapshotSha256: "0751be73c1a86dc8d9fd87859083a2b7fb5c47b02bdee9ac752ba2c6ca77f78c", sourceChecksum: "fc9668cd2112c3b6ec4710adced46112a543ecf023efa595ab97a737f1aaabfe", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "d05a5e6a-c431-4ff3-81ef-0b8bf7804da3", sourceUid: "480491530831", model: "Giraffe Incubator Carestation", candidatePayloadChecksum: "12c721c48dc28631fe8549542d720923f5fbc4d311fb7e94422af16c791b2b69", payloadChecksum: "18b2bb5899b0f74772489663c05a11c00fee79728c8475a26f824cab40536f8a", productIdentityChecksum: "129fa8089e77c05edb204965cd95c7cf1e20612fd60fbf0d06af4f51c5e1f728", rawSnapshotSha256: "f9dc39bec26f9e25d1c3ed5ee04866a55e297ce2e01e8b5ced621e84feef09f8", sourceChecksum: "775722d52c400a42b8ba66cc79b3887437d62ce66c2c5832cf43b6614048c469", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "ec3d6459-264c-43f6-841c-b092c7abeb06", sourceUid: "670271281172", model: "EPK-3000 DEFINA", candidatePayloadChecksum: "84603ccb6dc429fd9116256bb2de7756225e4531402eb4ad1538b8ee0e4f9b83", payloadChecksum: "ea0d50a3e693f0c82ee584ba081ba2211fc425b98439dabaab39b974a31421d9", productIdentityChecksum: "e38f4197901f572def405eb5b44a80341fc37991751cf9ad70a31254c89219e0", rawSnapshotSha256: "bb27ae792a6fbf1c88caf8c353066f6ca8d2e32d25858730ac51a18fd8d4d3f7", sourceChecksum: "80d217be872d914e8c2d23dbd98c7ab0b46c9c3e2c0105330b19fc2959324cc6", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "eb488432-182d-4808-a96e-a17462f1b4f0", sourceUid: "868434933208", model: "CARDIPIA 200", candidatePayloadChecksum: "404e7526685ddd7f3c3f6252ccf72e38c59f5a9c71f3672a5fa22393b73966f4", payloadChecksum: "9fc182ba39cf9e36c0b1aa4d614e8812b3237fe07e41941323c8e3ad198e6e2b", productIdentityChecksum: "a594d0bad33876b3a1cbf95d4ade987d2b71b474cdbd6a46abaa685f0264d4c2", rawSnapshotSha256: "e5487821681b3cf7c467a0140600c7eab42a5ece6a288bae5218fee72b656720", sourceChecksum: "dae092ec494d05f01296b4617bd07031c59b3153ba5878e82984c62e0f5a8edd", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "d683e351-fbc6-40a0-8b5c-f844edb6cfa4", sourceUid: "928472985221", model: "Овертон 6900", candidatePayloadChecksum: "e685d5bb6f689b53997bea434eb264510c0086805b47d8d46932afebcd3fb094", payloadChecksum: "3459e79bbc2663b6f45f6979d6895ba189788c321b0aa3c8498065cd291c02c1", productIdentityChecksum: "202aaf32c2990af1770b60a66a2b8534704bebe20ff54e635d041747b08d7ef1", rawSnapshotSha256: "3c88c67b8b50ed1e14f379417d55eccb6747a22243e9263e34b52babba9097e3", sourceChecksum: "eef3010f8f056f8dd3f458ebe1da4f475b01811755a3e9545ea8e78c2dcfdc4e", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
  ] satisfies readonly GroupCBatch3RevisionManifestEntry[]),
} as const);

/** Populated after first durable Production execution; excluded from digest. */
export const GROUP_C_BATCH_3_REVISION_COMPLETION_EVIDENCE:
readonly GroupCBatch3RevisionCompletionEvidence[] = Object.freeze([]);

export function groupCBatch3RevisionManifestDigestInput() {
  return {
    version: GROUP_C_BATCH_3_REVISION_MANIFEST.version,
    createdAt: GROUP_C_BATCH_3_REVISION_MANIFEST.createdAt,
    operationKey: GROUP_C_BATCH_3_REVISION_MANIFEST.operationKey,
    productCount: GROUP_C_BATCH_3_REVISION_MANIFEST.productCount,
    sourceArtifacts: GROUP_C_BATCH_3_REVISION_MANIFEST.sourceArtifacts,
    entries: GROUP_C_BATCH_3_REVISION_MANIFEST.entries,
  };
}

export function calculateGroupCBatch3RevisionManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(groupCBatch3RevisionManifestDigestInput()))
    .digest("hex");
}

export function validateGroupCBatch3RevisionOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_3_REVISION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_3_REVISION_MANIFEST_SHA256;
}
