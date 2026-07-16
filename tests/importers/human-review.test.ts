import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  FileReviewDecisionStore,
  InvalidReviewTransitionError,
  auditHumanReview,
  createReviewFixturePublicationInput,
  createReviewItemSnapshot,
  evaluateItemPublicationEligibility,
  evaluateProductPublicationPolicy,
  resolveReviewerId,
  reviewFixturesEnabled,
  submitHumanReviewDecision,
  transitionReviewStatus,
  type ReviewContext,
} from "../../scripts/importers/catalog/review/index.ts";
import {
  buildPublishedCatalog,
  publishCatalog,
} from "../../scripts/importers/catalog/publication/index.ts";

function fixtureContext(): ReviewContext {
  const fixture = createReviewFixturePublicationInput();
  return {
    reports: fixture.reviewProducts,
    artifacts: fixture.artifacts,
    integrityViolations: fixture.integrityViolations,
  };
}

function firstSnapshot(context = fixtureContext()) {
  const report = context.reports[0];
  const item = report.reviewItems[0];
  return {
    report,
    item,
    snapshot: createReviewItemSnapshot({
      report,
      item,
      artifacts: context.artifacts,
      integrityViolations: context.integrityViolations,
    }),
  };
}

test("review state machine permits only explicit workflow transitions", () => {
  assert.equal(
    transitionReviewStatus({ previous: "pending_review", decision: "start_review" }),
    "in_review",
  );
  assert.equal(
    transitionReviewStatus({ previous: "in_review", decision: "approve" }),
    "approved",
  );
  assert.equal(
    transitionReviewStatus({ previous: "in_review", decision: "reject" }),
    "rejected",
  );
  assert.equal(
    transitionReviewStatus({ previous: "in_review", decision: "request_changes" }),
    "needs_changes",
  );
  assert.equal(
    transitionReviewStatus({ previous: "needs_changes", decision: "reopen" }),
    "in_review",
  );
  assert.equal(
    transitionReviewStatus({ previous: "conflicted", decision: "reopen" }),
    "in_review",
  );
  assert.equal(
    transitionReviewStatus({
      previous: "approved",
      decision: "archive",
      publicationStatus: "published",
    }),
    "archived",
  );
  assert.throws(
    () => transitionReviewStatus({ previous: "pending_review", decision: "approve" }),
    InvalidReviewTransitionError,
  );
  assert.throws(
    () => transitionReviewStatus({ previous: "rejected", decision: "reopen" }),
    InvalidReviewTransitionError,
  );
});

test("file decision store is append-only and idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "review-store-"));
  try {
    const store = new FileReviewDecisionStore(root);
    const context = fixtureContext();
    const { item, snapshot } = firstSnapshot(context);
    const first = await submitHumanReviewDecision({
      reviewItemId: item.reviewItemId,
      decision: "start_review",
      expectedSnapshotHash: snapshot.hash,
      expectedStatus: "pending_review",
      idempotencyKey: "fixture-start-0001",
      reviewerId: "reviewer.test",
      reviewedAt: "2026-07-16T10:00:00.000Z",
      context,
      store,
    });
    const retry = await submitHumanReviewDecision({
      reviewItemId: item.reviewItemId,
      decision: "start_review",
      expectedSnapshotHash: snapshot.hash,
      expectedStatus: "pending_review",
      idempotencyKey: "fixture-start-0001",
      reviewerId: "reviewer.test",
      reviewedAt: "2026-07-16T10:00:00.000Z",
      context,
      store,
    });
    assert.equal(first.created, true);
    assert.equal(retry.created, false);
    assert.equal((await store.list()).length, 1);
    const stored = JSON.parse(
      await readFile(join(root, "decisions", `${first.decision.id}.json`), "utf8"),
    );
    assert.equal(stored.schemaVersion, "human-review-decision-v1");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("decision service rejects stale snapshots, stale status and missing comments", async () => {
  const root = await mkdtemp(join(tmpdir(), "review-stale-"));
  try {
    const store = new FileReviewDecisionStore(root);
    const context = fixtureContext();
    const { item, snapshot } = firstSnapshot(context);
    await assert.rejects(
      submitHumanReviewDecision({
        reviewItemId: item.reviewItemId,
        decision: "start_review",
        expectedSnapshotHash: "0".repeat(64),
        expectedStatus: "pending_review",
        idempotencyKey: "fixture-stale-0001",
        reviewerId: "reviewer.test",
        context,
        store,
      }),
      /Stale review item snapshot/u,
    );
    await submitHumanReviewDecision({
      reviewItemId: item.reviewItemId,
      decision: "start_review",
      expectedSnapshotHash: snapshot.hash,
      expectedStatus: "pending_review",
      idempotencyKey: "fixture-start-0002",
      reviewerId: "reviewer.test",
      context,
      store,
    });
    await assert.rejects(
      submitHumanReviewDecision({
        reviewItemId: item.reviewItemId,
        decision: "approve",
        expectedSnapshotHash: snapshot.hash,
        expectedStatus: "pending_review",
        idempotencyKey: "fixture-approve-0002",
        reviewerId: "reviewer.test",
        context,
        store,
      }),
      /Stale review status/u,
    );
    await assert.rejects(
      submitHumanReviewDecision({
        reviewItemId: item.reviewItemId,
        decision: "reject",
        expectedSnapshotHash: snapshot.hash,
        expectedStatus: "in_review",
        idempotencyKey: "fixture-reject-0002",
        reviewerId: "reviewer.test",
        context,
        store,
      }),
      /Comment is required/u,
    );
    await assert.rejects(
      submitHumanReviewDecision({
        reviewItemId: "../../etc/passwd",
        decision: "start_review",
        expectedSnapshotHash: snapshot.hash,
        expectedStatus: "pending_review",
        idempotencyKey: "fixture-path-0002",
        reviewerId: "reviewer.test",
        context,
        store,
      }),
      /Invalid reviewItemId/u,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reviewer identity is server-side and required in production", () => {
  assert.equal(
    resolveReviewerId({ env: { CYBERMEDICA_REVIEWER_ID: "expert.01" }, nodeEnv: "production" }),
    "expert.01",
  );
  assert.equal(resolveReviewerId({ env: {}, nodeEnv: "development" }), "development-reviewer");
  assert.throws(() => resolveReviewerId({ env: {}, nodeEnv: "production" }), /required/u);
});

test("item eligibility rejects missing evidence, document, invalid artifact and unofficial source", () => {
  const context = fixtureContext();
  const valid = firstSnapshot(context).snapshot;
  assert.equal(evaluateItemPublicationEligibility(valid).eligible, true);

  const cases = [
    { mutate: () => { context.reports[0].reviewItems[0].evidenceCandidateIds = []; }, reason: "evidence_invalid" },
    { mutate: () => { context.reports[0].reviewItems[0].documentVersionIds = []; }, reason: "document_version_missing" },
    { mutate: () => { context.artifacts[0].invalidPdf = true; }, reason: "artifact_invalid" },
    { mutate: () => { context.reports[0].reviewItems[0].sourceUrls = ["http://fixtures.invalid/file.pdf"]; }, reason: "official_source_missing" },
  ];
  for (const entry of cases) {
    const isolated = fixtureContext();
    context.reports = isolated.reports;
    context.artifacts = isolated.artifacts;
    entry.mutate();
    const result = evaluateItemPublicationEligibility(firstSnapshot(context).snapshot);
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes(entry.reason));
  }
});

test("product policy requires identity and one approved technical field but allows optional fields", () => {
  const fixture = createReviewFixturePublicationInput();
  const latest = new Map(fixture.decisions.map((decision) => [decision.reviewItemId, decision]));
  const valid = evaluateProductPublicationPolicy({
    report: fixture.reviewProducts[0],
    items: fixture.reviewProducts[0].reviewItems,
    latestDecisions: latest as never,
  });
  assert.equal(valid.eligible, true);

  const missing = createReviewFixturePublicationInput();
  missing.reviewProducts[0].product.model = null;
  const blocked = evaluateProductPublicationPolicy({
    report: missing.reviewProducts[0],
    items: missing.reviewProducts[0].reviewItems,
    latestDecisions: new Map(missing.decisions.map((decision) => [decision.reviewItemId, decision])) as never,
  });
  assert.equal(blocked.eligible, false);
  assert.ok(blocked.reasons.includes("model_missing"));

  const optionalMissing = createReviewFixturePublicationInput();
  optionalMissing.reviewProducts[0].reviewItems = optionalMissing.reviewProducts[0].reviewItems.slice(0, 1);
  optionalMissing.decisions = optionalMissing.decisions.slice(0, 1);
  const optional = buildPublishedCatalog(optionalMissing);
  assert.equal(optional.catalog.kpi.publishedProducts, 1);
});

test("approved fixture completes publication end-to-end only in explicit fixture mode", async () => {
  assert.equal(reviewFixturesEnabled({ env: {}, nodeEnv: "development" }), false);
  assert.equal(
    reviewFixturesEnabled({
      env: { CYBERMEDICA_ENABLE_REVIEW_FIXTURES: "1" },
      nodeEnv: "development",
    }),
    true,
  );
  assert.equal(
    reviewFixturesEnabled({
      env: { CYBERMEDICA_ENABLE_REVIEW_FIXTURES: "1" },
      nodeEnv: "production",
    }),
    false,
  );
  const root = await mkdtemp(join(tmpdir(), "review-publication-e2e-"));
  try {
    const result = await publishCatalog({
      publicRoot: root,
      buildInput: createReviewFixturePublicationInput(),
    });
    assert.equal(result.catalog.kpi.publishedProducts, 1);
    assert.equal(result.catalog.products[0].slug, "review-fixture-monitor-100");
    assert.doesNotMatch(JSON.stringify(result.catalog), /fixture_decision_/u);
    const manifest = JSON.parse(
      await readFile(join(root, "publication-manifest.internal.json"), "utf8"),
    );
    assert.equal(manifest.products[0].approvedDecisionIds.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("pending, rejected and stale approvals never publish", () => {
  const pending = createReviewFixturePublicationInput();
  pending.decisions = [];
  assert.equal(buildPublishedCatalog(pending).catalog.kpi.publishedProducts, 0);

  const rejected = createReviewFixturePublicationInput();
  rejected.decisions = rejected.decisions.map((decision) => ({
    ...decision,
    decision: "reject" as const,
    nextStatus: "rejected" as const,
    publicationEligibility: { eligible: false, status: "not_ready" as const, reasons: ["rejected"] },
  }));
  assert.equal(buildPublishedCatalog(rejected).catalog.kpi.publishedProducts, 0);

  const stale = createReviewFixturePublicationInput();
  stale.decisions[0].snapshotHash = "0".repeat(64);
  assert.equal(buildPublishedCatalog(stale).catalog.blockedByReason.stale_approval, 1);
});

test("review audit detects orphan and stale decisions", async () => {
  const fixture = createReviewFixturePublicationInput();
  const context = fixtureContext();
  const decision = {
    ...fixture.decisions[0],
    idempotencyKey: "audit-orphan-0001",
    reviewerId: "reviewer.test",
    previousStatus: "pending_review" as const,
    comment: "",
    evidenceSnapshot: firstSnapshot(context).snapshot.evidence,
    valueSnapshot: firstSnapshot(context).snapshot.value,
    sourceSnapshot: firstSnapshot(context).snapshot.sources,
    documentVersionSnapshot: firstSnapshot(context).snapshot.documentVersions,
    conflictReason: null,
    schemaVersion: "human-review-decision-v1" as const,
  };
  const stale = { ...decision, snapshotHash: "0".repeat(64) };
  const audit = await auditHumanReview({ context, decisions: [stale] });
  assert.equal(audit.valid, false);
  assert.equal(audit.staleSnapshots, 1);
});

test("Reviewer Workspace is gated, localized and uses server-only writes", async () => {
  const [page, component, action, env] = await Promise.all([
    readFile("app/internal/reviewer/page.tsx", "utf8"),
    readFile("components/internal/ReviewerWorkspace.tsx", "utf8"),
    readFile("app/internal/reviewer/actions.ts", "utf8"),
    readFile(".env.example", "utf8"),
  ]);
  assert.match(page, /notFound\(\)/u);
  for (const label of ["Начать проверку", "Одобрить", "Отклонить", "Запросить изменения", "Отметить конфликт", "История решений"]) {
    assert.match(component, new RegExp(label, "u"));
  }
  assert.match(component, /Готово к публикации/u);
  assert.match(action, /"use server"/u);
  assert.match(action, /expectedSnapshotHash/u);
  assert.doesNotMatch(action, /supabase/iu);
  assert.match(env, /CYBERMEDICA_REVIEWER_ID=/u);
  assert.match(env, /CYBERMEDICA_ENABLE_REVIEW_FIXTURES=/u);
});

test("fixture PDF has a PDF signature and fixtures are disabled by default", async () => {
  const bytes = await readFile("tests/fixtures/review/official-review-fixture.pdf");
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
  assert.notEqual(process.env.CYBERMEDICA_ENABLE_REVIEW_FIXTURES, "1");
});

test("human review source contains no automatic approval or publication command", async () => {
  const sources = await Promise.all([
    readFile("scripts/importers/catalog/review/review-service.ts", "utf8"),
    readFile("scripts/importers/catalog/review/review-summary.ts", "utf8"),
    readFile("app/internal/reviewer/actions.ts", "utf8"),
  ]);
  const source = sources.join("\n");
  assert.doesNotMatch(source, /supabase|verifiedClaims|autoApprove|approveAll/iu);
  assert.doesNotMatch(source, /data\/research\/(?:review|wave2|extraction).*write/iu);
});
