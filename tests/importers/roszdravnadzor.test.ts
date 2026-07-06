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
  evaluateRegistrationEvidence,
  findMatchingApiRecord,
  findNetworkRegistryRecord,
  normalizeDocumentLinks,
  normalizeRegistrationNumber,
  resolveDetailFallback,
  resolveRegistryAcquisition,
  resolveRoszdravnadzorTlsPolicy,
  scoreSearchDescriptor,
} from "../../scripts/importers/roszdravnadzor.ts";
import { writeRoszdravnadzorDiagnostics } from "../../scripts/importers/roszdravnadzor-diagnostics.ts";
import { replayRoszdravnadzorDiagnostics } from "../../scripts/importers/roszdravnadzor-replay.ts";

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

test("missing search input creates complete diagnosticsPath", async () => {
  const root = await createTemporaryRoot();
  type FakeElement = {
    tag: string;
    attrs: Record<string, string>;
    text: string;
  };
  const elements: FakeElement[] = [{
    tag: "button",
    attrs: { type: "button", "aria-label": "Меню" },
    text: "Меню",
  }];
  const locator = (items: FakeElement[]) => ({
    count: async () => items.length,
    nth: (index: number) => locator(items.slice(index, index + 1)),
    isVisible: async () => true,
    getAttribute: async (name: string) =>
      name === "tagName" ? items[0]?.tag ?? null : items[0]?.attrs[name as keyof typeof items[0]["attrs"]] ?? null,
    innerText: async () => items[0]?.text ?? "",
    boundingBox: async () => ({ x: 0, y: 0, width: 100, height: 30 }),
    evaluate: async () => items[0]?.tag ?? null,
  });
  const page = {
    url: () => "https://elk.roszdravnadzor.gov.ru/widget/",
    title: async () => "Реестр",
    content: async () => "<html><body><button>Меню</button></body></html>",
    locator: (selector: string) =>
      locator(selector === "body" ? [{ tag: "body", attrs: {}, text: "Меню" }] : elements),
    frames: () => [{
      url: () => "https://elk.roszdravnadzor.gov.ru/frame",
      name: () => "registry-frame",
      locator: () => locator([]),
      frameElement: async () => locator([{
        tag: "iframe",
        attrs: { title: "Реестр РУ" },
        text: "",
      }]),
    }, {
      url: () => "https://elk.roszdravnadzor.gov.ru/child",
      name: () => "child",
      locator: () => locator([]),
      frameElement: async () => locator([{
        tag: "iframe",
        attrs: { title: "Форма поиска" },
        text: "",
      }]),
    }],
    screenshot: async ({ path }: { path: string }) =>
      writeFile(path, Buffer.from("png")),
    evaluate: async () => "Test Agent",
  };

  const diagnosticsPath = await writeRoszdravnadzorDiagnostics({
    page: page as never,
    query: "ФСЗ 2009/04992",
    reason: "Registration-number search input was not found.",
    tlsBypassEnabled: false,
    detailIdFallbackEnabled: false,
    network: [],
    rootDirectory: root,
    now: new Date("2026-07-06T10:00:00.000Z"),
  });
  const files = (await readdir(diagnosticsPath)).sort();
  assert.deepEqual(files, [
    "elements.json",
    "iframes.json",
    "metadata.json",
    "network.json",
    "page.html",
    "screenshot.png",
    "visible-text.txt",
  ]);
  const metadata = JSON.parse(
    await readFile(join(diagnosticsPath, "metadata.json"), "utf8"),
  );
  assert.equal(metadata.status, "blocked");
  assert.match(metadata.reason, /search input/i);
  assert.equal(metadata.detailIdFallbackEnabled, false);
  assert.equal(metadata.diagnosticsVersion, "1.0");
  const iframeData = JSON.parse(
    await readFile(join(diagnosticsPath, "iframes.json"), "utf8"),
  );
  assert.equal(iframeData.length, 1);
  assert.equal(iframeData[0].title, "Форма поиска");
});

test("search input is ranked by placeholder", () => {
  assert.ok(
    scoreSearchDescriptor({ placeholder: "Номер регистрационного удостоверения" }) >=
      50,
  );
});

test("search input is ranked by aria-label", () => {
  assert.ok(scoreSearchDescriptor({ ariaLabel: "Поиск РУ" }) >= 45);
});

test("search input is ranked by searchbox role", () => {
  assert.ok(scoreSearchDescriptor({ role: "searchbox" }) >= 20);
});

test("widget input-search class outranks generic comboboxes", () => {
  assert.ok(
    scoreSearchDescriptor({ className: "input-search" }) >
      scoreSearchDescriptor({ role: "combobox" }),
  );
});

test("observed network payload can supply record when DOM search fails", () => {
  const record = findMatchingApiRecord(
    [{ data: [{ id: 37042, registrationNumber: "ФСЗ 2009/04992" }] }],
    "ФСЗ 2009/04992",
  );
  assert.equal(record?.id, 37042);
});

test("registration number normalization accepts explicit equivalent forms", () => {
  const expected = normalizeRegistrationNumber("ФСЗ 2009/04992");
  assert.equal(normalizeRegistrationNumber("ФСЗ2009/04992"), expected);
  assert.equal(normalizeRegistrationNumber("ФСЗ № 2009 / 04992"), expected);
});

test("network-first extraction returns a nested registry record", () => {
  const match = findNetworkRegistryRecord(
    [
      {
        response: {
          items: [
            {
              medProductId: 37042,
              registrationNumber: "ФСЗ № 2009/04992",
              medicalDeviceName: "Фильтр дыхательный FS510",
              manufacturer: { name: "Alba Healthcare" },
              status: "Действует",
              issueDate: "2009-12-01",
              updatedDate: "2026-06-01",
              documents: [
                {
                  title: "Регистрационное удостоверение",
                  path: "/documents/fs510.pdf",
                },
              ],
            },
          ],
        },
      },
    ],
    "ФСЗ2009/04992",
  );

  assert.equal(match?.registryRecordId, "37042");
  assert.equal(match?.record.medicalDeviceName, "Фильтр дыхательный FS510");
  assert.equal(match?.registrationNumber, "ФСЗ № 2009/04992");
});

test("network-first extraction rejects a different registration number", () => {
  const match = findNetworkRegistryRecord(
    [
      {
        data: [
          {
            productId: 37042,
            registrationNumber: "ФСЗ 2009/00001",
          },
        ],
      },
    ],
    "ФСЗ 2009/04992",
  );
  assert.equal(match, null);
});

test("network-first extraction rejects an echoed query with wrong records", () => {
  const match = findNetworkRegistryRecord(
    [
      {
        query: "ФСЗ 2009/04992",
        content: [
          {
            id: 1,
            noRu: "ФСЗ 2009/00001",
            name: "Другое изделие",
          },
        ],
      },
    ],
    "ФСЗ 2009/04992",
  );
  assert.equal(match, null);
});

test("network-first acquisition does not require a DOM result URL", () => {
  const acquisition = resolveRegistryAcquisition({
    payloads: [
      {
        data: {
          productId: "37042",
          registrationNumber: "ФСЗ2009/04992",
          productName: "FS510",
        },
      },
    ],
    payloadUrls: [
      "https://elk.roszdravnadzor.gov.ru/public-gateway/med-product/search",
    ],
    registrationNumber: "ФСЗ № 2009/04992",
    domRecordUrl: null,
  });

  assert.equal(acquisition?.source, "network");
  assert.equal(acquisition?.registryRecordId, "37042");
  assert.equal(
    acquisition?.recordUrl,
    "https://elk.roszdravnadzor.gov.ru/widget/med-product/37042",
  );
});

test("Roszdravnadzor noRu response is normalized from the network record", async () => {
  const payload = {
    content: [
      {
        id: 37042,
        noRu: "ФСЗ № 2009/04992",
        dateRu: "2009-12-01",
        name: "Фильтр дыхательный FS510",
        producer: { name: "Alba Healthcare" },
        status: { id: 1, code: "active", name: "Действует" },
      },
    ],
  };
  const adapter = new RoszdravnadzorAdapter(
    new ContentAddressedArtifactStore(),
  );
  const normalized = await adapter.normalize({
    provider: "roszdravnadzor",
    query: "ФСЗ 2009/04992",
    registrationNumber: "ФСЗ 2009/04992",
    registryRecordId: "37042",
    sourceUrl:
      "https://elk.roszdravnadzor.gov.ru/widget/med-product/37042",
    capturedAt: "2026-07-06T00:00:00.000Z",
    payloads: [payload],
    htmlArtifacts: [],
    jsonArtifacts: [],
    metadata: { domData: { pairs: [], links: [] } },
  });

  assert.equal(normalized.registrationNumber, "ФСЗ № 2009/04992");
  assert.equal(normalized.medicalDeviceName, "Фильтр дыхательный FS510");
  assert.equal(normalized.manufacturer, "Alba Healthcare");
  assert.equal(normalized.status, "Действует");
  assert.equal(normalized.issueDate, "2009-12-01");
});

test("explicit detail ID resolves observed detail URL and warning", () => {
  const fallback = resolveDetailFallback({ ROSRZN_DETAIL_ID: "37042" });
  assert.equal(
    fallback?.url,
    "https://elk.roszdravnadzor.gov.ru/widget/med-product/37042",
  );
  assert.match(fallback?.warning ?? "", /search was intentionally skipped/i);
});

test("detail fallback warning and TLS dev warning coexist", () => {
  const adapter = new RoszdravnadzorAdapter(
    new ContentAddressedArtifactStore(),
    {
      environment: {
        NODE_ENV: "development",
        ROSRZN_IGNORE_HTTPS_ERRORS: "1",
        ROSRZN_DETAIL_ID: "37042",
      },
    },
  );
  assert.match(adapter.warnings.join(" "), /TLS certificate validation was disabled/);
  assert.match(
    adapter.warnings.join(" "),
    /Manual Roszdravnadzor detail ID fallback was used/,
  );
});

test("detail fallback registration mismatch blocks ingestion", () => {
  const result = evaluateRegistrationEvidence({
    query: "ФСЗ 2009/04992",
    observedRegistrationNumber: "ФСЗ 2009/00001",
    detailIdFallbackEnabled: true,
  });
  assert.equal(result.outcome, "mismatch");
  assert.match(result.warning ?? "", /does not match/);
});

test("unverifiable detail fallback is never silently completed", () => {
  const result = evaluateRegistrationEvidence({
    query: "ФСЗ 2009/04992",
    observedRegistrationNumber: null,
    detailIdFallbackEnabled: true,
  });
  assert.equal(result.outcome, "unverified");
  assert.match(result.warning ?? "", /could not be verified/);
});

test("diagnostics replay is offline and produces a human-readable report", async () => {
  const root = await createTemporaryRoot();
  await Promise.all([
    writeFile(
      join(root, "metadata.json"),
      JSON.stringify({
        url: "https://elk.roszdravnadzor.gov.ru/widget/",
        title: "Реестр",
        timestamp: "2026-07-06T10:00:00.000Z",
        query: "ФСЗ 2009/04992",
        status: "blocked",
        reason: "Registration-number search input was not found.",
        userAgent: "Test Agent",
        tlsBypassEnabled: false,
        detailIdFallbackEnabled: false,
        diagnosticsVersion: "1.0",
      }),
    ),
    writeFile(
      join(root, "elements.json"),
      JSON.stringify([
        {
          tag: "input",
          placeholder: "Номер регистрационного удостоверения",
          isVisible: true,
        },
        {
          tag: "button",
          textContent: "Найти",
          isVisible: true,
        },
      ]),
    ),
    writeFile(join(root, "iframes.json"), "[]"),
    writeFile(
      join(root, "network.json"),
      JSON.stringify([
        {
          url: "https://elk.roszdravnadzor.gov.ru/med-product/search",
          contentType: "application/json",
          resourceType: "xhr",
          bodyPreview: '{"registrationNumber":"ФСЗ 2009/04992"}',
          markers: ["ФСЗ", "med-product"],
        },
      ]),
    ),
  ]);

  const originalFetch = globalThis.fetch;
  let networkCalled = false;
  globalThis.fetch = (async () => {
    networkCalled = true;
    throw new Error("Replay must not use network.");
  }) as typeof fetch;
  try {
    const report = await replayRoszdravnadzorDiagnostics(root);
    assert.equal(networkCalled, false);
    assert.match(report, /Search inputs found: 1/);
    assert.match(report, /JSON\/XHR\/fetch responses: 1/);
    assert.match(report, /placeholder:/);
    assert.match(
      report,
      /Candidate network responses:[\s\S]*med-product\/search[\s\S]*registrationNumber/,
    );
    assert.match(report, /Recommended next action:/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("importer source has no publication, verified claim, or Supabase write", async () => {
  const source = await readFile(
    join(process.cwd(), "scripts/importers/roszdravnadzor.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /supabase(?:Url|Client|\.from)|service_role/i);
  assert.doesNotMatch(source, /verificationStatus:\s*["']verified/i);
  assert.doesNotMatch(source, /createVerification|verification\.(?:insert|create)/i);
  assert.doesNotMatch(source, /autoPublish:\s*true/i);
  assert.doesNotMatch(source, /publication\.(?:insert|create|publish)/i);
});
