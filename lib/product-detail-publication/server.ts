import "server-only";

import {
  createSupabaseServerClient,
  type SupabaseServerClient,
} from "../supabase/index.ts";
import {
  createStructuredProductDetailRevisionInputSchema,
  publishStructuredProductDetailInputSchema,
  rollbackStructuredProductDetailInputSchema,
  structuredProductDetailPublicationResultSchema,
  structuredProductDetailRevisionResultSchema,
  type CreateStructuredProductDetailRevisionInput,
  type PublishStructuredProductDetailInput,
  type RollbackStructuredProductDetailInput,
} from "./contracts.ts";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

async function callStructuredProductDetailRpc(
  rpc:
    | "create_structured_product_detail_revision_v1"
    | "publish_structured_product_detail_v2"
    | "rollback_structured_product_detail_v2",
  body: Readonly<Record<string, unknown>>,
  client: SupabaseServerClient,
): Promise<unknown> {
  if (client.access !== "service_role") {
    throw new Error("Structured Product Detail writes require a service-role server client.");
  }

  const response = await client.request(`/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: CLOUD_API_HEADERS,
    body: JSON.stringify(body),
  });

  return response.json();
}

/** Snapshots a candidate and product identity before any manual approval. */
export async function createStructuredProductDetailRevision(
  input: CreateStructuredProductDetailRevisionInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = createStructuredProductDetailRevisionInputSchema.parse(input);
  const result = await callStructuredProductDetailRpc(
    "create_structured_product_detail_revision_v1",
    { p_candidate_id: parsed.candidateId, p_actor_id: parsed.actorId },
    client,
  );
  return structuredProductDetailRevisionResultSchema.parse(result);
}

/**
 * Publishes an already approved candidate. This module is deliberately not
 * exported from a public Storefront barrel and has no route or Server Action.
 */
export async function publishStructuredProductDetail(
  input: PublishStructuredProductDetailInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = publishStructuredProductDetailInputSchema.parse(input);
  const result = await callStructuredProductDetailRpc("publish_structured_product_detail_v2", {
    p_candidate_revision_id: parsed.candidateRevisionId,
    p_schema_version: parsed.schemaVersion,
    p_idempotency_key: parsed.idempotencyKey,
    p_actor_id: parsed.actorId,
  }, client);
  return structuredProductDetailPublicationResultSchema.parse(result);
}

/** Rolls back one publication batch; it never performs a global rollback. */
export async function rollbackStructuredProductDetail(
  input: RollbackStructuredProductDetailInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = rollbackStructuredProductDetailInputSchema.parse(input);
  const result = await callStructuredProductDetailRpc("rollback_structured_product_detail_v2", {
    p_publication_batch_id: parsed.publicationBatchId,
    p_actor_id: parsed.actorId,
  }, client);
  return structuredProductDetailPublicationResultSchema.parse(result);
}
