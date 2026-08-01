import "server-only";

import { createHash } from "node:crypto";

export const GROUP_C_BATCH_2_REVISION_OPERATION_KEY =
  "group-c-batch-2-revision-creation-v1";
export const GROUP_C_BATCH_2_REVISION_MANIFEST_SHA256 =
  "54cd498122a1cc205f8c071e85d73922a81053fc2913dbeb519fe6126befd3cd";

export type GroupCBatch2RevisionManifestEntry = Readonly<{
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

export type GroupCBatch2RevisionCompletionEvidence = Readonly<{
  productId: string;
  revisionId: string;
  reviewItemId: string;
}>;

/**
 * Immutable server-side scope approved for Group C Remediation Batch 2.
 * Browser callers submit only the operation key and digest; identities and
 * lifecycle keys are resolved from this tracked manifest.
 */
export const GROUP_C_BATCH_2_REVISION_MANIFEST = Object.freeze({
  version: "group-c-batch-2-revision-creation-v1",
  createdAt: "2026-08-01T22:51:09Z",
  operationKey: GROUP_C_BATCH_2_REVISION_OPERATION_KEY,
  manifestSha256: GROUP_C_BATCH_2_REVISION_MANIFEST_SHA256,
  productCount: 13,
  sourceArtifacts: Object.freeze({
    patchPreviewSha256:
      "a551cb866c522ddc473bda86019d25f4af8b82d9dae9d547eb3744373e79b044",
  }),
  entries: Object.freeze([
    { productId: "050240d2-c1b5-472e-b202-39ab3bb35289", sourceUid: "122386402842", model: "АПДН-01", expectedUpdatedAt: "2026-08-01T21:58:16.458162+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "394e6bf37e9cefab278b9b221782eafc6b0d96351edebb636c00d7dacd2116a1", payloadChecksum: "4aa7931d41d099ee71a1a0197d3acfbdeeba8403590796199b995fbe609e7959", productIdentityChecksum: "a3a9feee0671c8f928630482000f98fb2c7a7ab9782a5a8fc418aef8e7332f52", rawSnapshotSha256: "70a1ec380c154340c9dc34f50e9a22e23043d30e3b456e9755327908fb4b298e", sourceChecksum: "089b8e93837ab4890402efd5694094cf79de86e8b81565a3bb09b6cf5936f399", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "2eb7fd5b-63b9-4eb6-a12f-00001f2f4a4c", sourceUid: "198869594712", model: "ЭК12Т-01-«Р-Д»/260", expectedUpdatedAt: "2026-08-01T21:58:31.011038+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "f3276d0bc39a25ad3ff3c09006570cee88c7b684abaa5d7b4f36510df89d3424", payloadChecksum: "1ccdf6b91f6862791518b3712b8d91ffde4c5d90d57c9092e1844ab512109e4a", productIdentityChecksum: "0d6660c4b9e1f8e9dd93541fd458ffe17ae1607906c8e66419d5e746ad7baeab", rawSnapshotSha256: "a189ecce327c8f30c91caa41fd5b778b183c46a561999815d58e458d1c33b789", sourceChecksum: "514c5c5c6642564e17612fc48aa3e9ad745470b56288bb2c9b92f5a54a3386b2", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "c8ba4609-de12-4109-abf6-07d750f5c14b", sourceUid: "259394139301", model: "CM1200A", expectedUpdatedAt: "2026-08-01T21:58:33.280385+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "7dac01ed1823275a809cdd46f6d79b7c460e8fd803c5901773806678f250a06c", payloadChecksum: "8d9d5c0a164182a71b82081b3ce0f4887f378b52781d6b4f13101523cfeaf266", productIdentityChecksum: "8615ae5728a5bf6d5f35894f75c708bd6a7aff96cabe6834fe869af4bbe9122d", rawSnapshotSha256: "b3c004163f99470d8bf77d6b04dbc8ab21ecf211e0355be0a34397296f8e0d98", sourceChecksum: "822ccea94bcdbd10d9d37e67fcc2700046edfc4f8c172569936fc8af9d7fdfd0", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "107e911f-5d55-470a-87de-cf9e8be0cdbc", sourceUid: "279448521542", model: "КРТ", expectedUpdatedAt: "2026-08-01T21:58:35.721919+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "ee4c538cea878cb8eb9517787c0dfc214c90e1063fe458eba80bbb58a1ce3a93", payloadChecksum: "489b08dfcba263a10e51973b74c80067c8e6468264e08393caef16ee0bb06121", productIdentityChecksum: "2b57776870521026fa1540913469eee653874ea84926f839d992a6a9f3121df7", rawSnapshotSha256: "c6e82975743806d84791e6334a4d71dba628572d4fd998b042ee72fcc1c51dfa", sourceChecksum: "90adcc60f4bea9de09f92960ff6512d34329a45b04a6c6ac357890f7ac75d2b0", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "1014ca16-3996-4f17-98b3-057b67cab362", sourceUid: "344327759482", model: "Corometrics 259cx", expectedUpdatedAt: "2026-08-01T21:58:39.247269+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "1185100ec79a9711cf5718ab53e6096d1e31ae68397e68bcd45e3b428ef1cede", payloadChecksum: "e22f6a1e03688309678e2206e4738dcc65175ec9a8368389dd4cb39216ec9b5b", productIdentityChecksum: "43f57827ef8ad372d3605243d7685e96d5bb6e9bcf16de63928e74a4997d7b5c", rawSnapshotSha256: "48dca1e8d019cb25569e73d8c2340be1bcb4be85c36dc37d13aa51d4de9d7865", sourceChecksum: "16f33a86880926c63ba9b2fe6e7145e455887db2928f8d2bab8b0c0f753e3c55", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "5143084e-5fe7-4094-bf8c-6cd8197b741e", sourceUid: "403689762041", model: "AXEON", expectedUpdatedAt: "2026-08-01T21:58:40.488146+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "2b7ded19c92043770488ccb5fc40a01c5491c27d3dfc74774c33f10d9e56660e", payloadChecksum: "28220dea61896627313485cee4b8e41d432b6a3d07b6f8ca9144b9965ab0e0f6", productIdentityChecksum: "06bffbfce594a8541dc219f8c151b8e34bdba025ba5a46c22b2a99006d5c04fe", rawSnapshotSha256: "de68eccdd0a9ddb6818cf88df03b0e623f00d03a49028d304fbcaa60d681922b", sourceChecksum: "64f834aa4988818ce1da90cf03b60c217838e7ec5a7061a9789796341a3f9589", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "37853370-f39c-45ac-9fc5-ecc093cba831", sourceUid: "420215548801", model: "FB-15V", expectedUpdatedAt: "2026-08-01T21:58:42.564841+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "39188dedd2f9a1cf306ff63e6a306e3cb09157425213f465ac40d21074e0bfc7", payloadChecksum: "9733357bd589be3453d84571a98733785647fb9594ffea6e94ae86a455ff3249", productIdentityChecksum: "c3a8aadc6e55d78cfee2c7bff025c202b1b666f8ca554f934b6a0692dce47393", rawSnapshotSha256: "9aa394597dedc094a8bf23fc3cb68b8f61976e99634bb7a88a9c3dab6b395b67", sourceChecksum: "4de840bb20024992198311e56f34f22e524e5c48fe91182c5cc7c9fba027817a", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
    { productId: "946b74d5-0163-43b1-b1c8-eb3c488776ae", sourceUid: "485427737755", model: "ДФР-02", expectedUpdatedAt: "2026-08-01T21:58:46.709731+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "e2e0a054cd24e43a08efab40b0d3b8c9880318b29af7a0ba1ae8e273a85da8c1", payloadChecksum: "f5e5722a94ae46c9109084efd28a95547e080a1e4d767362a2ae9b472ef679a4", productIdentityChecksum: "005ae0c25c0801fe4fee9d9c44622815a99077660ada120d94ba84eaef648bb4", rawSnapshotSha256: "62e77061cc618ceef8543c16cb9f7722314a35285666a3ca3eddec91bb47a217", sourceChecksum: "cdb3412b05fb4a644ff1cb71358303a109d2fe4d417bf8c1b8f848a625fd588c", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "3a33254d-4088-4bf1-bab6-65c28fe9f5e5", sourceUid: "513492182572", model: "FG-29V", expectedUpdatedAt: "2026-08-01T21:58:48.320252+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "bceda403cc2aeff294011e29c886417d1aea33bbc47afba5d574dc2efc6a9374", payloadChecksum: "640cb3c4a773cd72602a1db882f39a7b2bcc633c2f5866d801cf5a17fdd3d895", productIdentityChecksum: "22c723151243f7c1e9480d1bcd56db7f964d011c1997f08035838e3f52731dc8", rawSnapshotSha256: "b82251c8ca14eabc0b1ffdfeb2c0f156207966b536ac71122a19ab50a4722b73", sourceChecksum: "b7e059c81d351332917b7046da674fda5e9844c44d9cf65793e8746835d409fb", characteristics: 3, media: 3, warnings: ["missing_documents", "missing_registration"] },
    { productId: "79b6082c-b63e-4c8e-9769-36383747b57b", sourceUid: "571191341342", model: "OEC 9900 Elite", expectedUpdatedAt: "2026-08-01T21:58:50.172098+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "d4c53fadec791809e6f17830c4892e7224cd3612f90539863ddac1d4c3f6f0dd", payloadChecksum: "efb20267122f9765f77a3e6690ab52119c64a9d428efefc4621191723f29c532", productIdentityChecksum: "240753065b27839975db51d7f4fd59e794757017e77555de55c49a9e1948eeab", rawSnapshotSha256: "997932689a653cab064e6e64d9796153b9506543cfbc0ae59104e562c05e5594", sourceChecksum: "254bd6b5ee2649304ebe09c94d3ee08538fd96ac2ba85b9d315738628c9911d9", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "8bee3a8e-97a7-420a-aa9f-2f082136060d", sourceUid: "694791065122", model: "УНИКОС-01", expectedUpdatedAt: "2026-08-01T21:58:52.614136+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "51832c9d91ed42dc358c92a66039f70e04949373f78400f8baa4ba8d9deae3a9", payloadChecksum: "d452f1b7bbb820d2b69f8ef7ccedf8a00e54501ce6069f0199f9e5a3cc516231", productIdentityChecksum: "7ab015ae89ef0f82181357e73c1e0b39f22f6dd4887ff6087c2745e447a98cce", rawSnapshotSha256: "a3fc06031620ebeea7d3e0d0f3aa928d5155f0ebc0daeb667c44790c1ab4ea76", sourceChecksum: "495f55e3c85a8c6abf687a38cd6835f7cefdfc929a1fd65ac527057d1e81fb6d", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "54cac861-bc82-4142-a4c4-bb014f21e68e", sourceUid: "860641516881", model: "ИДН-02", expectedUpdatedAt: "2026-08-01T21:58:55.080728+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "02e80f525d8030b221f1120b3c480a65f0aee2165f769e4b6f47e67518bc9527", payloadChecksum: "46046095bcd2f2ad023bb0a3c23e3e25be6180c1ed959c2f62959a2eb1e0b3b7", productIdentityChecksum: "9a0260543b48530801f3dc830ab9aebcb49fd35ca0510ee46dff2d37e1d5ad0b", rawSnapshotSha256: "69790fdea9e4cc17167e428cd7e7f66cd5ccd4ef9971772f4f985760e71dabcf", sourceChecksum: "97d35f7c99f993e1044c7dbea4fbe62ccf59000f99dfe89773462e8b60afd5ec", characteristics: 3, media: 1, warnings: ["missing_documents", "missing_registration"] },
    { productId: "eee213c1-3906-474d-8a28-37aa7ea8dc51", sourceUid: "939922758055", model: "FB-18RBS", expectedUpdatedAt: "2026-08-01T21:58:57.241807+00:00", expectedPublicationStatus: "draft", expectedReviewState: "pending", candidatePayloadChecksum: "c309b5e9e29fdf6f9321376faf4c1b8a30fdeecc3423e96bbd9aa56288667ad4", payloadChecksum: "e55dd3d2fcbbb051f0e6c74d219210fadd3f579e9bf1c3366374d90518ff7ddf", productIdentityChecksum: "af319ea4b03dc059943999686b1052ab7e5344d32de65351265667a834e68a1e", rawSnapshotSha256: "9e89c3acf291681306b30e8b00a4be6f313ea3e4fcaf3da27e18746fff65e26a", sourceChecksum: "b1b4790b712646ada76a59b92465aac86866eb96c83430de8c16147382591c21", characteristics: 3, media: 2, warnings: ["missing_documents", "missing_registration"] },
  ] satisfies readonly GroupCBatch2RevisionManifestEntry[]),
} as const);

/** Populated after first durable Production execution; excluded from digest. */
export const GROUP_C_BATCH_2_REVISION_COMPLETION_EVIDENCE:
readonly GroupCBatch2RevisionCompletionEvidence[] = Object.freeze([]);

export function groupCBatch2RevisionManifestDigestInput() {
  return {
    version: GROUP_C_BATCH_2_REVISION_MANIFEST.version,
    createdAt: GROUP_C_BATCH_2_REVISION_MANIFEST.createdAt,
    operationKey: GROUP_C_BATCH_2_REVISION_MANIFEST.operationKey,
    productCount: GROUP_C_BATCH_2_REVISION_MANIFEST.productCount,
    sourceArtifacts: GROUP_C_BATCH_2_REVISION_MANIFEST.sourceArtifacts,
    entries: GROUP_C_BATCH_2_REVISION_MANIFEST.entries,
  };
}

export function calculateGroupCBatch2RevisionManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(groupCBatch2RevisionManifestDigestInput()))
    .digest("hex");
}

export function validateGroupCBatch2RevisionOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_2_REVISION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_2_REVISION_MANIFEST_SHA256;
}
