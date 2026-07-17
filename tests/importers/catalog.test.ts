import assert from "node:assert/strict";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  validateCandidateCharacteristic,
} from "../../scripts/importers/catalog/extractor.ts";
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
  DefaultSourceRanker,
  ManualSourceSeedResearchProvider,
  validateSourceCandidate,
} from "../../scripts/importers/catalog/providers.ts";
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
  processReviewDecisions,
  reviewDecisionIsNotVerification,
  type ReviewDecision,
} from "../../scripts/importers/catalog/review-queue.ts";
import {
  CATALOG_SEED_WARNING,
} from "../../scripts/importers/catalog/types.ts";

const FIXTURE = resolve(
  process.cwd(),
  "tests/fixtures/catalog/catalog-extract.txt",
);
const DOCUMENT_RESOLVER_FIXTURE_DIRECTORY = resolve(
  process.cwd(),
  "tests/fixtures/catalog/document-resolver",
);

async function fixtureSeed() {
  const text = await readFile(FIXTURE, "utf8");
  return parseCatalogSeedText(text, "Каталог Кибермедика.pdf");
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

test("storefront product UI contains no internal verification state", async () => {
  const files = await Promise.all(
    ["app/catalog/[slug]/page.tsx"].map((file) =>
      readFile(resolve(process.cwd(), file), "utf8"),
    ),
  );
  const source = files.join("\n");
  assert.doesNotMatch(source, /CyberMedica Verified|РУ · подтверждено|verified badge/i);
  assert.doesNotMatch(source, /candidate|evidence|readiness|coverage/i);
});

test("active catalog importers have no forbidden writes or publication", async () => {
  const importerSources = await Promise.all(
    [
      "providers.ts",
      "documents.ts",
      "extractor.ts",
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

test("manufacturer adapters classify Mindray resources with resolver confidence", async () => {
  const resolver = await resolverForFixture("mindray-resources.html");
  const result = await resolver.resolve(
    discoverySource({
      manufacturer: "Mindray",
      url: "https://www.mindray.com/en/products/anesthesia/a7",
      title: "A7 official product page",
    }),
  );

  assert.equal(result.links.length, 2);
  assert.ok(result.warnings.some((warning) => warning.includes("adapter used: mindray")));
  assert.ok(
    result.links.some((link) =>
      link.documentCandidate.reasons.some((reason) =>
        reason.includes("resolver_document_label:Safety Information"),
      ),
    ),
  );
  assert.ok(
    result.links.every((link) =>
      link.documentCandidate.reasons.some((reason) =>
        /^resolver_confidence:\d+/u.test(reason),
      ),
    ),
  );
});

test("manufacturer resolver follows retry chain to resources pages and dedupes", async () => {
  const productHtml = await readFile(
    join(DOCUMENT_RESOLVER_FIXTURE_DIRECTORY, "retry-product.html"),
    "utf8",
  );
  const resourcesHtml = await readFile(
    join(DOCUMENT_RESOLVER_FIXTURE_DIRECTORY, "retry-resources.html"),
    "utf8",
  );
  const resolver = new DefaultManufacturerDocumentLinkResolver({
    fetchImplementation: (async (input) => {
      const url = String(input);
      return new Response(
        url.includes("/resources") ? resourcesHtml : productHtml,
        {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }) as typeof fetch,
  });
  const result = await resolver.resolve(
    discoverySource({
      manufacturer: "Mindray",
      url: "https://www.mindray.com/en/products/anesthesia/a7",
      title: "A7 official product page",
    }),
  );

  assert.equal(result.links.length, 2);
  assert.ok(
    result.links.some(
      (link) =>
        link.documentCandidate.url ===
        "https://www.mindray.com/en/downloads/a7-safety-performance.pdf",
    ),
  );
  assert.ok(
    result.warnings.some((warning) => warning.includes("duplicatesRemoved=1")),
  );
  assert.ok(result.warnings.some((warning) => warning.includes("attempts=2")));
});

test("Ambu adapter resolves IFU and quick guide candidates", async () => {
  const resolver = await resolverForFixture("ambu-ifu.html");
  const result = await resolver.resolve(
    discoverySource({
      manufacturer: "Ambu",
      url: "https://www.ambu.com/endoscopy/pulmonology/bronchoscopes/product/ascope-5-broncho",
      title: "Ambu aScope 5 Broncho official product page",
    }),
  );

  assert.equal(result.links.length, 2);
  assert.ok(result.warnings.some((warning) => warning.includes("adapter used: ambu")));
  assert.ok(
    result.links.some((link) => link.documentCandidate.documentType === "ifu"),
  );
  assert.ok(
    result.links.some(
      (link) =>
        link.documentCandidate.documentType === "user_manual" &&
        link.documentCandidate.reasons.some((reason) =>
          reason.includes("resolver_document_label:Quick Guide"),
        ),
    ),
  );
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
    providerDiagnostics: {
      providerName: "hamilton",
      strategyUsed: "test fixture",
      pagesVisited: [],
      candidateUrls: [],
      normalizedUrls: [],
      duplicatesRemoved: 0,
      blockedUrls: [],
      unsupportedPortals: [],
      warnings: [],
    },
    providerSelectedAutomatically: true,
    fallbackProviderUsed: false,
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
    source: "test_fixture",
  };

  assert.deepEqual(reviewDecisionIsNotVerification(decision), decision);
  assert.doesNotMatch(JSON.stringify(decision), /verified|publish/i);
});

test("review decision links valid decision to queue item", () => {
  const item = buildReviewQueueForProduct(reviewExtractionReport()).reviewItems[0];
  const report = processReviewDecisions({
    queueItems: [item],
    decisions: [
      {
        decisionId: "decision_valid",
        reviewItemId: item.reviewItemId,
        decision: "approve",
        reviewer: "reviewer@example.org",
        notes: "",
        decidedAt: "2026-07-09T00:00:00.000Z",
        source: "test_fixture",
      },
    ],
  });

  assert.equal(report.summary.totalDecisions, 1);
  assert.equal(report.summary.approved, 1);
  assert.equal(report.invalidDecisions.length, 0);
  assert.equal(report.queueItemsWithDecision[0].reviewItemId, item.reviewItemId);
});

test("review decision with unknown reviewItemId is invalid", () => {
  const item = buildReviewQueueForProduct(reviewExtractionReport()).reviewItems[0];
  const report = processReviewDecisions({
    queueItems: [item],
    decisions: [
      {
        decisionId: "decision_unknown",
        reviewItemId: "review_item_missing",
        decision: "approve",
        reviewer: "reviewer@example.org",
        notes: "",
        decidedAt: "2026-07-09T00:00:00.000Z",
        source: "test_fixture",
      },
    ],
  });

  assert.equal(report.summary.totalDecisions, 0);
  assert.equal(report.invalidDecisions.length, 1);
  assert.equal(report.summary.decisionsWithoutQueueItem, 1);
});

test("duplicate review decision is not silently accepted", () => {
  const item = buildReviewQueueForProduct(reviewExtractionReport()).reviewItems[0];
  const baseDecision = {
    reviewItemId: item.reviewItemId,
    decision: "approve",
    reviewer: "reviewer@example.org",
    notes: "",
    decidedAt: "2026-07-09T00:00:00.000Z",
    source: "test_fixture",
  };
  const report = processReviewDecisions({
    queueItems: [item],
    decisions: [
      { ...baseDecision, decisionId: "decision_one" },
      { ...baseDecision, decisionId: "decision_two" },
    ],
  });

  assert.equal(report.summary.totalDecisions, 0);
  assert.equal(report.invalidDecisions.length, 2);
  assert.ok(report.warnings.some((warning) => warning.includes("Duplicate")));
});

test("reject and request more evidence decisions require notes", () => {
  const item = buildReviewQueueForProduct(reviewExtractionReport()).reviewItems[0];
  const report = processReviewDecisions({
    queueItems: [item],
    decisions: [
      {
        decisionId: "decision_reject_without_notes",
        reviewItemId: item.reviewItemId,
        decision: "reject",
        reviewer: "reviewer@example.org",
        notes: "",
        decidedAt: "2026-07-09T00:00:00.000Z",
        source: "test_fixture",
      },
    ],
  });

  assert.equal(report.summary.totalDecisions, 0);
  assert.equal(report.invalidDecisions.length, 1);
  assert.ok(report.invalidDecisions[0].reasons.some((reason) => reason.includes("Notes")));
});

test("review decision report is idempotent and creates no publication artifacts", () => {
  const item = buildReviewQueueForProduct(reviewExtractionReport()).reviewItems[0];
  const decisions = [
    {
      decisionId: "decision_idempotent",
      reviewItemId: item.reviewItemId,
      decision: "approve",
      reviewer: "reviewer@example.org",
      notes: "",
      decidedAt: "2026-07-09T00:00:00.000Z",
      source: "test_fixture",
    },
  ];
  const first = processReviewDecisions({ queueItems: [item], decisions });
  const second = processReviewDecisions({ queueItems: [item], decisions });

  assert.deepEqual(first, second);
  assert.equal(Object.hasOwn(first, "verifiedClaims"), false);
  assert.equal(Object.hasOwn(first, "publications"), false);
  assert.equal(Object.hasOwn(first, "public_api"), false);
});

test("internal review queue route is protected and read-only", async () => {
  const [pageSource, loaderSource, viewSource] = await Promise.all(
    [
      "app/internal/review-queue/page.tsx",
      "lib/internal-review-queue.ts",
      "components/internal/ReviewQueueView.tsx",
    ].map((file) => readFile(resolve(process.cwd(), file), "utf8")),
  );
  const source = [pageSource, loaderSource, viewSource].join("\n");

  assert.match(pageSource, /CYBERMEDICA_ENABLE_INTERNAL_REVIEW/);
  assert.match(pageSource, /notFound\(\)/);
  assert.match(pageSource, /connection\(\)/);
  assert.match(loaderSource, /data\/research\/review/);
  assert.match(loaderSource, /review-queue\.generated\.json/);
  assert.match(loaderSource, /review-decisions\.generated\.json/);
  assert.doesNotMatch(source, /supabase|service_role|public_api/i);
  assert.doesNotMatch(source, /createPublication|publishClaim|Publication/i);
  assert.doesNotMatch(source, /VerifiedClaim|verificationStatus:\s*["']verified/i);
  assert.doesNotMatch(viewSource, /<form|<button|formAction|onSubmit|onClick/i);
});
