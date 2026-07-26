import "server-only";

import {
  createSupabaseServerClient,
  type SupabaseServerClient,
} from "../supabase/index.ts";
import {
  approveProductPublicationRevisionInputSchema,
  archiveProductInputSchema,
  createProductPublicationRevisionInputSchema,
  productPublicationActionResultSchema,
  productPublicationApprovalResultSchema,
  productPublicationRevisionResultSchema,
  publishProductInputSchema,
  rollbackProductPublicationInputSchema,
  type ApproveProductPublicationRevisionInput,
  type ArchiveProductInput,
  type CreateProductPublicationRevisionInput,
  type PublishProductInput,
  type RollbackProductPublicationInput,
} from "./contracts.ts";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

type ProductPublicationRpc =
  | "create_product_publication_revision_v1"
  | "approve_product_publication_revision_v1"
  | "publish_product_v1"
  | "archive_product_v1"
  | "rollback_product_publication_v1";

async function callProductPublicationRpc(
  rpc: ProductPublicationRpc,
  body: Readonly<Record<string, unknown>>,
  client: SupabaseServerClient,
) {
  if (client.access !== "service_role") {
    throw new Error("Product publication writes require a service-role server client.");
  }
  const response = await client.request(`/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: CLOUD_API_HEADERS,
    body: JSON.stringify(body),
  });
  return response.json() as Promise<unknown>;
}

export async function createProductPublicationRevision(
  input: CreateProductPublicationRevisionInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = createProductPublicationRevisionInputSchema.parse(input);
  const result = await callProductPublicationRpc(
    "create_product_publication_revision_v1",
    {
      p_product_id: parsed.productId,
      p_idempotency_key: parsed.idempotencyKey,
    },
    client,
  );
  return productPublicationRevisionResultSchema.parse(result);
}

export async function approveProductPublicationRevision(
  input: ApproveProductPublicationRevisionInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = approveProductPublicationRevisionInputSchema.parse(input);
  const result = await callProductPublicationRpc(
    "approve_product_publication_revision_v1",
    {
      p_candidate_revision_id: parsed.candidateRevisionId,
      p_review_decision_id: parsed.reviewDecisionId,
    },
    client,
  );
  return productPublicationApprovalResultSchema.parse(result);
}

export async function publishProduct(
  input: PublishProductInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = publishProductInputSchema.parse(input);
  const result = await callProductPublicationRpc("publish_product_v1", {
    p_candidate_revision_id: parsed.candidateRevisionId,
    p_idempotency_key: parsed.idempotencyKey,
  }, client);
  return productPublicationActionResultSchema.parse(result);
}

export async function archiveProduct(
  input: ArchiveProductInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = archiveProductInputSchema.parse(input);
  const result = await callProductPublicationRpc("archive_product_v1", {
    p_product_id: parsed.productId,
    p_idempotency_key: parsed.idempotencyKey,
  }, client);
  return productPublicationActionResultSchema.parse(result);
}

export async function rollbackProductPublication(
  input: RollbackProductPublicationInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = rollbackProductPublicationInputSchema.parse(input);
  const result = await callProductPublicationRpc("rollback_product_publication_v1", {
    p_publication_batch_id: parsed.publicationBatchId,
    p_idempotency_key: parsed.idempotencyKey,
  }, client);
  return productPublicationActionResultSchema.parse(result);
}
