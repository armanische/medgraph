import "server-only";

import { createHash } from "node:crypto";

export const GROUP_C_BATCH_2_PUBLICATION_OPERATION_KEY =
  "group-c-batch-2-publication-v1";
export const GROUP_C_BATCH_2_PUBLICATION_MANIFEST_SHA256 =
  "33b32702f4c433c07a8bb568d8a97f815be2afbb59d750ebddf989a0c01785be";

export type GroupCBatch2PublicationManifestEntry = Readonly<{
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
 * Exact corporate-reviewed Group C Batch 2 publication scope. Browser callers
 * submit only the operation key and digest; every lifecycle identity is loaded
 * from this server-only manifest.
 */
export const GROUP_C_BATCH_2_PUBLICATION_MANIFEST = Object.freeze({
  version: "group-c-batch-2-publication-v1",
  createdAt: "2026-08-02T10:08:58Z",
  operationKey: GROUP_C_BATCH_2_PUBLICATION_OPERATION_KEY,
  productCount: 13,
  manifestSha256: GROUP_C_BATCH_2_PUBLICATION_MANIFEST_SHA256,
  entries: Object.freeze([
    { productId: "050240d2-c1b5-472e-b202-39ab3bb35289", sourceUid: "122386402842", model: "АПДН-01", revisionId: "08b210a6-2217-4a02-a6ea-ed7c5a847334", reviewItemId: "4351a2f4-9033-40a8-9e60-05b770e2765f", decisionId: "4fe1c393-5ea9-440a-985b-b68cf656756c", candidatePayloadChecksum: "394e6bf37e9cefab278b9b221782eafc6b0d96351edebb636c00d7dacd2116a1", payloadChecksum: "4aa7931d41d099ee71a1a0197d3acfbdeeba8403590796199b995fbe609e7959", productIdentityChecksum: "a3a9feee0671c8f928630482000f98fb2c7a7ab9782a5a8fc418aef8e7332f52", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:57:40.066690Z" },
    { productId: "2eb7fd5b-63b9-4eb6-a12f-00001f2f4a4c", sourceUid: "198869594712", model: "ЭК12Т-01-«Р-Д»/260", revisionId: "882e2a25-bedb-4e6d-b72b-7fc91951a0d7", reviewItemId: "d0849892-ebf1-4089-9539-c7cd2ef1f40a", decisionId: "49dbd9ee-2103-437f-ab71-12dfe3848c1c", candidatePayloadChecksum: "f3276d0bc39a25ad3ff3c09006570cee88c7b684abaa5d7b4f36510df89d3424", payloadChecksum: "1ccdf6b91f6862791518b3712b8d91ffde4c5d90d57c9092e1844ab512109e4a", productIdentityChecksum: "0d6660c4b9e1f8e9dd93541fd458ffe17ae1607906c8e66419d5e746ad7baeab", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:24.340101Z" },
    { productId: "c8ba4609-de12-4109-abf6-07d750f5c14b", sourceUid: "259394139301", model: "CM1200A", revisionId: "8b13c3d0-ae6b-487e-83e5-7b56dbed31a7", reviewItemId: "f254793b-b993-4e56-a972-c09929a3ce41", decisionId: "095f35e4-d987-43bf-9d45-2428a97704dc", candidatePayloadChecksum: "7dac01ed1823275a809cdd46f6d79b7c460e8fd803c5901773806678f250a06c", payloadChecksum: "8d9d5c0a164182a71b82081b3ce0f4887f378b52781d6b4f13101523cfeaf266", productIdentityChecksum: "8615ae5728a5bf6d5f35894f75c708bd6a7aff96cabe6834fe869af4bbe9122d", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:25.422331Z" },
    { productId: "107e911f-5d55-470a-87de-cf9e8be0cdbc", sourceUid: "279448521542", model: "КРТ", revisionId: "c0731b0f-cf49-4acf-a227-694e78dca3ab", reviewItemId: "144366fb-f9fa-481d-ab66-1d659234bd40", decisionId: "24c97cc8-58c6-4c33-baba-e73fca68b11c", candidatePayloadChecksum: "ee4c538cea878cb8eb9517787c0dfc214c90e1063fe458eba80bbb58a1ce3a93", payloadChecksum: "489b08dfcba263a10e51973b74c80067c8e6468264e08393caef16ee0bb06121", productIdentityChecksum: "2b57776870521026fa1540913469eee653874ea84926f839d992a6a9f3121df7", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:28.660847Z" },
    { productId: "1014ca16-3996-4f17-98b3-057b67cab362", sourceUid: "344327759482", model: "Corometrics 259cx", revisionId: "4c3b1418-d6d4-43f8-b8c9-269c8af64c5d", reviewItemId: "3a4963b0-30c8-44d5-a49f-48be44b81e73", decisionId: "c0431499-52f6-4410-a2b3-c7d981ee260d", candidatePayloadChecksum: "1185100ec79a9711cf5718ab53e6096d1e31ae68397e68bcd45e3b428ef1cede", payloadChecksum: "e22f6a1e03688309678e2206e4738dcc65175ec9a8368389dd4cb39216ec9b5b", productIdentityChecksum: "43f57827ef8ad372d3605243d7685e96d5bb6e9bcf16de63928e74a4997d7b5c", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:33.382052Z" },
    { productId: "5143084e-5fe7-4094-bf8c-6cd8197b741e", sourceUid: "403689762041", model: "AXEON", revisionId: "70ffc7e1-3953-4c8b-a247-d961c5af23d2", reviewItemId: "3c0d1e94-6c63-4986-9997-962bbdd12f85", decisionId: "d1ce6e89-93ee-40e2-94a4-01e94c30ba9c", candidatePayloadChecksum: "2b7ded19c92043770488ccb5fc40a01c5491c27d3dfc74774c33f10d9e56660e", payloadChecksum: "28220dea61896627313485cee4b8e41d432b6a3d07b6f8ca9144b9965ab0e0f6", productIdentityChecksum: "06bffbfce594a8541dc219f8c151b8e34bdba025ba5a46c22b2a99006d5c04fe", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:35.434672Z" },
    { productId: "37853370-f39c-45ac-9fc5-ecc093cba831", sourceUid: "420215548801", model: "FB-15V", revisionId: "cd8abd72-ebb3-4b63-8eaa-a4edf7a933d6", reviewItemId: "43e5460d-c89b-4b26-bef4-d0cadd7e0fa0", decisionId: "5dba8373-85b8-452b-b8cf-5b0de0498e38", candidatePayloadChecksum: "39188dedd2f9a1cf306ff63e6a306e3cb09157425213f465ac40d21074e0bfc7", payloadChecksum: "9733357bd589be3453d84571a98733785647fb9594ffea6e94ae86a455ff3249", productIdentityChecksum: "c3a8aadc6e55d78cfee2c7bff025c202b1b666f8ca554f934b6a0692dce47393", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:38.576627Z" },
    { productId: "946b74d5-0163-43b1-b1c8-eb3c488776ae", sourceUid: "485427737755", model: "ДФР-02", revisionId: "e9adfcee-3294-4eb1-b33b-bc961f54b8d2", reviewItemId: "5c928d3a-b776-4b7b-8001-c620dbc5b369", decisionId: "e9ca6631-748e-42b2-bfb1-0c67c6721b61", candidatePayloadChecksum: "e2e0a054cd24e43a08efab40b0d3b8c9880318b29af7a0ba1ae8e273a85da8c1", payloadChecksum: "f5e5722a94ae46c9109084efd28a95547e080a1e4d767362a2ae9b472ef679a4", productIdentityChecksum: "005ae0c25c0801fe4fee9d9c44622815a99077660ada120d94ba84eaef648bb4", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:41.626644Z" },
    { productId: "3a33254d-4088-4bf1-bab6-65c28fe9f5e5", sourceUid: "513492182572", model: "FG-29V", revisionId: "66e2dd8f-9913-4768-8869-306a9cf81789", reviewItemId: "ebc0589c-3e94-4c1b-a264-c41fe7373a4c", decisionId: "060d1d4c-ad63-4b74-a5a7-9aead18d8389", candidatePayloadChecksum: "bceda403cc2aeff294011e29c886417d1aea33bbc47afba5d574dc2efc6a9374", payloadChecksum: "640cb3c4a773cd72602a1db882f39a7b2bcc633c2f5866d801cf5a17fdd3d895", productIdentityChecksum: "22c723151243f7c1e9480d1bcd56db7f964d011c1997f08035838e3f52731dc8", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:44.541400Z" },
    { productId: "79b6082c-b63e-4c8e-9769-36383747b57b", sourceUid: "571191341342", model: "OEC 9900 Elite", revisionId: "12cd2d90-98ad-4cce-a8b8-350f3a0ee4e2", reviewItemId: "2dcd9ee0-377b-4830-84f2-5297eaf1f82e", decisionId: "a30a4cc2-6c86-4e91-8549-aaa54b2a65dd", candidatePayloadChecksum: "d4c53fadec791809e6f17830c4892e7224cd3612f90539863ddac1d4c3f6f0dd", payloadChecksum: "efb20267122f9765f77a3e6690ab52119c64a9d428efefc4621191723f29c532", productIdentityChecksum: "240753065b27839975db51d7f4fd59e794757017e77555de55c49a9e1948eeab", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:47.556918Z" },
    { productId: "8bee3a8e-97a7-420a-aa9f-2f082136060d", sourceUid: "694791065122", model: "УНИКОС-01", revisionId: "dea0e398-4336-4b6e-a2bd-7ba969fa4ef6", reviewItemId: "d413992f-af52-4e0e-918c-61c14dfef427", decisionId: "7201c493-6693-4456-8f23-bd22248b76fb", candidatePayloadChecksum: "51832c9d91ed42dc358c92a66039f70e04949373f78400f8baa4ba8d9deae3a9", payloadChecksum: "d452f1b7bbb820d2b69f8ef7ccedf8a00e54501ce6069f0199f9e5a3cc516231", productIdentityChecksum: "7ab015ae89ef0f82181357e73c1e0b39f22f6dd4887ff6087c2745e447a98cce", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:58:50.501992Z" },
    { productId: "54cac861-bc82-4142-a4c4-bb014f21e68e", sourceUid: "860641516881", model: "ИДН-02", revisionId: "d67a05d2-09d6-4176-910d-8607e6945a9c", reviewItemId: "841a4ae7-dced-469a-8590-ee148c17387f", decisionId: "e2ed1888-73b8-4b40-998d-b4ff66578bd9", candidatePayloadChecksum: "02e80f525d8030b221f1120b3c480a65f0aee2165f769e4b6f47e67518bc9527", payloadChecksum: "46046095bcd2f2ad023bb0a3c23e3e25be6180c1ed959c2f62959a2eb1e0b3b7", productIdentityChecksum: "9a0260543b48530801f3dc830ab9aebcb49fd35ca0510ee46dff2d37e1d5ad0b", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:59:07.526513Z" },
    { productId: "eee213c1-3906-474d-8a28-37aa7ea8dc51", sourceUid: "939922758055", model: "FB-18RBS", revisionId: "b3374a31-8103-49d7-adca-dce0740002cb", reviewItemId: "acaa94df-9c4c-4464-8a80-4710ca44f1e5", decisionId: "5643b3e1-fc40-4fcd-b149-506cf86c31a4", candidatePayloadChecksum: "c309b5e9e29fdf6f9321376faf4c1b8a30fdeecc3423e96bbd9aa56288667ad4", payloadChecksum: "e55dd3d2fcbbb051f0e6c74d219210fadd3f579e9bf1c3366374d90518ff7ddf", productIdentityChecksum: "af319ea4b03dc059943999686b1052ab7e5344d32de65351265667a834e68a1e", warnings: ["missing_documents", "missing_registration"], reviewedAt: "2026-08-02T09:59:10.411854Z" },
  ] satisfies readonly GroupCBatch2PublicationManifestEntry[]),
} as const);

export function groupCBatch2PublicationManifestDigestInput() {
  return {
    version: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.version,
    createdAt: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.createdAt,
    operationKey: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.operationKey,
    productCount: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.productCount,
    entries: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries,
  };
}

export function calculateGroupCBatch2PublicationManifestSha256() {
  return createHash("sha256")
    .update(JSON.stringify(groupCBatch2PublicationManifestDigestInput()))
    .digest("hex");
}

export function validateGroupCBatch2PublicationOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_C_BATCH_2_PUBLICATION_OPERATION_KEY
    && record.manifestSha256 === GROUP_C_BATCH_2_PUBLICATION_MANIFEST_SHA256;
}
