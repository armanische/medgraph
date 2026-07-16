import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { loadInternalImportCenter } from "../../lib/internal-import-center.ts";

test("import center route is protected by CYBERMEDICA_ENABLE_IMPORT_CENTER", async () => {
  const [source, access] = await Promise.all([
    readFile("app/internal/import-center/page.tsx", "utf8"),
    readFile("lib/internal-access.ts", "utf8"),
  ]);
  assert.match(source, /CYBERMEDICA_ENABLE_IMPORT_CENTER/);
  assert.match(source, /notFound\(\)/);
  assert.match(source, /internalRouteMetadata/);
  assert.match(access, /index:\s*false/);
});

test("import center page reads only wave2 reports", async () => {
  const page = await readFile("app/internal/import-center/page.tsx", "utf8");
  const loader = await readFile("lib/internal-import-center.ts", "utf8");
  assert.match(loader, /data\/research\/wave2/);
  assert.doesNotMatch(`${page}\n${loader}`, /data\/research\/review/);
  assert.doesNotMatch(`${page}\n${loader}`, /source-seeds\.manual/);
});

test("import center has no Supabase, Publication or Verification mutation", async () => {
  const files = [
    "app/internal/import-center/page.tsx",
    "components/internal/ImportCenterDashboard.tsx",
    "lib/internal-import-center.ts",
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");
  assert.doesNotMatch(source, /@supabase|createClient|from\(/i);
  assert.doesNotMatch(source, /createPublication|publishClaim|public_api/i);
  assert.doesNotMatch(source, /createVerifiedClaim|verifiedClaims\.insert/i);
  assert.doesNotMatch(source, /mutateVerification|verifyClaim|processReviewDecision/i);
});

test("import center route contains missing report empty state", async () => {
  const source = await readFile("app/internal/import-center/page.tsx", "utf8");
  assert.match(source, /Отчёт Wave 2 ещё не сформирован/);
  assert.match(source, /npm run wave2:execute -- all/);
});

test("import center aggregate metrics are displayed", async () => {
  const source = await readFile(
    "components/internal/ImportCenterDashboard.tsx",
    "utf8",
  );
  for (const metric of [
    "productsDiscovered",
    "officialSources",
    "documentsFound",
    "downloads",
    "artifacts",
    "candidateFacts",
    "reviewItems",
    "blockedProducts",
    "warnings",
    "errors",
  ]) {
    assert.match(source, new RegExp(metric));
  }
});

test("import center loader returns missing when report is absent", async () => {
  const originalCwd = process.cwd();
  const tempRoot = await mkdtemp(join(tmpdir(), "import-center-missing-"));
  try {
    process.chdir(tempRoot);
    const result = await loadInternalImportCenter();
    assert.equal(result.status, "missing");
  } finally {
    process.chdir(originalCwd);
  }
});

test("import center loader returns invalid for broken aggregate JSON", async () => {
  const originalCwd = process.cwd();
  const tempRoot = await mkdtemp(join(tmpdir(), "import-center-invalid-"));
  try {
    const reportPath = join(
      tempRoot,
      "data/research/wave2/wave2-summary.generated.json",
    );
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, "{", "utf8");
    process.chdir(tempRoot);
    const result = await loadInternalImportCenter();
    assert.equal(result.status, "invalid");
  } finally {
    process.chdir(originalCwd);
  }
});

test("import center loader reads aggregate and manufacturer reports", async () => {
  const originalCwd = process.cwd();
  const tempRoot = await mkdtemp(join(tmpdir(), "import-center-ready-"));
  try {
    const waveRoot = join(tempRoot, "data/research/wave2");
    const aggregate = {
      generatedAt: "test",
      manufacturers: ["Hamilton"],
      totals: {
        productsDiscovered: 10,
        officialSources: 3,
        documentsFound: 22,
        downloads: 15,
        artifacts: 15,
        candidateFacts: 35,
        reviewItems: 35,
        blockedProducts: 1,
        errors: 0,
        warnings: 1,
        durationMs: 1458,
      },
      reports: [{ manufacturer: "Hamilton", path: "unused" }],
      safety: {
        publicationCreated: false,
        supabaseWrites: false,
        verificationChanged: false,
        reviewDecisionsChanged: false,
      },
    };
    const manufacturer = {
      manufacturer: "Hamilton",
      generatedAt: "test",
      productsDiscovered: 10,
      officialSources: 3,
      documentsFound: 22,
      downloads: 15,
      artifacts: 15,
      candidateFacts: 35,
      reviewItems: 35,
      blockedProducts: 1,
      errors: [],
      warnings: ["report only"],
      durationMs: 1458,
      retries: [],
      stages: [],
    };
    await writeJson(join(waveRoot, "wave2-summary.generated.json"), aggregate);
    await writeJson(join(waveRoot, "Hamilton/summary.generated.json"), manufacturer);
    process.chdir(tempRoot);
    const result = await loadInternalImportCenter();
    assert.equal(result.status, "ready");
    if (result.status === "ready") {
      assert.equal(result.aggregate.totals.productsDiscovered, 10);
      assert.equal(result.manufacturers[0].manufacturer, "Hamilton");
    }
  } finally {
    process.chdir(originalCwd);
  }
});

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}
