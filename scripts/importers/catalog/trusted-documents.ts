import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { ContentAddressedArtifactStore } from "../core/artifact-store.ts";
import { StreamingDownloader } from "../core/downloader.ts";
import type { DownloadedArtifact, NormalizedDocumentLink } from "../core/contracts.ts";
import { extractDownloadedDocumentText } from "./documents.ts";
import type {
  DiscoveryDocumentType,
  DiscoveryProductInput,
  DiscoveryProductReport,
  TrustTier,
} from "./discovery.ts";
import {
  coverageSummary,
  profileCoverageForCharacteristics,
} from "./extraction-profiles/index.ts";
import { RuleBasedCharacteristicExtractor } from "./extractor.ts";
import type {
  CandidateCharacteristic,
  CatalogSeedItem,
  DocumentCandidate as ResearchDocumentCandidate,
  DocumentCandidateType,
  SourceCandidate as ResearchSourceCandidate,
} from "./types.ts";

const DISCOVERY_PRODUCT_DIRECTORY = resolve(
  process.cwd(),
  "data/research/discovery/products",
);
const DOCUMENT_ROOT = resolve(process.cwd(), "data/research/documents");
const DOCUMENT_PRODUCT_DIRECTORY = resolve(DOCUMENT_ROOT, "products");
const DOWNLOAD_REPORT_PATH = resolve(
  DOCUMENT_ROOT,
  "download-report.generated.json",
);
const EXTRACTION_ROOT = resolve(process.cwd(), "data/research/extraction");
const EXTRACTION_PRODUCT_DIRECTORY = resolve(EXTRACTION_ROOT, "products");
const EXTRACTION_REPORT_PATH = resolve(
  EXTRACTION_ROOT,
  "extraction-report.generated.json",
);
const ARTIFACT_ROOT = resolve(process.cwd(), "data/research/artifacts");
const ALLOWED_TRUST_TIERS = new Set<TrustTier>([1, 2]);

export interface DocumentVersion {
  versionId: string;
  documentCandidateId: string;
  sourceId: string;
  productSlug: string;
  documentKey: string;
  documentType: DiscoveryDocumentType;
  title: string;
  language: string | null;
  sourceUrl: string;
  sha256: string;
  contentType: string;
  byteSize: number;
  filePath: string;
  trustTier: TrustTier;
  requiresHumanReview: true;
  status: "candidate";
}

export interface DownloadedDocumentArtifact {
  documentCandidateId: string;
  sourceUrl: string;
  title: string;
  documentType: DiscoveryDocumentType;
  sha256: string;
  contentType: string;
  byteSize: number;
  filePath: string;
}

export interface DownloadAttempt {
  documentCandidateId: string;
  sourceId: string;
  productSlug: string;
  title: string;
  url: string;
  documentType: DiscoveryDocumentType;
  trustTier: TrustTier;
}

export interface SkippedDocument {
  documentCandidateId: string;
  url: string;
  title: string;
  trustTier: TrustTier;
  reason: string;
}

export interface FailedTrustedDownload {
  documentCandidateId: string;
  url: string;
  title: string;
  reason: string;
  retryable: boolean;
}

export interface TrustedDocumentProductDownloadReport {
  product: DiscoveryProductInput;
  attemptedDownloads: DownloadAttempt[];
  downloadedArtifacts: DownloadedDocumentArtifact[];
  failedDownloads: FailedTrustedDownload[];
  skippedDocuments: SkippedDocument[];
  documentVersions: DocumentVersion[];
  warnings: string[];
  readiness: {
    hasDownloadedDocuments: boolean;
    hasExtractedText: false;
    hasCandidateClaims: false;
    canProceedToReview: false;
  };
}

export interface TrustedDocumentDownloadReport {
  productsProcessed: number;
  attemptedDownloads: number;
  downloadedArtifacts: number;
  failedDownloads: number;
  skippedDocuments: number;
  documentVersions: number;
  productsWithDownloadedDocuments: number;
  productsReadyForExtraction: number;
  productReports: Array<{
    productSlug: string;
    attemptedDownloads: number;
    downloadedArtifacts: number;
    failedDownloads: number;
    skippedDocuments: number;
    documentVersions: number;
    canProceedToExtraction: boolean;
  }>;
  warnings: string[];
}

export interface EvidenceCandidateReference {
  evidenceCandidateId: string;
  kind: "document_excerpt" | "document_metadata";
  documentVersionId: string;
  documentCandidateId: string;
  sha256: string;
  sourceUrl: string;
  locator: {
    page: number | null;
    section: string | null;
    heading: string | null;
    table: string | null;
    paragraph: number | null;
  };
  quotedText: string;
  status: "candidate";
  requiresHumanReview: true;
}

export interface ExtractedFactCandidate {
  factCandidateId: string;
  productSlug: string;
  factType: string;
  label: string;
  value: string;
  unit: string | null;
  rawText: string;
  documentVersionId: string;
  documentCandidateId: string;
  documentSha256: string;
  sourceUrl: string;
  locator: EvidenceCandidateReference["locator"];
  evidenceCandidateId: string | null;
  confidence: number;
  extractionMethod: "pdf_text" | "rule_based" | "document_metadata";
  status: "candidate";
  verificationStatus: "unverified";
  autoPublish: false;
  requiresHumanReview: true;
  warnings: string[];
}

export interface CandidateClaimHandoff {
  claimId: string;
  productSlug: string;
  subjectType: "product";
  suggestedClaimType: string;
  valuePayload: { value: string; unit: string | null };
  rawText: string;
  evidenceCandidateIds: string[];
  confidence: number;
  extractionMethod: ExtractedFactCandidate["extractionMethod"];
  status: "candidate";
  verificationStatus: "unverified";
  autoPublish: false;
  requiresHumanReview: true;
  warnings: string[];
}

export interface TrustedDocumentExtractionProductReport {
  product: DiscoveryProductInput;
  documentVersions: DocumentVersion[];
  extractedFactCandidates: ExtractedFactCandidate[];
  evidenceCandidates: EvidenceCandidateReference[];
  candidateClaims: CandidateClaimHandoff[];
  extractionProfileSummary?: {
    profilesUsed: string[];
    patternsMatched: Record<string, number>;
    normalizedUnits: Record<string, number>;
    failedFields: Record<string, string[]>;
    coveragePercent: number;
  };
  warnings: string[];
  readiness: {
    hasDownloadedDocuments: boolean;
    hasExtractedText: boolean;
    hasCandidateClaims: boolean;
    canProceedToReview: boolean;
  };
}

export interface TrustedDocumentExtractionReport {
  productsProcessed: number;
  documentVersionsProcessed: number;
  extractedFactCandidates: number;
  evidenceCandidates: number;
  candidateClaims: number;
  productsReadyForReview: number;
  extractionProfileSummary: {
    profilesUsed: string[];
    patternsMatched: Record<string, number>;
    normalizedUnits: Record<string, number>;
    averageCoveragePercent: number;
  };
  productReports: Array<{
    productSlug: string;
    documentVersions: number;
    extractedFactCandidates: number;
    candidateClaims: number;
    profilesUsed: string[];
    coveragePercent: number;
    canProceedToReview: boolean;
  }>;
  warnings: string[];
}

export type TrustedDocumentTextExtractor = (
  document: ResearchDocumentCandidate,
  version: DocumentVersion,
) => Promise<string | null>;

function stableId(prefix: string, parts: Array<string | number | null>) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${stableId("part", [path, JSON.stringify(value)])}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

async function readJsonFile<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function listJsonFiles(directory: string) {
  try {
    return (await readdir(directory))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => join(directory, file));
  } catch {
    return [];
  }
}

function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "::1" &&
      !host.endsWith(".local") &&
      !/^10\.|^127\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(
        host,
      )
    );
  } catch {
    return false;
  }
}

function documentKey(documentId: string) {
  return `trusted-document:${documentId}`;
}

function coreDocumentType(type: DiscoveryDocumentType): NormalizedDocumentLink["documentType"] {
  if (type === "registration_certificate") return "registration";
  if (type === "ifu" || type === "user_manual" || type === "service_manual") {
    return "ifu";
  }
  if (type === "certificate") return "certificate";
  return "other";
}

function researchDocumentType(type: DiscoveryDocumentType): DocumentCandidateType {
  const map: Partial<Record<DiscoveryDocumentType, DocumentCandidateType>> = {
    registration_certificate: "registration_certificate",
    ifu: "ifu",
    user_manual: "manual",
    service_manual: "service_manual",
    datasheet: "datasheet",
    brochure: "brochure",
    certificate: "certificate",
  };
  return map[type] ?? "other";
}

function dedupeDiscoveryDocuments(report: DiscoveryProductReport) {
  return [
    ...new Map(
      report.documentCandidates.map((document) => [
        `${document.url}\u001f${document.documentType}`,
        document,
      ]),
    ).values(),
  ].sort(
    (left, right) =>
      left.trustTier - right.trustTier ||
      right.confidence - left.confidence ||
      left.url.localeCompare(right.url),
  );
}

function downloadAttempt(
  document: DiscoveryProductReport["documentCandidates"][number],
): DownloadAttempt {
  return {
    documentCandidateId: document.documentId,
    sourceId: document.sourceId,
    productSlug: document.productSlug,
    title: document.title,
    url: document.url,
    documentType: document.documentType,
    trustTier: document.trustTier,
  };
}

function versionFromArtifact(
  document: DiscoveryProductReport["documentCandidates"][number],
  artifact: DownloadedArtifact,
): DocumentVersion {
  const key = documentKey(document.documentId);
  return {
    versionId: stableId("document_version", [key, artifact.sha256]),
    documentCandidateId: document.documentId,
    sourceId: document.sourceId,
    productSlug: document.productSlug,
    documentKey: key,
    documentType: document.documentType,
    title: document.title,
    language: document.language,
    sourceUrl: document.url,
    sha256: artifact.sha256,
    contentType: artifact.contentType,
    byteSize: artifact.byteSize,
    filePath: artifact.filePath,
    trustTier: document.trustTier,
    requiresHumanReview: true,
    status: "candidate",
  };
}

async function defaultDownloadOne(input: {
  document: DiscoveryProductReport["documentCandidates"][number];
  artifactStoreRoot: string;
  fetchImplementation?: typeof fetch;
  maxBytes?: number;
}) {
  const host = new URL(input.document.url).hostname;
  const artifactStore = new ContentAddressedArtifactStore({
    rootDirectory: input.artifactStoreRoot,
    maxBytes: input.maxBytes,
  });
  const downloader = new StreamingDownloader({
    artifactStore,
    acceptedHosts: [host],
    timeoutMs: 20_000,
    maxAttempts: 2,
    fetchImplementation: input.fetchImplementation,
  });
  const key = documentKey(input.document.documentId);
  const link: NormalizedDocumentLink = {
    externalId: input.document.documentId,
    documentKey: key,
    documentType: coreDocumentType(input.document.documentType),
    title: input.document.title,
    url: input.document.url,
  };
  return downloader.download(link);
}

export async function runTrustedDocumentDownloadForReports(input: {
  discoveryReports: DiscoveryProductReport[];
  productReportDirectory?: string;
  aggregateReportPath?: string;
  artifactStoreRoot?: string;
  fetchImplementation?: typeof fetch;
  maxBytes?: number;
}) {
  const productReportDirectory =
    input.productReportDirectory ?? DOCUMENT_PRODUCT_DIRECTORY;
  const aggregateReportPath = input.aggregateReportPath ?? DOWNLOAD_REPORT_PATH;
  const artifactStoreRoot = input.artifactStoreRoot ?? ARTIFACT_ROOT;
  const productReports: TrustedDocumentProductDownloadReport[] = [];

  for (const discoveryReport of input.discoveryReports) {
    const warnings = [...discoveryReport.warnings];
    const attemptedDownloads: DownloadAttempt[] = [];
    const downloadedArtifacts: DownloadedDocumentArtifact[] = [];
    const failedDownloads: FailedTrustedDownload[] = [];
    const skippedDocuments: SkippedDocument[] = [];
    const documentVersions: DocumentVersion[] = [];

    for (const document of dedupeDiscoveryDocuments(discoveryReport)) {
      if (!ALLOWED_TRUST_TIERS.has(document.trustTier)) {
        skippedDocuments.push({
          documentCandidateId: document.documentId,
          url: document.url,
          title: document.title,
          trustTier: document.trustTier,
          reason: "Document trust tier is not allowed for trusted processing.",
        });
        continue;
      }
      if (!isSafePublicUrl(document.url)) {
        skippedDocuments.push({
          documentCandidateId: document.documentId,
          url: document.url,
          title: document.title,
          trustTier: document.trustTier,
          reason: "Document URL is not a safe public HTTPS URL.",
        });
        continue;
      }

      attemptedDownloads.push(downloadAttempt(document));
      const result = await defaultDownloadOne({
        document,
        artifactStoreRoot,
        fetchImplementation: input.fetchImplementation,
        maxBytes: input.maxBytes,
      });
      if (!result.artifact) {
        failedDownloads.push({
          documentCandidateId: document.documentId,
          url: document.url,
          title: document.title,
          reason: result.failure?.reason ?? "Unknown download failure.",
          retryable: result.failure?.retryable ?? false,
        });
        continue;
      }
      const version = versionFromArtifact(document, result.artifact);
      downloadedArtifacts.push({
        documentCandidateId: document.documentId,
        sourceUrl: document.url,
        title: document.title,
        documentType: document.documentType,
        sha256: version.sha256,
        contentType: version.contentType,
        byteSize: version.byteSize,
        filePath: version.filePath,
      });
      documentVersions.push(version);
    }

    if (!attemptedDownloads.length && !skippedDocuments.length) {
      warnings.push("No DocumentCandidate records were available for download.");
    }
    const report: TrustedDocumentProductDownloadReport = {
      product: discoveryReport.product,
      attemptedDownloads,
      downloadedArtifacts,
      failedDownloads,
      skippedDocuments,
      documentVersions,
      warnings,
      readiness: {
        hasDownloadedDocuments: documentVersions.length > 0,
        hasExtractedText: false,
        hasCandidateClaims: false,
        canProceedToReview: false,
      },
    };
    productReports.push(report);
    await writeJsonAtomic(
      join(productReportDirectory, `${discoveryReport.product.productSlug}.json`),
      report,
    );
  }

  const aggregate: TrustedDocumentDownloadReport = {
    productsProcessed: productReports.length,
    attemptedDownloads: productReports.reduce(
      (sum, report) => sum + report.attemptedDownloads.length,
      0,
    ),
    downloadedArtifacts: productReports.reduce(
      (sum, report) => sum + report.downloadedArtifacts.length,
      0,
    ),
    failedDownloads: productReports.reduce(
      (sum, report) => sum + report.failedDownloads.length,
      0,
    ),
    skippedDocuments: productReports.reduce(
      (sum, report) => sum + report.skippedDocuments.length,
      0,
    ),
    documentVersions: productReports.reduce(
      (sum, report) => sum + report.documentVersions.length,
      0,
    ),
    productsWithDownloadedDocuments: productReports.filter(
      (report) => report.readiness.hasDownloadedDocuments,
    ).length,
    productsReadyForExtraction: productReports.filter(
      (report) => report.readiness.hasDownloadedDocuments,
    ).length,
    productReports: productReports.map((report) => ({
      productSlug: report.product.productSlug,
      attemptedDownloads: report.attemptedDownloads.length,
      downloadedArtifacts: report.downloadedArtifacts.length,
      failedDownloads: report.failedDownloads.length,
      skippedDocuments: report.skippedDocuments.length,
      documentVersions: report.documentVersions.length,
      canProceedToExtraction: report.readiness.hasDownloadedDocuments,
    })),
    warnings: productReports.flatMap((report) =>
      report.warnings.map(
        (warning) => `${report.product.productSlug}: ${warning}`,
      ),
    ),
  };
  await writeJsonAtomic(aggregateReportPath, aggregate);
  return { aggregate, productReports };
}

async function loadDiscoveryReports(directory = DISCOVERY_PRODUCT_DIRECTORY) {
  const files = await listJsonFiles(directory);
  return Promise.all(
    files.map((file) => readJsonFile<DiscoveryProductReport>(file)),
  );
}

async function loadDownloadProductReports(directory = DOCUMENT_PRODUCT_DIRECTORY) {
  const files = await listJsonFiles(directory);
  return Promise.all(
    files.map((file) => readJsonFile<TrustedDocumentProductDownloadReport>(file)),
  );
}

function catalogSeedItemFromProduct(product: DiscoveryProductInput): CatalogSeedItem {
  return {
    titleFromCatalog: product.productName,
    normalizedTitle: product.productName,
    brandCandidate: product.manufacturer,
    modelCandidate: product.model,
    category: product.category,
    catalogPage: 0,
    slug: product.productSlug,
    status: "seed_only",
    needsIndependentResearch: true,
  };
}

function researchSourceFromVersion(
  product: DiscoveryProductInput,
  version: DocumentVersion,
): ResearchSourceCandidate {
  return {
    sourceTitle: version.title,
    sourceUrl: version.sourceUrl,
    sourceType: "official_manufacturer_page",
    publisher: product.manufacturer ?? new URL(version.sourceUrl).hostname,
    detectedManufacturer: product.manufacturer,
    detectedModel: product.model,
    confidence: 0.9,
    rankScore: 90,
    reason: "Trusted document version created from discovery candidate.",
    discoveredAt: "candidate-only",
    status: "candidate",
    warnings: ["Document source still requires human review."],
  };
}

function researchDocumentFromVersion(
  version: DocumentVersion,
): ResearchDocumentCandidate {
  return {
    documentType: researchDocumentType(version.documentType),
    title: version.title,
    url: version.sourceUrl,
    publisher: new URL(version.sourceUrl).hostname,
    mimeType: version.contentType,
    sizeBytes: version.byteSize,
    downloadedAt: "content-addressed",
    sha256: version.sha256,
    artifactPath: version.filePath,
    sourceUrl: version.sourceUrl,
    status: "candidate",
    warnings: ["Downloaded document is not verified evidence."],
  };
}

function locatorFor(text: string, index: number) {
  const preceding = text.slice(0, index);
  return {
    page: preceding.split("\f").length,
    section: null,
    heading: null,
    table: null,
    paragraph: preceding.split(/\n\s*\n|\n/).length,
  };
}

function evidenceForFact(input: {
  version: DocumentVersion;
  rawText: string;
  locator: EvidenceCandidateReference["locator"];
  kind?: EvidenceCandidateReference["kind"];
}) {
  return {
    evidenceCandidateId: stableId("evidence", [
      input.version.versionId,
      input.rawText,
      input.locator.page,
      input.locator.paragraph,
    ]),
    kind: input.kind ?? "document_excerpt",
    documentVersionId: input.version.versionId,
    documentCandidateId: input.version.documentCandidateId,
    sha256: input.version.sha256,
    sourceUrl: input.version.sourceUrl,
    locator: input.locator,
    quotedText: input.rawText,
    status: "candidate",
    requiresHumanReview: true,
  } satisfies EvidenceCandidateReference;
}

function metadataFacts(version: DocumentVersion) {
  const values: Array<{
    factType: string;
    label: string;
    value: string | null;
    rawText: string;
  }> = [
    {
      factType: "document.title",
      label: "Название документа",
      value: version.title,
      rawText: `Document title: ${version.title}`,
    },
    {
      factType: "document.language",
      label: "Язык документа",
      value: version.language,
      rawText: `Document language: ${version.language ?? ""}`,
    },
    {
      factType: "document.type",
      label: "Тип документа",
      value: version.documentType,
      rawText: `Document type: ${version.documentType}`,
    },
  ];
  return values.filter((value) => value.value);
}

function explicitTextFacts(input: {
  text: string;
  product: DiscoveryProductInput;
  version: DocumentVersion;
}) {
  const rules: Array<{
    factType: string;
    label: string;
    pattern: RegExp;
    confidence: number;
  }> = [
    {
      factType: "product.name",
      label: "Наименование изделия",
      pattern:
        /(?:product name|device name|medical device|наименование(?: медицинского)? изделия|изделие)\s*[:–-]\s*([^\n;]{3,180})/giu,
      confidence: 0.82,
    },
    {
      factType: "technical.term",
      label: "Технический термин",
      pattern:
        /\b(tidal volume|minute volume|ventilation modes?|flow rate|display|battery|weight|dimensions|compatibility|давление|поток|режимы вентиляции|объем|дисплей|аккумулятор|масса|габариты)\b[^\n]{0,120}/giu,
      confidence: 0.64,
    },
  ];
  const output: ExtractedFactCandidate[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of input.text.matchAll(rule.pattern)) {
      const value = (match[1] ?? match[0] ?? "").replace(/\s+/g, " ").trim();
      if (!value) continue;
      const key = `${rule.factType}:${value}`.toLocaleLowerCase("ru-RU");
      if (seen.has(key)) continue;
      seen.add(key);
      const rawText = (match[0] ?? value).replace(/\s+/g, " ").trim();
      const locator = locatorFor(input.text, match.index ?? 0);
      const evidence = evidenceForFact({
        version: input.version,
        rawText,
        locator,
      });
      output.push({
        factCandidateId: stableId("fact", [
          input.product.productSlug,
          input.version.versionId,
          rule.factType,
          value,
        ]),
        productSlug: input.product.productSlug,
        factType: rule.factType,
        label: rule.label,
        value,
        unit: null,
        rawText,
        documentVersionId: input.version.versionId,
        documentCandidateId: input.version.documentCandidateId,
        documentSha256: input.version.sha256,
        sourceUrl: input.version.sourceUrl,
        locator,
        evidenceCandidateId: evidence.evidenceCandidateId,
        confidence: rule.confidence,
        extractionMethod: "rule_based",
        status: "candidate",
        verificationStatus: "unverified",
        autoPublish: false,
        requiresHumanReview: true,
        warnings: ["Rule-based extraction; human review is required."],
      });
    }
  }
  return output;
}

export function candidateClaimFromExtractedFact(
  fact: ExtractedFactCandidate,
): CandidateClaimHandoff | null {
  if (!fact.evidenceCandidateId || !fact.documentSha256) return null;
  return {
    claimId: stableId("claim", [
      fact.productSlug,
      fact.factType,
      fact.value,
      fact.evidenceCandidateId,
    ]),
    productSlug: fact.productSlug,
    subjectType: "product",
    suggestedClaimType: fact.factType,
    valuePayload: { value: fact.value, unit: fact.unit },
    rawText: fact.rawText,
    evidenceCandidateIds: [fact.evidenceCandidateId],
    confidence: fact.confidence,
    extractionMethod: fact.extractionMethod,
    status: "candidate",
    verificationStatus: "unverified",
    autoPublish: false,
    requiresHumanReview: true,
    warnings: ["Candidate claim handoff only; not verified and not published."],
  };
}

function dedupeFacts(facts: ExtractedFactCandidate[]) {
  return [
    ...new Map(
      facts.map((fact) => [
        `${fact.factType}\u001f${fact.value}\u001f${fact.documentVersionId}`,
        fact,
      ]),
    ).values(),
  ];
}

function emptyExtractionProfileSummary() {
  return {
    profilesUsed: [],
    patternsMatched: {},
    normalizedUnits: {},
    failedFields: {},
    coveragePercent: 0,
  };
}

function mergeCountMaps(
  reports: TrustedDocumentExtractionProductReport[],
  key: "patternsMatched" | "normalizedUnits",
) {
  const output: Record<string, number> = {};
  for (const report of reports) {
    for (const [itemKey, count] of Object.entries(
      (report.extractionProfileSummary ?? emptyExtractionProfileSummary())[key],
    )) {
      output[itemKey] = (output[itemKey] ?? 0) + count;
    }
  }
  return output;
}

export async function runTrustedDocumentExtractionForReports(input: {
  downloadReports: TrustedDocumentProductDownloadReport[];
  productReportDirectory?: string;
  aggregateReportPath?: string;
  textExtractor?: TrustedDocumentTextExtractor;
}) {
  const productReportDirectory =
    input.productReportDirectory ?? EXTRACTION_PRODUCT_DIRECTORY;
  const aggregateReportPath = input.aggregateReportPath ?? EXTRACTION_REPORT_PATH;
  const extractor = new RuleBasedCharacteristicExtractor();
  const textExtractor =
    input.textExtractor ??
    ((document: ResearchDocumentCandidate) =>
      extractDownloadedDocumentText(document));
  const productReports: TrustedDocumentExtractionProductReport[] = [];

  for (const downloadReport of input.downloadReports) {
    const warnings = [...downloadReport.warnings];
    const facts: ExtractedFactCandidate[] = [];
    const evidenceCandidates: EvidenceCandidateReference[] = [];
    const extractedCharacteristicsForCoverage: CandidateCharacteristic[] = [];
    let extractedTextDocuments = 0;

    for (const version of downloadReport.documentVersions) {
      for (const metadata of metadataFacts(version)) {
        const locator = {
          page: null,
          section: "document_metadata",
          heading: null,
          table: null,
          paragraph: null,
        };
        const evidence = evidenceForFact({
          version,
          rawText: metadata.rawText,
          locator,
          kind: "document_metadata",
        });
        evidenceCandidates.push(evidence);
        facts.push({
          factCandidateId: stableId("fact", [
            downloadReport.product.productSlug,
            version.versionId,
            metadata.factType,
            metadata.value,
          ]),
          productSlug: downloadReport.product.productSlug,
          factType: metadata.factType,
          label: metadata.label,
          value: metadata.value ?? "",
          unit: null,
          rawText: metadata.rawText,
          documentVersionId: version.versionId,
          documentCandidateId: version.documentCandidateId,
          documentSha256: version.sha256,
          sourceUrl: version.sourceUrl,
          locator,
          evidenceCandidateId: evidence.evidenceCandidateId,
          confidence: 0.7,
          extractionMethod: "document_metadata",
          status: "candidate",
          verificationStatus: "unverified",
          autoPublish: false,
          requiresHumanReview: true,
          warnings: ["Document metadata only; human review is required."],
        });
      }

      const document = researchDocumentFromVersion(version);
      let text: string | null = null;
      try {
        text = await textExtractor(document, version);
      } catch (error) {
        warnings.push(
          `Text extraction failed for ${version.title}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
      if (!text?.trim()) {
        warnings.push(`No extractable text was found for ${version.title}.`);
        continue;
      }
      extractedTextDocuments += 1;
      const source = researchSourceFromVersion(downloadReport.product, version);
      const seedItem = catalogSeedItemFromProduct(downloadReport.product);
      const extractedCharacteristics = extractor.extract({
        product: seedItem,
        source,
        document,
        text,
        extractionMethod:
          version.contentType === "application/pdf" ? "pdf_text" : "rule_based",
      });
      extractedCharacteristicsForCoverage.push(...extractedCharacteristics);
      for (const characteristic of extractedCharacteristics) {
        const locator = characteristic.locator;
        const evidence = evidenceForFact({
          version,
          rawText: characteristic.rawText,
          locator,
        });
        evidenceCandidates.push(evidence);
        facts.push({
          factCandidateId: stableId("fact", [
            downloadReport.product.productSlug,
            version.versionId,
            characteristic.category,
            characteristic.value,
          ]),
          productSlug: downloadReport.product.productSlug,
          factType: `product.${characteristic.category}`,
          label: characteristic.label,
          value: characteristic.value,
          unit: characteristic.unit,
          rawText: characteristic.rawText,
          documentVersionId: version.versionId,
          documentCandidateId: version.documentCandidateId,
          documentSha256: version.sha256,
          sourceUrl: version.sourceUrl,
          locator,
          evidenceCandidateId: evidence.evidenceCandidateId,
          confidence: characteristic.confidence,
          extractionMethod:
            characteristic.extractionMethod === "html_metadata"
              ? "rule_based"
              : characteristic.extractionMethod,
          status: "candidate",
          verificationStatus: "unverified",
          autoPublish: false,
          requiresHumanReview: true,
          warnings: [
            "Rule-based extraction; human review is required.",
            `profile:${characteristic.extractionProfile ?? "unknown"}`,
            `matchedPattern:${characteristic.matchedPattern ?? "unknown"}`,
            `matchedSynonym:${characteristic.matchedSynonym ?? "unknown"}`,
            `unitParsed:${characteristic.normalizedUnit ?? "none"}`,
          ],
        });
      }
      facts.push(
        ...explicitTextFacts({
          text,
          product: downloadReport.product,
          version,
        }),
      );
    }

    const dedupedFacts = dedupeFacts(facts);
    const claims = dedupedFacts
      .map((fact) => candidateClaimFromExtractedFact(fact))
      .filter((claim): claim is CandidateClaimHandoff => Boolean(claim));
    const extractionProfileSummary = coverageSummary(
      profileCoverageForCharacteristics({
        category: downloadReport.product.category,
        characteristics: extractedCharacteristicsForCoverage,
      }),
    );
    const report: TrustedDocumentExtractionProductReport = {
      product: downloadReport.product,
      documentVersions: downloadReport.documentVersions,
      extractedFactCandidates: dedupedFacts,
      evidenceCandidates: [
        ...new Map(
          evidenceCandidates.map((candidate) => [
            candidate.evidenceCandidateId,
            candidate,
          ]),
        ).values(),
      ],
      candidateClaims: claims,
      extractionProfileSummary,
      warnings,
      readiness: {
        hasDownloadedDocuments: downloadReport.documentVersions.length > 0,
        hasExtractedText: extractedTextDocuments > 0,
        hasCandidateClaims: claims.length > 0,
        canProceedToReview: extractedTextDocuments > 0 && claims.length > 0,
      },
    };
    productReports.push(report);
    await writeJsonAtomic(
      join(productReportDirectory, `${downloadReport.product.productSlug}.json`),
      report,
    );
  }

  const aggregate: TrustedDocumentExtractionReport = {
    productsProcessed: productReports.length,
    documentVersionsProcessed: productReports.reduce(
      (sum, report) => sum + report.documentVersions.length,
      0,
    ),
    extractedFactCandidates: productReports.reduce(
      (sum, report) => sum + report.extractedFactCandidates.length,
      0,
    ),
    evidenceCandidates: productReports.reduce(
      (sum, report) => sum + report.evidenceCandidates.length,
      0,
    ),
    candidateClaims: productReports.reduce(
      (sum, report) => sum + report.candidateClaims.length,
      0,
    ),
    productsReadyForReview: productReports.filter(
      (report) => report.readiness.canProceedToReview,
    ).length,
    extractionProfileSummary: {
      profilesUsed: [
        ...new Set(
          productReports.flatMap(
            (report) =>
              (report.extractionProfileSummary ?? emptyExtractionProfileSummary())
                .profilesUsed,
          ),
        ),
      ].sort(),
      patternsMatched: mergeCountMaps(productReports, "patternsMatched"),
      normalizedUnits: mergeCountMaps(productReports, "normalizedUnits"),
      averageCoveragePercent: productReports.length
        ? Math.round(
            productReports.reduce(
              (sum, report) =>
                sum +
                (report.extractionProfileSummary ?? emptyExtractionProfileSummary())
                  .coveragePercent,
              0,
            ) / productReports.length,
          )
        : 0,
    },
    productReports: productReports.map((report) => ({
      productSlug: report.product.productSlug,
      documentVersions: report.documentVersions.length,
      extractedFactCandidates: report.extractedFactCandidates.length,
      candidateClaims: report.candidateClaims.length,
      profilesUsed: (report.extractionProfileSummary ?? emptyExtractionProfileSummary())
        .profilesUsed,
      coveragePercent: (
        report.extractionProfileSummary ?? emptyExtractionProfileSummary()
      ).coveragePercent,
      canProceedToReview: report.readiness.canProceedToReview,
    })),
    warnings: productReports.flatMap((report) =>
      report.warnings.map(
        (warning) => `${report.product.productSlug}: ${warning}`,
      ),
    ),
  };
  await writeJsonAtomic(aggregateReportPath, aggregate);
  return { aggregate, productReports };
}

export async function downloadDiscoveredDocuments() {
  const discoveryReports = await loadDiscoveryReports();
  if (!discoveryReports.length) {
    const aggregate: TrustedDocumentDownloadReport = {
      productsProcessed: 0,
      attemptedDownloads: 0,
      downloadedArtifacts: 0,
      failedDownloads: 0,
      skippedDocuments: 0,
      documentVersions: 0,
      productsWithDownloadedDocuments: 0,
      productsReadyForExtraction: 0,
      productReports: [],
      warnings: [
        "Discovery reports were not found; run npm run discover:catalog-sources first.",
      ],
    };
    await writeJsonAtomic(DOWNLOAD_REPORT_PATH, aggregate);
    return { aggregate, productReports: [] };
  }
  return runTrustedDocumentDownloadForReports({ discoveryReports });
}

export async function extractDiscoveredDocuments() {
  const downloadReports = await loadDownloadProductReports();
  if (!downloadReports.length) {
    const aggregate: TrustedDocumentExtractionReport = {
      productsProcessed: 0,
      documentVersionsProcessed: 0,
      extractedFactCandidates: 0,
      evidenceCandidates: 0,
      candidateClaims: 0,
      productsReadyForReview: 0,
      extractionProfileSummary: {
        profilesUsed: [],
        patternsMatched: {},
        normalizedUnits: {},
        averageCoveragePercent: 0,
      },
      productReports: [],
      warnings: [
        "Downloaded document reports were not found; run npm run download:discovered-documents first.",
      ],
    };
    await writeJsonAtomic(EXTRACTION_REPORT_PATH, aggregate);
    return { aggregate, productReports: [] };
  }
  return runTrustedDocumentExtractionForReports({ downloadReports });
}

export async function processTrustedDocuments() {
  const download = await downloadDiscoveredDocuments();
  const extraction = await extractDiscoveredDocuments();
  return { download, extraction };
}

async function runCli() {
  const mode = process.argv[2] ?? "process";
  if (mode === "download") {
    const result = await downloadDiscoveredDocuments();
    console.log(
      `Trusted document download: attempted=${result.aggregate.attemptedDownloads}, downloaded=${result.aggregate.downloadedArtifacts}, failed=${result.aggregate.failedDownloads}`,
    );
    return;
  }
  if (mode === "extract") {
    const result = await extractDiscoveredDocuments();
    console.log(
      `Trusted document extraction: facts=${result.aggregate.extractedFactCandidates}, claims=${result.aggregate.candidateClaims}, ready=${result.aggregate.productsReadyForReview}`,
    );
    return;
  }
  const result = await processTrustedDocuments();
  console.log(
    `Trusted document processing: attempted=${result.download.aggregate.attemptedDownloads}, downloaded=${result.download.aggregate.downloadedArtifacts}, facts=${result.extraction.aggregate.extractedFactCandidates}, claims=${result.extraction.aggregate.candidateClaims}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
