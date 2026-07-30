import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  AGILIA_REVIEW,
  AGILIA_REVIEW_PATH,
  APPROVED_REVIEWER,
  HAMILTON_REVIEW,
  HAMILTON_REVIEW_PATH,
  MINDRAY_REVIEW_PATH,
} from "../../lib/internal-auth/constants.ts";
import {
  approvedCallbackUrl,
  isApprovedLoginEmail,
  isApprovedReviewer,
  isSafeCallbackRequest,
  redactAuthText,
  resolveInternalAuthOrigin,
  safeInternalDestination,
} from "../../lib/internal-auth/policy.ts";

const productionEnvironment = Object.freeze({
  CYBERMEDICA_INTERNAL_AUTH_ORIGIN: "https://medgraph-medgraph.vercel.app",
  VERCEL_ENV: "production",
});

test("launch auth accepts only the approved Production origin and fixed destination", () => {
  assert.equal(
    resolveInternalAuthOrigin(productionEnvironment),
    "https://medgraph-medgraph.vercel.app",
  );
  assert.equal(
    approvedCallbackUrl(productionEnvironment),
    "https://medgraph-medgraph.vercel.app/auth/callback",
  );
  assert.equal(safeInternalDestination(), HAMILTON_REVIEW_PATH);
  assert.equal(
    approvedCallbackUrl(MINDRAY_REVIEW_PATH, productionEnvironment),
    "https://medgraph-medgraph.vercel.app/auth/callback?next=%2Finternal%2Freview%2Fmindray-sv300",
  );
  assert.equal(
    approvedCallbackUrl(AGILIA_REVIEW_PATH, productionEnvironment),
    "https://medgraph-medgraph.vercel.app/auth/callback?next=%2Finternal%2Freview%2Fagilia-sp-mc",
  );

  assert.throws(() =>
    resolveInternalAuthOrigin({
      CYBERMEDICA_INTERNAL_AUTH_ORIGIN: "https://attacker.example",
      VERCEL_ENV: "production",
    }),
  );
  assert.throws(() =>
    resolveInternalAuthOrigin({
      CYBERMEDICA_INTERNAL_AUTH_ORIGIN: "https://medgraph-medgraph.vercel.app/other",
      VERCEL_ENV: "production",
    }),
  );
});

test("callback accepts one authorization code and rejects token or redirect input", () => {
  assert.equal(
    isSafeCallbackRequest(
      new URL("https://medgraph-medgraph.vercel.app/auth/callback?code=12345678"),
      productionEnvironment,
    ),
    true,
  );
  for (const url of [
    "https://medgraph-medgraph.vercel.app/auth/callback",
    "https://medgraph-medgraph.vercel.app/auth/callback?code=12345678&code=abcdefgh",
    "https://medgraph-medgraph.vercel.app/auth/callback?code=12345678&next=https://attacker.example",
    "https://medgraph-medgraph.vercel.app/auth/callback?access_token=secret",
    "https://medgraph-medgraph.vercel.app/auth/callback?code=12345678#refresh_token=secret",
    "https://attacker.example/auth/callback?code=12345678",
  ]) {
    assert.equal(isSafeCallbackRequest(new URL(url), productionEnvironment), false, url);
  }
  assert.equal(
    isSafeCallbackRequest(
      new URL(`https://medgraph-medgraph.vercel.app/auth/callback?code=12345678&next=${encodeURIComponent(MINDRAY_REVIEW_PATH)}`),
      productionEnvironment,
    ),
    true,
  );
  assert.equal(
    isSafeCallbackRequest(
      new URL(`https://medgraph-medgraph.vercel.app/auth/callback?code=12345678&next=${encodeURIComponent(AGILIA_REVIEW_PATH)}`),
      productionEnvironment,
    ),
    true,
  );
});

test("only the exact confirmed Production reviewer identity is accepted", () => {
  const approved = {
    id: APPROVED_REVIEWER.userId,
    email: APPROVED_REVIEWER.email,
    email_confirmed_at: "2026-07-29T00:00:00.000Z",
  };
  assert.equal(isApprovedReviewer(approved), true);
  assert.equal(isApprovedLoginEmail(`  ${APPROVED_REVIEWER.email.toUpperCase()} `), true);
  assert.equal(isApprovedReviewer({ ...approved, id: crypto.randomUUID() }), false);
  assert.equal(isApprovedReviewer({ ...approved, email: "other@example.com" }), false);
  assert.equal(isApprovedReviewer({ ...approved, email_confirmed_at: null }), false);
});

test("auth diagnostics redact URL credentials and authorization material", () => {
  const redacted = redactAuthText(
    "GET /auth/callback?code=secret-code&access_token=secret-token Authorization Bearer secret Cookie: auth=secret",
  );
  assert.doesNotMatch(redacted, /secret-code|secret-token|Bearer secret|auth=secret/u);
  assert.match(redacted, /\[REDACTED\]/u);
});

test("server routes implement PKCE exchange, exact guard, clean redirect and hardened cookies", async () => {
  const [login, callback, proxy, cookies, config] = await Promise.all([
    readFile("app/internal/login/actions.ts", "utf8"),
    readFile("app/auth/callback/route.ts", "utf8"),
    readFile("proxy.ts", "utf8"),
    readFile("lib/internal-auth/supabase.server.ts", "utf8"),
    readFile("next.config.ts", "utf8"),
  ]);

  assert.match(login, /signInWithOtp/u);
  assert.match(login, /shouldCreateUser:\s*false/u);
  assert.match(login, /emailRedirectTo:[\s\S]*approvedCallbackUrl\(\)/u);
  assert.match(callback, /exchangeCodeForSession\(code\)/u);
  assert.match(callback, /isApprovedReviewer\(data\.user\)/u);
  assert.match(callback, /signOut\(\{ scope: "local" \}\)/u);
  assert.match(callback, /cleanRedirect\(callbackDestination\(requestUrl\)\)/u);
  assert.doesNotMatch(callback, /access_token|refresh_token|token_hash/iu);
  assert.match(proxy, /matcher:[\s\S]*\/internal\/review\/hamilton-t1[\s\S]*\/internal\/review\/mindray-sv300[\s\S]*\/internal\/review\/agilia-sp-mc/u);
  assert.match(proxy, /client\.auth\.getUser\(\)/u);
  assert.match(cookies, /path:\s*"\/"/u);
  assert.match(cookies, /sameSite:\s*"lax"/u);
  assert.match(cookies, /httpOnly:\s*true/u);
  assert.match(cookies, /secure:\s*process\.env\.NODE_ENV === "production"/u);
  assert.match(config, /private, no-store/u);
  assert.match(config, /no-referrer/u);
  assert.match(config, /noindex, nofollow/u);
  assert.doesNotMatch(`${login}\n${callback}\n${proxy}`, /localStorage|sessionStorage/u);
});

test("Agilia review route is pinned to the current immutable revision", async () => {
  const [action, page, component] = await Promise.all([
    readFile("app/internal/review/agilia-sp-mc/actions.ts", "utf8"),
    readFile("app/internal/review/agilia-sp-mc/page.tsx", "utf8"),
    readFile("components/internal/AgiliaReviewConfirmation.tsx", "utf8"),
  ]);

  assert.match(page, /AGILIA_REVIEW\.revisionId/u);
  assert.match(page, /AGILIA_REVIEW\.reviewItemId/u);
  assert.match(page, /catalog_admin_product/u);
  assert.match(page, /Accept-Profile.*cloud_api/u);
  assert.match(page, /candidatePayloadChecksum/u);
  assert.match(page, /candidateCharacteristics\.length !== 3/u);
  assert.match(page, /candidateMedia\.length !== 2/u);
  assert.doesNotMatch(page, /Accept-Profile.*cloud["']/u);
  assert.doesNotMatch(page, /rest\/v1\/products\?/u);
  assert.match(action, /AGILIA_REVIEW\.revisionId/u);
  assert.match(action, /AGILIA_REVIEW\.payloadChecksum/u);
  assert.match(action, /record_product_publication_review_decision_v1/u);
  assert.doesNotMatch(action, /approve_product|publish_product|create_product_publication_revision/iu);
  assert.equal((component.match(/<button/gu) ?? []).length, 1);
  assert.match(component, /Подтвердить Human Review/u);
  assert.equal(AGILIA_REVIEW.productId, "b7f07e3e-5cdd-4988-b2a4-423bed321f46");
  assert.equal(AGILIA_REVIEW.revisionId, "e09f69c9-fbc5-4f6e-a240-05372e959510");
  assert.equal(
    AGILIA_REVIEW.candidatePayloadChecksum,
    "d14d6199641cec398e2d9ab48e86583fcab1575bd904e03d4fa4d7c0d8060747",
  );
});

test("Mindray review route is pinned to the current immutable revision", async () => {
  const [action, page, component] = await Promise.all([
    readFile("app/internal/review/mindray-sv300/actions.ts", "utf8"),
    readFile("app/internal/review/mindray-sv300/page.tsx", "utf8"),
    readFile("components/internal/MindrayReviewConfirmation.tsx", "utf8"),
  ]);

  assert.match(page, /MINDRAY_REVIEW\.revisionId/u);
  assert.match(page, /MINDRAY_REVIEW\.reviewItemId/u);
  assert.match(page, /catalog_admin_product/u);
  assert.match(page, /Accept-Profile.*cloud_api/u);
  assert.match(page, /candidatePayloadChecksum/u);
  assert.doesNotMatch(page, /Accept-Profile.*cloud["']/u);
  assert.doesNotMatch(page, /rest\/v1\/products\?/u);
  assert.match(action, /MINDRAY_REVIEW\.revisionId/u);
  assert.match(action, /MINDRAY_REVIEW\.payloadChecksum/u);
  assert.match(action, /record_product_publication_review_decision_v1/u);
  assert.doesNotMatch(action, /approve_product|publish_product|create_product_publication_revision/iu);
  assert.equal((component.match(/<button/gu) ?? []).length, 1);
  assert.match(component, /Подтвердить Human Review/u);
});

test("Hamilton action is the only write and is pinned to the immutable revision", async () => {
  const [action, page, component, foundation] = await Promise.all([
    readFile("app/internal/review/hamilton-t1/actions.ts", "utf8"),
    readFile("app/internal/review/hamilton-t1/page.tsx", "utf8"),
    readFile("components/internal/HamiltonReviewConfirmation.tsx", "utf8"),
    readFile(
      "supabase/migrations/202607260001_product_publication_foundation_corrective_v1.sql",
      "utf8",
    ),
  ]);

  const rpcCalls = [...action.matchAll(/\.rpc\("([^"]+)"/gu)].map((match) => match[1]);
  assert.deepEqual(rpcCalls, ["record_product_publication_review_decision_v1"]);
  assert.doesNotMatch(action, /export const/u);
  assert.match(action, /p_candidate_revision_id:\s*HAMILTON_REVIEW\.revisionId/u);
  assert.match(action, /p_rationale:\s*HAMILTON_REVIEW\.rationale/u);
  assert.match(action, /result\.productId !== HAMILTON_REVIEW\.productId/u);
  assert.match(action, /result\.payloadChecksum !== HAMILTON_REVIEW\.payloadChecksum/u);
  assert.doesNotMatch(action, /approve_product|publish_product|create_product_publication_revision/iu);
  assert.doesNotMatch(page, /\.rpc\(|approve_product|publish_product/iu);
  assert.equal((component.match(/<button/gu) ?? []).length, 1);
  assert.match(component, /Подтвердить Human Review/u);

  assert.match(foundation, /current in-review Product revision/u);
  assert.match(foundation, /reviewer already recorded a different decision for this revision/u);
  assert.match(foundation, /'idempotent', true/u);
  assert.match(foundation, /approved_payload_checksum <> revision\.payload_checksum/u);
  assert.match(foundation, /product_identity_checksum <> revision\.product_identity_checksum/u);
  assert.equal(HAMILTON_REVIEW.productId, "e66a1165-030b-4aa4-a400-959f1ac70fe3");
  assert.equal(HAMILTON_REVIEW.revisionId, "8d48a2b5-0842-4796-803f-4e4daf6f6e17");
  assert.equal(
    HAMILTON_REVIEW.payloadChecksum,
    "f391551c5eede060365d23440f79dce518d41e7197cee01511a63587da97c2bf",
  );
});
