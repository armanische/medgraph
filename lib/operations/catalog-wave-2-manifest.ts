import "server-only";

export const CATALOG_WAVE_2_OPERATION_KEY = "catalog-publication-wave-2-v1";
export const CATALOG_WAVE_2_MANIFEST_SHA256 =
  "b19fda10991a2ae81db9bf87bb1565e1dcb7e1e2eea582a97cca3097495a8204";

export type CatalogWave2ManifestEntry = Readonly<{
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
 * Immutable Production scope extracted in a READ ONLY transaction and approved
 * for Catalog Publication Wave 2. Runtime callers submit only the operation key
 * and digest; no caller-controlled Product identity reaches lifecycle RPCs.
 */
export const CATALOG_WAVE_2_MANIFEST = Object.freeze({
  version: 1,
  createdAt: "2026-07-31T15:44:36Z",
  operationKey: CATALOG_WAVE_2_OPERATION_KEY,
  waveSha256: CATALOG_WAVE_2_MANIFEST_SHA256,
  entries: Object.freeze([
    {
      productId: "ce444ef2-5619-46b4-8a17-01bef3f4aaeb",
      sourceUid: "551427991321",
      model: "Vacus 7209",
      revisionId: "a60c8f66-1aac-4d99-8ae9-ec2f85721b36",
      reviewItemId: "44f79b9e-5f15-4a49-bfd2-f74754802172",
      decisionId: "1ebcef63-b6ac-433f-b10e-971243284ac5",
      candidatePayloadChecksum: "a34d7a63177ee5c35d86951df2469920796fd6f654f1506088775337a12aceeb",
      payloadChecksum: "1492883fcd3bfae1dd0fd1c86bf3cf44c8dc1b77dc7d62f3ba6f073449fad474",
      productIdentityChecksum: "3f88d77a38c43767deee72b67991ac6c9052cc4b32ff8c0c241824486863e2ad",
    },
    {
      productId: "2dd905db-e017-4dd8-8401-81e78193d838",
      sourceUid: "365138915501",
      model: "iMEC 8/10/12",
      revisionId: "8318e62f-2d40-4df8-b29f-619d413b4637",
      reviewItemId: "525b507c-e3a2-4361-b2f8-ae05010bef73",
      decisionId: "3f9b7087-9b01-4b42-9e0a-57ca883119b5",
      candidatePayloadChecksum: "6e10c4e1a8e90f9bebd98abe4fb55973bfcc37094094fa4f103380a7d1340075",
      payloadChecksum: "f4742ba6c4094a1eed9fcca69a9e191e7d9c5aac0440a57fdb1e9088bd328406",
      productIdentityChecksum: "4484373a0ab1adbcc8fa4f0085353d1b979c9f36003f165061134a696661fd33",
    },
    {
      productId: "2499091f-ad6d-461f-89fd-f5f8884f7d99",
      sourceUid: "972412373651",
      model: "Storm 5900",
      revisionId: "70452a0a-fd59-40e6-836f-bb39d67140a5",
      reviewItemId: "7df4947a-bf5e-4315-80d7-7fee09d27f95",
      decisionId: "eb3acdae-cda3-44a5-93bf-db78062d851d",
      candidatePayloadChecksum: "adbdd3270d349d1134dd94f550c11a2ecccf6ecabc70303b3e0adce2052eb3dc",
      payloadChecksum: "a6cc38e524513e1c39198edf631127fd3607b6d9de6c68463b1935cbf232bfab",
      productIdentityChecksum: "23efee5f3191d3d1344ea634f79e8d09559289bb7f423886cd48048d5e00f927",
    },
    {
      productId: "312a01ea-d83d-49fb-96dc-cc380cc070b5",
      sourceUid: "162624200421",
      model: "Vacus 7018",
      revisionId: "7c895040-d904-4709-91d6-8390b437da2d",
      reviewItemId: "15c3aff9-9fde-4e68-a8e7-7a0e78f8aae9",
      decisionId: "c66c67c5-fa95-4965-85b9-0dc86558cdeb",
      candidatePayloadChecksum: "4c3f78aa817541ff22a350f51117bdc302b92fac18f6d6e8f76e5242972f6d55",
      payloadChecksum: "4cc2272e72e40cc71c001a261a23c7fae35bb897369ecc254e3246bfdc635343",
      productIdentityChecksum: "8e89f1e1eaab0fe227108e8c595a6c5283d61cf165b09113fe905dccf1ebec6f",
    },
    {
      productId: "66b45c69-47b9-4371-ae81-8aff1f3e5685",
      sourceUid: "730259716752",
      model: "Aplio i700",
      revisionId: "98d270f7-a5ca-4c0f-a4ba-fbaf0f161182",
      reviewItemId: "687d61ff-15b5-4889-8a19-59c9b99ec2a4",
      decisionId: "992a8894-bd46-438f-a590-9092afbd03cf",
      candidatePayloadChecksum: "20385ffaaa7c763e648faff8b94136d4bc0d0af080baa4b00bb1adc447c5429e",
      payloadChecksum: "823f3219abe983fd3d915881a2680f94a675b017838ed6b62c05e06e111f4662",
      productIdentityChecksum: "5733f73cb9b14e7c9fa29c90060b550c83ddd28ffb77b25064a9dd720693c111",
    },
    {
      productId: "90d92c9e-d5f4-4c29-8a65-48ac27ca391b",
      sourceUid: "722415430452",
      model: "Aplio i800",
      revisionId: "a56a65f5-114a-4ca4-93fc-31f1b347dc3b",
      reviewItemId: "b89625f5-7829-4c88-b726-984d7dc498eb",
      decisionId: "8ac92c83-e31c-441a-b652-e0ca1be2bbac",
      candidatePayloadChecksum: "47dcb95d63d97421b9b55760a06c7b45da8feb84e68eafe93b59dc180bca41ad",
      payloadChecksum: "9bc3635becb9ee836dab32972eae4f442ff956322793b71116e4c725eb02745d",
      productIdentityChecksum: "2c0aecc1ea85c1f965df194db005b21b2c90904c5bf533c0891dcbfd422ce964",
    },
    {
      productId: "a420a758-de21-4b45-924e-7f2f31da6eaa",
      sourceUid: "816186680362",
      model: "Vivid iQ",
      revisionId: "7f57e339-ad32-425b-a5c4-41abbab04c9a",
      reviewItemId: "bc15902e-94bf-41e3-805b-dc351f213bf7",
      decisionId: "da8781d6-bf71-4b04-9340-5b3c0310e4b8",
      candidatePayloadChecksum: "e8b21bb4c81432574f42c4b0870225cf03a160b15dddfbec47e674203d4996d4",
      payloadChecksum: "6e259da0dafd528534af399f333ae3a1b76d2aa64051560b5c94b6243bd304d9",
      productIdentityChecksum: "a30e1679a712df526ece387338ec25aea1eb3d97ff9dd889ea37db175816982c",
    },
    {
      productId: "140440f8-bfbd-421f-b926-531adcd7c458",
      sourceUid: "225844007122",
      model: "Vivid T9",
      revisionId: "bd93445a-50be-4f70-a382-93bd0a3d602a",
      reviewItemId: "9b5441c2-5140-46fe-82ba-a995940085db",
      decisionId: "8f61f6e7-dd3b-44e5-8c83-afd994d77e1f",
      candidatePayloadChecksum: "67158e1be46a3b53571c2a6c8ea5d9049bb557fd299ae55265087bca65310086",
      payloadChecksum: "9c2a8439afacf782d33e035b9533e876c811d6da7ae10597e1fd65c7816f70d7",
      productIdentityChecksum: "c1f437b8f1639fd9789ee86922c50ff57953b88b645b2b34e5d435c75a2a2c7f",
    },
    {
      productId: "81447b8f-5676-4ecc-8440-23f1a722b648",
      sourceUid: "299320772912",
      model: "DC-40",
      revisionId: "b5e1c60b-4193-4c8b-9453-10a57ecc1ab6",
      reviewItemId: "b04879da-43dd-480d-9fc9-b91cc4c157af",
      decisionId: "09caeda7-8df5-4b77-9c2e-9b65672676e2",
      candidatePayloadChecksum: "e4971d701b80895053a8bdedc39ce5076fd6e045b2b1f088b1a34bae76da261a",
      payloadChecksum: "28a0f7a7f3feb441adbf5d61d55ee35c4f146fcff406f4d815cb5cab56e3856e",
      productIdentityChecksum: "be2be9b50f4f264b9dc26c570f3ed051d1041a9dad9476c13912405406fe67d9",
    },
    {
      productId: "bbd89839-44d4-4d0d-bba0-27785055faa0",
      sourceUid: "836797220702",
      model: "DC-70",
      revisionId: "9046484b-c7dc-48af-a133-80ec15f006dc",
      reviewItemId: "4b7ac400-e985-4c00-afc5-55128ab8625c",
      decisionId: "9e0e0e2a-3234-4963-ab4f-5e4d35ad8da0",
      candidatePayloadChecksum: "127eb9d327a755e35762fb235f50f8006f40163420b55759c7854c47c9d6467a",
      payloadChecksum: "4dbe513c1d8b8cd7ade11698449ef87774f270cb0c7f9c2c9f829587acee4431",
      productIdentityChecksum: "19bbfcfcdd739b911a31133683ee1dae258e7d9fb9be061840daae0281fb20d7",
    },
    {
      productId: "0caffe1c-2751-4649-9aed-01a43708e026",
      sourceUid: "233964023312",
      model: "DC-80",
      revisionId: "3998646e-7901-404b-be6f-abadbf62052a",
      reviewItemId: "7e7fdd95-8ac0-429f-a8b7-c052d1e89d0b",
      decisionId: "a683dd39-51a8-4eb4-ac01-b30e65be0222",
      candidatePayloadChecksum: "1064a2f592d0fae9c40c981015865092de5b75d59a19b64ee8f7fa86b74285ef",
      payloadChecksum: "19a3c8e8031e7f838bde0b6e57fc32d975eec275d947eaf2e707a243838b53c3",
      productIdentityChecksum: "7df2cb4a45d6ef3916ade2621f9b613fea8101883a55c81ab2f201b34f5cf25e",
    },
    {
      productId: "cf4a1c0a-b301-4b62-9c86-ffdec5bb6a7f",
      sourceUid: "772103317658",
      model: "M9",
      revisionId: "13cb5d25-dc70-4219-b911-a0c5b7f33ae7",
      reviewItemId: "318dfc48-603a-44d8-9094-60ccc945e75e",
      decisionId: "f0621841-fc36-4d88-970f-89c9f7d57970",
      candidatePayloadChecksum: "8bc81d344f64b2b88dbfb3cc828b18359645cf446c7a5c1f9157fe55d6fffd99",
      payloadChecksum: "2c70c214d3f65fd03fbca26a3afb9a409f86327a9801242ef59dd48069981a8b",
      productIdentityChecksum: "732560a760cca43786448837664f57c1e01dd274afa6bc2bfaeca89f3af9319e",
    },
    {
      productId: "44eb828a-894b-4f92-acab-40ed3eab761a",
      sourceUid: "743154619762",
      model: "MX8",
      revisionId: "86663f03-a9cb-4771-a3b8-8f169af77478",
      reviewItemId: "8915e082-beac-4bc4-863e-1f46347cae29",
      decisionId: "e78823bd-cf75-435b-a178-1070a0361050",
      candidatePayloadChecksum: "118358372a52bacafffd323759d9ab9049d31f7c22ea9060b86ab7cc527744a3",
      payloadChecksum: "38986ffc0e3261605f7820a546312a2e213105dfa90f09de62b8727131f011a2",
      productIdentityChecksum: "3179b27f1124f4a559f17a0deda6dec5358392f3c5ee100e150e9b2ffa6997db",
    },
    {
      productId: "cd6e6060-6cdb-4575-8e78-d8a52816fe6d",
      sourceUid: "710502245802",
      model: "Resona 6",
      revisionId: "3d290303-c460-4efe-b615-42b53b870c9a",
      reviewItemId: "35540183-7a60-4741-ab6d-a3cabfd52411",
      decisionId: "607eb61a-027c-4154-a3d8-16a151cfbc78",
      candidatePayloadChecksum: "1cc9c1ba9ff3f66af48b5d97b847c50b7484d72067c99ca78cc1a53c1a67aed2",
      payloadChecksum: "eee1c2122fbb1466f0d526013c390bed18403dd34daf554ce80b2038bb0dc3df",
      productIdentityChecksum: "5ce5d023e34408a2a60bbd9361dd62e1dc6a8bf7ef24c3223800179e19867735",
    },
    {
      productId: "1eb7ac0d-c755-4666-b10e-7933a650931d",
      sourceUid: "163731865692",
      model: "Resona 7",
      revisionId: "378a199b-84b0-465e-96f8-fa10795a02aa",
      reviewItemId: "04a705b2-9b99-4ce7-9cb8-4042b88b661e",
      decisionId: "791441c8-f2b7-4726-b77a-10414ef6ad86",
      candidatePayloadChecksum: "fda4711e0c77d22ce38e65adc45f3884786d2238723e0c1c2e6d5fc23a6f6448",
      payloadChecksum: "9ee034ef5f41eecc0be3a21554ca5f8b7c1eefcf4f33341e8a9fa3c5f5d69e2c",
      productIdentityChecksum: "98121bdad50a821b6ce9639699b77c72449d020ebf8fa979da3a67174b937b9b",
    },
  ] satisfies readonly CatalogWave2ManifestEntry[]),
} as const);

export function validateCatalogWave2OperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === CATALOG_WAVE_2_OPERATION_KEY
    && record.manifestSha256 === CATALOG_WAVE_2_MANIFEST_SHA256;
}
