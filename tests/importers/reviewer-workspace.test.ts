import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  createReviewerDecisionDraft,
  createReviewerWorkspaceModel,
  filterReviewerFacts,
} from "../../lib/review/workspace.ts";

test("reviewer workspace model opens with products and facts", () => {
  const model = createReviewerWorkspaceModel();
  assert.equal(model.products.length, 2);
  assert.equal(model.products[0].productTitle, "Hamilton T1");
  assert.equal(model.products[0].factsCount, 8);
  assert.equal(model.products[1].productTitle, "FS510");
  assert.equal(model.products[1].factsCount, 3);
  assert.equal(model.facts.length, 11);
});

test("reviewer workspace filters work", () => {
  const model = createReviewerWorkspaceModel();
  assert.equal(filterReviewerFacts(model.facts, "all").length, 11);
  assert.equal(
    filterReviewerFacts(model.facts, "pending").every(
      (fact) => fact.status === "pending",
    ),
    true,
  );
  assert.equal(
    filterReviewerFacts(model.facts, "high").every(
      (fact) => fact.priority === "high" || fact.priority === "critical",
    ),
    true,
  );
  assert.equal(filterReviewerFacts(model.facts, "conflict").length, 1);
  assert.equal(filterReviewerFacts(model.facts, "needs_evidence").length, 3);
});

test("reviewer draft decisions are local only", () => {
  const model = createReviewerWorkspaceModel();
  const fact = model.facts[0];
  const draft = createReviewerDecisionDraft({
    factId: fact.factId,
    decision: "reject",
    notes: "Need stronger source.",
  });
  assert.equal(draft.localOnly, true);
  assert.equal(draft.factId, fact.factId);
  assert.equal(fact.status, "pending");
  assert.equal("verifiedClaimId" in draft, false);
  assert.equal("publicationId" in draft, false);
});

test("reviewer workspace route is protected", async () => {
  const source = await readFile(
    resolve("app/internal/reviewer/page.tsx"),
    "utf8",
  );
  assert.match(source, /CYBERMEDICA_ENABLE_INTERNAL_REVIEW/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /index:\s*false/);
});

test("reviewer workspace does not import forbidden writers", async () => {
  const files = [
    "app/internal/reviewer/page.tsx",
    "components/internal/ReviewerWorkspace.tsx",
    "lib/review/workspace.ts",
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(resolve(file), "utf8")))
  ).join("\n");
  assert.doesNotMatch(source, /@supabase|createClient|from\(/i);
  assert.doesNotMatch(source, /createPublication|publishClaim|public_api/i);
  assert.doesNotMatch(source, /createVerifiedClaim|verifiedClaims\.insert/i);
  assert.doesNotMatch(source, /fetch\(|axios|XMLHttpRequest/i);
});
