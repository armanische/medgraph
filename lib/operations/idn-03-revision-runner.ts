import "server-only";

import { createHash } from "node:crypto";

import { createProductPublicationRevision } from "@/lib/product-publication/server";
import { parsePublishedCatalogProjection } from "@/lib/published-catalog/contracts";
import {
  createProjectBoundSupabaseServerClient,
  type SupabaseServerClient,
} from "@/lib/supabase/client.server";

import {
  calculateIdn03RevisionManifestSha256,
  IDN_03_REVISION_COMPLETION_EVIDENCE,
  IDN_03_REVISION_MANIFEST,
  IDN_03_REVISION_MANIFEST_SHA256,
  type Idn03RevisionManifestEntry,
} from "./idn-03-revision-manifest";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

const EXCLUDED_PRODUCTS = Object.freeze([
  { productId: "d7506879-32fc-48ae-9ea6-8561f2c5868a", sourceUid: "275089738610" },
  { productId: "860306a1-e01e-4f10-b980-93490e446d37", sourceUid: "529970599662" },
  { productId: "db6da513-24dc-45e3-8e18-c6033825adce", sourceUid: "632825146024" },
  { productId: "5c41e1d8-6311-4a63-bb99-41b8ae17d8a1", sourceUid: "754023648801" },
  { productId: "f3053ed8-d29a-41ff-b9e1-a873dd6b77f1", sourceUid: "757604699272" },
  { productId: "46340003-dffa-4321-b5c1-cb3f4a5cf317", sourceUid: "576228046022" },
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
  qualityFlags?: Record<string, unknown> | null;
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
  media: 1;
  warnings: readonly string[];
  idempotent: boolean;
}>;

export type Idn03RevisionResult = Readonly<{
  status: "completed" | "already_complete";
  operationKey: string;
  manifestSha256: string;
  created: 0 | 1;
  revisions: readonly [RevisionEvidence];
  totals: Readonly<{
    products: 79;
    published: 70;
    revisions: 71;
    decisions: 70;
    approvals: 70;
    publicationBatches: 70;
    pendingReviewItems: 1;
  }>;
  projectionVersion: 72;
}>;

export class Idn03RevisionRunnerError extends Error {
  readonly code: string;
  constructor(code: string) {
    super("IDN-03 revision operation failed closed.");
    this.name = "Idn03RevisionRunnerError";
    this.code = code;
  }
}

function fail(code: string): never {
  throw new Idn03RevisionRunnerError(code);
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

function assertManifest() {
  const [entry] = IDN_03_REVISION_MANIFEST.entries;
  const checksum = /^[a-f0-9]{64}$/u;
  if (
    calculateIdn03RevisionManifestSha256() !== IDN_03_REVISION_MANIFEST_SHA256
    || IDN_03_REVISION_MANIFEST.productCount !== 1
    || IDN_03_REVISION_MANIFEST.entries.length !== 1
    || entry.productId !== "24ac72fc-5c64-4f4e-9f92-cd4eca58e426"
    || entry.sourceUid !== "363181290312"
    || !checksum.test(entry.candidatePayloadChecksum)
    || !checksum.test(entry.payloadChecksum)
    || !checksum.test(entry.productIdentityChecksum)
    || !checksum.test(entry.rawSnapshotSha256)
    || !checksum.test(entry.sourceChecksum)
    || entry.characteristics !== 3
    || entry.media !== 1
    || EXCLUDED_PRODUCTS.some(({ productId }) => productId === entry.productId)
  ) fail("manifest_scope_invalid");
}

function assertCatalogProduct(
  entry: Idn03RevisionManifestEntry,
  product: CatalogAdminProduct | null,
  created: boolean,
) {
  const flags = product?.qualityFlags;
  if (!product || product.id !== entry.productId) fail("catalog_product_binding_drift");
  if (product.model !== entry.model) fail("catalog_product_model_drift");
  if (product.published !== false) fail("catalog_product_published_drift");
  if (
    created
      ? product.publicationStatus !== "in_review" || product.reviewState !== "in_review"
      : product.publicationStatus !== "draft" || product.reviewState !== "pending"
  ) fail("catalog_product_lifecycle_state_drift");
  if (product.catalogQualityStatus !== "READY") fail("catalog_product_quality_drift");
  if (
    typeof product.shortDescription !== "string" || !product.shortDescription.trim()
    || typeof product.description !== "string" || !product.description.trim()
    || typeof product.seoTitle !== "string" || !product.seoTitle.trim()
    || typeof product.seoDescription !== "string" || !product.seoDescription.trim()
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
    || product.reviewState !== "pending"
  ) fail("excluded_product_drift");
}

async function preflight(client: SupabaseServerClient) {
  const [entry] = IDN_03_REVISION_MANIFEST.entries;
  const [inventory, projection, excluded] = await Promise.all([
    readInventory(client),
    readPublishedProjection(client),
    Promise.all(EXCLUDED_PRODUCTS.map(({ productId }) =>
      readCatalogProduct(client, productId))),
  ]);
  if (inventory.total !== 79 || !Array.isArray(inventory.items) || inventory.items.length !== 79) {
    fail("catalog_total_drift");
  }
  if (projection.products.length !== 70) fail("published_projection_drift");
  excluded.forEach((product, index) => assertExcludedProduct(EXCLUDED_PRODUCTS[index], product));

  const rounds: (CatalogAdminProduct | null)[] = [];
  for (let read = 0; read < 10; read += 1) {
    rounds.push(await readCatalogProduct(client, entry.productId));
  }
  const first = rounds[0];
  const created = first?.publicationStatus === "in_review";
  const digest = sha256(first);
  for (const product of rounds) {
    if (sha256(product) !== digest) fail("candidate_nondeterministic");
    assertCatalogProduct(entry, product, created);
  }
  return created;
}

async function createExactly(
  client: SupabaseServerClient,
  entry: Idn03RevisionManifestEntry,
) {
  const result = await createProductPublicationRevision({
    productId: entry.productId,
    idempotencyKey: "idn-03-initial-revision-v1",
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
  entry: Idn03RevisionManifestEntry,
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
    characteristics: 3,
    media: 1,
    warnings: entry.warnings,
    idempotent: result.idempotent,
  };
}

export async function executeProductionIdn03RevisionCreation(): Promise<Idn03RevisionResult> {
  assertManifest();
  const [entry] = IDN_03_REVISION_MANIFEST.entries;
  const client = createProjectBoundSupabaseServerClient();
  if (client.access !== "service_role") fail("service_role_required");
  const alreadyCreated = await preflight(client);

  if (
    alreadyCreated
    && (
      IDN_03_REVISION_COMPLETION_EVIDENCE.length !== 1
      || IDN_03_REVISION_COMPLETION_EVIDENCE[0]?.productId !== entry.productId
    )
  ) fail("preexisting_revision");

  const firstResult = await createExactly(client, entry);
  const created = firstResult.idempotent ? 0 : 1;
  if (created !== (alreadyCreated ? 0 : 1)) fail("partial_revision_creation");

  if (alreadyCreated) {
    const [expected] = IDN_03_REVISION_COMPLETION_EVIDENCE;
    if (
      !firstResult.idempotent
      || firstResult.candidateRevisionId !== expected.revisionId
      || firstResult.reviewItemId !== expected.reviewItemId
    ) fail("revision_completion_evidence_drift");
  }

  const replayResult = await createExactly(client, entry);
  if (
    !replayResult.idempotent
    || replayResult.candidateRevisionId !== firstResult.candidateRevisionId
    || replayResult.reviewItemId !== firstResult.reviewItemId
  ) fail("revision_idempotency_failed");

  const [afterProduct, afterProjection, excludedAfter] = await Promise.all([
    readCatalogProduct(client, entry.productId),
    readPublishedProjection(client),
    Promise.all(EXCLUDED_PRODUCTS.map(({ productId }) =>
      readCatalogProduct(client, productId))),
  ]);
  assertCatalogProduct(entry, afterProduct, true);
  if (afterProjection.products.length !== 70) fail("published_projection_drift");
  excludedAfter.forEach((product, index) =>
    assertExcludedProduct(EXCLUDED_PRODUCTS[index], product));

  return {
    status: created === 0 ? "already_complete" : "completed",
    operationKey: IDN_03_REVISION_MANIFEST.operationKey,
    manifestSha256: IDN_03_REVISION_MANIFEST.manifestSha256,
    created,
    revisions: [evidenceFromResult(entry, replayResult)],
    totals: {
      products: 79,
      published: 70,
      revisions: 71,
      decisions: 70,
      approvals: 70,
      publicationBatches: 70,
      pendingReviewItems: 1,
    },
    projectionVersion: 72,
  };
}
