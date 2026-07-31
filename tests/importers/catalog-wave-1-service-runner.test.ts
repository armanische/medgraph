import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const expectedManifestSha =
  "45694001e0652a23977de759a5b6ca86dbfe893fd8c38a1c151739be13c42405";

test("Wave 1 manifest is immutable, exact and server-only", async () => {
  const manifest = await readFile(
    "lib/operations/catalog-wave-1-manifest.ts",
    "utf8",
  );
  assert.match(manifest, /^import "server-only";/u);
  assert.match(manifest, new RegExp(expectedManifestSha, "u"));
  assert.match(manifest, /catalog-publication-wave-1-v1/u);
  assert.equal((manifest.match(/productId: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/revisionId: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/reviewItemId: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/decisionId: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/candidatePayloadChecksum: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/payloadChecksum: "/gu) ?? []).length, 10);
  assert.equal((manifest.match(/productIdentityChecksum: "/gu) ?? []).length, 10);
  assert.match(manifest, /Object\.keys\(record\)\.length === 2/u);
  assert.doesNotMatch(manifest, /SUPABASE_SERVICE_ROLE_KEY|Authorization|Bearer/u);
});

test("runner uses only the project-bound service client and approved lifecycle RPC adapters", async () => {
  const runner = await readFile(
    "lib/operations/catalog-wave-1-runner.ts",
    "utf8",
  );
  assert.match(runner, /^import "server-only";/u);
  assert.match(runner, /createProjectBoundSupabaseServerClient/u);
  assert.match(runner, /approveProductPublicationRevision/u);
  assert.match(runner, /publishProduct/u);
  assert.match(runner, /access !== "service_role"/u);
  assert.doesNotMatch(runner, /createClient\(|localStorage|persistSession|autoRefreshToken/u);
  assert.doesNotMatch(runner, /insert into|update cloud\.|delete from|\.from\([^)]*\)\.insert/iu);
  assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|Authorization|Bearer/u);
});

test("runner fails closed on stale, missing, extra or checksum-drifted scope", async () => {
  const runner = await readFile(
    "lib/operations/catalog-wave-1-runner.ts",
    "utf8",
  );
  assert.match(runner, /targetIds\.size !== 10 \|\| targetRevisionIds\.size !== 10/u);
  assert.match(runner, /manifest_evidence_missing/u);
  assert.match(runner, /revisionDecisions\.length !== 1/u);
  assert.match(runner, /productRevisions\.length !== 1/u);
  assert.match(runner, /current_product_publication_revision_id !== manifest\.revisionId/u);
  assert.match(runner, /candidate_payload_checksum !== manifest\.candidatePayloadChecksum/u);
  assert.match(runner, /payload_checksum !== manifest\.payloadChecksum/u);
  assert.match(runner, /product_identity_checksum !== manifest\.productIdentityChecksum/u);
  assert.match(runner, /review_decision_drift/u);
  assert.match(runner, /production_totals_or_exclusion_drift/u);
  assert.match(runner, /remainingReviewedUnpublished !== 23/u);
});

test("approval and publication are durable, idempotent and replay-safe", async () => {
  const runner = await readFile(
    "lib/operations/catalog-wave-1-runner.ts",
    "utf8",
  );
  assert.match(runner, /already_completed/u);
  assert.match(runner, /catalog-wave-1-publish-\$\{entry\.productId\}/u);
  assert.match(runner, /await dependencies\.readState\(\)/u);
  assert.match(runner, /approval_durable_verification_failed/u);
  assert.match(runner, /publication_failed/u);
  assert.match(runner, /wave_not_fully_published/u);
  assert.match(runner, /nonTargetApprovals !== 3/u);
  assert.match(runner, /nonTargetPublicationBatches !== 3/u);
  assert.match(runner, /nonTargetPublished !== 3/u);
  assert.match(runner, /for \(const target of state\.targets\)/u);
  assert.doesNotMatch(runner, /Promise\.all\(state\.targets/u);
});

test("POST route re-authorizes exact admin and never exposes a generic publication API", async () => {
  const route = await readFile(
    "app/internal/operations/catalog-publication-wave/route.ts",
    "utf8",
  );
  assert.match(route, /export async function POST/u);
  assert.doesNotMatch(route, /export async function (GET|PUT|PATCH|DELETE)/u);
  assert.match(route, /process\.env\.VERCEL_ENV !== "production"/u);
  assert.match(route, /sec-fetch-site/u);
  assert.match(route, /same-origin/u);
  assert.match(route, /auth\.client\.auth\.getUser\(\)/u);
  assert.match(route, /current_internal_access_v1/u);
  assert.match(route, /access\.role === "admin"/u);
  assert.match(route, /validateCatalogWave1OperationRequest/u);
  assert.match(route, /service_configuration_missing/u);
  assert.match(route, /rawBody\.length > 512/u);
  assert.match(route, /application\/x-www-form-urlencoded/u);
  assert.match(route, /Object\.fromEntries\(form\.entries\(\)\)/u);
  assert.doesNotMatch(route, /productId|revisionId|decisionId/u);
  assert.doesNotMatch(route, /serviceRoleKey|SUPABASE_SERVICE_ROLE_KEY[^?]/u);
});

test("execution page submits only the immutable Wave 1 manifest", async () => {
  const page = await readFile(
    "app/internal/operations/catalog-publication-wave/execute/page.tsx",
    "utf8",
  );
  assert.match(page, /CatalogWave1ExecutionAction/u);
  assert.doesNotMatch(page, /productId|revisionId|decisionId|serviceRole/u);
});

test("execution Server Action re-authorizes the exact Production admin", async () => {
  const action = await readFile(
    "app/internal/operations/catalog-publication-wave/execute/actions.ts",
    "utf8",
  );
  const component = await readFile(
    "components/internal/CatalogWave1ExecutionAction.tsx",
    "utf8",
  );
  assert.match(action, /^"use server";/u);
  assert.match(action, /process\.env\.VERCEL_ENV !== "production"/u);
  assert.match(action, /requireTrustedReviewer\(\)/u);
  assert.match(action, /current_internal_access_v1/u);
  assert.match(action, /access\.role !== "admin"/u);
  assert.match(action, /executeProductionCatalogWave1\(\)/u);
  assert.match(component, /useActionState/u);
  assert.match(component, /executeCatalogWave1Action/u);
  assert.doesNotMatch(component, /productId|revisionId|decisionId|serviceRole/u);
});
