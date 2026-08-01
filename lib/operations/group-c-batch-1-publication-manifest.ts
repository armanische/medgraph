import "server-only";

export const GROUP_C_BATCH_1_PUBLICATION_OPERATION_KEY =
  "group-c-batch-1-publication-v1";
export const GROUP_C_BATCH_1_PUBLICATION_MANIFEST_SHA256 =
  "8df78bc385aa62f829831af2c8dcc87622b9639b2daedc66d52c57b7664f1853";

export type GroupCBatch1PublicationManifestEntry = Readonly<{
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

/**
 * Exact corporate-reviewed Group C Batch 1 publication scope. Browser callers
 * submit only the operation key and digest; every lifecycle identity is loaded
 * from this server-only manifest.
 */
export const GROUP_C_BATCH_1_PUBLICATION_MANIFEST = Object.freeze({
  version: "group-c-batch-1-publication-v1",
  createdAt: "2026-08-01T20:56:10Z",
  operationKey: GROUP_C_BATCH_1_PUBLICATION_OPERATION_KEY,
  productCount: 8,
  manifestSha256: GROUP_C_BATCH_1_PUBLICATION_MANIFEST_SHA256,
  entries: Object.freeze([
    {
      productId: "48f7d071-c8e4-4bc9-96c4-fc12672ca183",
      sourceUid: "446510199362",
      model: "EPK-i5000",
      revisionId: "685637b7-471a-4b8e-bd85-95633f6caf03",
      reviewItemId: "b9de9b94-06d5-4dd2-8eca-be70842521e5",
      decisionId: "e9acacb1-3e09-41c9-afa7-e5c4fc9301bd",
      candidatePayloadChecksum: "146b52963630a2e9225b7b60dd9d1ee7c8d2d10426df2593da6e86ac9a769417",
      payloadChecksum: "70239140c8a9d455e8acbd5962ecf6505ec5761b40cec9bd221db8bf6d5b8206",
      productIdentityChecksum: "184d9b6b3d36947466eb725012972502d834b9a827090cb8ab19a88914f1ebce",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:37:52.229367Z",
    },
    {
      productId: "721a2244-75a6-42b3-9370-7df148d8a51e",
      sourceUid: "776712772161",
      model: "HD-350",
      revisionId: "e87cbd30-ccd5-4418-93ac-2c3817a842c9",
      reviewItemId: "376c2abb-3a5c-4332-8102-87c830380cbe",
      decisionId: "030b1756-46f4-4475-9252-9e903bc4a5f6",
      candidatePayloadChecksum: "8a6414948c3d4779b5c9f66fe00442021af3837db0013be0513f64cdd5b99b06",
      payloadChecksum: "bc99595a62fa53cd15ad7ec8f9688a6100b1e5514afed252f78d067f9ce7d5f1",
      productIdentityChecksum: "f2582dcd022b2243e83f6575c47b673ddf0b9389e7ad2da9b4de43b3233509e8",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:38:05.169173Z",
    },
    {
      productId: "831f5d47-a765-4bc2-8d18-65691cae76e9",
      sourceUid: "697047413241",
      model: "HD-500",
      revisionId: "650e6150-fada-41ee-a3a3-f8ea2da5b65c",
      reviewItemId: "000ca5ac-040e-4043-bc79-4217861afaee",
      decisionId: "3e6c9e37-ea8d-4424-b9a0-f79b7028680a",
      candidatePayloadChecksum: "cefa4b91e07f51f5bd58548fd813602e21dbcf763a3523c3515df02e1fcf2569",
      payloadChecksum: "24daba146a8961f886d9315226e7def48e18705c7b1a2e3f4c38f658de29668f",
      productIdentityChecksum: "32c745cbbad52e12f6179f7fd5b0703ce79ec08b703b0ea9a45da4a8e0509198",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:38:26.650074Z",
    },
    {
      productId: "ae1e448d-f266-4d5d-9d42-e2c22a2d54c8",
      sourceUid: "601909099101",
      model: "Dialog+",
      revisionId: "acae1207-9d59-4ad9-94d8-1716a6655812",
      reviewItemId: "f29dc1b9-46bd-416d-b3ce-43cee09438d6",
      decisionId: "89987466-3879-415f-8798-38de2e185e77",
      candidatePayloadChecksum: "7a1c66503b00e046649d010c36b02d35f84887ff896ac8e427d9817835ab7ba1",
      payloadChecksum: "645a53ebc2169a377d79d4bf756d88a0cafd9e270480447d8c4bbc7a24a94076",
      productIdentityChecksum: "fa0de4a04cba1c060a0d7cc0dba1be0e382149f194097a3e05bff55d29cee257",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:38:47.701965Z",
    },
    {
      productId: "760b9466-dcb6-4fd5-a821-eb4bf8203e77",
      sourceUid: "574929514601",
      model: "BabyGuard 1120",
      revisionId: "c4c4cc16-1631-4289-9437-7a908c4b53ed",
      reviewItemId: "31a9eadd-79bd-4773-8ed4-297d9ed7e4e5",
      decisionId: "13d17a15-d5ea-46b8-add5-263603097d87",
      candidatePayloadChecksum: "c92d1b083fd9a2d5ffb3c25e7a2ade71ee765a5d47d06f00653e8c7326a22213",
      payloadChecksum: "6a5c9b62eec8e57850f097f02dd9a055343ba493f914c4098704efb94ae2a5d3",
      productIdentityChecksum: "bd6fc8053ed3df162d65b00e6f1fba19c70fc0e758791df3cc36fa080fda0e49",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:40:05.236929Z",
    },
    {
      productId: "7866179e-e753-411b-8e9e-409b109b66d2",
      sourceUid: "608519946332",
      model: "JAY-10",
      revisionId: "a7fef268-87c8-44b4-bb38-265befedaed1",
      reviewItemId: "8871eedd-311c-403d-a79a-098ed6b0d4e2",
      decisionId: "d90b951f-b846-4926-a5e4-0d3684bbdbc2",
      candidatePayloadChecksum: "4fb78de43806f4e453197598bfc4ed911666cd75b42dd422e76a72bac0d29139",
      payloadChecksum: "2705afeef7274779de20e108bc305da0506f5b9d7ae4520d852622e89e4c503c",
      productIdentityChecksum: "36f4b1898a939b597f7f2e6755b89cee9b789099d92ca016244d27f6cd26cd1a",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:39:47.681846Z",
    },
    {
      productId: "6041f5e8-1560-4a54-99eb-81bf91c18fbe",
      sourceUid: "322249256482",
      model: "Discovery RF180",
      revisionId: "8f68bcc0-0822-4a14-ae1f-09b3804a2d6a",
      reviewItemId: "b0df7213-03c1-4419-aace-4f88ef481c4d",
      decisionId: "1a74035d-30e4-46c7-816c-7d88ef6063a5",
      candidatePayloadChecksum: "a52e7193ea6a1c9a7766241f3199036a924aea23c99757977bc23d8a43005f8d",
      payloadChecksum: "4f25b211d53d59fdac3f18cf69236cf0599c076f01d42a78c53bb062e09c3275",
      productIdentityChecksum: "c9fa730d6b06bb53ebbe402a4c2a784c7c54dcd02501b4c013e0fc266af230f6",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:39:32.596186Z",
    },
    {
      productId: "30f623b9-764f-4fc3-9b2d-c0598b50015c",
      sourceUid: "241834833046",
      model: "CM1200B",
      revisionId: "181da0a6-fad3-4c2c-aed9-fec7ca06634f",
      reviewItemId: "7811faa4-45c5-4a2a-b169-4b02f3d9e3d2",
      decisionId: "4ec94b06-276f-4fdc-9ddc-f022391c2bfd",
      candidatePayloadChecksum: "27ee2c5cf1908a2b70885c76554d571e265c2cb1916088b948f0da136b7bda2b",
      payloadChecksum: "15e9b57a50890a698de01ef3126190ceec8613b96a6a7823dadaac3970aced04",
      productIdentityChecksum: "e622fe64ef60b6e34ba52b628c671cc83fadfcd85796c88dc59a094c1f0b72ce",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-08-01T20:39:19.113923Z",
    },
  ] satisfies readonly GroupCBatch1PublicationManifestEntry[]),
} as const);

export function validateGroupCBatch1PublicationOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_1_PUBLICATION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_1_PUBLICATION_MANIFEST_SHA256;
}
