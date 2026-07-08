import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { DefaultCandidateClaimBuilder } from "./claims.ts";
import {
  CatalogDocumentDownloader,
  extractDownloadedDocumentText,
} from "./documents.ts";
import {
  RuleBasedCharacteristicExtractor,
  validateCandidateCharacteristic,
} from "./extractor.ts";
import {
  artifactCount,
  DefaultConflictDetector,
  DefaultDocumentFinder,
  DefaultEvidenceBuilder,
  DefaultManufacturerResolver,
  DefaultMissingInformationDetector,
  ProviderSourceFinder,
} from "./knowledge-engine.ts";
import {
  NoNetworkResearchProvider,
  CompositeResearchProvider,
  ManualSourceSeedResearchProvider,
  WebSearchResearchProvider,
  validateSourceCandidate,
} from "./providers.ts";
import { CatalogResearchManifest } from "./research-manifest.ts";
import { stableCatalogSlug } from "./seed.ts";
import {
  CATALOG_SEED_WARNING,
  DRAFT_PRODUCT_WARNING,
  type BlockingIssue,
  type CandidateCharacteristic,
  type CandidateClaimBuilder,
  type CatalogImportReport,
  type CatalogProductsFile,
  type CatalogResearchAggregateReport,
  type CatalogSeed,
  type CatalogSeedItem,
  type CharacteristicExtractor,
  type DocumentCandidate,
  type DocumentDownloader,
  type DocumentFinder,
  type DraftCatalogProduct,
  type ConflictDetector,
  type ManufacturerResolver,
  type MissingInformationDetector,
  type ProductResearchReport,
  type ResearchProvider,
  type SourceCandidate,
  type SourceFinder,
} from "./types.ts";

const SEED_PATH = resolve(process.cwd(), "data/catalog-seed.generated.json");
const PRODUCTS_PATH = resolve(
  process.cwd(),
  "data/catalog-products.generated.json",
);
const IMPORT_REPORT_PATH = resolve(
  process.cwd(),
  "data/catalog-import-report.generated.json",
);
const RESEARCH_REPORT_PATH = resolve(
  process.cwd(),
  "data/catalog-research-report.generated.json",
);
const PRODUCT_REPORT_DIRECTORY = resolve(
  process.cwd(),
  "data/research/products",
);

export interface CatalogResearchPaths {
  seedPath: string;
  productsPath: string;
  importReportPath: string;
  researchReportPath: string;
  productReportDirectory: string;
}

const OFFICIAL_SOURCE_TYPES = new Set([
  "official_manufacturer_page",
  "manufacturer_product_page",
  "official_manufacturer",
  "datasheet",
  "ifu",
  "brochure",
  "service_manual",
  "regulatory_registry",
  "fda",
  "eudamed",
]);

export interface CatalogResearchDependencies {
  provider: ResearchProvider;
  downloader: DocumentDownloader;
  extractor: CharacteristicExtractor;
  claimBuilder: CandidateClaimBuilder;
  manufacturerResolver: ManufacturerResolver;
  sourceFinder: SourceFinder;
  documentFinder: DocumentFinder;
  conflictDetector: ConflictDetector;
  missingDetector: MissingInformationDetector;
  manifest: CatalogResearchManifest;
  paths?: Partial<CatalogResearchPaths>;
  generatedAt?: string;
}

export function validateCatalogProductsFile(
  value: CatalogProductsFile,
): CatalogProductsFile {
  for (const product of value.products) {
    if (product.status !== "draft" || product.needsReview !== true) {
      throw new Error(`Generated product ${product.slug} is not draft-only.`);
    }
    product.sourceCandidates.forEach(validateSourceCandidate);
    product.characteristics.forEach(validateCandidateCharacteristic);
    for (const claim of product.candidateClaims) {
      if (
        claim.status !== "candidate" ||
        claim.verificationStatus !== "unverified" ||
        claim.autoPublish !== false ||
        claim.evidenceCandidateIds.length === 0
      ) {
        throw new Error(
          `Generated Candidate Claim ${claim.claimId} violates publication safeguards.`,
        );
      }
    }
  }
  return value;
}

function uniqueWarnings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${randomUUID()}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
) {
  const output: R[] = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await mapper(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, worker),
  );
  return output;
}

function sourceQualityScore(sources: SourceCandidate[]) {
  if (!sources.length) return 0;
  const official = sources.filter((source) =>
    OFFICIAL_SOURCE_TYPES.has(source.sourceType),
  );
  const pool = official.length ? official : sources;
  const average =
    pool.reduce((sum, source) => sum + source.confidence, 0) / pool.length;
  return Math.round(average * (official.length ? 100 : 60));
}

function criticalFields(
  sources: SourceCandidate[],
  documents: DocumentCandidate[],
  characteristics: CandidateCharacteristic[],
) {
  const categories = new Set(
    characteristics.map((characteristic) => characteristic.category),
  );
  const missing = [];
  if (!categories.has("manufacturer")) missing.push("manufacturer");
  if (!categories.has("model")) missing.push("model");
  if (!categories.has("deviceType")) missing.push("deviceType");
  if (!categories.has("registrationNumber")) missing.push("registrationNumber");
  if (!sources.some((source) => OFFICIAL_SOURCE_TYPES.has(source.sourceType))) {
    missing.push("officialSource");
  }
  if (!documents.length) missing.push("document");
  return missing;
}

function blockingIssues(
  item: CatalogSeedItem,
  sources: SourceCandidate[],
  documents: DocumentCandidate[],
  characteristics: CandidateCharacteristic[],
  manufacturerAmbiguous = false,
  hasConflicts = false,
): BlockingIssue[] {
  const output: BlockingIssue[] = [];
  if (!sources.some((source) => OFFICIAL_SOURCE_TYPES.has(source.sourceType))) {
    output.push("no_official_source");
  }
  if (!documents.length) output.push("no_document");
  if (!item.modelCandidate || manufacturerAmbiguous) {
    output.push("ambiguous_model");
  }
  if (hasConflicts) output.push("conflicting_sources");
  if (
    !characteristics.some(
      (characteristic) => characteristic.category === "registrationNumber",
    )
  ) {
    output.push("missing_registration");
  }
  return output;
}

function readinessScore(input: {
  sources: SourceCandidate[];
  documents: DocumentCandidate[];
  characteristics: CandidateCharacteristic[];
  candidateClaimsCount: number;
  missingCriticalFields: string[];
}) {
  const official = input.sources.some((source) =>
    OFFICIAL_SOURCE_TYPES.has(source.sourceType),
  );
  const downloaded = input.documents.some((document) => document.sha256);
  const score =
    (input.sources.length ? 15 : 0) +
    (official ? 20 : 0) +
    (input.documents.length ? 15 : 0) +
    (downloaded ? 10 : 0) +
    Math.min(20, input.characteristics.length * 4) +
    Math.min(10, input.candidateClaimsCount * 2) +
    Math.max(0, 10 - input.missingCriticalFields.length * 2);
  return Math.min(100, score);
}

function researchStatus(input: {
  sources: SourceCandidate[];
  documents: DocumentCandidate[];
  characteristics: CandidateCharacteristic[];
  missingCriticalFields: string[];
  blockingIssues?: BlockingIssue[];
}) {
  if (input.blockingIssues?.includes("download_failed")) return "blocked" as const;
  if (!input.sources.length) return "needs_source" as const;
  if (
    input.documents.length &&
    input.characteristics.length &&
    input.missingCriticalFields.length === 0
  ) {
    return "research_ready" as const;
  }
  return "partially_researched" as const;
}

function documentVersions(documents: DocumentCandidate[]) {
  return documents.flatMap((document) =>
    document.sha256 && document.artifactPath
      ? [
          {
            documentKey: catalogResearchDocumentKey(document),
            documentVersionId: `${catalogResearchDocumentKey(document)}:${document.sha256}`,
            sha256: document.sha256,
            sourceUrl: document.url,
            artifactPath: document.artifactPath,
          },
        ]
      : [],
  );
}

function catalogResearchDocumentKey(document: Pick<DocumentCandidate, "url">) {
  return `catalog-research:${createHash("sha256")
    .update(document.url)
    .digest("hex")
    .slice(0, 32)}`;
}

function resolvePaths(
  paths: Partial<CatalogResearchPaths> = {},
): CatalogResearchPaths {
  return {
    seedPath: paths.seedPath ?? SEED_PATH,
    productsPath: paths.productsPath ?? PRODUCTS_PATH,
    importReportPath: paths.importReportPath ?? IMPORT_REPORT_PATH,
    researchReportPath: paths.researchReportPath ?? RESEARCH_REPORT_PATH,
    productReportDirectory:
      paths.productReportDirectory ?? PRODUCT_REPORT_DIRECTORY,
  };
}

function reviewReadiness(input: {
  sources: SourceCandidate[];
  documents: DocumentCandidate[];
  characteristics: CandidateCharacteristic[];
  conflicts: number;
  readinessScore: number;
}) {
  return {
    sourceQualityScore: sourceQualityScore(input.sources),
    documentCoverageScore: input.documents.length
      ? Math.round(
          (input.documents.filter((document) => document.sha256).length /
            input.documents.length) *
            100,
        )
      : 0,
    characteristicCoverageScore: Math.min(
      100,
      input.characteristics.length * 10,
    ),
    conflictPenalty: input.conflicts * 10,
    readinessScore: input.readinessScore,
  };
}

function reviewPriority(issues: BlockingIssue[]) {
  if (issues.includes("no_official_source") || issues.includes("no_document")) {
    return "high" as const;
  }
  return issues.length ? ("medium" as const) : ("low" as const);
}

function characteristicValue(
  characteristics: CandidateCharacteristic[],
  category: CandidateCharacteristic["category"],
) {
  return characteristics.find((item) => item.category === category)?.value ?? null;
}

async function validateDiscoverySources(
  sources: SourceCandidate[],
  warnings: string[],
) {
  return sources.flatMap((source) => {
    try {
      return [validateSourceCandidate(source)];
    } catch (error) {
      warnings.push(
        `Source candidate rejected: ${
          error instanceof Error ? error.message : "invalid candidate"
        }`,
      );
      return [];
    }
  });
}

export async function researchProduct(
  item: CatalogSeedItem,
  dependencies: CatalogResearchDependencies,
): Promise<{
  product: DraftCatalogProduct;
  report: ProductResearchReport;
}> {
  const generatedAt = dependencies.generatedAt ?? new Date().toISOString();
  const warnings: string[] = [];
  let discovery = { sources: [], documents: [], warnings: [] } as Awaited<
    ReturnType<ResearchProvider["discover"]>
  >;
  let manufacturer = dependencies.manufacturerResolver.resolve(item, []);
  try {
    discovery = await dependencies.sourceFinder.find(item, manufacturer);
    manufacturer = dependencies.manufacturerResolver.resolve(
      item,
      discovery.sources,
    );
  } catch (error) {
    warnings.push(
      `Independent research could not run: ${
        error instanceof Error ? error.message : "unknown network error"
      }`,
    );
  }
  warnings.push(...discovery.warnings);
  warnings.push(...manufacturer.warnings);
  const sources = await validateDiscoverySources(discovery.sources, warnings);
  sources.sort((left, right) => right.rankScore - left.rankScore);

  const downloadedDocuments: DocumentCandidate[] = [];
  for (const document of dependencies.documentFinder.find(discovery)) {
    try {
      downloadedDocuments.push(await dependencies.downloader.download(document));
    } catch (error) {
      downloadedDocuments.push({
        ...document,
        warnings: [
          ...document.warnings,
          `Download pipeline failed: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        ],
      });
    }
  }

  const characteristics: CandidateCharacteristic[] = [];
  for (const document of downloadedDocuments) {
    const source =
      sources.find(
        (candidate) =>
          candidate.sourceUrl === document.sourceUrl ||
          candidate.sourceUrl === document.url,
      ) ?? null;
    if (!source) {
      warnings.push(
        `Document “${document.title}” has no corresponding SourceCandidate; extraction skipped.`,
      );
      continue;
    }
    const discoveryDocument = discovery.documents.find(
      (candidate) => candidate.url === document.url,
    );
    const text =
      discoveryDocument?.extractionText ??
      (await extractDownloadedDocumentText(document));
    if (!text) continue;
    const extracted = dependencies.extractor.extract({
      product: item,
      source,
      document,
      text,
      extractionMethod:
        document.mimeType === "application/pdf" ? "pdf_text" : "rule_based",
    });
    for (const characteristic of extracted) {
      characteristics.push(validateCandidateCharacteristic(characteristic));
    }
  }

  const deduplicatedCharacteristics = [
    ...new Map(
      characteristics.map((characteristic) => [
        [
          characteristic.category,
          characteristic.value,
          characteristic.sourceUrl,
        ].join("\u001f"),
        characteristic,
      ]),
    ).values(),
  ];
  const evidenceBuilder = new DefaultEvidenceBuilder();
  const evidenceCandidates = deduplicatedCharacteristics.map((characteristic) =>
    evidenceBuilder.build(characteristic),
  );
  const candidateClaims = dependencies.claimBuilder.build(
    item,
    deduplicatedCharacteristics,
  );
  const conflicts = dependencies.conflictDetector.detect(
    item,
    deduplicatedCharacteristics,
  );
  const missingCharacteristics = dependencies.missingDetector.detect(
    deduplicatedCharacteristics,
  );
  const missingCriticalFields = criticalFields(
    sources,
    downloadedDocuments,
    deduplicatedCharacteristics,
  );
  const issues = blockingIssues(
    item,
    sources,
    downloadedDocuments,
    deduplicatedCharacteristics,
    manufacturer.ambiguous,
    conflicts.length > 0,
  );
  if (
    downloadedDocuments.some((document) =>
      document.warnings.some((warning) => /download failed|download rejected/i.test(warning)),
    )
  ) {
    issues.push("download_failed");
  }
  if (!deduplicatedCharacteristics.length && downloadedDocuments.length > 0) {
    issues.push("no_characteristics");
  }
  const quality = sourceQualityScore(sources);
  const readiness = readinessScore({
    sources,
    documents: downloadedDocuments,
    characteristics: deduplicatedCharacteristics,
    candidateClaimsCount: candidateClaims.length,
    missingCriticalFields,
  });
  const status = researchStatus({
    sources,
    documents: downloadedDocuments,
    characteristics: deduplicatedCharacteristics,
    missingCriticalFields,
    blockingIssues: issues,
  });
  const priority = reviewPriority(issues);
  const versions = documentVersions(downloadedDocuments);
  const readinessBreakdown = reviewReadiness({
    sources,
    documents: downloadedDocuments,
    characteristics: deduplicatedCharacteristics,
    conflicts: conflicts.length,
    readinessScore: readiness,
  });
  await dependencies.manifest.record({
    product: item,
    sources,
    documents: downloadedDocuments,
    warnings,
  });
  const report: ProductResearchReport = {
    productSlug: item.slug,
    titleFromCatalog: item.titleFromCatalog,
    normalizedTitle: item.normalizedTitle,
    manufacturerCandidate: manufacturer,
    modelCandidate: item.modelCandidate,
    category: item.category,
    researchStatus: status,
    sourcesFound: sources.length,
    officialSourcesFound: sources.filter((source) =>
      OFFICIAL_SOURCE_TYPES.has(source.sourceType),
    ).length,
    documentsFound: downloadedDocuments.length,
    documentsDownloaded: downloadedDocuments.filter((document) => document.sha256)
      .length,
    characteristicsExtracted: deduplicatedCharacteristics.length,
    candidateClaimsCreated: candidateClaims.length,
    conflictsFound: conflicts.length,
    missingCriticalFields,
    missingOptionalFields: missingCharacteristics.filter(
      (field) => !missingCriticalFields.includes(field),
    ),
    warnings: uniqueWarnings([
      ...warnings,
      ...downloadedDocuments.flatMap((document) => document.warnings),
    ]),
    generatedAt,
    sources,
    documents: downloadedDocuments,
    documentVersions: versions,
    facts: deduplicatedCharacteristics,
    evidenceCandidates,
    characteristics: deduplicatedCharacteristics,
    candidateClaims,
    reviewReadiness: readinessBreakdown,
    reviewStatus: "pending",
    reviewPriority: priority,
    reviewReasons: issues.map((issue) => `blocking_issue:${issue}`),
    suggestedReviewerRole: "medical_data_reviewer",
    blockingIssues: issues,
    sourceQualityScore: quality,
    readinessScore: readiness,
    conflicts,
    missingCharacteristics,
    uniqueArtifacts: artifactCount(downloadedDocuments),
  };

  const product: DraftCatalogProduct = {
    slug: item.slug,
    title: item.normalizedTitle,
    titleFromCatalog: item.titleFromCatalog,
    brand:
      characteristicValue(deduplicatedCharacteristics, "manufacturer") ??
      item.brandCandidate,
    manufacturer: characteristicValue(
      deduplicatedCharacteristics,
      "manufacturer",
    ),
    model:
      characteristicValue(deduplicatedCharacteristics, "model") ??
      item.modelCandidate,
    category: item.category,
    catalogPage: item.catalogPage,
    shortDescription: null,
    imageUrl: null,
    imageSourceUrl: null,
    officialProductUrl:
      sources.find((source) => source.sourceType === "official_manufacturer")
        ?.sourceUrl ?? null,
    documents: downloadedDocuments,
    characteristics: deduplicatedCharacteristics,
    sourceCandidates: sources,
    evidenceCandidates,
    candidateClaims,
    researchStatus: status,
    status: "draft",
    warning: DRAFT_PRODUCT_WARNING,
    researchWarnings: report.warnings,
    sourcesSummary: {
      total: report.sourcesFound,
      official: report.officialSourcesFound,
    },
    documentsSummary: {
      total: report.documentsFound,
      downloaded: report.documentsDownloaded,
    },
    characteristicsPreview: deduplicatedCharacteristics.slice(0, 6),
    candidateClaimsCount: candidateClaims.length,
    needsReview: true,
    lastResearchedAt: generatedAt,
    missingCriticalFields,
    sourceQualityScore: quality,
    readinessScore: readiness,
    reviewStatus: "pending",
    reviewPriority: priority,
    reviewReasons: report.reviewReasons,
    suggestedReviewerRole: report.suggestedReviewerRole,
    blockingIssues: issues,
    conflicts,
    missingCharacteristics,
  };
  return { product, report };
}

export async function researchCatalogProducts(
  seed: CatalogSeed,
  dependencies: Partial<CatalogResearchDependencies>,
) {
  const generatedAt = dependencies.generatedAt ?? new Date().toISOString();
  const resolvedDependencies = resolveDependencies(dependencies, generatedAt);
  const results = await mapWithConcurrency(seed.items, 4, (item) =>
    researchProduct(item, resolvedDependencies),
  );
  return {
    generatedAt,
    researchProvider: resolvedDependencies.provider.name,
    products: results.map((result) => result.product),
    reports: results.map((result) => result.report),
  };
}

function aggregateReport(
  seed: CatalogSeed,
  reports: ProductResearchReport[],
  importReport: CatalogImportReport,
  generatedAt: string,
): CatalogResearchAggregateReport {
  return {
    totalProducts: seed.items.length,
    processedProducts: reports.length,
    totalSeedItems: importReport.extractedPositions,
    uniqueProducts: seed.items.length,
    researchedProducts: reports.filter(
      (report) => report.researchStatus === "research_ready",
    ).length,
    partiallyResearchedProducts: reports.filter(
      (report) => report.researchStatus === "partially_researched",
    ).length,
    productsNeedingSource: reports.filter(
      (report) => report.researchStatus === "needs_source",
    ).length,
    researchReadyProducts: reports.filter(
      (report) => report.researchStatus === "research_ready",
    ).length,
    blockedProducts: reports.filter(
      (report) => report.researchStatus === "blocked",
    ).length,
    failedProducts: reports.filter(
      (report) => report.researchStatus === "blocked",
    ).length,
    totalSourcesFound: reports.reduce(
      (sum, report) => sum + report.sourcesFound,
      0,
    ),
    totalOfficialSourcesFound: reports.reduce(
      (sum, report) => sum + report.officialSourcesFound,
      0,
    ),
    totalDocumentsFound: reports.reduce(
      (sum, report) => sum + report.documentsFound,
      0,
    ),
    totalDocumentsDownloaded: reports.reduce(
      (sum, report) => sum + report.documentsDownloaded,
      0,
    ),
    totalArtifactsCreated: new Set(
      reports.flatMap((report) =>
        report.documents
          .map((document) => document.sha256)
          .filter((value): value is string => Boolean(value)),
      ),
    ).size,
    totalFactsExtracted: reports.reduce(
      (sum, report) => sum + report.facts.length,
      0,
    ),
    totalEvidenceCandidates: reports.reduce(
      (sum, report) => sum + report.evidenceCandidates.length,
      0,
    ),
    totalCandidateClaims: reports.reduce(
      (sum, report) => sum + report.candidateClaims.length,
      0,
    ),
    totalConflicts: reports.reduce(
      (sum, report) => sum + report.conflicts.length,
      0,
    ),
    totalMissingCharacteristics: reports.reduce(
      (sum, report) => sum + report.missingCharacteristics.length,
      0,
    ),
    duplicateProducts: importReport.suspectedDuplicates,
    productsWithoutSources: reports
      .filter((report) => report.sourcesFound === 0)
      .map((report) => report.productSlug),
    productsWithoutDocuments: reports
      .filter((report) => report.documentsFound === 0)
      .map((report) => report.productSlug),
    productsReadyForHumanReview: reports
      .filter(
        (report) =>
          report.sourcesFound > 0 &&
          report.candidateClaimsCreated > 0 &&
          report.readinessScore >= 40,
      )
      .map((report) => report.productSlug),
    generatedAt,
    warnings: uniqueWarnings([
      CATALOG_SEED_WARNING,
      "No LLM or OCR was used. Extraction is rule-based and remains unverified.",
      ...reports.flatMap((report) => report.warnings),
    ]),
  };
}

function defaultProvider() {
  const manual = new ManualSourceSeedResearchProvider();
  return process.env.CATALOG_RESEARCH_PROVIDER === "none"
    ? new CompositeResearchProvider([manual, new NoNetworkResearchProvider()])
    : new CompositeResearchProvider([manual, new WebSearchResearchProvider()]);
}

function resolveDependencies(
  dependencies: Partial<CatalogResearchDependencies>,
  generatedAt: string,
) {
  const provider = dependencies.provider ?? defaultProvider();
  return {
    provider,
    downloader:
      dependencies.downloader ?? new CatalogDocumentDownloader(),
    extractor:
      dependencies.extractor ?? new RuleBasedCharacteristicExtractor(),
    claimBuilder:
      dependencies.claimBuilder ??
      new DefaultCandidateClaimBuilder(new DefaultEvidenceBuilder()),
    manufacturerResolver:
      dependencies.manufacturerResolver ?? new DefaultManufacturerResolver(),
    sourceFinder:
      dependencies.sourceFinder ?? new ProviderSourceFinder(provider),
    documentFinder:
      dependencies.documentFinder ?? new DefaultDocumentFinder(),
    conflictDetector:
      dependencies.conflictDetector ?? new DefaultConflictDetector(),
    missingDetector:
      dependencies.missingDetector ?? new DefaultMissingInformationDetector(),
    manifest: dependencies.manifest ?? new CatalogResearchManifest(),
    paths: dependencies.paths,
    generatedAt,
  } satisfies CatalogResearchDependencies;
}

export async function runCatalogResearch(
  dependencies: Partial<CatalogResearchDependencies> = {},
) {
  const generatedAt = dependencies.generatedAt ?? new Date().toISOString();
  const paths = resolvePaths(dependencies.paths);
  const seed = JSON.parse(await readFile(paths.seedPath, "utf8")) as CatalogSeed;
  const importReport = JSON.parse(
    await readFile(paths.importReportPath, "utf8"),
  ) as CatalogImportReport;
  const resolvedDependencies = resolveDependencies(dependencies, generatedAt);
  const result = await researchCatalogProducts(seed, resolvedDependencies);
  const output: CatalogProductsFile = {
    generatedAt,
    researchProvider: result.researchProvider,
    products: result.products,
  };
  validateCatalogProductsFile(output);
  const aggregate = aggregateReport(
    seed,
    result.reports,
    importReport,
    generatedAt,
  );
  const updatedImportReport: CatalogImportReport = {
    ...importReport,
    generatedAt,
    independentSourcesFound: result.products.filter(
      (product) => product.sourcesSummary.total > 0,
    ).length,
    productsWithoutSources: aggregate.productsNeedingSource,
    requiresManualReview: result.products.length,
    warnings: aggregate.warnings,
  };

  await Promise.all([
    writeJsonAtomic(paths.productsPath, output),
    writeJsonAtomic(paths.researchReportPath, aggregate),
    writeJsonAtomic(paths.importReportPath, updatedImportReport),
    ...result.reports.map((report) =>
      writeJsonAtomic(
        join(paths.productReportDirectory, `${report.productSlug}.research.json`),
        report,
      ),
    ),
  ]);

  return {
    productsPath: paths.productsPath,
    aggregateReportPath: paths.researchReportPath,
    productReportsDirectory: paths.productReportDirectory,
    output,
    aggregate,
  };
}

export async function runSingleProductResearch(
  query: string,
  dependencies: Partial<CatalogResearchDependencies> = {},
) {
  const normalizedTitle = query.replace(/\s+/g, " ").trim();
  if (!normalizedTitle) throw new Error("Product query is required.");
  const generatedAt = dependencies.generatedAt ?? new Date().toISOString();
  const paths = resolvePaths(dependencies.paths);
  let existing: CatalogProductsFile = {
    generatedAt,
    researchProvider: "uninitialized",
    products: [],
  };
  try {
    existing = JSON.parse(
      await readFile(paths.productsPath, "utf8"),
    ) as CatalogProductsFile;
  } catch {
    // First single-product research run creates the generated draft file.
  }
  const normalizedQuery = normalizedTitle.toLocaleLowerCase("ru-RU");
  const existingProduct =
    existing.products.find(
      (product) =>
        product.model?.toLocaleLowerCase("ru-RU") === normalizedQuery ||
        product.title.toLocaleLowerCase("ru-RU").includes(normalizedQuery),
    ) ?? null;
  const item: CatalogSeedItem = {
    titleFromCatalog: existingProduct?.titleFromCatalog ?? normalizedTitle,
    normalizedTitle: existingProduct?.title ?? normalizedTitle,
    brandCandidate: existingProduct?.brand ?? null,
    modelCandidate: existingProduct?.model ?? normalizedTitle,
    category: existingProduct?.category ?? "Не определена",
    catalogPage: existingProduct?.catalogPage ?? 0,
    slug: existingProduct?.slug ?? stableCatalogSlug(normalizedTitle),
    status: "seed_only",
    needsIndependentResearch: true,
  };
  const resolved = resolveDependencies(dependencies, generatedAt);
  const result = await researchProduct(item, resolved);
  const products = existing.products.filter(
    (product) => product.slug !== result.product.slug,
  );
  const output: CatalogProductsFile = {
    generatedAt,
    researchProvider: resolved.provider.name,
    products: [...products, result.product],
  };
  validateCatalogProductsFile(output);
  await Promise.all([
    writeJsonAtomic(paths.productsPath, output),
    writeJsonAtomic(
      join(paths.productReportDirectory, `${item.slug}.research.json`),
      result.report,
    ),
  ]);
  return { item, ...result, productsPath: paths.productsPath };
}

async function main() {
  const result = await runCatalogResearch();
  process.stdout.write(
    `${JSON.stringify(
      {
        productsPath: result.productsPath,
        aggregateReportPath: result.aggregateReportPath,
        productReportsDirectory: result.productReportsDirectory,
        provider: result.output.researchProvider,
        products: result.aggregate.uniqueProducts,
        sourcesFound: result.aggregate.totalSourcesFound,
        documentsFound: result.aggregate.totalDocumentsFound,
        characteristicsExtracted: result.aggregate.totalFactsExtracted,
        candidateClaimsCreated: result.aggregate.totalCandidateClaims,
        uniqueArtifacts: result.aggregate.totalArtifactsCreated,
        conflicts: result.aggregate.totalConflicts,
        productsReadyForHumanReview:
          result.aggregate.productsReadyForHumanReview.length,
        productsNeedingSource: result.aggregate.productsNeedingSource,
        warnings: result.aggregate.warnings,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    process.stderr.write(
      `${
        error instanceof Error ? error.message : "Catalog research failed."
      }\n`,
    );
    process.exitCode = 1;
  });
}
