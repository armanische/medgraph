import "server-only";

export const GROUP_B_SIX_OPERATION_KEY = "group-b-six-publication-v1";
export const GROUP_B_SIX_MANIFEST_SHA256 =
  "15c69beef95257ac62778860f14360b360ae5bf49a984740e35297f3961c6879";

export type GroupBSixManifestEntry = Readonly<{
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
 * Exact Product Owner-approved Group B scope extracted in a READ ONLY
 * Production transaction. Runtime callers submit only the operation key and
 * digest; no caller-controlled Product identity reaches lifecycle RPCs.
 */
export const GROUP_B_SIX_MANIFEST = Object.freeze({
  version: "group-b-six-publication-v1",
  createdAt: "2026-07-31T19:10:01Z",
  operationKey: GROUP_B_SIX_OPERATION_KEY,
  productCount: 6,
  waveSha256: GROUP_B_SIX_MANIFEST_SHA256,
  entries: Object.freeze([
    {
      productId: "95af806c-3fbf-446e-a608-263aa290d548",
      sourceUid: "740658724462",
      model: "CV-170",
      revisionId: "d0095254-3b5b-4bea-8021-700e5af1c8d5",
      reviewItemId: "486bcae0-3b9a-4fae-a114-45fe671cbde7",
      decisionId: "baba1928-0bc7-4b88-9374-170e91f35450",
      candidatePayloadChecksum: "e06fb3ce11330c869a94d271cd88fafb19c16fefe2296bf6183030c9fd184b42",
      payloadChecksum: "8b7aa7f3d9d4aa0cf2a0b1d1a14f54510c8c08297e64d6575d5b86d260fd679e",
      productIdentityChecksum: "73f19745eb535c2178d32e5a4edd0f869e906ab7edb12923a5fdcac3bd244267",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:52:47.693665Z",
    },
    {
      productId: "4e1a370b-4e53-4ee6-b590-823d1ad0e087",
      sourceUid: "304432044232",
      model: "CV-190",
      revisionId: "c629b5d2-7b13-4fda-9da6-d004b579fb18",
      reviewItemId: "07b79430-6420-4227-9dbc-f5335c663854",
      decisionId: "22f5e7f2-648f-4395-8972-3ce032d68cac",
      candidatePayloadChecksum: "ccb4f9039553c11259e92161a3df899153f889cdd982c8badc09a68cf11b444b",
      payloadChecksum: "f7a256d3970e896af1552117074db0763f0aaaf3d0664364e8a8e51e3ae32bd3",
      productIdentityChecksum: "6e87818326c1702e60b5b88dec994b8d3dea205f427241beffcdb28f6f155209",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:53:18.183562Z",
    },
    {
      productId: "3d31c64e-0cc0-40f9-bfed-cbc720781567",
      sourceUid: "761217382341",
      model: "BM5",
      revisionId: "7700d1ef-fd92-4d46-81d7-e1a981e939df",
      reviewItemId: "bb597579-1178-48f1-83c6-671cb78da16d",
      decisionId: "5c95b785-9b02-49ec-9d0e-42e3a0fb038b",
      candidatePayloadChecksum: "2f90dece2fae2c21d87ebaffd9b6bae98fd7d433e50cae8e472b0ae0efd3ed55",
      payloadChecksum: "320857abd6e5478bc0b17a0ccea0f2c29a122a520637bf0e1ad1790306e43968",
      productIdentityChecksum: "d4df9121854e95c5233de7d2e95eba2d89208b0989befc8b5c059a48148d7873",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:53:35.613817Z",
    },
    {
      productId: "76840838-c759-40eb-a1ef-e329e9091714",
      sourceUid: "724985486041",
      model: "BeneFusion SP5",
      revisionId: "676523c3-90bf-4a31-98d1-bd7c6af34c9f",
      reviewItemId: "f6d4baae-ec54-46bc-b4e3-1969eeeb1722",
      decisionId: "c6ba4cca-1838-446a-a0ed-afa74f2b686e",
      candidatePayloadChecksum: "f808ab93fe29bb7fb3b3330e7bdc5373b51088dc0249f0f759841980d7a05539",
      payloadChecksum: "c3cfc1a4d65d8493a90c999578e734bb8f2b7f95cb2ee60b84ff6d5716e23d12",
      productIdentityChecksum: "8f245b0731dd9d10ebdc1e8e4d918352c2b50224ea937b91dae8998bd2facb43",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:53:39.151391Z",
    },
    {
      productId: "b352787f-36b3-4cae-b72d-7e9d130dd5f7",
      sourceUid: "777813572261",
      model: "STAR5000",
      revisionId: "d2ed13c0-43a9-468a-a19f-683c289b1e6f",
      reviewItemId: "ff2eff8c-e942-479d-ac4c-f39ff3b1379e",
      decisionId: "7eba6054-7660-4574-a3f6-4b9249c007be",
      candidatePayloadChecksum: "5d0844b0ab40f62afb2b1b2b8076bf212e477c45141ac12f68cd6dc0657af905",
      payloadChecksum: "2848470a220b840b96f96a96b64ee091695bd30fe34b96e75dd51a60c9663d13",
      productIdentityChecksum: "df7d5d97b2828fedb44b347dcb6e28b133cf3d85f7f0f2ee2dfbd098c68ae986",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:53:40.685006Z",
    },
    {
      productId: "f798f9c1-4555-447e-b67c-66ba22f52c3e",
      sourceUid: "116854129531",
      model: "STAR5000C",
      revisionId: "26771e99-4d44-4d12-85f6-267187d77654",
      reviewItemId: "b7cd1dab-7c94-4169-8f89-42a8f45105c0",
      decisionId: "94ec02d5-b026-4069-8678-beecd0f0faea",
      candidatePayloadChecksum: "ba4a2af5687c531d482ccbbae7010a580d20dbc9083b5be08ded8b6dcac8a154",
      payloadChecksum: "11040e740cb7b8864443acdc750381aaabe365705d141acfe05a7af0cb2ecf14",
      productIdentityChecksum: "970d0b6657c21819b1e3b1317f25b962c988beb3b7777fd7423f80addd720930",
      warnings: ["missing_documents", "missing_registration"],
      reviewedAt: "2026-07-31T18:53:43.612182Z",
    },
  ] satisfies readonly GroupBSixManifestEntry[]),
} as const);

export function validateGroupBSixOperationRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2
    && record.operationKey === GROUP_B_SIX_OPERATION_KEY
    && record.manifestSha256 === GROUP_B_SIX_MANIFEST_SHA256;
}
