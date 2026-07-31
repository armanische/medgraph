import "server-only";

import {
  approveProductPublicationRevision,
  publishProduct,
} from "@/lib/product-publication/server";
import {
  createProjectBoundSupabaseServerClient,
  type SupabaseServerClient,
} from "@/lib/supabase/client.server";

import {
  CATALOG_WAVE_1_MANIFEST,
  type CatalogWave1ManifestEntry,
} from "./catalog-wave-1-manifest";

const CLOUD_READ_HEADERS = { "Accept-Profile": "cloud" } as const;
const EXPECTED_REVIEWER_ID = "0a5270ac-66f2-4711-9701-e0557fcff73a";

type ProductRow = {
  id: string;
  source_uid: string;
  source_checksum: string;
  slug: string;
  model: string;
  published: boolean;
  publication_status: string;
  review_state: string;
  current_product_publication_revision_id: string | null;
  current_product_publication_approval_id: string | null;
  active_product_publication_batch_id: string | null;
};

type RevisionRow = {
  id: string;
  product_id: string;
  review_item_id: string;
  revision_number: number;
  candidate_payload_checksum: string;
  payload_checksum: string;
  product_identity_checksum: string;
};

type DecisionRow = {
  id: string;
  review_item_id: string;
  product_publication_revision_id: string;
  decision_type: string;
  field_path: string;
  decision: string;
  reviewer_id: string;
  approved_payload_checksum: string;
  product_identity_checksum: string;
};

type ReviewItemRow = { id: string; status: string };

type ApprovalRow = {
  id: string;
  candidate_revision_id: string;
  review_item_id: string;
  review_decision_id: string;
  payload_checksum: string;
  product_identity_checksum: string;
  decision: string;
  reviewer_id: string;
};

type PublicationBatchRow = {
  id: string;
  product_id: string;
  candidate_revision_id: string | null;
  approval_id: string | null;
  action: string;
  idempotency_key: string;
  payload_checksum: string;
};

export type CatalogWave1Stage = "ready" | "approved" | "published";

export type CatalogWave1TargetState = Readonly<{
  manifest: CatalogWave1ManifestEntry;
  product: ProductRow;
  revision: RevisionRow;
  decision: DecisionRow;
  reviewItem: ReviewItemRow;
  approval: ApprovalRow | null;
  publicationBatch: PublicationBatchRow | null;
  stage: CatalogWave1Stage;
}>;

export type CatalogWave1State = Readonly<{
  totals: Readonly<{
    products: number;
    published: number;
    revisions: number;
    decisions: number;
    approvals: number;
    publicationBatches: number;
  }>;
  targets: readonly CatalogWave1TargetState[];
  remainingReviewedUnpublished: number;
  nonTargetApprovals: number;
  nonTargetPublicationBatches: number;
  nonTargetPublished: number;
}>;

export type CatalogWave1Result = Readonly<{
  status: "completed" | "already_completed";
  operationKey: string;
  manifestSha256: string;
  approvals: readonly Readonly<{ revisionId: string; approvalId: string }>[];
  publications: readonly Readonly<{
    productId: string;
    revisionId: string;
    publicationBatchId: string;
    slug: string;
  }>[];
  totals: CatalogWave1State["totals"];
  remainingReviewedUnpublished: number;
}>;

export class CatalogWave1RunnerError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Catalog Wave 1 operation failed closed.");
    this.name = "CatalogWave1RunnerError";
    this.code = code;
  }
}

function fail(code: string): never {
  throw new CatalogWave1RunnerError(code);
}

async function readCloudRows<T>(
  client: SupabaseServerClient,
  table: string,
  select: string,
): Promise<T[]> {
  if (client.access !== "service_role") fail("service_role_required");
  const query = new URLSearchParams({ select, limit: "1000" });
  const response = await client.request(`/rest/v1/${table}?${query.toString()}`, {
    headers: CLOUD_READ_HEADERS,
  });
  const value: unknown = await response.json();
  if (!Array.isArray(value)) fail("invalid_read_contract");
  return value as T[];
}

function uniqueById<T extends { id: string }>(rows: readonly T[], code: string) {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (!row?.id || map.has(row.id)) fail(code);
    map.set(row.id, row);
  }
  return map;
}

function publicationIdempotencyKey(entry: CatalogWave1ManifestEntry) {
  return `catalog-wave-1-publish-${entry.productId}`;
}

function exactTargetStage(
  manifest: CatalogWave1ManifestEntry,
  product: ProductRow,
  approval: ApprovalRow | null,
  batch: PublicationBatchRow | null,
): CatalogWave1Stage {
  if (!approval && !batch && !product.published) {
    if (
      product.publication_status !== "in_review"
      || product.review_state !== "in_review"
      || product.current_product_publication_approval_id !== null
      || product.active_product_publication_batch_id !== null
    ) fail("target_not_current_in_review");
    return "ready";
  }

  if (approval && !batch && !product.published) {
    if (
      product.publication_status !== "approved"
      || product.review_state !== "approved"
      || product.current_product_publication_approval_id !== approval.id
      || product.active_product_publication_batch_id !== null
    ) fail("target_approval_state_mismatch");
    return "approved";
  }

  if (approval && batch && product.published) {
    if (
      product.publication_status !== "published"
      || product.review_state !== "published"
      || product.current_product_publication_approval_id !== approval.id
      || product.active_product_publication_batch_id !== batch.id
      || batch.idempotency_key !== publicationIdempotencyKey(manifest)
    ) fail("target_publication_state_mismatch");
    return "published";
  }

  return fail("target_lifecycle_state_invalid");
}

export async function readCatalogWave1State(
  client: SupabaseServerClient,
): Promise<CatalogWave1State> {
  const [products, revisions, decisions, reviewItems, approvals, batches] = await Promise.all([
    readCloudRows<ProductRow>(
      client,
      "products",
      "id,source_uid,source_checksum,slug,model,published,publication_status,review_state,current_product_publication_revision_id,current_product_publication_approval_id,active_product_publication_batch_id",
    ),
    readCloudRows<RevisionRow>(
      client,
      "product_publication_revisions",
      "id,product_id,review_item_id,revision_number,candidate_payload_checksum,payload_checksum,product_identity_checksum",
    ),
    readCloudRows<DecisionRow>(
      client,
      "review_decisions",
      "id,review_item_id,product_publication_revision_id,decision_type,field_path,decision,reviewer_id,approved_payload_checksum,product_identity_checksum",
    ),
    readCloudRows<ReviewItemRow>(client, "review_items", "id,status"),
    readCloudRows<ApprovalRow>(
      client,
      "product_publication_approvals",
      "id,candidate_revision_id,review_item_id,review_decision_id,payload_checksum,product_identity_checksum,decision,reviewer_id",
    ),
    readCloudRows<PublicationBatchRow>(
      client,
      "product_publication_batches",
      "id,product_id,candidate_revision_id,approval_id,action,idempotency_key,payload_checksum",
    ),
  ]);

  const productById = uniqueById(products, "duplicate_product_identity");
  const revisionById = uniqueById(revisions, "duplicate_revision_identity");
  const decisionById = uniqueById(decisions, "duplicate_decision_identity");
  const reviewItemById = uniqueById(reviewItems, "duplicate_review_item_identity");
  const approvalsByRevision = new Map<string, ApprovalRow>();
  for (const approval of approvals) {
    if (approvalsByRevision.has(approval.candidate_revision_id)) {
      fail("duplicate_revision_approval");
    }
    approvalsByRevision.set(approval.candidate_revision_id, approval);
  }
  const batchesByRevision = new Map<string, PublicationBatchRow>();
  for (const batch of batches) {
    if (batch.action !== "publish" || !batch.candidate_revision_id) continue;
    if (batchesByRevision.has(batch.candidate_revision_id)) {
      fail("duplicate_revision_publication");
    }
    batchesByRevision.set(batch.candidate_revision_id, batch);
  }

  const targetIds = new Set(CATALOG_WAVE_1_MANIFEST.entries.map((entry) => entry.productId));
  const targetRevisionIds = new Set(
    CATALOG_WAVE_1_MANIFEST.entries.map((entry) => entry.revisionId),
  );
  if (targetIds.size !== 10 || targetRevisionIds.size !== 10) fail("manifest_scope_invalid");

  const targets = CATALOG_WAVE_1_MANIFEST.entries.map((manifest) => {
    const product = productById.get(manifest.productId);
    const revision = revisionById.get(manifest.revisionId);
    const decision = decisionById.get(manifest.decisionId);
    const reviewItem = reviewItemById.get(manifest.reviewItemId);
    if (!product || !revision || !decision || !reviewItem) fail("manifest_evidence_missing");

    const revisionDecisions = decisions.filter(
      (row) => row.product_publication_revision_id === manifest.revisionId,
    );
    const productRevisions = revisions.filter((row) => row.product_id === manifest.productId);
    if (revisionDecisions.length !== 1 || productRevisions.length !== 1) {
      fail("revision_not_unique_or_current");
    }
    if (
      product.source_uid !== manifest.sourceUid
      || product.model !== manifest.model
      || product.current_product_publication_revision_id !== manifest.revisionId
      || revision.product_id !== manifest.productId
      || revision.review_item_id !== manifest.reviewItemId
      || revision.revision_number !== 1
      || revision.candidate_payload_checksum !== manifest.candidatePayloadChecksum
      || revision.payload_checksum !== manifest.payloadChecksum
      || revision.product_identity_checksum !== manifest.productIdentityChecksum
    ) fail("revision_or_product_drift");
    if (
      decision.product_publication_revision_id !== manifest.revisionId
      || decision.review_item_id !== manifest.reviewItemId
      || decision.decision_type !== "product_publication"
      || decision.field_path !== "product"
      || decision.decision !== "approve"
      || decision.reviewer_id !== EXPECTED_REVIEWER_ID
      || decision.approved_payload_checksum !== manifest.payloadChecksum
      || decision.product_identity_checksum !== manifest.productIdentityChecksum
      || ["blocked", "rejected", "archived"].includes(reviewItem.status)
    ) fail("review_decision_drift");

    const approval = approvalsByRevision.get(manifest.revisionId) ?? null;
    if (approval && (
      approval.review_item_id !== manifest.reviewItemId
      || approval.review_decision_id !== manifest.decisionId
      || approval.payload_checksum !== manifest.payloadChecksum
      || approval.product_identity_checksum !== manifest.productIdentityChecksum
      || approval.decision !== "approve"
      || approval.reviewer_id !== EXPECTED_REVIEWER_ID
    )) fail("approval_drift");

    const publicationBatch = batchesByRevision.get(manifest.revisionId) ?? null;
    if (publicationBatch && (
      !approval
      || publicationBatch.product_id !== manifest.productId
      || publicationBatch.approval_id !== approval.id
      || publicationBatch.payload_checksum !== manifest.payloadChecksum
    )) fail("publication_drift");

    return {
      manifest,
      product,
      revision,
      decision,
      reviewItem,
      approval,
      publicationBatch,
      stage: exactTargetStage(manifest, product, approval, publicationBatch),
    } satisfies CatalogWave1TargetState;
  });

  const targetApprovalCount = targets.filter((target) => target.approval).length;
  const targetBatchCount = targets.filter((target) => target.publicationBatch).length;
  const targetPublishedCount = targets.filter((target) => target.product.published).length;
  const remainingReviewedUnpublished = revisions.filter((revision) => {
    if (targetRevisionIds.has(revision.id)) return false;
    const product = productById.get(revision.product_id);
    if (!product || product.published || product.current_product_publication_revision_id !== revision.id) {
      return false;
    }
    return decisions.some((decision) =>
      decision.product_publication_revision_id === revision.id
      && decision.decision_type === "product_publication"
      && decision.decision === "approve"
      && !approvalsByRevision.has(revision.id),
    );
  }).length;
  const totals = {
    products: products.length,
    published: products.filter((product) => product.published).length,
    revisions: revisions.length,
    decisions: decisions.length,
    approvals: approvals.length,
    publicationBatches: batches.length,
  } as const;

  if (
    totals.products !== 79
    || totals.revisions !== 36
    || totals.decisions !== 36
    || totals.approvals !== 3 + targetApprovalCount
    || totals.publicationBatches !== 3 + targetBatchCount
    || totals.published !== 3 + targetPublishedCount
    || remainingReviewedUnpublished !== 23
  ) fail("production_totals_or_exclusion_drift");

  return {
    totals,
    targets,
    remainingReviewedUnpublished,
    nonTargetApprovals: totals.approvals - targetApprovalCount,
    nonTargetPublicationBatches: totals.publicationBatches - targetBatchCount,
    nonTargetPublished: totals.published - targetPublishedCount,
  };
}

function assertNonTargetInvariance(state: CatalogWave1State) {
  if (
    state.nonTargetApprovals !== 3
    || state.nonTargetPublicationBatches !== 3
    || state.nonTargetPublished !== 3
    || state.remainingReviewedUnpublished !== 23
  ) fail("non_target_scope_changed");
}

function resultFromCompletedState(
  state: CatalogWave1State,
  status: CatalogWave1Result["status"],
): CatalogWave1Result {
  assertNonTargetInvariance(state);
  if (!state.targets.every((target) => target.stage === "published")) {
    fail("wave_not_fully_published");
  }
  return {
    status,
    operationKey: CATALOG_WAVE_1_MANIFEST.operationKey,
    manifestSha256: CATALOG_WAVE_1_MANIFEST.waveSha256,
    approvals: state.targets.map((target) => ({
      revisionId: target.manifest.revisionId,
      approvalId: target.approval!.id,
    })),
    publications: state.targets.map((target) => ({
      productId: target.manifest.productId,
      revisionId: target.manifest.revisionId,
      publicationBatchId: target.publicationBatch!.id,
      slug: target.product.slug,
    })),
    totals: state.totals,
    remainingReviewedUnpublished: state.remainingReviewedUnpublished,
  };
}

export type CatalogWave1RunnerDependencies = Readonly<{
  readState: () => Promise<CatalogWave1State>;
  approve: (entry: CatalogWave1ManifestEntry) => Promise<unknown>;
  publish: (entry: CatalogWave1ManifestEntry) => Promise<unknown>;
}>;

export async function runCatalogWave1Operation(
  dependencies: CatalogWave1RunnerDependencies,
): Promise<CatalogWave1Result> {
  let state = await dependencies.readState();
  assertNonTargetInvariance(state);
  if (state.targets.every((target) => target.stage === "published")) {
    return resultFromCompletedState(state, "already_completed");
  }
  if (
    state.targets.some((target) => target.stage === "published")
    && state.targets.some((target) => target.stage === "ready")
  ) {
    fail("partial_publication_order_invalid");
  }

  for (const target of state.targets) {
    if (target.stage === "approved" || target.stage === "published") continue;
    if (target.stage !== "ready") fail("approval_precondition_failed");
    try {
      await dependencies.approve(target.manifest);
    } catch {
      state = await dependencies.readState();
      const recovered = state.targets.find(
        (candidate) => candidate.manifest.revisionId === target.manifest.revisionId,
      );
      if (!recovered || recovered.stage !== "approved") fail("approval_failed");
    }
  }

  state = await dependencies.readState();
  assertNonTargetInvariance(state);
  if (!state.targets.every(
    (target) => target.stage === "approved" || target.stage === "published",
  )) {
    fail("approval_durable_verification_failed");
  }

  for (const target of state.targets) {
    if (target.stage === "published") continue;
    if (target.stage !== "approved") fail("publication_precondition_failed");
    try {
      await dependencies.publish(target.manifest);
    } catch {
      const recoveredState = await dependencies.readState();
      const recovered = recoveredState.targets.find(
        (candidate) => candidate.manifest.revisionId === target.manifest.revisionId,
      );
      if (!recovered || recovered.stage !== "published") fail("publication_failed");
    }
  }

  state = await dependencies.readState();
  return resultFromCompletedState(state, "completed");
}

export async function executeProductionCatalogWave1() {
  const client = createProjectBoundSupabaseServerClient();
  return runCatalogWave1Operation({
    readState: () => readCatalogWave1State(client),
    approve: (entry) => approveProductPublicationRevision({
      candidateRevisionId: entry.revisionId,
      reviewDecisionId: entry.decisionId,
    }, client),
    publish: (entry) => publishProduct({
      candidateRevisionId: entry.revisionId,
      idempotencyKey: publicationIdempotencyKey(entry),
    }, client),
  });
}
