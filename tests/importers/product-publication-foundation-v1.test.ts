import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  approveProductPublicationRevisionInputSchema,
  archiveProductInputSchema,
  createProductPublicationRevisionInputSchema,
  productPublicationActionResultSchema,
  productPublicationApprovalResultSchema,
  productPublicationRevisionResultSchema,
  publishProductInputSchema,
  rollbackProductPublicationInputSchema,
} from "../../lib/product-publication/contracts.ts";

const productId = "40000000-0000-4000-8000-000000000050";
const revisionId = "40000000-0000-4000-8000-000000000070";
const reviewDecisionId = "40000000-0000-4000-8000-000000000074";
const approvalId = "40000000-0000-4000-8000-000000000071";
const batchId = "40000000-0000-4000-8000-000000000072";

test("Product publication contracts are strict, revision-bound and typed", () => {
  assert.equal(createProductPublicationRevisionInputSchema.safeParse({
    productId,
    idempotencyKey: "revision-key-v1",
  }).success, true);
  assert.equal(approveProductPublicationRevisionInputSchema.safeParse({
    candidateRevisionId: revisionId,
    reviewDecisionId,
  }).success, true);
  assert.equal(publishProductInputSchema.safeParse({
    candidateRevisionId: revisionId,
    idempotencyKey: "publication-key-v1",
  }).success, true);
  assert.equal(archiveProductInputSchema.safeParse({
    productId,
    idempotencyKey: "archive-key-v1",
  }).success, true);
  assert.equal(rollbackProductPublicationInputSchema.safeParse({
    publicationBatchId: batchId,
    idempotencyKey: "rollback-key-v1",
  }).success, true);

  assert.equal(publishProductInputSchema.safeParse({
    productId,
    idempotencyKey: "publication-key-v1",
  }).success, false);
  assert.equal(createProductPublicationRevisionInputSchema.safeParse({
    productId,
    idempotencyKey: "short",
  }).success, false);

  assert.equal(approveProductPublicationRevisionInputSchema.safeParse({
    candidateRevisionId: revisionId,
    reviewerId: reviewDecisionId,
    rationale: "Caller-asserted reviewer identity must not be accepted.",
  }).success, false);

  assert.equal(productPublicationRevisionResultSchema.safeParse({
    candidateRevisionId: revisionId,
    productId,
    reviewItemId: "40000000-0000-4000-8000-000000000073",
    revisionNumber: 1,
    schemaVersion: 1,
    payloadChecksum: "a".repeat(64),
    productIdentityChecksum: "b".repeat(64),
    state: "in_review",
    idempotent: false,
  }).success, true);
  assert.equal(productPublicationApprovalResultSchema.safeParse({
    approvalId,
    candidateRevisionId: revisionId,
    productId,
    state: "approved",
    payloadChecksum: "a".repeat(64),
    idempotent: false,
  }).success, true);
  assert.equal(productPublicationActionResultSchema.safeParse({
    publicationBatchId: batchId,
    candidateRevisionId: revisionId,
    productId,
    action: "publish",
    state: "published",
    publicationVersion: 1,
    idempotent: false,
  }).success, true);
});

test("Product publication migration defines immutable approval and append-only actions", async () => {
  const [migration, corrective] = await Promise.all([
    readFile("supabase/migrations/202607250001_product_publication_foundation_v1.sql", "utf8"),
    readFile("supabase/migrations/202607260001_product_publication_foundation_corrective_v1.sql", "utf8"),
  ]);

  assert.match(migration, /create table cloud\.product_publication_revisions/u);
  assert.match(migration, /create table cloud\.product_publication_approvals/u);
  assert.match(migration, /create table cloud\.product_publication_batches/u);
  assert.match(migration, /product_identity_checksum = cloud\.sha256_jsonb_v1/u);
  assert.match(migration, /candidate_payload_checksum = cloud\.sha256_jsonb_v1/u);
  assert.match(migration, /decision_type <> 'product_publication'/u);
  assert.match(migration, /product_publication_revision_id is not null/u);
  assert.match(migration, /product_publication_batches_immutable/u);
  assert.match(migration, /action in \('publish', 'archive', 'rollback'\)/u);
  assert.match(migration, /pg_advisory_xact_lock/u);
  assert.match(migration, /only the currently applied product publication action can be rolled back/u);
  assert.match(migration, /product has no current revision-bound approval/u);
  assert.match(migration, /product changed after publication revision creation/u);
  assert.match(migration, /approved product publication revision is stale/u);
  assert.match(migration, /product has unresolved critical import errors/u);
  assert.match(migration, /product publication actor is not authorized for/u);
  assert.match(migration, /references cloud\.user_profiles\(id\) on delete restrict/u);
  assert.match(migration, /product manufacturer is not published/u);
  assert.match(migration, /product category is not a published assignable category/u);
  assert.match(migration, /product application areas are missing or unpublished/u);
  assert.match(migration, /products_publication_state_guard/u);
  assert.match(migration, /publication_status = 'published'[\s\S]+active_product_publication_batch_id is not null/u);
  assert.match(migration, /grant execute on function cloud_api\.publish_product_v1[\s\S]+to service_role/u);
  assert.match(migration, /revoke all on function cloud_api\.publish_product_v1[\s\S]+from public, anon, authenticated/u);
  assert.doesNotMatch(migration, /cloud_storefront_preview_catalog|CatalogRepository|ProductService/u);
  assert.doesNotMatch(migration, /hamilton|330695211247/iu);

  assert.match(corrective, /trusted_product_publication_service_actor_v1/u);
  assert.match(corrective, /auth\.uid\(\)/u);
  assert.match(corrective, /record_product_publication_review_decision_v1/u);
  assert.match(corrective, /current_product_publication_revision_id/u);
  assert.match(corrective, /only the current approved Product revision can be published/u);
  assert.match(corrective, /for share of product_area, area/u);
  assert.match(corrective, /published Product depends on manufacturer/u);
  assert.match(corrective, /published Product application areas are immutable/u);
  assert.match(corrective, /lookup occurs after both advisory and Product row locks/u);
  assert.doesNotMatch(
    corrective,
    /grant execute on function cloud_api\.publish_product_v1\(uuid, text, uuid\)/u,
  );
  assert.doesNotMatch(corrective, /hamilton|330695211247/iu);
});

test("Product publication server adapter is service-only and not a Storefront API", async () => {
  const server = await readFile("lib/product-publication/server.ts", "utf8");

  assert.match(server, /^import "server-only";/u);
  assert.match(server, /access: "service_role"/u);
  assert.match(server, /Product publication writes require a service-role server client/u);
  assert.match(server, /create_product_publication_revision_v1/u);
  assert.match(server, /approve_product_publication_revision_v1/u);
  assert.match(server, /publish_product_v1/u);
  assert.match(server, /archive_product_v1/u);
  assert.match(server, /rollback_product_publication_v1/u);
  assert.doesNotMatch(server, /@\/lib\/storefront|CatalogRepository|ProductService/u);
});

test("Local Product publication integration is transactional and exercises failure paths", async () => {
  const [fixture, runner, packageJson] = await Promise.all([
    readFile("supabase/tests/004_product_publication_integration.sql", "utf8"),
    readFile("scripts/qa/product-publication-local-integration.ts", "utf8"),
    readFile("package.json", "utf8").then(JSON.parse),
  ]);

  assert.match(fixture, /^begin;/mu);
  assert.match(fixture, /^rollback;/mu);
  assert.match(fixture, /create_product_publication_revision_v1/u);
  assert.match(fixture, /approve_product_publication_revision_v1/u);
  assert.match(fixture, /publish_product_v1/u);
  assert.match(fixture, /archive_product_v1/u);
  assert.match(fixture, /rollback_product_publication_v1/u);
  assert.match(fixture, /revision retry is not idempotent/u);
  assert.match(fixture, /revision retry changed an advanced Product state/u);
  assert.match(fixture, /publication retry is not idempotent/u);
  assert.match(fixture, /unapproved product unexpectedly published/u);
  assert.match(fixture, /spoofed reviewer unexpectedly accepted/u);
  assert.match(fixture, /stale approved revision unexpectedly published/u);
  assert.match(fixture, /dependency guard did not preserve published Product contract/u);
  assert.match(fixture, /new revision did not supersede approval and reset review lifecycle/u);
  assert.match(fixture, /product with unpublished dependency unexpectedly published/u);
  assert.match(fixture, /failed publication was not rolled back atomically/u);
  assert.match(fixture, /direct publication bypass unexpectedly succeeded/u);
  assert.match(fixture, /approved Product content unexpectedly mutated/u);
  assert.match(fixture, /product publication RPC grants are unsafe/u);
  assert.doesNotMatch(fixture, /hamilton|330695211247/iu);

  assert.equal(
    packageJson.scripts["qa:product-publication:local"],
    "node scripts/qa/product-publication-local-integration.ts",
  );
  assert.match(runner, /docker", \["image", "inspect", IMAGE\]/u);
  assert.match(runner, /This QA command never pulls images automatically/u);
  assert.match(runner, /migrationCount: MIGRATION_COUNT/u);
  assert.match(runner, /Concurrent approval was not exactly idempotent/u);
  assert.match(runner, /005_product_publication_concurrent_approval\.sql/u);
  assert.match(runner, /remoteConnections: 0/u);
  assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE/u);
});
