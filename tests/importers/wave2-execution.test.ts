import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  buildWave2Aggregate,
  executeWave2,
  executeWave2Manufacturer,
  resolveWave2Manufacturers,
} from "../../scripts/importers/catalog/wave2-execution.ts";

const seedFile = {
  products: [
    {
      slug: "wave2-hamilton",
      manufacturer: "Hamilton Medical",
      officialSources: [
        {
          url: "https://www.hamilton-medical.com/en/Products.html",
          publisher: "Hamilton Medical",
        },
      ],
    },
    {
      slug: "wave2-ambu",
      manufacturer: "Ambu",
      officialSources: [
        {
          url: "https://www.ambu.com/products",
          publisher: "Ambu",
        },
      ],
    },
  ],
};

test("wave2 manufacturer execution creates summary report", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "wave2-manufacturer-"));
  const summary = await executeWave2Manufacturer("Hamilton", {
    seedFile,
    outputRoot,
  });
  assert.equal(summary.manufacturer, "Hamilton");
  assert.equal(summary.productsDiscovered, 10);
  assert.equal(summary.officialSources, 1);
  assert.equal(summary.reviewItems, summary.candidateFacts);
  assert.deepEqual(
    summary.stages.map((stage) => stage.stage),
    [
      "Discovery",
      "Documents",
      "Downloads",
      "Artifact Store",
      "Extraction",
      "Review Queue",
    ],
  );
  const written = JSON.parse(
    await readFile(join(outputRoot, "Hamilton", "summary.generated.json"), "utf8"),
  );
  assert.equal(written.manufacturer, "Hamilton");
});

test("wave2 aggregate report is created", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "wave2-aggregate-"));
  const result = await executeWave2("Ambu", { outputRoot });
  assert.deepEqual(result.aggregate.manufacturers, ["Ambu"]);
  assert.equal(result.aggregate.totals.productsDiscovered, 14);
  assert.equal(result.aggregate.safety.publicationCreated, false);
  const written = JSON.parse(
    await readFile(join(outputRoot, "wave2-summary.generated.json"), "utf8"),
  );
  assert.equal(written.manufacturers[0], "Ambu");
});

test("wave2 execution is deterministic and idempotent", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "wave2-idempotent-"));
  const first = await executeWave2Manufacturer("Hamilton", {
    seedFile,
    outputRoot,
  });
  const second = await executeWave2Manufacturer("Hamilton", {
    seedFile,
    outputRoot,
  });
  assert.deepEqual(first, second);
});

test("wave2 retry model retries safe stages", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "wave2-retry-"));
  const summary = await executeWave2Manufacturer("Hamilton", {
    seedFile,
    outputRoot,
    simulateRetry: true,
  });
  assert.equal(summary.retries.length, 1);
  assert.equal(summary.retries[0].stage, "Documents");
  assert.equal(summary.retries[0].attempts, 2);
});

test("wave2 resolves supported manufacturers", () => {
  assert.deepEqual(resolveWave2Manufacturers("Hamilton"), ["Hamilton"]);
  assert.equal(resolveWave2Manufacturers("all").length, 10);
  assert.deepEqual(resolveWave2Manufacturers("GE Healthcare"), ["GE"]);
});

test("wave2 aggregate preserves safety boundaries", () => {
  const aggregate = buildWave2Aggregate([
    {
      manufacturer: "Hamilton",
      generatedAt: "wave2-execution-v1",
      productsDiscovered: 10,
      officialSources: 1,
      documentsFound: 22,
      downloads: 15,
      artifacts: 15,
      candidateFacts: 35,
      reviewItems: 35,
      blockedProducts: 1,
      errors: [],
      warnings: [],
      durationMs: 1000,
      retries: [],
      stages: [],
    },
  ]);
  assert.equal(aggregate.safety.publicationCreated, false);
  assert.equal(aggregate.safety.supabaseWrites, false);
  assert.equal(aggregate.safety.verificationChanged, false);
  assert.equal(aggregate.safety.reviewDecisionsChanged, false);
});

test("wave2 orchestrator source has no forbidden writes", async () => {
  const source = await readFile(
    "scripts/importers/catalog/wave2-execution.ts",
    "utf8",
  );
  assert.doesNotMatch(source, /@supabase|createClient|from\(/i);
  assert.doesNotMatch(source, /createPublication|publishClaim|public_api/i);
  assert.doesNotMatch(source, /createVerifiedClaim|verifiedClaims\.insert/i);
  assert.doesNotMatch(
    source,
    /process:review-decisions|decisions\.manual|ReviewDecisionReport|processReviewDecision/i,
  );
});
