import "server-only";

import {
  createSupabaseServerClient,
  type SupabaseServerClient,
} from "../supabase/index.ts";
import {
  publishStructuredProductDetailInputSchema,
  rollbackStructuredProductDetailInputSchema,
  structuredProductDetailPublicationResultSchema,
  type PublishStructuredProductDetailInput,
  type RollbackStructuredProductDetailInput,
  type StructuredProductDetailPublicationResult,
} from "./contracts.ts";

const CLOUD_API_HEADERS = {
  "Accept-Profile": "cloud_api",
  "Content-Profile": "cloud_api",
  "Content-Type": "application/json",
} as const;

async function callStructuredProductDetailRpc(
  rpc: "publish_structured_product_detail_v1" | "rollback_structured_product_detail_v1",
  body: Readonly<Record<string, unknown>>,
  client: SupabaseServerClient,
): Promise<StructuredProductDetailPublicationResult> {
  if (client.access !== "service_role") {
    throw new Error("Structured Product Detail writes require a service-role server client.");
  }

  const response = await client.request(`/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: CLOUD_API_HEADERS,
    body: JSON.stringify(body),
  });

  return structuredProductDetailPublicationResultSchema.parse(await response.json());
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
  return callStructuredProductDetailRpc("publish_structured_product_detail_v1", {
    p_candidate_id: parsed.candidateId,
    p_schema_version: parsed.schemaVersion,
    p_idempotency_key: parsed.idempotencyKey,
    p_actor_id: parsed.actorId,
  }, client);
}

/** Rolls back one publication batch; it never performs a global rollback. */
export async function rollbackStructuredProductDetail(
  input: RollbackStructuredProductDetailInput,
  client: SupabaseServerClient = createSupabaseServerClient({ access: "service_role" }),
) {
  const parsed = rollbackStructuredProductDetailInputSchema.parse(input);
  return callStructuredProductDetailRpc("rollback_structured_product_detail_v1", {
    p_publication_batch_id: parsed.publicationBatchId,
    p_actor_id: parsed.actorId,
  }, client);
}
