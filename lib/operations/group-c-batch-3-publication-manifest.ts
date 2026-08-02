import "server-only";

import { createHash } from "node:crypto";

export const GROUP_C_BATCH_3_PUBLICATION_OPERATION_KEY =
  "group-c-batch-3-publication-v1";
export const GROUP_C_BATCH_3_PUBLICATION_MANIFEST_SHA256 =
  "f0889e6738b984d18445c8fe2af42bbbf1dd6de68a373c3f66d3d37aa020fb3f";

export type GroupCBatch3PublicationManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  revisionId: string;
  reviewItemId: string;
  decisionId: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  warnings: readonly ["missing_documents", "missing_registration"];
  reviewedAt: string;
}>;

/** Exact corporate-reviewed Group C Batch 3 publication scope. */
export const GROUP_C_BATCH_3_PUBLICATION_MANIFEST = Object.freeze({
  version: "group-c-batch-3-publication-v1",
  createdAt: "2026-08-02T14:05:00Z",
  operationKey: GROUP_C_BATCH_3_PUBLICATION_OPERATION_KEY,
  productCount: 7,
  manifestSha256: GROUP_C_BATCH_3_PUBLICATION_MANIFEST_SHA256,
  entries: Object.freeze([
    { productId: "64b8a4a0-9d45-472d-aa85-f47c5b593fcd", sourceUid: "300255468231", model: "HD-1", revisionId: "075ff1ca-ecdd-4f78-a2cf-904d9a28a6bf", reviewItemId: "7ef0838d-0f4d-47ac-9a49-02e4edb262ac", decisionId: "a4ed6f7c-ebc4-4e35-bbae-510e54f48909", candidatePayloadChecksum: "6d219c0fdd59cfb6300122a17029faab11dfe056b43639c5119fbceb41005b0d", payloadChecksum: "8344fab1e98ea29321ca4eb965de6dae0b950ef2cd2abd48552f0eec8ee40741", productIdentityChecksum: "73279cba77585f5a481b4c18456650ad35663e0ae21da33b1c91bf6aacf846d9", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:35:35.833756Z" },
    { productId: "8ac30c51-503e-404c-9912-0ec4dc68920c", sourceUid: "323650602021", model: "Овертон 6200", revisionId: "e5ecef0b-8d13-4f01-9f51-080790d8f481", reviewItemId: "b6665afb-4b8a-4763-a806-6805840f1cb0", decisionId: "77f263be-4011-45f4-8f9a-fac863d3b96a", candidatePayloadChecksum: "ffeafe4bb2750e4f50ae1ccc69d86867b2bbc6b30fc62affeb8c13212fc0f7ce", payloadChecksum: "e3ce44405b70e57e9a6afdd38cb732873eff789fc01842d2dd6134c243126ed2", productIdentityChecksum: "a7a0a6b96b49b3f1f6efd7491b2f9c59379cd0e8ba040516f822728cf53e6378", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:35:50.439127Z" },
    { productId: "cb139c6c-5cbc-4dc0-aa80-3114856d3dd1", sourceUid: "358648454622", model: "Versana Premier", revisionId: "af0233e6-71f9-4ade-a118-bff8c7b69446", reviewItemId: "8a2344e2-1811-4923-a4fc-83abdef47c52", decisionId: "5090c53a-c890-491f-b1c4-85edd69e4d55", candidatePayloadChecksum: "496890a87588762b3f94471b2c2b55e85de6b16a0ac56843cd721c95f2854c58", payloadChecksum: "982b88801af229659e44f277d4d6f59ce55a35ee51d2f3a44d57068cb94090ee", productIdentityChecksum: "5469a5ef5d85613384b4921640b752f67b56f3e759982c9367761d670556b76b", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:36:07.683338Z" },
    { productId: "d05a5e6a-c431-4ff3-81ef-0b8bf7804da3", sourceUid: "480491530831", model: "Giraffe Incubator Carestation", revisionId: "a0365bdb-2bbc-44ac-9e02-c920c3afba7f", reviewItemId: "65feb6a5-21ef-4d48-a484-8a3f65a32c53", decisionId: "484f0ad1-390c-4f93-8237-acb9076c74ff", candidatePayloadChecksum: "12c721c48dc28631fe8549542d720923f5fbc4d311fb7e94422af16c791b2b69", payloadChecksum: "18b2bb5899b0f74772489663c05a11c00fee79728c8475a26f824cab40536f8a", productIdentityChecksum: "129fa8089e77c05edb204965cd95c7cf1e20612fd60fbf0d06af4f51c5e1f728", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:36:25.018670Z" },
    { productId: "ec3d6459-264c-43f6-841c-b092c7abeb06", sourceUid: "670271281172", model: "EPK-3000 DEFINA", revisionId: "46222169-c0e4-446b-bb69-a6e52c553fbc", reviewItemId: "b6cb6ef1-2e07-4644-a5af-cf5610ad680e", decisionId: "270faf63-b1d0-4a39-bf36-a8c2ff647248", candidatePayloadChecksum: "84603ccb6dc429fd9116256bb2de7756225e4531402eb4ad1538b8ee0e4f9b83", payloadChecksum: "ea0d50a3e693f0c82ee584ba081ba2211fc425b98439dabaab39b974a31421d9", productIdentityChecksum: "e38f4197901f572def405eb5b44a80341fc37991751cf9ad70a31254c89219e0", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:36:38.483372Z" },
    { productId: "eb488432-182d-4808-a96e-a17462f1b4f0", sourceUid: "868434933208", model: "CARDIPIA 200", revisionId: "b4cafd0c-fc0c-4d64-91fc-e4065ae679a6", reviewItemId: "0b22bed6-da14-470b-a8aa-933840a5f322", decisionId: "3295180d-03d9-46e8-ad67-7828ea73566f", candidatePayloadChecksum: "404e7526685ddd7f3c3f6252ccf72e38c59f5a9c71f3672a5fa22393b73966f4", payloadChecksum: "9fc182ba39cf9e36c0b1aa4d614e8812b3237fe07e41941323c8e3ad198e6e2b", productIdentityChecksum: "a594d0bad33876b3a1cbf95d4ade987d2b71b474cdbd6a46abaa685f0264d4c2", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:36:59.837497Z" },
    { productId: "d683e351-fbc6-40a0-8b5c-f844edb6cfa4", sourceUid: "928472985221", model: "Овертон 6900", revisionId: "271c99e7-d6ff-45ab-86ef-81678a15a9ca", reviewItemId: "9d400544-5705-479e-8c2f-759aefa72f78", decisionId: "65363b4c-4a0e-4e0d-8eaa-78601a6be9ce", candidatePayloadChecksum: "e685d5bb6f689b53997bea434eb264510c0086805b47d8d46932afebcd3fb094", payloadChecksum: "3459e79bbc2663b6f45f6979d6895ba189788c321b0aa3c8498065cd291c02c1", productIdentityChecksum: "202aaf32c2990af1770b60a66a2b8534704bebe20ff54e635d041747b08d7ef1", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T13:37:10.545493Z" },
  ] satisfies readonly GroupCBatch3PublicationManifestEntry[]),
} as const);

export function groupCBatch3PublicationManifestDigestInput() {
  return {
    version: GROUP_C_BATCH_3_PUBLICATION_MANIFEST.version,
    createdAt: GROUP_C_BATCH_3_PUBLICATION_MANIFEST.createdAt,
    operationKey: GROUP_C_BATCH_3_PUBLICATION_MANIFEST.operationKey,
    productCount: GROUP_C_BATCH_3_PUBLICATION_MANIFEST.productCount,
    entries: GROUP_C_BATCH_3_PUBLICATION_MANIFEST.entries,
  };
}

export function calculateGroupCBatch3PublicationManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(groupCBatch3PublicationManifestDigestInput()))
    .digest("hex");
}

export function validateGroupCBatch3PublicationOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_3_PUBLICATION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_3_PUBLICATION_MANIFEST_SHA256;
}
