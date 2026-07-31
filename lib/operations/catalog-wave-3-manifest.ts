import "server-only";

export const CATALOG_WAVE_3_OPERATION_KEY = "catalog-publication-wave-3-v1";
export const CATALOG_WAVE_3_MANIFEST_SHA256 =
  "7444e7872b109d4ad86ffe69cc6c04cb9623d56cc574dc6effe82e9197df13a1";

export type CatalogWave3ManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  revisionId: string;
  reviewItemId: string;
  decisionId: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  warnings: readonly string[];
  reviewedAt: string;
}>;

/**
 * Immutable Production scope extracted in a READ ONLY transaction and approved
 * for Catalog Publication Wave 3. Runtime callers submit only the operation key
 * and digest; no caller-controlled Product identity reaches lifecycle RPCs.
 */
export const CATALOG_WAVE_3_MANIFEST = Object.freeze({
  version: "catalog-publication-wave-3-v1",
  createdAt: "2026-07-31T16:52:32Z",
  operationKey: CATALOG_WAVE_3_OPERATION_KEY,
  productCount: 8,
  waveSha256: CATALOG_WAVE_3_MANIFEST_SHA256,
  entries: Object.freeze([
    {
      productId: "5ac01386-a97f-4ee1-a456-752649a1da71",
      sourceUid: "431878286472",
      model: "Resona i9",
      revisionId: "134311f6-1c57-4f71-8ec9-638741d48545",
      reviewItemId: "897857c4-edcd-4955-8767-485109579fb4",
      decisionId: "ced9eeb2-7d66-4727-8924-0db15e39f185",
      candidatePayloadChecksum: "da2f740f239e0ad31cd13ab5242b38269a6f95b707c1c0e9221cf52409f65cf5",
      payloadChecksum: "3eafb1bea5381b46e63492d4fee8b7e9ba9c915792d4a614bee0714694e83f29",
      productIdentityChecksum: "19aced0209a26a90ee4c2a7e1d1109a50bb2bc3d29e141f211323aaff413cae7",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:51:54.767792Z",
    },
    {
      productId: "e34f16f0-723c-4710-aab3-fb03d9fd9b84",
      sourceUid: "989433020341",
      model: "FC1400",
      revisionId: "71dfcfcd-8562-4252-92f7-fabcdf424bb9",
      reviewItemId: "8ba340fd-89f7-4ea7-8572-ef33ee243c18",
      decisionId: "91749a99-0536-4432-9af9-17853211b830",
      candidatePayloadChecksum: "110b99c2bedf882c260b647f4e0ddcd90013edb67bad1140db45006001192dc4",
      payloadChecksum: "b1e88bbc01b1008fa719c787c1b8091c045885bb4734592362cda6d9ebeafa4a",
      productIdentityChecksum: "e3dca15b47a169eea644772886eb82da0c6840bc9b3d2eb602348ddffc193489",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:12.624277Z",
    },
    {
      productId: "5411e0dc-a1f0-4124-a0aa-e7a9f39ffb7c",
      sourceUid: "582183013252",
      model: "Sonicaid Team3-I",
      revisionId: "4df1af38-0e00-4736-a55f-a29f671cd907",
      reviewItemId: "d974a475-1384-48db-9822-68b5c24b97bf",
      decisionId: "e646ca57-0898-408a-a6aa-74c206dcf03f",
      candidatePayloadChecksum: "bb2c3ec52d252130fdb3b1c90112c2e0dcac8cfeb2e70bc45678fe0010125f99",
      payloadChecksum: "321356159c06ebcc26313b05c2d11dae1d6167fccf386da887100d92102b9347",
      productIdentityChecksum: "653b860ddc954f194fd161c490e1d639b55b316272166b3a9687a55d6927180b",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:14.549565Z",
    },
    {
      productId: "291673de-2321-4df3-8121-a741d18da72b",
      sourceUid: "772750235332",
      model: "Sonicaid Team3-A",
      revisionId: "d627f1c9-21b2-4a20-b8d3-56371fbabe75",
      reviewItemId: "130d3765-ffe6-42a2-b2a4-6bdc8dc164e3",
      decisionId: "8dd4cfa0-e744-4553-bc1e-189c036b4376",
      candidatePayloadChecksum: "af7442a87a94fa7be8c307335bfde27c534ac8044f8f7e1fc9c9644b49481294",
      payloadChecksum: "1d26a5f5606b871ed7e46d2779c034459f1d2aafa46510ae4518c33a214f2a18",
      productIdentityChecksum: "8073eb693d4e58358185310f7ff9be577920447e6512b66ad5cad866141f0500",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:16.791937Z",
    },
    {
      productId: "4ec80478-242d-4c9a-a9e7-dc57d8a8a5b4",
      sourceUid: "937994862401",
      model: "Aplio i900",
      revisionId: "7d7d063c-e646-4a17-ba19-4a7598338a08",
      reviewItemId: "e718ced9-a06d-4e55-b81b-7e0c9a80ec21",
      decisionId: "7d899c1d-fbcf-4d47-ac28-a4184f806708",
      candidatePayloadChecksum: "dbf862c42cb172b90140e3009074160397d6bfe532208bf6046e619eabe3f5fe",
      payloadChecksum: "19cc8011612b7b75314e8c7b5bdaa337665696403627e451119de013f30f41ad",
      productIdentityChecksum: "477afef77c9121616b230831f71008a0b91400413f69000e6338db769a88bd3a",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:27.779736Z",
    },
    {
      productId: "c8e51a0f-e969-4740-9f21-4af1110d2a46",
      sourceUid: "975456539101",
      model: "LOGIQ E9",
      revisionId: "bc95867b-5de7-4b9f-b73e-d4b29003a130",
      reviewItemId: "97408a9a-f76b-45b0-bf02-21ddbd0d7453",
      decisionId: "c6a5b7b7-ebdf-4e46-972b-3f21c15b6f41",
      candidatePayloadChecksum: "39bed70f91606707b74f9a864d85aadef4ac0b7f93f8b1f69a0146c9070ce121",
      payloadChecksum: "b0f4596ca255a6ad911634631c0e8cd35ff9fb0a9448bcc5d4e34b45ce71218b",
      productIdentityChecksum: "4ce01cf1dcf3ce621759bee85bbc98a514ef6fdb3bd664bb360bd008f5ceda49",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:30.265539Z",
    },
    {
      productId: "f397743d-ef0d-4a5b-9b87-876e251ed367",
      sourceUid: "619316683987",
      model: "CardioCare 2000",
      revisionId: "a7ac7070-73a7-4570-b7a8-427a4c86e36a",
      reviewItemId: "2c5df626-40ee-4a61-916e-5ad15c33bc36",
      decisionId: "34a04102-ee19-45de-80cc-eb480adde8de",
      candidatePayloadChecksum: "63cfcc00a413bcfe5950062e3fdaeace276154201569dfa8494c16ec02aafc01",
      payloadChecksum: "9a76b3f9e318f941cc81ba2f424f99dd4631682b5a633e6f49525cdc2c7558e8",
      productIdentityChecksum: "b29822feece281c2ed21f9595b5519f81c246d38204bf56230c99dd7872d0141",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:32.382283Z",
    },
    {
      productId: "dc511122-9b03-4a91-83c6-eb08e27a7b74",
      sourceUid: "507218946101",
      model: "CardioTouch 3000",
      revisionId: "558e5395-cf03-47a2-8c6e-4346f1fc651b",
      reviewItemId: "05e9b6e9-c974-4485-bc77-a79f7245b0e5",
      decisionId: "3db2b009-195c-4489-945c-0c84ccec35ff",
      candidatePayloadChecksum: "8016c385602987a215524165a93c4f68b01d5eb516f3f446e03c3ec0a6a78c64",
      payloadChecksum: "25e66da008029c7e7fed1f657890d6a89261a0654232db9dd6a08ac16b853e8d",
      productIdentityChecksum: "04cd0f605a6689addbb6efc3072f0bd42bd43251637069ddd77804b4185c5a48",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T10:52:34.513807Z",
    },
  ] satisfies readonly CatalogWave3ManifestEntry[]),
} as const);

export function validateCatalogWave3OperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === CATALOG_WAVE_3_OPERATION_KEY
    && record.manifestSha256 === CATALOG_WAVE_3_MANIFEST_SHA256;
}
