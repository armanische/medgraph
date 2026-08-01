import "server-only";

import { createHash } from "node:crypto";

export const GROUP_C_BATCH_1_REVISION_OPERATION_KEY =
  "group-c-batch-1-revision-creation-v1";
export const GROUP_C_BATCH_1_REVISION_MANIFEST_SHA256 =
  "2e8e165c7b27ac5b64a226916a7a26289711ff46b5bcded109e3029ca9f40ae9";

export type GroupCBatch1RevisionManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  expectedUpdatedAt: string;
  expectedPublicationStatus: "draft";
  expectedReviewState: "pending";
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  rawSnapshotSha256: string;
  sourceChecksum: string;
  characteristics: 3;
  media: number;
  warnings: readonly ["missing_documents", "missing_registration"];
}>;

export type GroupCBatch1RevisionCompletionEvidence = Readonly<{
  productId: string;
  revisionId: string;
  reviewItemId: string;
}>;

/**
 * Immutable scope approved by the Product Owner for Group C Remediation
 * Batch 1. Browser callers submit only the operation key and this manifest's
 * digest; Product identities and lifecycle keys never come from the request.
 */
export const GROUP_C_BATCH_1_REVISION_MANIFEST = Object.freeze({
  version: "group-c-batch-1-revision-creation-v1",
  createdAt: "2026-08-01T19:19:34Z",
  operationKey: GROUP_C_BATCH_1_REVISION_OPERATION_KEY,
  manifestSha256: GROUP_C_BATCH_1_REVISION_MANIFEST_SHA256,
  productCount: 8,
  sourceArtifacts: Object.freeze({
    patchPreviewSha256:
      "009e96884fd94d5c960a7fba8e7efbf4b373b86308446ab64af0e8788aa39123",
    revisionPreflightSha256:
      "80f25c2a1938d7cd121821ac715391aa3fd3be5bc84641b3d29b70946000fcfa",
  }),
  entries: Object.freeze([
    {
      productId: "48f7d071-c8e4-4bc9-96c4-fc12672ca183",
      sourceUid: "446510199362",
      model: "EPK-i5000",
      expectedUpdatedAt: "2026-08-01T08:49:10.532139+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "146b52963630a2e9225b7b60dd9d1ee7c8d2d10426df2593da6e86ac9a769417",
      payloadChecksum:
        "70239140c8a9d455e8acbd5962ecf6505ec5761b40cec9bd221db8bf6d5b8206",
      productIdentityChecksum:
        "184d9b6b3d36947466eb725012972502d834b9a827090cb8ab19a88914f1ebce",
      rawSnapshotSha256:
        "9c0ee29596f6e4d95b869bbc12700685f89932de068324a060b9254d92d59f31",
      sourceChecksum:
        "68627301b3cd16bd8252f261993805a918a113187a32ce6a0ee5bae3bbddf06e",
      characteristics: 3,
      media: 2,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "721a2244-75a6-42b3-9370-7df148d8a51e",
      sourceUid: "776712772161",
      model: "HD-350",
      expectedUpdatedAt: "2026-08-01T08:49:11.613657+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "8a6414948c3d4779b5c9f66fe00442021af3837db0013be0513f64cdd5b99b06",
      payloadChecksum:
        "bc99595a62fa53cd15ad7ec8f9688a6100b1e5514afed252f78d067f9ce7d5f1",
      productIdentityChecksum:
        "f2582dcd022b2243e83f6575c47b673ddf0b9389e7ad2da9b4de43b3233509e8",
      rawSnapshotSha256:
        "2ae9ee2e5ac51b989ad5e80cd8a98169230823c51cd9a7934c4245311744315e",
      sourceChecksum:
        "d6a4ae1af32c79bb3fd8f08556da59078d1ec7fa36ad5fdf027ab5681bc9269a",
      characteristics: 3,
      media: 3,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "831f5d47-a765-4bc2-8d18-65691cae76e9",
      sourceUid: "697047413241",
      model: "HD-500",
      expectedUpdatedAt: "2026-08-01T08:49:12.361986+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "cefa4b91e07f51f5bd58548fd813602e21dbcf763a3523c3515df02e1fcf2569",
      payloadChecksum:
        "24daba146a8961f886d9315226e7def48e18705c7b1a2e3f4c38f658de29668f",
      productIdentityChecksum:
        "32c745cbbad52e12f6179f7fd5b0703ce79ec08b703b0ea9a45da4a8e0509198",
      rawSnapshotSha256:
        "d59806ecb4ab8319e1c0a0b75aa703cef280475b9a5e4f64c7b3108adecac553",
      sourceChecksum:
        "00acaf86eef18dda12ebc960471ad41dc4a8f3d4599b8f2f9d0e1c6ac3b06111",
      characteristics: 3,
      media: 2,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "ae1e448d-f266-4d5d-9d42-e2c22a2d54c8",
      sourceUid: "601909099101",
      model: "Dialog+",
      expectedUpdatedAt: "2026-08-01T08:49:13.289397+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "7a1c66503b00e046649d010c36b02d35f84887ff896ac8e427d9817835ab7ba1",
      payloadChecksum:
        "645a53ebc2169a377d79d4bf756d88a0cafd9e270480447d8c4bbc7a24a94076",
      productIdentityChecksum:
        "fa0de4a04cba1c060a0d7cc0dba1be0e382149f194097a3e05bff55d29cee257",
      rawSnapshotSha256:
        "17966a85ccefc8c20d3555f0aab07f2fb1cab6f9253a4b37005d50d4512340a8",
      sourceChecksum:
        "4a142d11db3a06e62324786250a81cae60fcfd82fa84b559e6c39ad61716afe1",
      characteristics: 3,
      media: 2,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "760b9466-dcb6-4fd5-a821-eb4bf8203e77",
      sourceUid: "574929514601",
      model: "BabyGuard 1120",
      expectedUpdatedAt: "2026-08-01T08:49:13.999822+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "c92d1b083fd9a2d5ffb3c25e7a2ade71ee765a5d47d06f00653e8c7326a22213",
      payloadChecksum:
        "6a5c9b62eec8e57850f097f02dd9a055343ba493f914c4098704efb94ae2a5d3",
      productIdentityChecksum:
        "bd6fc8053ed3df162d65b00e6f1fba19c70fc0e758791df3cc36fa080fda0e49",
      rawSnapshotSha256:
        "0f3a9327fd27b783d381d9ec85aeb8a1b28682d5af533a6c10b6ce0e856f623b",
      sourceChecksum:
        "5b06040fc45e0e99f907f781dbc8042e4f145b5d577b2881da37ff3de2994975",
      characteristics: 3,
      media: 2,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "7866179e-e753-411b-8e9e-409b109b66d2",
      sourceUid: "608519946332",
      model: "JAY-10",
      expectedUpdatedAt: "2026-08-01T08:49:14.697511+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "4fb78de43806f4e453197598bfc4ed911666cd75b42dd422e76a72bac0d29139",
      payloadChecksum:
        "2705afeef7274779de20e108bc305da0506f5b9d7ae4520d852622e89e4c503c",
      productIdentityChecksum:
        "36f4b1898a939b597f7f2e6755b89cee9b789099d92ca016244d27f6cd26cd1a",
      rawSnapshotSha256:
        "dcaa2fa64d59cdea42f7feb703d0e7931479d1596f23de3e7e34b8c939524e6a",
      sourceChecksum:
        "c1856896de96d116c2b5f473de0de306171719ec8d63ee728a3f0c2118328d58",
      characteristics: 3,
      media: 3,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "6041f5e8-1560-4a54-99eb-81bf91c18fbe",
      sourceUid: "322249256482",
      model: "Discovery RF180",
      expectedUpdatedAt: "2026-08-01T08:49:15.443840+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "a52e7193ea6a1c9a7766241f3199036a924aea23c99757977bc23d8a43005f8d",
      payloadChecksum:
        "4f25b211d53d59fdac3f18cf69236cf0599c076f01d42a78c53bb062e09c3275",
      productIdentityChecksum:
        "c9fa730d6b06bb53ebbe402a4c2a784c7c54dcd02501b4c013e0fc266af230f6",
      rawSnapshotSha256:
        "859e07731ba6c6ebfa0a02053772943c42485902d61767f74cf6fd8746b174a0",
      sourceChecksum:
        "6d5ac8498847c8bb1fcb053ac73020a8601e324a049b6accc053a21d8ac206ec",
      characteristics: 3,
      media: 1,
      warnings: ["missing_documents", "missing_registration"],
    },
    {
      productId: "30f623b9-764f-4fc3-9b2d-c0598b50015c",
      sourceUid: "241834833046",
      model: "CM1200B",
      expectedUpdatedAt: "2026-08-01T08:49:16.241830+00:00",
      expectedPublicationStatus: "draft",
      expectedReviewState: "pending",
      candidatePayloadChecksum:
        "27ee2c5cf1908a2b70885c76554d571e265c2cb1916088b948f0da136b7bda2b",
      payloadChecksum:
        "15e9b57a50890a698de01ef3126190ceec8613b96a6a7823dadaac3970aced04",
      productIdentityChecksum:
        "e622fe64ef60b6e34ba52b628c671cc83fadfcd85796c88dc59a094c1f0b72ce",
      rawSnapshotSha256:
        "e9de558580a22fe1904338399d3bc08741dedc4d64c0d84265802ce9d2c95963",
      sourceChecksum:
        "e8154c112beed0ece1cad23b87f7ed947b2811428bbd5af8370fba778f6d2d07",
      characteristics: 3,
      media: 1,
      warnings: ["missing_documents", "missing_registration"],
    },
  ] satisfies readonly GroupCBatch1RevisionManifestEntry[]),
} as const);

/**
 * Populated only after the first controlled Production execution. Keeping the
 * durable bindings separate preserves the immutable operation digest while
 * making a later whole-operation replay safe: an unknown in-review Product is
 * never treated as this operation's result.
 */
export const GROUP_C_BATCH_1_REVISION_COMPLETION_EVIDENCE:
readonly GroupCBatch1RevisionCompletionEvidence[] = Object.freeze([
  { productId: "48f7d071-c8e4-4bc9-96c4-fc12672ca183", revisionId: "685637b7-471a-4b8e-bd85-95633f6caf03", reviewItemId: "b9de9b94-06d5-4dd2-8eca-be70842521e5" },
  { productId: "721a2244-75a6-42b3-9370-7df148d8a51e", revisionId: "e87cbd30-ccd5-4418-93ac-2c3817a842c9", reviewItemId: "376c2abb-3a5c-4332-8102-87c830380cbe" },
  { productId: "831f5d47-a765-4bc2-8d18-65691cae76e9", revisionId: "650e6150-fada-41ee-a3a3-f8ea2da5b65c", reviewItemId: "000ca5ac-040e-4043-bc79-4217861afaee" },
  { productId: "ae1e448d-f266-4d5d-9d42-e2c22a2d54c8", revisionId: "acae1207-9d59-4ad9-94d8-1716a6655812", reviewItemId: "f29dc1b9-46bd-416d-b3ce-43cee09438d6" },
  { productId: "760b9466-dcb6-4fd5-a821-eb4bf8203e77", revisionId: "c4c4cc16-1631-4289-9437-7a908c4b53ed", reviewItemId: "31a9eadd-79bd-4773-8ed4-297d9ed7e4e5" },
  { productId: "7866179e-e753-411b-8e9e-409b109b66d2", revisionId: "a7fef268-87c8-44b4-bb38-265befedaed1", reviewItemId: "8871eedd-311c-403d-a79a-098ed6b0d4e2" },
  { productId: "6041f5e8-1560-4a54-99eb-81bf91c18fbe", revisionId: "8f68bcc0-0822-4a14-ae1f-09b3804a2d6a", reviewItemId: "b0df7213-03c1-4419-aace-4f88ef481c4d" },
  { productId: "30f623b9-764f-4fc3-9b2d-c0598b50015c", revisionId: "181da0a6-fad3-4c2c-aed9-fec7ca06634f", reviewItemId: "7811faa4-45c5-4a2a-b169-4b02f3d9e3d2" },
]);

export function groupCBatch1RevisionManifestDigestInput() {
  return {
    version: GROUP_C_BATCH_1_REVISION_MANIFEST.version,
    createdAt: GROUP_C_BATCH_1_REVISION_MANIFEST.createdAt,
    operationKey: GROUP_C_BATCH_1_REVISION_MANIFEST.operationKey,
    productCount: GROUP_C_BATCH_1_REVISION_MANIFEST.productCount,
    sourceArtifacts: GROUP_C_BATCH_1_REVISION_MANIFEST.sourceArtifacts,
    entries: GROUP_C_BATCH_1_REVISION_MANIFEST.entries,
  };
}

export function calculateGroupCBatch1RevisionManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(groupCBatch1RevisionManifestDigestInput()))
    .digest("hex");
}

export function validateGroupCBatch1RevisionOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_1_REVISION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_1_REVISION_MANIFEST_SHA256;
}
