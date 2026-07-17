import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("reviewer workspace uses real Review Queue DTO instead of mock drafts", async () => {
  const [page, loader] = await Promise.all([
    readFile("app/internal/reviewer/page.tsx", "utf8"),
    readFile("lib/review/human-workspace.ts", "utf8"),
  ]);
  assert.match(page, /loadHumanReviewerWorkspace/u);
  assert.match(loader, /loadReviewContext/u);
  assert.doesNotMatch(page, /createReviewerWorkspaceModel|draft decisions/iu);
});

test("reviewer workspace route is protected and noindexed", async () => {
  const [page, access] = await Promise.all([
    readFile("app/internal/reviewer/page.tsx", "utf8"),
    readFile("lib/internal-access.ts", "utf8"),
  ]);
  assert.match(page, /internalReviewEnabled/u);
  assert.match(page, /notFound\(\)/u);
  assert.match(access, /CYBERMEDICA_ENABLE_INTERNAL_REVIEW/u);
  assert.match(access, /index:\s*false/u);
});

test("reviewer writes are server-only and do not import protected writers", async () => {
  const files = [
    "app/internal/reviewer/actions.ts",
    "scripts/importers/catalog/review/review-service.ts",
    "scripts/importers/catalog/review/decision-store.ts",
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");
  assert.match(source, /"use server"/u);
  assert.doesNotMatch(source, /@supabase|createClient|public_api|createVerifiedClaim/iu);
  assert.doesNotMatch(source, /autoApprove|approveAll|autoPublish/iu);
});

test("review queue is a read-only projection of canonical Human Review", async () => {
  const [queuePage, reviewerPage, queueView, workspace, packageJson] =
    await Promise.all([
      readFile("app/internal/review-queue/page.tsx", "utf8"),
      readFile("app/internal/reviewer/page.tsx", "utf8"),
      readFile("components/internal/ReviewQueueView.tsx", "utf8"),
      readFile("lib/review/human-workspace.ts", "utf8"),
      readFile("package.json", "utf8"),
    ]);

  assert.match(queuePage, /loadHumanReviewerWorkspace/u);
  assert.match(queuePage, /scope:\s*["']all["']/u);
  assert.match(reviewerPage, /loadHumanReviewerWorkspace/u);
  assert.match(workspace, /FileReviewDecisionStore/u);
  assert.match(queueView, /human-types/u);
  assert.doesNotMatch(queuePage + queueView, /internal-review-queue/u);
  assert.doesNotMatch(queueView, /<form|<button|formAction|onSubmit|onClick/iu);
  assert.doesNotMatch(packageJson, /process:review-decisions/u);
});
