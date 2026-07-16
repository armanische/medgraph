import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  WAVE2_PLANNED_MANUFACTURERS,
  loadWave2Dashboard,
} from "../../lib/wave2-dashboard.ts";

const completedStages = [
  "Discovery",
  "Documents",
  "Downloads",
  "Artifact Store",
  "Extraction",
  "Review Queue",
].map((stage) => ({ stage, status: "completed" }));

function manufacturerSummary(
  manufacturer: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    manufacturer,
    generatedAt: "test",
    productsDiscovered: 10,
    officialSources: 8,
    documentsFound: 20,
    downloads: 12,
    artifacts: 11,
    candidateFacts: 30,
    reviewItems: 30,
    blockedProducts: 2,
    errors: [],
    warnings: ["report only"],
    stages: completedStages,
    ...overrides,
  };
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function withTempCwd(
  prefix: string,
  callback: (root: string) => Promise<void>,
) {
  const originalCwd = process.cwd();
  const root = await mkdtemp(join(tmpdir(), prefix));
  try {
    process.chdir(root);
    await callback(root);
  } finally {
    process.chdir(originalCwd);
  }
}

async function writeAggregate(root: string) {
  await writeJson(
    join(root, "data/research/wave2/wave2-summary.generated.json"),
    { generatedAt: "test", manufacturers: ["Hamilton"] },
  );
}

test("wave2 dashboard uses the ten-manufacturer plan", () => {
  assert.deepEqual(
    WAVE2_PLANNED_MANUFACTURERS.map((entry) => entry.manufacturer),
    [
      "Hamilton",
      "Mindray",
      "Dräger",
      "GE HealthCare",
      "Philips",
      "Ambu",
      "SonoScape",
      "Comen",
      "SLE",
      "Dixion",
    ],
  );
});

test("wave2 dashboard returns missing without the aggregate summary", async () => {
  await withTempCwd("wave2-dashboard-missing-", async () => {
    assert.deepEqual(await loadWave2Dashboard(), { status: "missing" });
  });
});

test("wave2 dashboard returns invalid for malformed aggregate JSON", async () => {
  await withTempCwd("wave2-dashboard-invalid-", async (root) => {
    const path = join(
      root,
      "data/research/wave2/wave2-summary.generated.json",
    );
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "{", "utf8");
    assert.deepEqual(await loadWave2Dashboard(), { status: "invalid" });
  });
});

test("wave2 dashboard derives status, progress, totals and aliases", async () => {
  await withTempCwd("wave2-dashboard-ready-", async (root) => {
    await writeAggregate(root);
    await writeJson(
      join(root, "data/research/wave2/Hamilton/summary.generated.json"),
      manufacturerSummary("Hamilton"),
    );
    await writeJson(
      join(root, "data/research/wave2/Mindray/summary.generated.json"),
      manufacturerSummary("Mindray", {
        stages: completedStages.slice(0, 3),
        warnings: [],
      }),
    );
    await writeJson(
      join(root, "data/research/wave2/Drager/summary.generated.json"),
      manufacturerSummary("Drager", { errors: ["download failed"] }),
    );

    const result = await loadWave2Dashboard();
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;

    assert.equal(result.data.plannedManufacturers, 10);
    assert.equal(result.data.completedManufacturers, 1);
    assert.equal(result.data.remainingManufacturers, 9);
    assert.equal(result.data.overallProgress, 10);
    assert.equal(result.data.totals.productsDiscovered, 30);
    assert.equal(result.data.totals.errors, 1);
    assert.equal(result.data.totals.warnings, 2);

    const hamilton = result.data.manufacturers[0];
    assert.equal(hamilton.status, "Completed");
    assert.equal(hamilton.progress, 100);
    assert.equal(hamilton.ready, 8);

    const mindray = result.data.manufacturers[1];
    assert.equal(mindray.status, "In Progress");
    assert.equal(mindray.progress, 50);

    const drager = result.data.manufacturers[2];
    assert.equal(drager.manufacturer, "Dräger");
    assert.equal(drager.status, "Blocked");

    const ge = result.data.manufacturers[3];
    assert.equal(ge.manufacturer, "GE HealthCare");
    assert.equal(ge.status, "Not Started");
  });
});

test("wave2 dashboard marks an invalid manufacturer summary as blocked", async () => {
  await withTempCwd("wave2-dashboard-product-invalid-", async (root) => {
    await writeAggregate(root);
    await writeJson(
      join(root, "data/research/wave2/Hamilton/summary.generated.json"),
      { manufacturer: "Hamilton" },
    );

    const result = await loadWave2Dashboard();
    assert.equal(result.status, "ready");
    if (result.status !== "ready") return;
    assert.equal(result.data.manufacturers[0].status, "Blocked");
    assert.equal(result.data.manufacturers[0].errors.length, 1);
  });
});

test("wave2 dashboard UI contains filters, metrics, details and progress", async () => {
  const source = await readFile(
    "components/internal/Wave2Dashboard.tsx",
    "utf8",
  );
  for (const label of [
    "Manufacturers completed",
    "Manufacturers remaining",
    "Products discovered",
    "Official sources",
    "Documents",
    "Downloads",
    "Artifacts",
    "Candidate facts",
    "Review items",
    "Errors",
    "Warnings",
    "Все",
    "Completed",
    "In Progress",
    "Blocked",
    "Not Started",
    "Execution report",
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-pressed/);
});

test("wave2 dashboard is read-only and has no API or pipeline controls", async () => {
  const files = [
    "app/internal/wave2/page.tsx",
    "components/internal/Wave2Dashboard.tsx",
    "lib/wave2-dashboard.ts",
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.doesNotMatch(source, /writeFile|appendFile|mkdir|rename|unlink/);
  assert.doesNotMatch(source, /fetch\(|route\.ts|\/api\//i);
  assert.doesNotMatch(source, /@supabase|createClient|public_api/i);
  assert.doesNotMatch(source, /wave2:execute|TrustedDownloader|ResolverV2/);
  assert.doesNotMatch(source, /createPublication|createVerifiedClaim/i);
});

test("wave2 route is internal, dynamic and excluded from indexing", async () => {
  const [source, access] = await Promise.all([
    readFile("app/internal/wave2/page.tsx", "utf8"),
    readFile("lib/internal-access.ts", "utf8"),
  ]);
  assert.match(source, /CYBERMEDICA_ENABLE_WAVE2_DASHBOARD/);
  assert.match(source, /await connection\(\)/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /internalRouteMetadata/);
  assert.match(access, /index:\s*false/);
});
