import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  createManifest,
  resolveArtifact,
  validateManifest,
  verifyArtifact,
} from "../../scripts/importers/catalog/artifact-storage/index.ts";

async function fixture() {
  const repositoryRoot = await mkdtemp(join(tmpdir(), "artifact-storage-"));
  const researchRoot = join(repositoryRoot, "data/research");
  const artifactRoot = join(researchRoot, "artifacts");

  async function addArtifact(content: string, extension = ".pdf") {
    const sha256 = createHash("sha256").update(content).digest("hex");
    const relativePath = `data/research/artifacts/artifacts/sha256/${sha256.slice(0, 2)}/${sha256.slice(2, 4)}/${sha256}${extension}`;
    const absolutePath = join(repositoryRoot, relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
    return { sha256, relativePath, absolutePath };
  }

  return { repositoryRoot, researchRoot, artifactRoot, addArtifact };
}

test("SHA verification accepts a correctly sharded content-addressed artifact", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  const artifact = await input.addArtifact("%PDF-1.7\nfixture");
  const result = await verifyArtifact(artifact.relativePath, input.repositoryRoot);
  assert.equal(result.sha256, artifact.sha256);
  assert.equal(result.shaMatchesPath, true);
  assert.equal(result.pdfSignature, true);
});

test("manifest links products, document versions, and review items", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  const artifact = await input.addArtifact("%PDF-1.7\nlinked");
  const documentsPath = join(input.researchRoot, "documents/products/device.json");
  const reviewPath = join(input.researchRoot, "review/products/device.json");
  await mkdir(dirname(documentsPath), { recursive: true });
  await mkdir(dirname(reviewPath), { recursive: true });
  await writeFile(
    documentsPath,
    JSON.stringify({
      product: { productSlug: "device", manufacturer: "Manufacturer" },
      documentVersions: [
        {
          versionId: "version-1",
          filePath: artifact.relativePath,
          sha256: artifact.sha256,
          contentType: "application/pdf",
        },
      ],
    }),
  );
  await writeFile(
    reviewPath,
    JSON.stringify({
      reviewItems: [
        { reviewItemId: "review-1", documentVersionIds: ["version-1"] },
      ],
    }),
  );
  const manifest = await createManifest(input);
  assert.equal(manifest.artifacts[0].manufacturer, "Manufacturer");
  assert.deepEqual(manifest.artifacts[0].referencedProducts, ["device"]);
  assert.deepEqual(manifest.artifacts[0].referencedDocumentVersions, ["version-1"]);
  assert.deepEqual(manifest.artifacts[0].referencedReviewItems, ["review-1"]);
  assert.equal(manifest.artifacts[0].referenceCount, 2);
  assert.equal(manifest.artifacts[0].orphan, false);
  assert.deepEqual(validateManifest(manifest), { valid: true, errors: [] });
});

test("duplicate content is reported without changing either file", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  const first = await input.addArtifact("%PDF-1.7\nduplicate", ".pdf");
  await input.addArtifact("%PDF-1.7\nduplicate", ".aspx");
  const manifest = await createManifest(input);
  assert.equal(manifest.summary.duplicateHashCount, 1);
  assert.equal(manifest.summary.duplicateFileCount, 1);
  assert.equal(manifest.duplicateFiles[0].sha256, first.sha256);
  assert.equal(manifest.duplicateFiles[0].paths.length, 2);
});

test("HTML masquerading as PDF is detected", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  await input.addArtifact("<!doctype html><html><body>blocked</body></html>");
  const manifest = await createManifest(input);
  assert.equal(manifest.summary.invalidPdfCount, 1);
  assert.equal(manifest.summary.htmlMasqueradingCount, 1);
  assert.equal(manifest.artifacts[0].mime, "text/html");
});

test("zero-byte artifacts are reported", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  await input.addArtifact("");
  const manifest = await createManifest(input);
  assert.equal(manifest.summary.zeroByteCount, 1);
  assert.equal(manifest.artifacts[0].zeroByte, true);
});

test("absolute artifact paths are rejected and absolute JSON values are audited", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  assert.throws(() => resolveArtifact("/Users/test/private.pdf", input.repositoryRoot));
  const reportPath = join(input.researchRoot, "documents/products/absolute.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify({ filePath: "/Users/test/private.pdf" }));
  const manifest = await createManifest(input);
  assert.equal(manifest.summary.absolutePathCount, 1);
  assert.equal(manifest.absolutePaths[0].value, "/Users/test/private.pdf");
});

test("manifest generation is idempotent", async (context) => {
  const input = await fixture();
  context.after(() => rm(input.repositoryRoot, { recursive: true, force: true }));
  await input.addArtifact("%PDF-1.7\nstable");
  const first = await createManifest(input);
  const second = await createManifest(input);
  assert.deepEqual(second, first);
});
