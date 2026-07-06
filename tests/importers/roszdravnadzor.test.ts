import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { mkdtemp } from "node:fs/promises";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { ContentAddressedArtifactStore } from "../../scripts/importers/core/artifact-store.ts";
import type {
  DownloadedArtifact,
  IngestionPlan,
  NormalizedDocumentLink,
} from "../../scripts/importers/core/contracts.ts";
import { StreamingDownloader } from "../../scripts/importers/core/downloader.ts";
import {
  ImportManifestStore,
  type ImportManifest,
} from "../../scripts/importers/core/manifest-store.ts";
import { determineImportStatus } from "../../scripts/importers/core/status.ts";
import {
  RoszdravnadzorAdapter,
  createTlsBlockedOutput,
  normalizeDocumentLinks,
  resolveRoszdravnadzorTlsPolicy,
} from "../../scripts/importers/roszdravnadzor.ts";

const OFFICIAL_DOCUMENT_URL =
  "https://elk.roszdravnadzor.gov.ru/public-gateway/med-product/api/v1/files/download-by-path-public?id=1";
const FIXTURE_DIRECTORY = join(
  process.cwd(),
  "tests/fixtures/roszdravnadzor",
);

async function createTemporaryRoot() {
  return mkdtemp(join(tmpdir(), "cybermedica-rzn-test-"));
}

async function listFiles(root: string): Promise<string[]> {
  const values = await readdir(root, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    values.map(async (value) => {
      const path = join(root, value.name);
      return value.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

function createDownloadedArtifact(
  documentKey: string,
  sha256: string,
): DownloadedArtifact {
  return {
    documentKey,
    documentType: "registration",
    externalId: documentKey,
    title: "Регистрационное удостоверение",
    sourceUrl: OFFICIAL_DOCUMENT_URL,
    contentType: "application/pdf",
    byteSize: 10,
    sha256,
    filePath: `tmp/artifacts/${sha256}.pdf`,
    capturedAt: "2026-07-03T00:00:00.000Z",
  };
}

function createPlan(downloadedFiles: DownloadedArtifact[]): IngestionPlan {
  return {
    provider: "roszdravnadzor",
    query: "ФСЗ 2009/04992",
    registrationNumber: "ФСЗ 2009/04992",
    registryRecordId: "123",
    sourceUrl:
      "https://elk.roszdravnadzor.gov.ru/widget/med-product/123",
    rawArtifacts: [],
    documents: [],
    documentVersions: [],
    downloadedFiles,
    failedDownloads: [],
    evidenceCandidates: [],
    claimCandidates: [],
    status: "completed",
    warnings: [],
  };
}

function documentLink(): NormalizedDocumentLink {
  return {
    externalId: "rzn:registration",
    documentKey: "rzn:registration",
    documentType: "registration",
    title: "Регистрационное удостоверение",
    url: OFFICIAL_DOCUMENT_URL,
  };
}

test("same import twice creates one content-addressed artifact and one version", async () => {
  const root = await createTemporaryRoot();
  const artifactStore = new ContentAddressedArtifactStore({
    rootDirectory: root,
  });
  const bytes = await readFile(join(FIXTURE_DIRECTORY, "registration-v1.pdf"));
  const first = await artifactStore.saveBytes({
    kind: "document",
    sourceUrl: OFFICIAL_DOCUMENT_URL,
    contentType: "application/pdf",
    extension: ".pdf",
    bytes,
  });
  const second = await artifactStore.saveBytes({
    kind: "document",
    sourceUrl: OFFICIAL_DOCUMENT_URL,
    contentType: "application/pdf",
    extension: ".pdf",
    bytes,
  });

  assert.equal(first.sha256, second.sha256);
  assert.equal(first.filePath, second.filePath);
  const artifactFiles = (await listFiles(join(root, "artifacts"))).filter(
    (path) => path.endsWith(".pdf"),
  );
  assert.equal(artifactFiles.length, 1);

  const manifestStore = new ImportManifestStore(join(root, "import-manifest.json"));
  const firstMerge = await manifestStore.merge(
    createPlan([createDownloadedArtifact("registration", first.sha256)]),
  );
  const manifestAfterFirstImport = await readFile(
    join(root, "import-manifest.json"),
    "utf8",
  );
  await delay(5);
  const secondMerge = await manifestStore.merge(
    createPlan([createDownloadedArtifact("registration", second.sha256)]),
  );
  const manifestAfterSecondImport = await readFile(
    join(root, "import-manifest.json"),
    "utf8",
  );
  const manifest = JSON.parse(manifestAfterSecondImport) as ImportManifest;
  const record = Object.values(manifest.imports)[0];
  assert.equal(firstMerge.changed, true);
  assert.equal(secondMerge.changed, false);
  assert.equal(manifestAfterSecondImport, manifestAfterFirstImport);
  assert.equal(record.documents.length, 1);
  assert.equal(record.documentVersions.length, 1);
  assert.equal(record.downloadedFiles.length, 1);
});

test("changed PDF creates a new version with supersedes", async () => {
  const root = await createTemporaryRoot();
  const manifestStore = new ImportManifestStore(join(root, "import-manifest.json"));
  const firstSha = createHash("sha256")
    .update(await readFile(join(FIXTURE_DIRECTORY, "registration-v1.pdf")))
    .digest("hex");
  const secondSha = createHash("sha256")
    .update(await readFile(join(FIXTURE_DIRECTORY, "registration-v2.pdf")))
    .digest("hex");

  await manifestStore.merge(
    createPlan([createDownloadedArtifact("registration", firstSha)]),
  );
  await manifestStore.merge(
    createPlan([createDownloadedArtifact("registration", secondSha)]),
  );

  const manifest = JSON.parse(
    await readFile(join(root, "import-manifest.json"), "utf8"),
  ) as ImportManifest;
  const record = Object.values(manifest.imports)[0];
  assert.equal(record.documentVersions.length, 2);
  assert.equal(record.documentVersions[1].previousSha256, firstSha);
  assert.equal(
    record.documentVersions[1].supersedes,
    record.documentVersions[0].versionId,
  );
});

test("multiple PDFs are modeled as separate logical documents", () => {
  const documents = normalizeDocumentLinks("ФСЗ 2009/04992", [
    {
      title: "Регистрационное удостоверение",
      url: `${OFFICIAL_DOCUMENT_URL}&path=registration.pdf`,
    },
    {
      title: "Приложение к регистрационному удостоверению",
      url: `${OFFICIAL_DOCUMENT_URL}&path=application.pdf`,
    },
    {
      title: "Инструкция по применению",
      url: `${OFFICIAL_DOCUMENT_URL}&path=manual.pdf`,
    },
  ]);

  assert.equal(documents.length, 3);
  assert.equal(new Set(documents.map((item) => item.documentKey)).size, 3);
  assert.deepEqual(
    documents.map((item) => item.documentType),
    ["registration", "application", "ifu"],
  );
});

test("missing documents require an explicit warning before completed status", () => {
  assert.equal(
    determineImportStatus({
      registryRecordFound: true,
      normalizedRecordCreated: true,
      downloadedDocumentCount: 0,
      documentOutcomeWarningCount: 0,
      manifestWritten: true,
    }),
    "partial",
  );
  assert.equal(
    determineImportStatus({
      registryRecordFound: true,
      normalizedRecordCreated: true,
      downloadedDocumentCount: 0,
      documentOutcomeWarningCount: 1,
      manifestWritten: true,
    }),
    "completed",
  );
});

for (const [contentType, fixtureName] of [
  ["text/html", "error.html"],
  ["application/json", "error.json"],
] as const) {
  test(`${contentType} error response is rejected`, async () => {
    const root = await createTemporaryRoot();
    const downloader = new StreamingDownloader({
      artifactStore: new ContentAddressedArtifactStore({
        rootDirectory: root,
      }),
      maxAttempts: 1,
      fetchImplementation: (async () =>
        new Response(await readFile(join(FIXTURE_DIRECTORY, fixtureName)), {
          status: 200,
          headers: { "content-type": contentType },
        })) as typeof fetch,
    });

    const result = await downloader.download(documentLink());
    assert.equal(result.artifact, null);
    assert.match(result.failure?.reason ?? "", /content type/i);
    assert.equal((await listFiles(join(root, "artifacts"))).length, 0);
  });
}

test("PDF magic-byte validator rejects a mislabeled response", async () => {
  const root = await createTemporaryRoot();
  const downloader = new StreamingDownloader({
    artifactStore: new ContentAddressedArtifactStore({ rootDirectory: root }),
    maxAttempts: 1,
    fetchImplementation: (async () =>
      new Response("not a PDF", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })) as typeof fetch,
  });

  const result = await downloader.download(documentLink());
  assert.equal(result.artifact, null);
  assert.match(result.failure?.reason ?? "", /PDF signature/i);
});

test("file size limit is enforced while streaming and .part is removed", async () => {
  const root = await createTemporaryRoot();
  const store = new ContentAddressedArtifactStore({
    rootDirectory: root,
    maxBytes: 5,
  });
  const chunks = Readable.from([Buffer.from("1234"), Buffer.from("5678")]);

  await assert.rejects(
    store.saveStream({
      kind: "document",
      sourceUrl: OFFICIAL_DOCUMENT_URL,
      contentType: "application/pdf",
      extension: ".pdf",
      stream: chunks,
    }),
    /maximum size/i,
  );

  const files = await listFiles(root);
  assert.equal(files.some((path) => path.endsWith(".part")), false);
  assert.equal(files.some((path) => path.endsWith(".pdf")), false);
});

test("temporary HTTP failures are retried with backoff", async () => {
  const root = await createTemporaryRoot();
  let attempts = 0;
  const downloader = new StreamingDownloader({
    artifactStore: new ContentAddressedArtifactStore({ rootDirectory: root }),
    maxAttempts: 3,
    fetchImplementation: (async () => {
      attempts += 1;
      if (attempts < 3) {
        return new Response("temporary", { status: 503 });
      }
      return new Response(
        await readFile(join(FIXTURE_DIRECTORY, "registration-v1.pdf")),
        {
          status: 200,
          headers: { "content-type": "application/pdf" },
        },
      );
    }) as typeof fetch,
  });

  const result = await downloader.download(documentLink());
  assert.equal(attempts, 3);
  assert.ok(result.artifact);
  assert.equal(result.failure, null);
});

test("HTTP 404 is not retried", async () => {
  const root = await createTemporaryRoot();
  let attempts = 0;
  const downloader = new StreamingDownloader({
    artifactStore: new ContentAddressedArtifactStore({ rootDirectory: root }),
    maxAttempts: 3,
    fetchImplementation: (async () => {
      attempts += 1;
      return new Response("missing", { status: 404 });
    }) as typeof fetch,
  });

  const result = await downloader.download(documentLink());
  assert.equal(attempts, 1);
  assert.equal(result.artifact, null);
  assert.match(result.failure?.reason ?? "", /404/);
});

test("stale manifest lock is recovered using timestamp metadata", async () => {
  const root = await createTemporaryRoot();
  const manifestPath = join(root, "import-manifest.json");
  const lockPath = `${manifestPath}.lock`;
  await writeFile(
    lockPath,
    JSON.stringify({
      pid: 999_999,
      acquiredAt: "2000-01-01T00:00:00.000Z",
      staleAfterMs: 10,
      token: "stale-test-lock",
    }),
  );
  const store = new ImportManifestStore(manifestPath, {
    staleLockTimeoutMs: 10,
  });

  const result = await store.merge(
    createPlan([createDownloadedArtifact("registration", "c".repeat(64))]),
  );

  assert.equal(result.record.documentVersions.length, 1);
  assert.equal(
    (await listFiles(root)).some((path) => path.endsWith(".lock")),
    false,
  );
});

test("HTTPS certificate authority error blocks import without dev flag", () => {
  const policy = resolveRoszdravnadzorTlsPolicy({
    NODE_ENV: "development",
  });
  const output = createTlsBlockedOutput(
    new Error("page.goto: net::ERR_CERT_AUTHORITY_INVALID"),
    "ФСЗ 2009/04992",
  );

  assert.equal(policy.ignoreHTTPSErrors, false);
  assert.equal(policy.warning, null);
  assert.equal(output?.status, "blocked");
  assert.match(
    output?.warnings.join(" ") ?? "",
    /TLS certificate validation failed/,
  );
  assert.match(
    output?.warnings.join(" ") ?? "",
    /ROSRZN_IGNORE_HTTPS_ERRORS=1 npm run import:roszdravnadzor/,
  );
});

test("dev TLS bypass warning is persisted in ImportManifest", async () => {
  const policy = resolveRoszdravnadzorTlsPolicy({
    NODE_ENV: "development",
    ROSRZN_IGNORE_HTTPS_ERRORS: "1",
  });
  assert.equal(policy.ignoreHTTPSErrors, true);
  assert.match(policy.warning ?? "", /TLS certificate validation was disabled/);

  const root = await createTemporaryRoot();
  const adapter = new RoszdravnadzorAdapter(
    new ContentAddressedArtifactStore({ rootDirectory: root }),
    {
      environment: {
        NODE_ENV: "development",
        ROSRZN_IGNORE_HTTPS_ERRORS: "1",
      },
    },
  );
  const plan = createPlan([]);
  plan.warnings = [...adapter.warnings];
  const manifestStore = new ImportManifestStore(join(root, "import-manifest.json"));
  const merged = await manifestStore.merge(plan);

  assert.equal(merged.record.status, "completed");
  assert.deepEqual(merged.record.warnings, plan.warnings);
  assert.match(
    merged.record.warnings.join(" "),
    /ROSRZN_IGNORE_HTTPS_ERRORS=1/,
  );
});

test("dev TLS bypass flag is ignored in production", () => {
  const policy = resolveRoszdravnadzorTlsPolicy({
    NODE_ENV: "production",
    ROSRZN_IGNORE_HTTPS_ERRORS: "1",
  });

  assert.equal(policy.ignoreHTTPSErrors, false);
  assert.match(policy.warning ?? "", /ignored because NODE_ENV=production/);
});
