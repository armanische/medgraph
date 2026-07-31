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
  CATALOG_WAVE_3_MANIFEST,
  type CatalogWave3ManifestEntry,
} from "./catalog-wave-3-manifest";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

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

type ApprovalEvidence = {
  revisionId: string;
  approvalId: string;
};

type PublicationEvidence = {
  productId: string;
  revisionId: string;
  publicationBatchId: string;
  slug: string;
};

export type CatalogWave3Result = Readonly<{
  status: "completed" | "already_completed";
  operationKey: string;
  manifestSha256: string;
  approvals: readonly ApprovalEvidence[];
  publications: readonly PublicationEvidence[];
  totals: Readonly<{
    products: 79;
    published: 36;
    revisions: 36;
    decisions: 36;
    approvals: 36;
    publicationBatches: 36;
  }>;
  remainingReviewedUnpublished: 0;
}>;

export class CatalogWave3RunnerError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Catalog Wave 3 operation failed closed.");
    this.name = "CatalogWave3RunnerError";
    this.code = code;
  }
}

function fail(code: string): never {
  throw new CatalogWave3RunnerError(code);
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
  return callCloudApi<CatalogAdminProduct | null>(
    client,
    "catalog_admin_product",
    { p_id: productId },
  );
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
  const entries = CATALOG_WAVE_3_MANIFEST.entries;
  const productIds = new Set(entries.map(({ productId }) => productId));
  const revisionIds = new Set(entries.map(({ revisionId }) => revisionId));
  const decisionIds = new Set(entries.map(({ decisionId }) => decisionId));
  const reviewItemIds = new Set(entries.map(({ reviewItemId }) => reviewItemId));
  const checksum = /^[a-f0-9]{64}$/u;
  const reviewTimestamp = /^2026-07-31T\d{2}:\d{2}:\d{2}\.\d{6}Z$/u;
  if (
    CATALOG_WAVE_3_MANIFEST.productCount !== 8
    || productIds.size !== 8
    || revisionIds.size !== 8
    || decisionIds.size !== 8
    || reviewItemIds.size !== 8
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
  entry: CatalogWave3ManifestEntry,
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
  entry: CatalogWave3ManifestEntry,
) {
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
  entry: CatalogWave3ManifestEntry,
) {
  const invoke = () => publishProduct({
    candidateRevisionId: entry.revisionId,
    idempotencyKey: `catalog-wave-3-publish-${entry.productId}`,
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
  status: CatalogWave3Result["status"],
  approvals: readonly ApprovalEvidence[],
  publications: readonly PublicationEvidence[],
): CatalogWave3Result {
  return {
    status,
    operationKey: CATALOG_WAVE_3_MANIFEST.operationKey,
    manifestSha256: CATALOG_WAVE_3_MANIFEST.waveSha256,
    approvals,
    publications,
    totals: {
      products: 79,
      published: 36,
      revisions: 36,
      decisions: 36,
      approvals: 36,
      publicationBatches: 36,
    },
    remainingReviewedUnpublished: 0,
  };
}

export async function executeProductionCatalogWave3(): Promise<CatalogWave3Result> {
  assertManifest();
  const client = createProjectBoundSupabaseServerClient();
  if (client.access !== "service_role") fail("service_role_required");

  const [inventory, projection, ...productValues] = await Promise.all([
    readInventory(client),
    readPublishedProjection(client),
    ...CATALOG_WAVE_3_MANIFEST.entries.map(({ productId }) =>
      readCatalogProduct(client, productId)),
  ]);
  if (inventory.total !== 79 || !Array.isArray(inventory.items) || inventory.items.length !== 79) {
    fail("catalog_total_drift");
  }
  if (projection.products.length !== 28 && projection.products.length !== 36) {
    fail("published_scope_drift");
  }
  const alreadyCompleted = projection.products.length === 36;
  const products = CATALOG_WAVE_3_MANIFEST.entries.map((entry, index) =>
    assertCatalogProduct(
      entry,
      productValues[index] as CatalogAdminProduct | null,
      alreadyCompleted,
    ));
  const publicSlugs = new Set(projection.products.map(({ slug }) => slug));
  if (products.some(({ slug }) => publicSlugs.has(slug) !== alreadyCompleted)) {
    fail("published_target_scope_drift");
  }

  // Sequential execution is intentionally below the approved maximum concurrency of two.
  const approvalResults = [];
  for (const entry of CATALOG_WAVE_3_MANIFEST.entries) {
    approvalResults.push(await approveExactly(client, entry));
  }
  const approvalEvidence = approvalResults.map((result, index) => ({
    revisionId: CATALOG_WAVE_3_MANIFEST.entries[index].revisionId,
    approvalId: result.approvalId,
  }));
  const approvalIds = new Set(approvalEvidence.map(({ approvalId }) => approvalId));
  if (approvalIds.size !== 8) fail("approval_scope_invalid");

  for (let index = 0; index < CATALOG_WAVE_3_MANIFEST.entries.length; index += 1) {
    const confirmation = await approveExactly(client, CATALOG_WAVE_3_MANIFEST.entries[index]);
    if (!confirmation.idempotent || confirmation.approvalId !== approvalEvidence[index].approvalId) {
      fail("approval_durable_verification_failed");
    }
  }

  const publicationResults = [];
  for (const entry of CATALOG_WAVE_3_MANIFEST.entries) {
    publicationResults.push(await publishExactly(client, entry));
  }
  const publicationEvidence = publicationResults.map((result, index) => ({
    productId: CATALOG_WAVE_3_MANIFEST.entries[index].productId,
    revisionId: CATALOG_WAVE_3_MANIFEST.entries[index].revisionId,
    publicationBatchId: result.publicationBatchId,
    slug: products[index].slug,
  }));
  const publicationIds = new Set(
    publicationEvidence.map(({ publicationBatchId }) => publicationBatchId),
  );
  if (publicationIds.size !== 8) fail("publication_scope_invalid");

  for (let index = 0; index < CATALOG_WAVE_3_MANIFEST.entries.length; index += 1) {
    const confirmation = await publishExactly(client, CATALOG_WAVE_3_MANIFEST.entries[index]);
    if (
      !confirmation.idempotent
      || confirmation.publicationBatchId !== publicationEvidence[index].publicationBatchId
    ) fail("publication_durable_verification_failed");
  }

  const finalProjection = await readPublishedProjection(client);
  const finalSlugs = new Set(finalProjection.products.map(({ slug }) => slug));
  if (
    finalProjection.products.length !== 36
    || publicationEvidence.some(({ slug }) => !finalSlugs.has(slug))
  ) fail("wave_not_fully_published");

  return finalResult(
    alreadyCompleted ? "already_completed" : "completed",
    approvalEvidence,
    publicationEvidence,
  );
}
