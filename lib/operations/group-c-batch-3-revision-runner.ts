import "server-only";

import { createHash } from "node:crypto";

import { createProductPublicationRevision } from "@/lib/product-publication/server";
import { parsePublishedCatalogProjection } from "@/lib/published-catalog/contracts";
import {
  createProjectBoundSupabaseServerClient,
  type SupabaseServerClient,
} from "@/lib/supabase/client.server";

import {
  calculateGroupCBatch3RevisionManifestSha256,
  GROUP_C_BATCH_3_REVISION_COMPLETION_EVIDENCE,
  GROUP_C_BATCH_3_REVISION_MANIFEST,
  GROUP_C_BATCH_3_REVISION_MANIFEST_SHA256,
  type GroupCBatch3RevisionManifestEntry,
} from "./group-c-batch-3-revision-manifest";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

const EXCLUDED_PRODUCTS = Object.freeze([
  { productId: "24ac72fc-5c64-4f4e-9f92-cd4eca58e426", sourceUid: "363181290312" },
  { productId: "db6da513-24dc-45e3-8e18-c6033825adce", sourceUid: "632825146024" },
  { productId: "5c41e1d8-6311-4a63-bb99-41b8ae17d8a1", sourceUid: "754023648801" },
  { productId: "f3053ed8-d29a-41ff-b9e1-a873dd6b77f1", sourceUid: "757604699272" },
  { productId: "46340003-dffa-4321-b5c1-cb3f4a5cf317", sourceUid: "576228046022" },
  { productId: "d7506879-32fc-48ae-9ea6-8561f2c5868a", sourceUid: "275089738610" },
  { productId: "860306a1-e01e-4f10-b980-93490e446d37", sourceUid: "529970599662" },
  { productId: "7efe1eb2-6551-4f0b-9310-c898cbcfdf7a", sourceUid: "412668785772" },
  { productId: "e7a54ec6-986d-422a-aca8-862d4d00a421", sourceUid: "532456144899" },
]);

type CatalogAdminProduct = {
  id?: unknown;
  model?: unknown;
  shortDescription?: unknown;
  description?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  publicationStatus?: unknown;
  reviewState?: unknown;
  published?: unknown;
  catalogQualityStatus?: unknown;
  qualityFlags?: {
    missingManufacturer?: unknown;
    missingCategory?: unknown;
    missingModel?: unknown;
    missingApplicationArea?: unknown;
    missingCharacteristics?: unknown;
    missingRegistration?: unknown;
    missingDocuments?: unknown;
    missingMedia?: unknown;
  } | null;
  characteristics?: unknown;
  media?: unknown;
  immutable?: {
    sourceUid?: unknown;
    sourceChecksum?: unknown;
    rawSnapshot?: unknown;
  } | null;
};

type CatalogAdminInventory = { items?: unknown; total?: unknown };

type RevisionEvidence = Readonly<{
  productId: string;
  sourceUid: string;
  model: string;
  revisionId: string;
  reviewItemId: string;
  revisionNumber: 1;
  candidatePayloadChecksum: string;
  payloadChecksum: string;
  productIdentityChecksum: string;
  characteristics: 3;
  media: number;
  warnings: readonly string[];
  idempotent: boolean;
}>;

export type GroupCBatch3RevisionResult = Readonly<{
  status: "completed" | "already_complete";
  operationKey: string;
  manifestSha256: string;
  created: number;
  revisions: readonly RevisionEvidence[];
  totals: Readonly<{
    products: 79;
    published: 63;
    revisions: 70;
    decisions: 63;
    approvals: 63;
    publicationBatches: 63;
    pendingReviewItems: 7;
  }>;
  projectionVersion: 65;
}>;

export class GroupCBatch3RevisionRunnerError extends Error {
  readonly code: string;
  constructor(code: string) {
    super("Group C Batch 3 revision operation failed closed.");
    this.name = "GroupCBatch3RevisionRunnerError";
    this.code = code;
  }
}

function fail(code: string): never {
  throw new GroupCBatch3RevisionRunnerError(code);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function sha256(value: unknown) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function postgresJsonbText(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(postgresJsonbText).join(", ")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).map((key) =>
      `${JSON.stringify(key)}: ${postgresJsonbText(record[key])}`).join(", ")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function postgresJsonbSha256(value: unknown) {
  return createHash("sha256").update(postgresJsonbText(value)).digest("hex");
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

async function mapWithConcurrency<T, U>(
  values: readonly T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<U>,
) {
  const results = new Array<U>(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function assertManifest() {
  const entries = GROUP_C_BATCH_3_REVISION_MANIFEST.entries;
  const productIds = new Set(entries.map(({ productId }) => productId));
  const sourceUids = new Set(entries.map(({ sourceUid }) => sourceUid));
  const checksum = /^[a-f0-9]{64}$/u;
  if (
    calculateGroupCBatch3RevisionManifestSha256()
      !== GROUP_C_BATCH_3_REVISION_MANIFEST_SHA256
    || GROUP_C_BATCH_3_REVISION_MANIFEST.productCount !== 7
    || entries.length !== 7
    || productIds.size !== 7
    || sourceUids.size !== 7
    || entries.some((entry) =>
      !checksum.test(entry.candidatePayloadChecksum)
      || !checksum.test(entry.payloadChecksum)
      || !checksum.test(entry.productIdentityChecksum)
      || !checksum.test(entry.rawSnapshotSha256)
      || !checksum.test(entry.sourceChecksum)
      || entry.characteristics !== 3
      || entry.media < 1
      || entry.warnings.length !== 2
      || !entry.warnings.includes("missing_documents")
      || !entry.warnings.includes("missing_registration"))
    || EXCLUDED_PRODUCTS.some(({ productId }) => productIds.has(productId))
  ) fail("manifest_scope_invalid");
}

function assertCatalogProduct(
  entry: GroupCBatch3RevisionManifestEntry,
  product: CatalogAdminProduct | null,
  allowCreatedState: boolean,
) {
  const flags = product?.qualityFlags;
  if (!product || product.id !== entry.productId) fail("catalog_product_binding_drift");
  if (product.model !== entry.model) fail("catalog_product_model_drift");
  if (product.published !== false) fail("catalog_product_published_drift");
  if (
    allowCreatedState
      ? product.publicationStatus !== "in_review" || product.reviewState !== "in_review"
      : product.publicationStatus !== "draft" || product.reviewState !== "pending"
  ) fail("catalog_product_lifecycle_state_drift");
  if (product.catalogQualityStatus !== "READY") fail("catalog_product_quality_drift");
  if (
    typeof product.shortDescription !== "string" || product.shortDescription.trim().length === 0
    || typeof product.description !== "string" || product.description.trim().length === 0
    || typeof product.seoTitle !== "string" || product.seoTitle.trim().length === 0
    || typeof product.seoDescription !== "string" || product.seoDescription.trim().length === 0
  ) fail("catalog_product_content_drift");
  if (
    !Array.isArray(product.characteristics)
    || product.characteristics.length !== entry.characteristics
    || !Array.isArray(product.media)
    || product.media.length !== entry.media
  ) fail("catalog_product_children_drift");
  if (product.immutable?.sourceUid !== entry.sourceUid) fail("catalog_product_source_uid_drift");
  if (product.immutable.sourceChecksum !== entry.sourceChecksum) {
    fail("catalog_product_source_checksum_drift");
  }
  if (!product.immutable.rawSnapshot || typeof product.immutable.rawSnapshot !== "object") {
    fail("catalog_product_raw_snapshot_missing");
  }
  if (postgresJsonbSha256(product.immutable.rawSnapshot) !== entry.rawSnapshotSha256) {
    fail("catalog_product_raw_snapshot_hash_drift");
  }
  if (
    !flags
    || flags.missingManufacturer !== false
    || flags.missingCategory !== false
    || flags.missingModel !== false
    || flags.missingApplicationArea !== false
    || flags.missingCharacteristics !== false
    || flags.missingMedia !== false
    || flags.missingRegistration !== true
    || flags.missingDocuments !== true
  ) fail("catalog_product_flags_drift");
}

function assertExcludedProduct(
  expected: (typeof EXCLUDED_PRODUCTS)[number],
  product: CatalogAdminProduct | null,
) {
  if (
    !product
    || product.id !== expected.productId
    || product.immutable?.sourceUid !== expected.sourceUid
    || product.published !== false
    || product.publicationStatus !== "draft"
    || product.reviewState === "in_review"
  ) fail("excluded_product_drift");
}

async function preflight(client: SupabaseServerClient) {
  const [inventory, projection, excluded] = await Promise.all([
    readInventory(client),
    readPublishedProjection(client),
    mapWithConcurrency(EXCLUDED_PRODUCTS, 3, ({ productId }) =>
      readCatalogProduct(client, productId)),
  ]);
  if (inventory.total !== 79 || !Array.isArray(inventory.items) || inventory.items.length !== 79) {
    fail("catalog_total_drift");
  }
  if (projection.products.length !== 63) {
    fail("published_projection_drift");
  }
  excluded.forEach((product, index) => assertExcludedProduct(EXCLUDED_PRODUCTS[index], product));

  const rounds: (CatalogAdminProduct | null)[][] = [];
  for (let read = 0; read < 10; read += 1) {
    rounds.push(await mapWithConcurrency(
      GROUP_C_BATCH_3_REVISION_MANIFEST.entries,
      3,
      ({ productId }) => readCatalogProduct(client, productId),
    ));
  }
  const states = GROUP_C_BATCH_3_REVISION_MANIFEST.entries.map((entry, index) => {
    const first = rounds[0][index];
    const created = first?.publicationStatus === "in_review";
    const firstDigest = sha256(first);
    for (const round of rounds) {
      if (sha256(round[index]) !== firstDigest) fail("candidate_nondeterministic");
      assertCatalogProduct(entry, round[index], created);
    }
    return created;
  });
  const created = states.filter(Boolean).length;
  if (created !== 0 && created !== 7) fail("mixed_revision_state");
  return created === 7;
}

function revisionIdempotencyKey(entry: GroupCBatch3RevisionManifestEntry) {
  return `group-c-batch-3-${entry.sourceUid}-revision-1`;
}

async function createExactly(
  client: SupabaseServerClient,
  entry: GroupCBatch3RevisionManifestEntry,
) {
  const result = await createProductPublicationRevision({
    productId: entry.productId,
    idempotencyKey: revisionIdempotencyKey(entry),
  }, client);
  if (
    result.productId !== entry.productId
    || result.revisionNumber !== 1
    || result.state !== "in_review"
    || result.payloadChecksum !== entry.payloadChecksum
    || result.productIdentityChecksum !== entry.productIdentityChecksum
  ) fail("revision_result_drift");
  return result;
}

function evidenceFromResult(
  entry: GroupCBatch3RevisionManifestEntry,
  result: Awaited<ReturnType<typeof createProductPublicationRevision>>,
): RevisionEvidence {
  return {
    productId: entry.productId,
    sourceUid: entry.sourceUid,
    model: entry.model,
    revisionId: result.candidateRevisionId,
    reviewItemId: result.reviewItemId,
    revisionNumber: 1,
    candidatePayloadChecksum: entry.candidatePayloadChecksum,
    payloadChecksum: result.payloadChecksum,
    productIdentityChecksum: result.productIdentityChecksum,
    characteristics: entry.characteristics,
    media: entry.media,
    warnings: entry.warnings,
    idempotent: result.idempotent,
  };
}

export async function executeProductionGroupCBatch3RevisionCreation(): Promise<
  GroupCBatch3RevisionResult
> {
  assertManifest();
  const client = createProjectBoundSupabaseServerClient();
  if (client.access !== "service_role") fail("service_role_required");
  const alreadyCreated = await preflight(client);

  if (
    alreadyCreated
    && (
      GROUP_C_BATCH_3_REVISION_COMPLETION_EVIDENCE.length !== 7
      || new Set(GROUP_C_BATCH_3_REVISION_COMPLETION_EVIDENCE.map(({ productId }) => productId)).size !== 7
    )
  ) fail("preexisting_revision");

  const firstResults: Awaited<ReturnType<typeof createProductPublicationRevision>>[] = [];
  for (const entry of GROUP_C_BATCH_3_REVISION_MANIFEST.entries) {
    firstResults.push(await createExactly(client, entry));
  }
  const created = firstResults.filter(({ idempotent }) => !idempotent).length;
  if (created !== (alreadyCreated ? 0 : 7)) fail("partial_revision_creation");

  if (alreadyCreated) {
    firstResults.forEach((result, index) => {
      const expected = GROUP_C_BATCH_3_REVISION_COMPLETION_EVIDENCE[index];
      if (
        !result.idempotent
        || result.productId !== expected.productId
        || result.candidateRevisionId !== expected.revisionId
        || result.reviewItemId !== expected.reviewItemId
      ) fail("revision_completion_evidence_drift");
    });
  }

  const revisionIds = new Set(firstResults.map(({ candidateRevisionId }) => candidateRevisionId));
  const reviewItemIds = new Set(firstResults.map(({ reviewItemId }) => reviewItemId));
  if (revisionIds.size !== 7 || reviewItemIds.size !== 7) fail("revision_binding_duplicate");

  const replayResults: Awaited<ReturnType<typeof createProductPublicationRevision>>[] = [];
  for (const entry of GROUP_C_BATCH_3_REVISION_MANIFEST.entries) {
    replayResults.push(await createExactly(client, entry));
  }
  replayResults.forEach((result, index) => {
    if (
      !result.idempotent
      || result.candidateRevisionId !== firstResults[index].candidateRevisionId
      || result.reviewItemId !== firstResults[index].reviewItemId
    ) fail("revision_idempotency_failed");
  });

  const afterProducts = await mapWithConcurrency(
    GROUP_C_BATCH_3_REVISION_MANIFEST.entries,
    3,
    ({ productId }) => readCatalogProduct(client, productId),
  );
  afterProducts.forEach((product, index) => {
    assertCatalogProduct(GROUP_C_BATCH_3_REVISION_MANIFEST.entries[index], product, true);
  });
  const [afterProjection, excludedAfter] = await Promise.all([
    readPublishedProjection(client),
    mapWithConcurrency(EXCLUDED_PRODUCTS, 3, ({ productId }) =>
      readCatalogProduct(client, productId)),
  ]);
  if (afterProjection.products.length !== 63) {
    fail("published_projection_drift");
  }
  excludedAfter.forEach((product, index) =>
    assertExcludedProduct(EXCLUDED_PRODUCTS[index], product));

  return {
    status: created === 0 ? "already_complete" : "completed",
    operationKey: GROUP_C_BATCH_3_REVISION_MANIFEST.operationKey,
    manifestSha256: GROUP_C_BATCH_3_REVISION_MANIFEST.manifestSha256,
    created,
    revisions: replayResults.map((result, index) =>
      evidenceFromResult(GROUP_C_BATCH_3_REVISION_MANIFEST.entries[index], result)),
    totals: {
      products: 79,
      published: 63,
      revisions: 70,
      decisions: 63,
      approvals: 63,
      publicationBatches: 63,
      pendingReviewItems: 7,
    },
    projectionVersion: 65,
  };
}
