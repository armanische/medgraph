import assert from "node:assert/strict";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  DefaultCandidateClaimBuilder,
  validateCandidateClaim,
} from "../../scripts/importers/catalog/claims.ts";
import {
  RuleBasedCharacteristicExtractor,
  validateCandidateCharacteristic,
} from "../../scripts/importers/catalog/extractor.ts";
import {
  DefaultConflictDetector,
  DefaultDocumentFinder,
  DefaultEvidenceBuilder,
  DefaultManufacturerResolver,
  DefaultMissingInformationDetector,
} from "../../scripts/importers/catalog/knowledge-engine.ts";
import {
  CompositeResearchProvider,
  DefaultSourceRanker,
  ManualSourceSeedResearchProvider,
  MockResearchProvider,
  NoNetworkResearchProvider,
  validateSourceCandidate,
} from "../../scripts/importers/catalog/providers.ts";
import { CatalogResearchManifest } from "../../scripts/importers/catalog/research-manifest.ts";
import {
  researchCatalogProducts,
  runCatalogResearch,
  validateCatalogProductsFile,
} from "../../scripts/importers/catalog/research.ts";
import {
  parseCatalogSeedText,
  stableCatalogSlug,
} from "../../scripts/importers/catalog/seed.ts";
import {
  CATALOG_SEED_WARNING,
  DRAFT_PRODUCT_WARNING,
  type CatalogSeedItem,
  type DocumentCandidate,
  type DocumentDownloader,
} from "../../scripts/importers/catalog/types.ts";

const FIXTURE = resolve(
  process.cwd(),
  "tests/fixtures/catalog/catalog-extract.txt",
);
const GENERATED_PRODUCTS = resolve(
  process.cwd(),
  "data/catalog-products.generated.json",
);
const AGGREGATE_REPORT = resolve(
  process.cwd(),
  "data/catalog-research-report.generated.json",
);

const noDownload: DocumentDownloader = {
  async download(document) {
    return document;
  },
};

function dependencies(
  provider: MockResearchProvider | NoNetworkResearchProvider,
) {
  return {
    provider,
    downloader: noDownload,
    extractor: new RuleBasedCharacteristicExtractor(),
    claimBuilder: new DefaultCandidateClaimBuilder(),
    generatedAt: "2026-07-06T00:00:00.000Z",
  };
}

async function fixtureSeed() {
  const text = await readFile(FIXTURE, "utf8");
  return parseCatalogSeedText(text, "Каталог Кибермедика.pdf");
}

function mockDocument(): DocumentCandidate & { extractionText: string } {
  return {
    documentType: "datasheet",
    title: "SLE 6000 Official Datasheet",
    url: "https://www.sle.co.uk/documents/sle6000.pdf",
    publisher: "sle.co.uk",
    mimeType: "application/pdf",
    sizeBytes: null,
    downloadedAt: null,
    sha256: null,
    artifactPath: null,
    sourceUrl: "https://www.sle.co.uk/documents/sle6000.pdf",
    status: "candidate",
    warnings: [],
    extractionText:
      "Manufacturer: SLE Ltd\nModel: SLE 6000\nDevice type: Ventilator\nWeight: 12 kg",
  };
}

function mockProvider() {
  return new MockResearchProvider(async (item: CatalogSeedItem) => {
    if (item.brandCandidate !== "SLE") {
      return { sources: [], documents: [], warnings: [] };
    }
    return {
      sources: [
        {
          sourceTitle: "SLE 6000 Official Datasheet",
          sourceUrl: "https://www.sle.co.uk/documents/sle6000.pdf",
          sourceType: "datasheet",
          publisher: "sle.co.uk",
          detectedManufacturer: "SLE",
          detectedModel: "SLE 6000",
          confidence: 0.95,
          rankScore: 95,
          reason: "Official manufacturer document.",
          discoveredAt: "2026-07-06T00:00:00.000Z",
          status: "candidate",
          warnings: [],
        },
      ],
      documents: [mockDocument()],
      warnings: [],
    };
  });
}

test("PDF catalog is seed-only and duplicate GE Logiq E9 remains detected", async () => {
  const result = await fixtureSeed();
  assert.equal(result.report.extractedPositions, 4);
  assert.equal(result.report.uniqueProducts, 3);
  assert.equal(result.report.suspectedDuplicates.length, 1);
  assert.match(
    result.report.suspectedDuplicates[0].canonicalKey,
    /gehealthcarelogiqe9/,
  );
  assert.equal(result.seed.source.warning, CATALOG_SEED_WARNING);
  assert.ok(result.seed.items.every((item) => item.status === "seed_only"));
});

test("slug generation is deterministic", () => {
  assert.equal(stableCatalogSlug("Аппарат ИВЛ SLE 6000"), "apparat-ivl-sle-6000");
});

test("manufacturer resolver identifies Hamilton and preserves ambiguity", async () => {
  const { seed } = await fixtureSeed();
  const resolver = new DefaultManufacturerResolver();
  const hamilton = resolver.resolve(
    {
      ...seed.items[0],
      normalizedTitle: "Hamilton C1",
      modelCandidate: "Hamilton C1",
    },
    [],
  );
  assert.equal(hamilton.selected?.name, "Hamilton Medical");
  assert.equal(hamilton.ambiguous, false);

  const ambiguous = resolver.resolve(
    {
      ...seed.items[0],
      normalizedTitle: "Hamilton C1 Mindray SV800",
      modelCandidate: null,
    },
    [],
  );
  assert.equal(ambiguous.selected, null);
  assert.equal(ambiguous.ambiguous, true);
});

test("source ranking prefers official sources", () => {
  const ranker = new DefaultSourceRanker();
  const base = {
    sourceTitle: "Source",
    sourceUrl: "https://example.org/source",
    publisher: "example.org",
    detectedManufacturer: null,
    detectedModel: null,
    confidence: 0.5,
    rankScore: 0,
    reason: "test",
    discoveredAt: "2026-07-06T00:00:00.000Z",
    status: "candidate" as const,
    warnings: [],
  };
  assert.equal(
    ranker.rank({ ...base, sourceType: "official_manufacturer" }),
    100,
  );
  assert.equal(ranker.rank({ ...base, sourceType: "regulatory_registry" }), 98);
  assert.equal(ranker.rank({ ...base, sourceType: "ifu" }), 96);
  assert.ok(
    ranker.rank({ ...base, sourceType: "official_manufacturer" }) >
      ranker.rank({ ...base, sourceType: "other" }),
  );
});

test("document finder ignores duplicate document URLs", () => {
  const document = mockDocument();
  const documents = new DefaultDocumentFinder().find({
    sources: [],
    documents: [document, { ...document }],
    warnings: [],
  });
  assert.equal(documents.length, 1);
});

test("NoNetwork provider preserves products as needs_source", async () => {
  const { seed } = await fixtureSeed();
  const result = await researchCatalogProducts(
    seed,
    dependencies(new NoNetworkResearchProvider()),
  );
  assert.ok(
    result.products.every((product) => product.researchStatus === "needs_source"),
  );
  assert.ok(result.products.every((product) => product.characteristics.length === 0));
  assert.ok(
    result.products.every((product) =>
      product.researchWarnings.some((warning) =>
        warning.includes("network restriction"),
      ),
    ),
  );
});

test("manual source seeds are used when search is unavailable", async () => {
  const { seed } = await fixtureSeed();
  const root = await mkdtemp(join(tmpdir(), "cybermedica-manual-seeds-"));
  const path = join(root, "source-seeds.manual.json");
  await writeFile(
    path,
    JSON.stringify({
      products: [{
        slug: seed.items[0].slug,
        officialSources: [{
          url: "https://www.hamilton-medical.com/c1-datasheet.pdf",
          sourceType: "datasheet",
          publisher: "Hamilton Medical",
          title: "Hamilton C1 Datasheet",
        }],
      }],
    }),
  );
  const result = await new ManualSourceSeedResearchProvider(path).discover(
    seed.items[0],
  );

  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].status, "candidate");
  assert.equal(result.documents.length, 1);
  assert.equal(result.documents[0].documentType, "datasheet");
});

test("source candidate requires URL and source type", () => {
  assert.throws(
    () =>
      validateSourceCandidate({
        sourceTitle: "Invalid",
        sourceUrl: "",
        sourceType: "other",
        publisher: "",
        detectedManufacturer: null,
        detectedModel: null,
        confidence: 0,
        rankScore: 0,
        reason: "",
        discoveredAt: "",
        status: "candidate",
        warnings: [],
      }),
    /sourceUrl/,
  );
});

test("characteristic requires sourceUrl and sourceTitle", () => {
  assert.throws(
    () =>
      validateCandidateCharacteristic({
        category: "weight",
        label: "Вес",
        value: "12",
        unit: "kg",
        rawText: "Weight: 12 kg",
        sourceUrl: "",
        sourceTitle: "",
        documentTitle: null,
        documentType: null,
        documentSha256: null,
        documentVersion: null,
        locator: {
          page: 1,
          section: null,
          heading: null,
          table: null,
          paragraph: 1,
        },
        extractionMethod: "rule_based",
        confidence: 0.8,
        status: "unverified",
        needsReview: true,
      }),
    /sourceUrl and sourceTitle/,
  );
});

test("candidate claim requires evidence and cannot auto-publish", () => {
  assert.throws(
    () =>
      validateCandidateClaim({
        claimId: "claim",
        productSlug: "product",
        subjectType: "product",
        suggestedClaimType: "product.weight",
        claimTypeCandidate: "product.weight",
        valuePayload: { value: "12", unit: "kg" },
        scopePayload: {},
        rawText: "Weight: 12 kg",
        evidenceCandidateIds: [],
        evidenceCandidates: [],
        confidence: 0.8,
        extractionMethod: "rule_based",
        status: "candidate",
        verificationStatus: "unverified",
        autoPublish: false,
        needsReview: true,
        warnings: [],
      }),
    /Evidence candidate/,
  );
});

test("mock provider produces documents, characteristics and candidate claims", async () => {
  const { seed } = await fixtureSeed();
  const result = await researchCatalogProducts(seed, dependencies(mockProvider()));
  const product = result.products.find((item) => item.brand === "SLE Ltd");
  assert.ok(product);
  assert.equal(product.status, "draft");
  assert.equal(product.warning, DRAFT_PRODUCT_WARNING);
  assert.equal(product.sourceCandidates.length, 1);
  assert.equal(product.documents.length, 1);
  assert.ok(product.characteristics.length >= 4);
  assert.equal(product.candidateClaimsCount, product.characteristics.length);
  assert.ok(product.readinessScore > 0);
  assert.ok(product.sourceQualityScore > 0);
  assert.ok(
    product.candidateClaims.every(
      (claim) =>
        claim.autoPublish === false &&
        claim.verificationStatus === "unverified" &&
        claim.evidenceCandidates.length > 0,
    ),
  );
  assert.ok(
    product.characteristics.every(
      (characteristic) =>
        characteristic.sourceUrl &&
        characteristic.sourceTitle &&
        characteristic.status === "unverified",
    ),
  );
  assert.ok(product.missingCharacteristics.length > 0);
});

test("evidence includes document hash, version, locator and confidence", () => {
  const evidence = new DefaultEvidenceBuilder().build({
    category: "weight",
    label: "Weight",
    value: "12",
    unit: "kg",
    rawText: "Weight: 12 kg",
    sourceUrl: "https://example.org/datasheet.pdf",
    sourceTitle: "Datasheet",
    documentTitle: "Datasheet",
    documentType: "datasheet",
    documentSha256: "a".repeat(64),
    documentVersion: `sha256:${"a".repeat(64)}`,
    locator: {
      page: 2,
      section: "Technical data",
      heading: "Dimensions",
      table: null,
      paragraph: 4,
    },
    extractionMethod: "pdf_text",
    confidence: 0.9,
    status: "unverified",
    needsReview: true,
  });
  assert.equal(evidence.sha256, "a".repeat(64));
  assert.equal(evidence.locator.page, 2);
  assert.equal(evidence.confidence, 0.9);
});

test("conflict and missing-information detectors never choose a value", async () => {
  const { seed } = await fixtureSeed();
  const characteristic = {
    category: "weight" as const,
    label: "Weight",
    unit: "kg",
    documentTitle: "Datasheet",
    documentType: "datasheet" as const,
    documentSha256: "a".repeat(64),
    documentVersion: `sha256:${"a".repeat(64)}`,
    locator: {
      page: 1,
      section: null,
      heading: null,
      table: null,
      paragraph: 1,
    },
    extractionMethod: "pdf_text" as const,
    confidence: 0.9,
    status: "unverified" as const,
    needsReview: true as const,
  };
  const conflicts = new DefaultConflictDetector().detect(seed.items[0], [
    {
      ...characteristic,
      value: "15",
      rawText: "Weight: 15 kg",
      sourceUrl: "https://example.org/v1.pdf",
      sourceTitle: "V1",
    },
    {
      ...characteristic,
      value: "17",
      rawText: "Weight: 17 kg",
      sourceUrl: "https://example.org/v2.pdf",
      sourceTitle: "V2",
    },
  ]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].resolution, null);
  assert.deepEqual(
    conflicts[0].values.map((value) => value.value),
    ["15", "17"],
  );
  const missing = new DefaultMissingInformationDetector().detect([]);
  assert.ok(missing.includes("weight"));
  assert.ok(missing.includes("dimensions"));
});

test("catalog research manifest is idempotent for the same SHA", async () => {
  const { seed } = await fixtureSeed();
  const root = await mkdtemp(join(tmpdir(), "catalog-manifest-test-"));
  const manifest = new CatalogResearchManifest(
    join(root, "import-manifest.json"),
  );
  const { extractionText: _extractionText, ...baseDocument } = mockDocument();
  void _extractionText;
  const document: DocumentCandidate = {
    ...baseDocument,
    mimeType: "application/pdf",
    sizeBytes: 100,
    downloadedAt: "2026-07-06T00:00:00.000Z",
    sha256: "b".repeat(64),
    artifactPath: `tmp/catalog-research/${"b".repeat(64)}.pdf`,
  };
  const input = {
    product: seed.items[0],
    sources: [],
    documents: [document],
    warnings: [],
  };
  const first = await manifest.record(input);
  const second = await manifest.record(input);
  assert.equal(first?.changed, true);
  assert.equal(second?.changed, false);
  assert.equal(second?.record.documentVersions.length, 1);
});

test("catalog text and search snippets are never copied into characteristics", async () => {
  const { seed } = await fixtureSeed();
  const provider = new MockResearchProvider(async () => ({
    sources: [
      {
        sourceTitle: "Search result",
        sourceUrl: "https://example.org/product",
        sourceType: "other",
        publisher: "example.org",
        detectedManufacturer: null,
        detectedModel: null,
        confidence: 0.2,
        rankScore: 40,
        reason: "Search snippet says Weight: 999 kg",
        discoveredAt: "2026-07-06T00:00:00.000Z",
        status: "candidate",
        warnings: [],
      },
    ],
    documents: [],
    warnings: [],
  }));
  const result = await researchCatalogProducts(seed, dependencies(provider));
  assert.ok(result.products.every((product) => product.characteristics.length === 0));
  assert.ok(
    !JSON.stringify(result.products).includes(
      "Оптимальный микроклимат",
    ),
  );
});

test("network failure does not crash the whole pipeline", async () => {
  const { seed } = await fixtureSeed();
  const provider = new MockResearchProvider(async () => {
    throw new Error("fetch failed");
  });
  const result = await researchCatalogProducts(seed, dependencies(provider));
  assert.equal(result.products.length, seed.items.length);
  assert.ok(
    result.products.every((product) => product.researchStatus === "needs_source"),
  );
});

test("generated research data and per-product reports exist", async () => {
  await runCatalogResearch({
    provider: new CompositeResearchProvider([
      new ManualSourceSeedResearchProvider(),
      new NoNetworkResearchProvider(),
    ]),
    generatedAt: "2026-07-06T00:00:00.000Z",
  });
  await access(GENERATED_PRODUCTS);
  await access(AGGREGATE_REPORT);
  const products = JSON.parse(await readFile(GENERATED_PRODUCTS, "utf8"));
  const aggregate = JSON.parse(await readFile(AGGREGATE_REPORT, "utf8"));
  assert.equal(products.products.length, aggregate.uniqueProducts);
  assert.equal(products.products.length, aggregate.totalProducts);
  assert.equal(products.products.length, aggregate.processedProducts);
  assert.equal(typeof aggregate.totalEvidenceCandidates, "number");
  assert.equal(typeof aggregate.totalCandidateClaims, "number");
  assert.equal(typeof aggregate.totalArtifactsCreated, "number");
  assert.equal(typeof products.products[0].readinessScore, "number");
  assert.equal(validateCatalogProductsFile(products), products);
  await access(
    resolve(
      process.cwd(),
      "data/research/products",
      `${products.products[0].slug}.research.json`,
    ),
  );
});

test("draft catalog UI never shows CyberMedica Verified for draft products", async () => {
  const files = await Promise.all(
    [
      "components/catalog/CatalogExplorer.tsx",
      "app/catalog/[slug]/page.tsx",
    ].map((file) => readFile(resolve(process.cwd(), file), "utf8")),
  );
  const source = files.join("\n");
  assert.doesNotMatch(source, /CyberMedica Verified|РУ · подтверждено|verified badge/i);
  assert.match(source, /Verification not performed|не прошла Verification/);
  assert.match(source, /candidate/i);
});

test("knowledge engine has no forbidden writes or publication", async () => {
  const importerSources = await Promise.all(
    [
      "research.ts",
      "providers.ts",
      "documents.ts",
      "extractor.ts",
      "claims.ts",
      "knowledge-engine.ts",
      "research-manifest.ts",
    ].map((file) =>
      readFile(
        resolve(process.cwd(), "scripts/importers/catalog", file),
        "utf8",
      ),
    ),
  );
  const source = importerSources.join("\n");
  assert.doesNotMatch(source, /public_api\.product_pages|service_role|supabase\.from/i);
  assert.doesNotMatch(source, /verificationStatus:\s*["']verified/i);
  assert.doesNotMatch(source, /autoPublish:\s*true/i);
  assert.doesNotMatch(source, /createPublication|publishClaim/i);
});
