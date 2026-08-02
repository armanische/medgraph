import "server-only";

import {
  approveProductPublicationRevision,
  publishProduct,
} from "@/lib/product-publication/server";
import { parsePublishedCatalogProjection } from "@/lib/published-catalog/contracts";
import {
  createProjectBoundSupabaseServerClient,
  type SupabaseServerClient,
} from "@/lib/supabase/client.server";

import {
  GROUP_C_BATCH_2_PUBLICATION_MANIFEST,
  type GroupCBatch2PublicationManifestEntry,
} from "./group-c-batch-2-publication-manifest";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

const EXCLUDED_PRODUCT_IDS = new Set([
  "46340003-dffa-4321-b5c1-cb3f4a5cf317", // Gemos-PF
  "f3053ed8-d29a-41ff-b9e1-a873dd6b77f1", // Gemos
  "d7506879-32fc-48ae-9ea6-8561f2c5868a", // AOHUA VME-5B
  "860306a1-e01e-4f10-b980-93490e446d37", // Pentax EPK-i7010
  "7efe1eb2-6551-4f0b-9310-c898cbcfdf7a", // combined UNIKOS-02/03
  "e7a54ec6-986d-422a-aca8-862d4d00a421", // Instilar 1438
]);

type CatalogAdminProduct = {
  id?: unknown;
  slug?: unknown;
  model?: unknown;
  publicationStatus?: unknown;
  reviewState?: unknown;
  published?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  characteristics?: unknown;
  media?: unknown;
  immutable?: { sourceUid?: unknown; sourceChecksum?: unknown } | null;
};

type CatalogAdminInventory = { items?: unknown; total?: unknown };
type ApprovalEvidence = { revisionId: string; approvalId: string };
type PublicationEvidence = {
  productId: string;
  revisionId: string;
  publicationBatchId: string;
  publicationVersion: number;
  slug: string;
};

export type GroupCBatch2PublicationResult = Readonly<{
  status: "completed" | "already_complete";
  operationKey: string;
  manifestSha256: string;
  approvals: readonly ApprovalEvidence[];
  publications: readonly PublicationEvidence[];
  totals: Readonly<{
    products: 79;
    published: 63;
    revisions: 63;
    decisions: 63;
    approvals: 63;
    publicationBatches: 63;
  }>;
}>;

export class GroupCBatch2PublicationRunnerError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Group C Batch 2 publication operation failed closed.");
    this.name = "GroupCBatch2PublicationRunnerError";
    this.code = code;
  }
}

function fail(code: string): never {
  throw new GroupCBatch2PublicationRunnerError(code);
}

async function callCloudApi<T>(
  client: SupabaseServerClient,
  rpc: string,
  body: Readonly<Record<string, unknown>>,
): Promise<T> {
  if (client.access !== "service_role") fail("service_role_required");
  const response = await client.request(`/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: CLOUD_API_HEADERS,
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}

async function readCatalogProduct(client: SupabaseServerClient, productId: string) {
  return callCloudApi<CatalogAdminProduct | null>(client, "catalog_admin_product", {
    p_id: productId,
  });
}

async function readInventory(client: SupabaseServerClient) {
  return callCloudApi<CatalogAdminInventory>(client, "catalog_admin_products", {
    p_search: null,
    p_filter: "all",
    p_sort: "updated",
  });
}

async function readPublishedProjection(client: SupabaseServerClient) {
  const value = await callCloudApi<unknown>(
    client,
    "cloud_published_storefront_catalog_v1",
    {},
  );
  return parsePublishedCatalogProjection(value);
}

function assertManifest() {
  const entries = GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries;
  const productIds = new Set(entries.map(({ productId }) => productId));
  const sourceUids = new Set(entries.map(({ sourceUid }) => sourceUid));
  const revisionIds = new Set(entries.map(({ revisionId }) => revisionId));
  const decisionIds = new Set(entries.map(({ decisionId }) => decisionId));
  const reviewItemIds = new Set(entries.map(({ reviewItemId }) => reviewItemId));
  const checksum = /^[a-f0-9]{64}$/u;
  const reviewTimestamp = /^2026-08-02T\d{2}:\d{2}:\d{2}\.\d{6}Z$/u;
  if (
    GROUP_C_BATCH_2_PUBLICATION_MANIFEST.productCount !== 13
    || productIds.size !== 13
    || sourceUids.size !== 13
    || revisionIds.size !== 13
    || decisionIds.size !== 13
    || reviewItemIds.size !== 13
    || [...EXCLUDED_PRODUCT_IDS].some((id) => productIds.has(id))
    || entries.some((entry) =>
      !checksum.test(entry.candidatePayloadChecksum)
      || !checksum.test(entry.payloadChecksum)
      || !checksum.test(entry.productIdentityChecksum)
      || !reviewTimestamp.test(entry.reviewedAt)
      || entry.warnings.length !== 2
      || !entry.warnings.includes("missing_documents")
      || !entry.warnings.includes("missing_registration"))
  ) fail("manifest_scope_invalid");
}

function assertCatalogProduct(
  entry: GroupCBatch2PublicationManifestEntry,
  product: CatalogAdminProduct | null,
  expectedPublished: boolean,
) {
  const characteristics = product?.characteristics;
  const media = product?.media;
  if (
    !product
    || product.id !== entry.productId
    || typeof product.slug !== "string"
    || product.model !== entry.model
    || product.published !== expectedPublished
    || product.publicationStatus !== (expectedPublished ? "published" : "in_review")
    || product.reviewState !== (expectedPublished ? "published" : "in_review")
    || product.immutable?.sourceUid !== entry.sourceUid
    || typeof product.immutable?.sourceChecksum !== "string"
    || product.immutable.sourceChecksum.length !== 64
    || typeof product.seoTitle !== "string"
    || typeof product.seoDescription !== "string"
    || !Array.isArray(characteristics)
    || characteristics.length < 3
    || !Array.isArray(media)
    || media.length < 1
  ) fail("catalog_product_scope_drift");
  return product as CatalogAdminProduct & { slug: string };
}

async function approveExactly(
  client: SupabaseServerClient,
  entry: GroupCBatch2PublicationManifestEntry,
) {
  const approvalIdempotencyKey = `group-c-batch-2-approval-${entry.revisionId}`;
  if (approvalIdempotencyKey.length < 8) fail("approval_key_invalid");
  const invoke = () => approveProductPublicationRevision({
    candidateRevisionId: entry.revisionId,
    reviewDecisionId: entry.decisionId,
  }, client);
  let result;
  try {
    result = await invoke();
  } catch {
    result = await invoke();
  }
  if (
    result.candidateRevisionId !== entry.revisionId
    || result.productId !== entry.productId
    || result.payloadChecksum !== entry.payloadChecksum
  ) fail("approval_result_drift");
  return result;
}

async function publishExactly(
  client: SupabaseServerClient,
  entry: GroupCBatch2PublicationManifestEntry,
) {
  const invoke = () => publishProduct({
    candidateRevisionId: entry.revisionId,
    idempotencyKey: `group-c-batch-2-publish-${entry.productId}`,
  }, client);
  let result;
  try {
    result = await invoke();
  } catch {
    result = await invoke();
  }
  if (
    result.candidateRevisionId !== entry.revisionId
    || result.productId !== entry.productId
    || result.action !== "publish"
    || result.state !== "published"
  ) fail("publication_result_drift");
  return result;
}

function finalResult(
  status: GroupCBatch2PublicationResult["status"],
  approvals: readonly ApprovalEvidence[],
  publications: readonly PublicationEvidence[],
): GroupCBatch2PublicationResult {
  return {
    status,
    operationKey: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.operationKey,
    manifestSha256: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.manifestSha256,
    approvals,
    publications,
    totals: {
      products: 79,
      published: 63,
      revisions: 63,
      decisions: 63,
      approvals: 63,
      publicationBatches: 63,
    },
  };
}

export async function executeProductionGroupCBatch2Publication(): Promise<GroupCBatch2PublicationResult> {
  assertManifest();
  const client = createProjectBoundSupabaseServerClient();
  if (client.access !== "service_role") fail("service_role_required");

  const [inventory, projection, ...productValues] = await Promise.all([
    readInventory(client),
    readPublishedProjection(client),
    ...GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries.map(({ productId }) =>
      readCatalogProduct(client, productId)),
  ]);
  if (inventory.total !== 79 || !Array.isArray(inventory.items) || inventory.items.length !== 79) {
    fail("catalog_total_drift");
  }
  if (projection.products.length !== 50 && projection.products.length !== 63) {
    fail("published_scope_drift");
  }
  const alreadyCompleted = projection.products.length === 63;
  const products = GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries.map((entry, index) =>
    assertCatalogProduct(entry, productValues[index] as CatalogAdminProduct | null, alreadyCompleted));
  const publicSlugs = new Set(projection.products.map(({ slug }) => slug));
  if (products.some(({ slug }) => publicSlugs.has(slug) !== alreadyCompleted)) {
    fail("published_target_scope_drift");
  }

  // Sequential execution remains below the approved maximum concurrency of two.
  const approvalResults = [];
  for (const entry of GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries) {
    approvalResults.push(await approveExactly(client, entry));
  }
  const approvalEvidence = approvalResults.map((result, index) => ({
    revisionId: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries[index].revisionId,
    approvalId: result.approvalId,
  }));
  if (new Set(approvalEvidence.map(({ approvalId }) => approvalId)).size !== 13) {
    fail("approval_scope_invalid");
  }
  for (let index = 0; index < GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries.length; index += 1) {
    const confirmation = await approveExactly(
      client,
      GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries[index],
    );
    if (!confirmation.idempotent || confirmation.approvalId !== approvalEvidence[index].approvalId) {
      fail("approval_durable_verification_failed");
    }
  }

  const publicationResults = [];
  for (const entry of GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries) {
    publicationResults.push(await publishExactly(client, entry));
  }
  const publicationEvidence = publicationResults.map((result, index) => ({
    productId: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries[index].productId,
    revisionId: GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries[index].revisionId,
    publicationBatchId: result.publicationBatchId,
    publicationVersion: result.publicationVersion,
    slug: products[index].slug,
  }));
  if (new Set(publicationEvidence.map(({ publicationBatchId }) => publicationBatchId)).size !== 13) {
    fail("publication_scope_invalid");
  }
  for (let index = 0; index < GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries.length; index += 1) {
    const confirmation = await publishExactly(
      client,
      GROUP_C_BATCH_2_PUBLICATION_MANIFEST.entries[index],
    );
    if (
      !confirmation.idempotent
      || confirmation.publicationBatchId !== publicationEvidence[index].publicationBatchId
    ) fail("publication_durable_verification_failed");
  }

  const finalProjection = await readPublishedProjection(client);
  const finalSlugs = new Set(finalProjection.products.map(({ slug }) => slug));
  if (
    finalProjection.products.length !== 63
    || publicationEvidence.some(({ slug }) => !finalSlugs.has(slug))
  ) fail("wave_not_fully_published");

  return finalResult(
    alreadyCompleted ? "already_complete" : "completed",
    approvalEvidence,
    publicationEvidence,
  );
}
