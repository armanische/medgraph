import "server-only";

export const CATALOG_WAVE_1_OPERATION_KEY = "catalog-publication-wave-1-v1";
export const CATALOG_WAVE_1_MANIFEST_SHA256 =
  "45694001e0652a23977de759a5b6ca86dbfe893fd8c38a1c151739be13c42405";

export type CatalogWave1ManifestEntry = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  revisionId: string;
  reviewItemId: string;
  decisionId: string;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
}>;

/**
 * Immutable Production operation scope approved by the Product Owner.
 *
 * Runtime callers submit only the operation key and manifest digest. Product
 * identities are resolved exclusively from this server-only manifest.
 */
export const CATALOG_WAVE_1_MANIFEST = Object.freeze({
  version: 1,
  createdAt: "2026-07-31T13:25:55Z",
  operationKey: CATALOG_WAVE_1_OPERATION_KEY,
  waveSha256: CATALOG_WAVE_1_MANIFEST_SHA256,
  entries: Object.freeze([
    {
      productId: "d0877778-2560-49f5-8e14-1c79a0236625",
      sourceUid: "691798585131",
      model: "HAMILTON-C1",
      revisionId: "45f10d39-7204-4cef-bee4-a6e644671a08",
      reviewItemId: "7870d449-2e0a-4e2c-81b1-82df7b746615",
      decisionId: "edd4d1cf-a0fc-43a8-9dd6-3d84c030d84e",
      candidatePayloadChecksum: "c213a947b0b5c35a380c0998fd5dbe0d438f655618530e8f3e29146944186b1b",
      payloadChecksum: "3b88afb09fab4600574c2e0c51d4a9585ab92c3fa8a40699a67c0a0c4ad640d1",
      productIdentityChecksum: "b7f25d4934b41c388f9cd9506ed0c8e8a07f573c38c24b073a901790d91c4764",
    },
    {
      productId: "55f88ed2-8308-4c76-8a2f-27de6f9b6ebb",
      sourceUid: "709309498991",
      model: "HAMILTON-C3",
      revisionId: "cdce4e6c-3788-4e43-b73a-d61c870bdd71",
      reviewItemId: "d4a7ea71-585f-4ae1-8134-cb4da6142ab2",
      decisionId: "dae752d1-1f74-43e7-9b02-c59ad42c41e1",
      candidatePayloadChecksum: "a24a7329990acab885dfc52464f84d0dd56942ec1a58ffdb0f316804f03664d2",
      payloadChecksum: "995c4c63f8e66b281979778ea287ffecb431c3b1c867638ca10f93b6604e12bf",
      productIdentityChecksum: "70e40475b3fd36f8efe21d1aac04acc49e0e9be22beb6b00ba04c8a39fb8f6c5",
    },
    {
      productId: "a7a94835-8608-4705-8205-b45cf9089b24",
      sourceUid: "385537759549",
      model: "Instilar 1428",
      revisionId: "0fcedfbd-bc41-41e2-b6c5-fadae6ef4918",
      reviewItemId: "8c83f7f9-af09-4fd7-8201-305e6dd1e851",
      decisionId: "8baf301c-604a-47ce-8341-71de9c17a2a6",
      candidatePayloadChecksum: "ba08e565cad67f075c28be3a4208202e843a51e85fe5f019e9816ceceec455a0",
      payloadChecksum: "1eff87491a85062765cd6cf47ae9f9ded2abd535e92fbf7da270a9e085ce7b94",
      productIdentityChecksum: "dd3b4f754c7bb262b889f4698f5cc2cf26076bb85cb4f6d6af41f93ab13b7c2f",
    },
    {
      productId: "224ee705-5dea-429f-ab10-1ef9153e94fc",
      sourceUid: "725867191732",
      model: "BeneHeart D3",
      revisionId: "c811034f-cb9d-44ac-8cf7-b2f6cb223c1e",
      reviewItemId: "31e9c689-fbf3-41ff-bc08-62ea742b3f5a",
      decisionId: "35dd1267-e431-48dd-8e2b-e7944fa0f643",
      candidatePayloadChecksum: "8c5ccabb5801eefe3b1d4f06272b0bc38d5c8001e36397fc889be01638d44dfa",
      payloadChecksum: "831b96363354d7eb7c9b3d0a06d33a4f4d67bf68804bd0418ad473483e7a837b",
      productIdentityChecksum: "d34a0156a56c5a859289dee2a36a40e1a4651ea4d1f08ab64c47f784c8991dc2",
    },
    {
      productId: "cdfed34e-73e4-4dec-a77b-70f88fc24cda",
      sourceUid: "791348718821",
      model: "Vacus 7308",
      revisionId: "d96aade7-9733-41ad-965f-b60ddcd9187e",
      reviewItemId: "4288d02d-596d-440b-a841-35a2219fb93d",
      decisionId: "f71917e8-10af-4f9c-926e-407262d3d322",
      candidatePayloadChecksum: "0144eaed349cf7d4da410026c60180d879c81fa9599913bed79bf3014ef454dc",
      payloadChecksum: "b4352b461a29d58014df1e7221efaaa1a0ade9d3adf959b8d313b32dd1dd3bcb",
      productIdentityChecksum: "eb4a2ed45966cc4876033a39483ac4ef2ba8c159e5001690ede25df2a35551e1",
    },
    {
      productId: "2f1efc30-7d1e-4f6b-a86c-a308c4ce58bc",
      sourceUid: "317877821321",
      model: "BeneVision N17/N15/N12",
      revisionId: "3a510da7-13b9-40ae-9791-2d7475577dd3",
      reviewItemId: "f75f7a43-ff4d-4392-98ab-f042a6790a06",
      decisionId: "a4d94757-422e-4195-bcee-a6dd9a4d202d",
      candidatePayloadChecksum: "10ed8fe6bbb34722af75bc1acc071d257b28a6690d5636a8989f8aa3685f817b",
      payloadChecksum: "fc0af9f2a02f66beeeb998de5c079d914767870325bdf85172feb820ced5adee",
      productIdentityChecksum: "1b0a7987ec641bc97ffa769b1e74eec1c6330407aa6d77b765dccee36bd3dfde",
    },
    {
      productId: "5a0416bf-0808-470d-9a39-0cb52f22f9af",
      sourceUid: "472096036091",
      model: "BM3",
      revisionId: "6c61405f-2765-484d-8dbb-27581e12397e",
      reviewItemId: "e396091b-e527-4161-8eec-7377428a441b",
      decisionId: "11e132c9-b400-423d-a694-55b5cab1c58e",
      candidatePayloadChecksum: "54d3e4243b8be6a6cad9ee5e45cbab2a7a246b503353443d5665db5e0a786035",
      payloadChecksum: "668d5b2f11c579e4752dd413c50b2c2c6056fe52adff47c0bd67317f88b50cd0",
      productIdentityChecksum: "0cc8a5ec8f802b778cfe412402446fd74763d722d4ff2fd8037e790ababf878f",
    },
    {
      productId: "43e90efe-9cae-4ccf-b74b-9fd410c82cd3",
      sourceUid: "211207666761",
      model: "Storm 5800",
      revisionId: "f150f4bc-c8d7-4069-ab45-c73c15d091dc",
      reviewItemId: "c5662abf-be3c-43e1-a581-c7b183473860",
      decisionId: "aeae643c-6f49-4d72-9706-df11424ed9df",
      candidatePayloadChecksum: "2818a406877dced2daceceac081c7eeb17cc14affb83c4d47ea202b67aa4a694",
      payloadChecksum: "339ca4a2858c2f0bb9f529b23c81c8d2a87028e632ab4aaa0099d7a7173b1f43",
      productIdentityChecksum: "46d68d13abe45b088dec923cd61c60eaa0bf84763e7ca6579fa6c61e3f023754",
    },
    {
      productId: "f61a0496-0434-41ab-8ca3-0f79c19ab0aa",
      sourceUid: "159912360691",
      model: "BeneVision N1",
      revisionId: "df13433f-7461-40fd-9c9c-e026254f9ec4",
      reviewItemId: "0d168d58-d096-408a-9bbb-e04065330d96",
      decisionId: "58c67cab-e496-4ed3-882f-c65c17086990",
      candidatePayloadChecksum: "30637d4ba26f0a874118c706ebb65adb0d8cbe88f22692754bfcc46b58c5e5a7",
      payloadChecksum: "925b501d10552120f1b0f0770c8daec05c1072150e13410f4983720ed0db1824",
      productIdentityChecksum: "bea760c0d0fac8beffc302e05e80a2c410452f25a5abee78ea7d224e29708034",
    },
    {
      productId: "c6ba9c45-f6e8-4b2f-9f32-38335ee52bfe",
      sourceUid: "256598838332",
      model: "Versana Essential",
      revisionId: "a84e9afe-0245-429a-ba4a-acc9926d49d0",
      reviewItemId: "7e728191-7296-43b5-af96-97ec6f3040f2",
      decisionId: "af3e1e3a-6473-455c-991d-0581a745a27a",
      candidatePayloadChecksum: "e183d336e0bd709ee90db62ecc70f3fa96feef35f2944650db3d255be58ad15c",
      payloadChecksum: "6b779e0fb2da11385cc12e8cd1c0f916cc365de3e41d989a4f798edcd450f120",
      productIdentityChecksum: "34c3fee6665d95d3c854a056a59325ec8410398111cf912574be1e1c3e25445b",
    },
  ] satisfies readonly CatalogWave1ManifestEntry[]),
} as const);

export function validateCatalogWave1OperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === CATALOG_WAVE_1_OPERATION_KEY
    && record.manifestSha256 === CATALOG_WAVE_1_MANIFEST_SHA256;
}
