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
  canSourceSupportPublication,
  discoverProduct,
  ManualSeedDiscoveryProvider,
  MockDiscoveryProvider,
  NoNetworkDiscoveryProvider,
  runDiscoveryForProducts,
  trustTierForSourceType,
  type DiscoveryProductInput,
  type DiscoveryProductReport,
  type SourceCandidate as DiscoverySourceCandidate,
} from "../../scripts/importers/catalog/discovery.ts";
import {
  classifyManufacturerDocumentLink,
  DefaultManufacturerDocumentLinkResolver,
} from "../../scripts/importers/catalog/document-link-resolver.ts";
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
  candidateClaimFromExtractedFact,
  runTrustedDocumentDownloadForReports,
  runTrustedDocumentExtractionForReports,
  type DocumentVersion,
  type ExtractedFactCandidate,
  type TrustedDocumentProductDownloadReport,
} from "../../scripts/importers/catalog/trusted-documents.ts";
import {
  buildReviewQueueForProduct,
  buildReviewQueueReports,
  reviewDecisionIsNotVerification,
  type ReviewDecision,
} from "../../scripts/importers/catalog/review-queue.ts";
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
const DOCUMENT_RESOLVER_FIXTURE_DIRECTORY = resolve(
  process.cwd(),
  "tests/fixtures/catalog/document-resolver",
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
        documentKey: null,
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
        claim.evidenceCandidateIds.length > 0,
    ),
  );
  assert.equal(product.evidenceCandidates.length, product.candidateClaims.length);
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
    documentKey: "catalog-research:example",
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
    documentKey: "catalog-research:example",
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
  const { seed, report: importReport } = await fixtureSeed();
  const root = await mkdtemp(join(tmpdir(), "catalog-research-output-"));
  const seedPath = join(root, "catalog-seed.generated.json");
  const productsPath = join(root, "catalog-products.generated.json");
  const importReportPath = join(root, "catalog-import-report.generated.json");
  const researchReportPath = join(root, "catalog-research-report.generated.json");
  const productReportDirectory = join(root, "research/products");
  await writeFile(seedPath, JSON.stringify(seed, null, 2));
  await writeFile(importReportPath, JSON.stringify(importReport, null, 2));
  await runCatalogResearch({
    provider: new CompositeResearchProvider([
      new ManualSourceSeedResearchProvider(),
      new NoNetworkResearchProvider(),
    ]),
    generatedAt: "2026-07-06T00:00:00.000Z",
    paths: {
      seedPath,
      productsPath,
      importReportPath,
      researchReportPath,
      productReportDirectory,
    },
  });
  await access(productsPath);
  await access(researchReportPath);
  const products = JSON.parse(await readFile(productsPath, "utf8"));
  const aggregate = JSON.parse(await readFile(researchReportPath, "utf8"));
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
      productReportDirectory,
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
      "discovery.ts",
      "document-link-resolver.ts",
      "trusted-documents.ts",
      "review-queue.ts",
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

const discoveryProduct: DiscoveryProductInput = {
  productSlug: "apparat-ivl-hamilton-t1",
  manufacturer: "Hamilton Medical",
  productName: "Аппарат ИВЛ Hamilton T1",
  model: "Hamilton T1",
  category: "Реанимационное оборудование",
};

function discoverySource(
  overrides: Partial<DiscoverySourceCandidate> = {},
): DiscoverySourceCandidate {
  return {
    sourceId: "source_hamilton_t1",
    productSlug: discoveryProduct.productSlug,
    manufacturer: discoveryProduct.manufacturer,
    productName: discoveryProduct.productName,
    sourceType: "official_manufacturer_page",
    url: "https://www.hamilton-medical.com/de_CH/Prehospital-transport/Products/HAMILTON-T1.html",
    title: "HAMILTON-T1 official product page",
    snippet: "Official product page candidate.",
    discoveredBy: "test",
    confidence: 0.92,
    trustTier: 1,
    requiresHumanReview: true,
    reasons: ["test candidate", "snippet is not evidence"],
    ...overrides,
  };
}

async function resolverForFixture(fileName: string) {
  const html = await readFile(
    join(DOCUMENT_RESOLVER_FIXTURE_DIRECTORY, fileName),
    "utf8",
  );
  return new DefaultManufacturerDocumentLinkResolver({
    fetchImplementation: (async () =>
      new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      })) as typeof fetch,
  });
}

test("discovery official manufacturer page receives trust tier 1", () => {
  assert.equal(trustTierForSourceType("official_manufacturer_page"), 1);
  assert.equal(trustTierForSourceType("manufacturer_document"), 1);
  assert.equal(trustTierForSourceType("regulator_record"), 1);
});

test("discovery distributor page cannot become publication source", () => {
  const source = discoverySource({
    sourceType: "distributor_page",
    url: "https://dealer.example.org/hamilton-t1",
    trustTier: 3,
    confidence: 0.45,
  });
  assert.equal(canSourceSupportPublication(source), false);
});

test("discovery missing required document creates MissingDocumentTask", async () => {
  const report = await discoverProduct(
    discoveryProduct,
    new MockDiscoveryProvider({
      sources: async () => [discoverySource()],
      documents: async () => [],
    }),
  );
  assert.equal(report.missingDocumentTasks.length, 3);
  assert.ok(
    report.missingDocumentTasks.some(
      (task) => task.requiredDocumentType === "registration_certificate",
    ),
  );
  assert.equal(report.readiness.hasRequiredDocuments, false);
  assert.equal(report.readiness.canProceedToExtraction, false);
});

test("discovery duplicate URLs are deduplicated", async () => {
  const source = discoverySource();
  const report = await discoverProduct(
    discoveryProduct,
    new MockDiscoveryProvider({
      sources: async () => [source, { ...source }],
      documents: async () => [
        {
          documentId: "doc_a",
          sourceId: source.sourceId,
          productSlug: source.productSlug,
          documentType: "datasheet",
          url: "https://www.hamilton-medical.com/t1-datasheet.pdf",
          title: "HAMILTON-T1 Datasheet",
          language: "en",
          confidence: 0.92,
          trustTier: 1,
          requiresHumanReview: true,
          reasons: ["test"],
        },
        {
          documentId: "doc_b",
          sourceId: source.sourceId,
          productSlug: source.productSlug,
          documentType: "datasheet",
          url: "https://www.hamilton-medical.com/t1-datasheet.pdf",
          title: "HAMILTON-T1 Datasheet duplicate",
          language: "en",
          confidence: 0.92,
          trustTier: 1,
          requiresHumanReview: true,
          reasons: ["test"],
        },
      ],
    }),
  );
  assert.equal(report.sourceCandidates.length, 1);
  assert.equal(report.documentCandidates.length, 1);
});

test("discovery no-network provider creates blocked needs_source without fake data", async () => {
  const report = await discoverProduct(
    discoveryProduct,
    new NoNetworkDiscoveryProvider(),
  );
  assert.equal(report.sourceCandidates.length, 0);
  assert.equal(report.documentCandidates.length, 0);
  assert.equal(report.readiness.canProceedToExtraction, false);
  assert.ok(report.warnings.some((warning) => warning.includes("needs_source")));
});

test("manual discovery seeds produce deterministic report", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-discovery-seeds-"));
  const seedPath = join(root, "source-seeds.manual.json");
  await writeFile(
    seedPath,
    JSON.stringify({
      products: [
        {
          slug: discoveryProduct.productSlug,
          officialSources: [
            {
              url: "https://www.hamilton-medical.com/de_CH/Prehospital-transport/Products/HAMILTON-T1.html",
              sourceType: "official_manufacturer_page",
              publisher: "Hamilton Medical",
              title: "HAMILTON-T1 official product page",
              trustTier: 1,
              documents: [
                {
                  url: "https://www.hamilton-medical.com/t1-datasheet.pdf",
                  documentType: "datasheet",
                  title: "HAMILTON-T1 Datasheet",
                  language: "en",
                },
              ],
            },
          ],
        },
      ],
    }),
  );
  const first = await discoverProduct(
    discoveryProduct,
    new ManualSeedDiscoveryProvider(seedPath),
  );
  const second = await discoverProduct(
    discoveryProduct,
    new ManualSeedDiscoveryProvider(seedPath),
  );
  assert.deepEqual(first, second);
  assert.equal(first.sourceCandidates.length, 1);
  assert.equal(first.documentCandidates.length, 1);
});

test("discovery commands are idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-discovery-output-"));
  const productReportDirectory = join(root, "products");
  const aggregateReportPath = join(root, "discovery-report.generated.json");
  const provider = new MockDiscoveryProvider({
    sources: async () => [discoverySource()],
    documents: async (source) => [
      {
        documentId: "doc_datasheet",
        sourceId: source.sourceId,
        productSlug: source.productSlug,
        documentType: "datasheet",
        url: "https://www.hamilton-medical.com/t1-datasheet.pdf",
        title: "HAMILTON-T1 Datasheet",
        language: "en",
        confidence: 0.92,
        trustTier: 1,
        requiresHumanReview: true,
        reasons: ["test"],
      },
    ],
  });
  await runDiscoveryForProducts({
    products: [discoveryProduct],
    provider,
    resolver: null,
    productReportDirectory,
    aggregateReportPath,
  });
  const first = await readFile(aggregateReportPath, "utf8");
  await runDiscoveryForProducts({
    products: [discoveryProduct],
    provider,
    resolver: null,
    productReportDirectory,
    aggregateReportPath,
  });
  const second = await readFile(aggregateReportPath, "utf8");
  assert.equal(first, second);
});

test("manufacturer resolver turns direct PDF links into DocumentCandidates", async () => {
  const resolver = await resolverForFixture("direct-pdf.html");
  const result = await resolver.resolve(discoverySource());

  assert.equal(result.links.length, 3);
  assert.ok(
    result.links.some(
      (link) =>
        link.documentCandidate.documentType === "user_manual" &&
        link.documentCandidate.url ===
          "https://www.hamilton-medical.com/downloads/hamilton-t1-user-manual.pdf",
    ),
  );
  assert.ok(
    result.links.every(
      (link) =>
        link.documentCandidate.trustTier === 1 &&
        link.documentCandidate.requiresHumanReview === true,
    ),
  );
});

test("manufacturer resolver normalizes relative PDF links", async () => {
  const resolver = await resolverForFixture("relative-links.html");
  const result = await resolver.resolve(discoverySource());

  assert.ok(
    result.links.some(
      (link) =>
        link.documentCandidate.documentType === "brochure" &&
        link.documentCandidate.url ===
          "https://www.hamilton-medical.com/documents/hamilton-t1-brochure.pdf",
    ),
  );
  assert.ok(
    result.links.some(
      (link) =>
        link.documentCandidate.documentType === "service_manual" &&
        link.documentCandidate.url ===
          "https://www.hamilton-medical.com/de_CH/Prehospital-transport/downloads/hamilton-t1-service-manual.pdf",
    ),
  );
});

test("manufacturer document classifier is conservative", () => {
  assert.equal(
    classifyManufacturerDocumentLink({
      url: "https://www.hamilton-medical.com/manual.pdf",
      linkText: "User manual",
    }).documentType,
    "user_manual",
  );
  assert.equal(
    classifyManufacturerDocumentLink({
      url: "https://www.hamilton-medical.com/doc.pdf?type=ifu",
      linkText: "Instructions for use",
    }).documentType,
    "ifu",
  );
  assert.equal(
    classifyManufacturerDocumentLink({
      url: "https://www.hamilton-medical.com/specification.pdf",
      linkText: "Technical specifications",
    }).documentType,
    "datasheet",
  );
  assert.equal(
    classifyManufacturerDocumentLink({
      url: "https://www.hamilton-medical.com/brochure.pdf",
      linkText: "Brochure",
    }).documentType,
    "brochure",
  );
  assert.equal(
    classifyManufacturerDocumentLink({
      url: "https://www.hamilton-medical.com/file.pdf",
      linkText: "Download",
    }).documentType,
    "unknown",
  );
});

test("manufacturer resolver reads document links from download buttons", async () => {
  const resolver = await resolverForFixture("download-buttons.html");
  const result = await resolver.resolve(discoverySource());

  assert.equal(result.links.length, 2);
  assert.ok(
    result.links.some(
      (link) => link.documentCandidate.documentType === "datasheet",
    ),
  );
  assert.ok(
    result.links.some(
      (link) => link.documentCandidate.documentType === "certificate",
    ),
  );
});

test("manufacturer resolver rejects offsite untrusted PDFs", async () => {
  const resolver = await resolverForFixture("offsite-untrusted.html");
  const result = await resolver.resolve(discoverySource());

  assert.equal(result.links.length, 0);
  assert.ok(
    result.warnings.some((warning) => warning.includes("offsite document URL")),
  );
});

test("manufacturer resolver creates no fake documents when no links are found", async () => {
  const resolver = await resolverForFixture("non-document-links.html");
  const result = await resolver.resolve(discoverySource());

  assert.equal(result.links.length, 0);
  assert.ok(result.warnings.some((warning) => warning.includes("no document links")));
});

test("discovery integrates resolved document links and dedupes URLs", async () => {
  const resolver = await resolverForFixture("same-host-mixed.html");
  const source = discoverySource({
    manufacturer: "Ambu",
    url: "https://www.ambu.com/endoscopy/pulmonology/bronchoscopes/product/ascope-5-broncho",
  });
  const report = await discoverProduct(
    discoveryProduct,
    new MockDiscoveryProvider({
      sources: async () => [source],
      documents: async () => [
        {
          documentId: "manual_seed_doc",
          sourceId: source.sourceId,
          productSlug: source.productSlug,
          documentType: "user_manual",
          url: "https://www.ambu.com/downloads/ascope-5-user-manual.pdf",
          title: "Manual from seed",
          language: "en",
          confidence: 0.92,
          trustTier: 1,
          requiresHumanReview: true,
          reasons: ["test"],
        },
      ],
    }),
    resolver,
  );

  assert.equal(report.resolvedDocumentLinks.length, 3);
  assert.equal(report.documentCandidates.length, 3);
  assert.ok(
    report.documentCandidates.some(
      (document) => document.documentType === "certificate",
    ),
  );
});

function trustedDiscoveryReport(
  documents: DiscoveryProductReport["documentCandidates"],
): DiscoveryProductReport {
  return {
    product: discoveryProduct,
    sourceCandidates: [discoverySource()],
    documentCandidates: documents,
    resolvedDocumentLinks: [],
    resolverWarnings: [],
    missingDocumentTasks: [],
    trustSummary: {
      tier1: documents.filter((document) => document.trustTier === 1).length,
      tier2: documents.filter((document) => document.trustTier === 2).length,
      tier3: documents.filter((document) => document.trustTier === 3).length,
      tier4: documents.filter((document) => document.trustTier === 4).length,
      canUseForPublication: documents.filter((document) => document.trustTier <= 2)
        .length,
      cannotUseForPublication: documents.filter(
        (document) => document.trustTier >= 3,
      ).length,
    },
    readiness: {
      hasOfficialManufacturerPage: true,
      hasRegulatorRecord: false,
      hasRequiredDocuments: true,
      canProceedToExtraction: documents.length > 0,
    },
    warnings: [],
  };
}

function trustedDocument(
  overrides: Partial<DiscoveryProductReport["documentCandidates"][number]> = {},
): DiscoveryProductReport["documentCandidates"][number] {
  return {
    documentId: overrides.documentId ?? "doc_hamilton_t1_datasheet",
    sourceId: overrides.sourceId ?? "source_hamilton_t1",
    productSlug: discoveryProduct.productSlug,
    documentType: overrides.documentType ?? "datasheet",
    url: overrides.url ?? "https://www.hamilton-medical.com/t1-datasheet.pdf",
    title: overrides.title ?? "HAMILTON-T1 Datasheet",
    language: overrides.language ?? "en",
    confidence: overrides.confidence ?? 0.92,
    trustTier: overrides.trustTier ?? 1,
    requiresHumanReview: true,
    reasons: overrides.reasons ?? ["test"],
  };
}

async function trustedDownloadRun(
  documents: DiscoveryProductReport["documentCandidates"],
  fetchImplementation: typeof fetch,
) {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-trusted-docs-"));
  return runTrustedDocumentDownloadForReports({
    discoveryReports: [trustedDiscoveryReport(documents)],
    productReportDirectory: join(root, "documents/products"),
    aggregateReportPath: join(root, "documents/download-report.generated.json"),
    artifactStoreRoot: join(root, "artifacts"),
    fetchImplementation,
  });
}

test("trusted document download only processes allowed trust tiers", async () => {
  let fetches = 0;
  const result = await trustedDownloadRun(
    [
      trustedDocument(),
      trustedDocument({
        documentId: "doc_dealer",
        url: "https://dealer.example.org/t1.pdf",
        trustTier: 3,
      }),
    ],
    (async () => {
      fetches += 1;
      return new Response(Buffer.from("%PDF-1.7\ntrusted"), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as typeof fetch,
  );

  assert.equal(fetches, 1);
  assert.equal(result.aggregate.attemptedDownloads, 1);
  assert.equal(result.aggregate.downloadedArtifacts, 1);
  assert.equal(result.aggregate.skippedDocuments, 1);
});

test("trusted document download rejects invalid PDF bytes", async () => {
  const result = await trustedDownloadRun(
    [trustedDocument()],
    (async () =>
      new Response("not a pdf", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })) as typeof fetch,
  );

  assert.equal(result.aggregate.attemptedDownloads, 1);
  assert.equal(result.aggregate.downloadedArtifacts, 0);
  assert.equal(result.aggregate.failedDownloads, 1);
  assert.match(
    result.productReports[0].failedDownloads[0].reason,
    /PDF signature/i,
  );
});

test("trusted document download deduplicates duplicate document URLs", async () => {
  let fetches = 0;
  const duplicate = trustedDocument({ documentId: "doc_duplicate" });
  const result = await trustedDownloadRun(
    [trustedDocument(), duplicate],
    (async () => {
      fetches += 1;
      return new Response(Buffer.from("%PDF-1.7\ntrusted"), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as typeof fetch,
  );

  assert.equal(fetches, 1);
  assert.equal(result.aggregate.attemptedDownloads, 1);
  assert.equal(result.aggregate.documentVersions, 1);
});

test("trusted document download is idempotent for reused hashes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-trusted-idempotent-"));
  const options = {
    discoveryReports: [trustedDiscoveryReport([trustedDocument()])],
    productReportDirectory: join(root, "documents/products"),
    aggregateReportPath: join(root, "documents/download-report.generated.json"),
    artifactStoreRoot: join(root, "artifacts"),
    fetchImplementation: (async () =>
      new Response(Buffer.from("%PDF-1.7\nsame bytes"), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      })) as typeof fetch,
  };
  await runTrustedDocumentDownloadForReports(options);
  const first = await readFile(options.aggregateReportPath, "utf8");
  await runTrustedDocumentDownloadForReports(options);
  const second = await readFile(options.aggregateReportPath, "utf8");
  assert.equal(first, second);
});

test("trusted document failed download does not fail whole run", async () => {
  const result = await trustedDownloadRun(
    [
      trustedDocument({
        documentId: "doc_ok",
        url: "https://www.hamilton-medical.com/ok.pdf",
      }),
      trustedDocument({
        documentId: "doc_missing",
        url: "https://www.hamilton-medical.com/missing.pdf",
      }),
    ],
    (async (url: string | URL | Request) => {
      if (String(url).includes("missing")) {
        return new Response("missing", { status: 404 });
      }
      return new Response(Buffer.from("%PDF-1.7\nok"), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    }) as typeof fetch,
  );

  assert.equal(result.aggregate.attemptedDownloads, 2);
  assert.equal(result.aggregate.downloadedArtifacts, 1);
  assert.equal(result.aggregate.failedDownloads, 1);
});

function trustedDocumentVersion(overrides: Partial<DocumentVersion> = {}) {
  return {
    versionId: "document_version_test",
    documentCandidateId: "doc_hamilton_t1_datasheet",
    sourceId: "source_hamilton_t1",
    productSlug: discoveryProduct.productSlug,
    documentKey: "trusted-document:doc_hamilton_t1_datasheet",
    documentType: "datasheet" as const,
    title: "HAMILTON-T1 Datasheet",
    language: "en",
    sourceUrl: "https://www.hamilton-medical.com/t1-datasheet.pdf",
    sha256: "a".repeat(64),
    contentType: "application/pdf",
    byteSize: 128,
    filePath: "data/research/artifacts/test.pdf",
    trustTier: 1 as const,
    requiresHumanReview: true as const,
    status: "candidate" as const,
    ...overrides,
  } satisfies DocumentVersion;
}

function trustedDownloadReport(
  versions: DocumentVersion[],
): TrustedDocumentProductDownloadReport {
  return {
    product: discoveryProduct,
    attemptedDownloads: [],
    downloadedArtifacts: [],
    failedDownloads: [],
    skippedDocuments: [],
    documentVersions: versions,
    warnings: [],
    readiness: {
      hasDownloadedDocuments: versions.length > 0,
      hasExtractedText: false,
      hasCandidateClaims: false,
      canProceedToReview: false,
    },
  };
}

test("trusted extraction creates fact candidates and unverified candidate claims", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-trusted-extract-"));
  const result = await runTrustedDocumentExtractionForReports({
    downloadReports: [trustedDownloadReport([trustedDocumentVersion()])],
    productReportDirectory: join(root, "extraction/products"),
    aggregateReportPath: join(root, "extraction/extraction-report.generated.json"),
    textExtractor: async () =>
      [
        "Manufacturer: Hamilton Medical",
        "Model: HAMILTON-T1",
        "Registration number: RU-TEST-001",
        "Weight: 6.5 kg",
      ].join("\n"),
  });
  const productReport = result.productReports[0];

  assert.ok(
    productReport.extractedFactCandidates.some(
      (fact) => fact.factType === "product.manufacturer",
    ),
  );
  assert.ok(
    productReport.extractedFactCandidates.some(
      (fact) => fact.factType === "product.registrationNumber",
    ),
  );
  assert.ok(productReport.candidateClaims.length > 0);
  assert.ok(
    productReport.candidateClaims.every(
      (claim) =>
        claim.autoPublish === false &&
        claim.verificationStatus === "unverified" &&
        claim.evidenceCandidateIds.length > 0,
    ),
  );
});

test("trusted extraction fact without evidence does not create CandidateClaim", () => {
  const fact: ExtractedFactCandidate = {
    factCandidateId: "fact_without_evidence",
    productSlug: discoveryProduct.productSlug,
    factType: "product.model",
    label: "Модель",
    value: "HAMILTON-T1",
    unit: null,
    rawText: "Model: HAMILTON-T1",
    documentVersionId: "document_version_test",
    documentCandidateId: "doc_test",
    documentSha256: "",
    sourceUrl: "https://www.hamilton-medical.com/t1.pdf",
    locator: {
      page: 1,
      section: null,
      heading: null,
      table: null,
      paragraph: 1,
    },
    evidenceCandidateId: null,
    confidence: 0.8,
    extractionMethod: "rule_based",
    status: "candidate",
    verificationStatus: "unverified",
    autoPublish: false,
    requiresHumanReview: true,
    warnings: [],
  };

  assert.equal(candidateClaimFromExtractedFact(fact), null);
});

function reviewExtractionReport(overrides: {
  claimType?: string;
  evidenceIds?: string[];
  documentVersions?: DocumentVersion[];
} = {}) {
  const version = trustedDocumentVersion();
  const evidenceId = "evidence_review_test";
  return {
    product: discoveryProduct,
    documentVersions: overrides.documentVersions ?? [version],
    extractedFactCandidates: [],
    evidenceCandidates: [
      {
        evidenceCandidateId: evidenceId,
        kind: "document_excerpt" as const,
        documentVersionId: version.versionId,
        documentCandidateId: version.documentCandidateId,
        sha256: version.sha256,
        sourceUrl: version.sourceUrl,
        locator: {
          page: 1,
          section: null,
          heading: null,
          table: null,
          paragraph: 1,
        },
        quotedText: "Compatibility: test circuit",
        status: "candidate" as const,
        requiresHumanReview: true as const,
      },
    ],
    candidateClaims: [
      {
        claimId: "claim_review_test",
        productSlug: discoveryProduct.productSlug,
        subjectType: "product" as const,
        suggestedClaimType: overrides.claimType ?? "product.compatibility",
        valuePayload: { value: "test circuit", unit: null },
        rawText: "Compatibility: test circuit",
        evidenceCandidateIds: overrides.evidenceIds ?? [evidenceId],
        confidence: 0.8,
        extractionMethod: "rule_based" as const,
        status: "candidate" as const,
        verificationStatus: "unverified" as const,
        autoPublish: false as const,
        requiresHumanReview: true as const,
        warnings: ["Candidate claim handoff only."],
      },
    ],
    warnings: [],
    readiness: {
      hasDownloadedDocuments: true,
      hasExtractedText: true,
      hasCandidateClaims: true,
      canProceedToReview: true,
    },
  };
}

test("review queue creates item for CandidateClaim with evidence", () => {
  const report = buildReviewQueueForProduct(reviewExtractionReport());

  assert.equal(report.reviewItems.length, 1);
  assert.equal(report.reviewItems[0].status, "pending_review");
  assert.equal(report.reviewItems[0].evidenceCandidateIds.length, 1);
  assert.equal(report.reviewItems[0].documentVersionIds.length, 1);
  assert.equal(report.reviewItems[0].reviewerNotes, null);
});

test("review queue skips CandidateClaim without evidence with warning", () => {
  const report = buildReviewQueueForProduct(
    reviewExtractionReport({ evidenceIds: [] }),
  );

  assert.equal(report.reviewItems.length, 0);
  assert.equal(report.missingEvidence.length, 1);
  assert.ok(report.warnings.some((warning) => warning.includes("skipped")));
});

test("review queue assigns high priority to high-risk claim types", () => {
  const report = buildReviewQueueForProduct(
    reviewExtractionReport({ claimType: "product.safety.warning" }),
  );

  assert.equal(report.reviewItems[0].priority, "critical");
  assert.equal(report.reviewItems[0].riskLevel, "high");
});

test("review queue keeps missing document version pending with reason", () => {
  const report = buildReviewQueueForProduct(
    reviewExtractionReport({ documentVersions: [] }),
  );

  assert.equal(report.reviewItems.length, 1);
  assert.equal(report.reviewItems[0].status, "pending_review");
  assert.equal(report.reviewItems[0].documentVersionIds.length, 0);
  assert.ok(
    report.reviewItems[0].reasons.some((reason) =>
      reason.includes("No DocumentVersion"),
    ),
  );
});

test("review queue builder is idempotent and writes product reports", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-review-queue-"));
  const options = {
    extractionReports: [reviewExtractionReport()],
    productReportDirectory: join(root, "review/products"),
    aggregateReportPath: join(root, "review/review-queue.generated.json"),
  };
  await buildReviewQueueReports(options);
  const first = await readFile(options.aggregateReportPath, "utf8");
  await access(
    join(options.productReportDirectory, `${discoveryProduct.productSlug}.json`),
  );
  await buildReviewQueueReports(options);
  const second = await readFile(options.aggregateReportPath, "utf8");

  assert.equal(first, second);
});

test("review queue aggregate metrics are correct", async () => {
  const root = await mkdtemp(join(tmpdir(), "cybermedica-review-metrics-"));
  const result = await buildReviewQueueReports({
    extractionReports: [
      reviewExtractionReport(),
      reviewExtractionReport({ evidenceIds: [] }),
    ],
    productReportDirectory: join(root, "review/products"),
    aggregateReportPath: join(root, "review/review-queue.generated.json"),
  });

  assert.equal(result.aggregate.totalItems, 1);
  assert.equal(result.aggregate.pendingReview, 1);
  assert.equal(result.aggregate.highPriority, 1);
  assert.equal(result.aggregate.missingEvidence, 1);
  assert.equal(result.aggregate.conflicts, 0);
  assert.equal(result.aggregate.readyForHumanReview, 1);
});

test("ReviewDecision approve does not create Verified Claim", () => {
  const decision: ReviewDecision = {
    decisionId: "decision_test",
    reviewItemId: "review_item_test",
    decision: "approve",
    reviewer: "reviewer@example.org",
    notes: "Looks ready for Verification handoff.",
    decidedAt: "2026-07-09T00:00:00.000Z",
  };

  assert.deepEqual(reviewDecisionIsNotVerification(decision), decision);
  assert.doesNotMatch(JSON.stringify(decision), /verified|publish/i);
});
