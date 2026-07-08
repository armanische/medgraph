export const CATALOG_SEED_WARNING =
  "Каталог используется только как перечень позиций, не как источник характеристик";

export const DRAFT_PRODUCT_WARNING =
  "Карточка создана автоматически и не прошла Verification. Данные являются кандидатными и требуют проверки.";

export interface CatalogSeedItem {
  titleFromCatalog: string;
  normalizedTitle: string;
  brandCandidate: string | null;
  modelCandidate: string | null;
  category: string;
  catalogPage: number;
  slug: string;
  status: "seed_only";
  needsIndependentResearch: true;
}

export interface CatalogSeed {
  source: {
    fileName: string;
    sourceType: "catalog_seed_only";
    warning: string;
  };
  items: CatalogSeedItem[];
}

export type SourceCandidateType =
  | "official_manufacturer_page"
  | "manufacturer_product_page"
  | "official_manufacturer"
  | "datasheet"
  | "ifu"
  | "brochure"
  | "service_manual"
  | "regulatory_registry"
  | "fda"
  | "eudamed"
  | "official_distributor"
  | "scientific_publication"
  | "other";

export interface SourceCandidate {
  sourceTitle: string;
  sourceUrl: string;
  sourceType: SourceCandidateType;
  publisher: string;
  detectedManufacturer: string | null;
  detectedModel: string | null;
  confidence: number;
  rankScore: number;
  reason: string;
  discoveredAt: string;
  status: "candidate";
  warnings: string[];
}

export type DocumentCandidateType =
  | "ifu"
  | "datasheet"
  | "brochure"
  | "registration"
  | "registration_certificate"
  | "certificate"
  | "manual"
  | "service_manual"
  | "technical_specification"
  | "other";

export interface DocumentCandidate {
  documentType: DocumentCandidateType;
  title: string;
  url: string;
  publisher: string;
  mimeType: string | null;
  sizeBytes: number | null;
  downloadedAt: string | null;
  sha256: string | null;
  artifactPath: string | null;
  sourceUrl: string;
  status: "candidate";
  warnings: string[];
}

export interface ResearchDiscovery {
  sources: SourceCandidate[];
  documents: Array<
    DocumentCandidate & {
      /** Test/provider hand-off only; never derived from search snippets. */
      extractionText?: string;
    }
  >;
  warnings: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface ResearchProvider {
  readonly name: string;
  discover(item: CatalogSeedItem): Promise<ResearchDiscovery>;
}

export interface ManualSourceSeedFile {
  products: Array<{
    slug: string;
    officialSources: Array<{
      url: string;
      sourceType?: SourceCandidateType;
      publisher: string;
      title?: string;
    }>;
  }>;
}

export interface DocumentDownloader {
  download(document: DocumentCandidate): Promise<DocumentCandidate>;
}

export type CharacteristicCategory =
  | "manufacturer"
  | "model"
  | "deviceType"
  | "country"
  | "registrationNumber"
  | "dimensions"
  | "weight"
  | "display"
  | "power"
  | "battery"
  | "operatingModes"
  | "measurementRanges"
  | "accuracy"
  | "interfaces"
  | "compatibility"
  | "consumables"
  | "accessories"
  | "safetyFeatures"
  | "warnings"
  | "contraindications"
  | "intendedUse"
  | "patientGroup"
  | "environment"
  | "storage"
  | "maintenance"
  | "serviceInterval"
  | "softwareVersion"
  | "warrantyService";

export interface EvidenceLocator {
  page: number | null;
  section: string | null;
  heading: string | null;
  table: string | null;
  paragraph: number | null;
}

export interface CandidateCharacteristic {
  category: CharacteristicCategory;
  label: string;
  value: string;
  unit: string | null;
  rawText: string;
  sourceUrl: string;
  sourceTitle: string;
  documentKey: string | null;
  documentTitle: string | null;
  documentType: DocumentCandidateType | null;
  documentSha256: string | null;
  documentVersion: string | null;
  locator: EvidenceLocator;
  extractionMethod: "rule_based" | "html_metadata" | "pdf_text";
  confidence: number;
  status: "unverified";
  needsReview: true;
}

export interface CharacteristicExtractionInput {
  product: CatalogSeedItem;
  source: SourceCandidate;
  document: DocumentCandidate | null;
  text: string;
  extractionMethod: CandidateCharacteristic["extractionMethod"];
}

export interface CharacteristicExtractor {
  extract(input: CharacteristicExtractionInput): CandidateCharacteristic[];
}

export interface EvidenceCandidate {
  evidenceCandidateId: string;
  kind: "document_excerpt" | "html_metadata";
  sourceUrl: string;
  sourceTitle: string;
  documentKey: string | null;
  documentVersionId: string | null;
  documentTitle: string | null;
  documentType: DocumentCandidateType | null;
  locator: EvidenceLocator;
  quotedText: string;
  rawText: string;
  sha256: string | null;
  documentVersion: string | null;
  confidence: number;
  status: "candidate";
}

export interface ManufacturerCandidate {
  name: string;
  officialHosts: string[];
  confidence: number;
  reason: string;
  status: "candidate";
}

export interface ManufacturerResolution {
  candidates: ManufacturerCandidate[];
  selected: ManufacturerCandidate | null;
  ambiguous: boolean;
  warnings: string[];
}

export interface ManufacturerResolver {
  resolve(
    product: CatalogSeedItem,
    sources: SourceCandidate[],
  ): ManufacturerResolution;
}

export interface SourceFinder {
  find(
    product: CatalogSeedItem,
    manufacturer: ManufacturerResolution,
  ): Promise<ResearchDiscovery>;
}

export interface SourceRanker {
  rank(source: SourceCandidate): number;
}

export interface DocumentFinder {
  find(discovery: ResearchDiscovery): DocumentCandidate[];
}

export interface EvidenceBuilder {
  build(characteristic: CandidateCharacteristic): EvidenceCandidate;
}

export interface ResearchConflict {
  conflictId: string;
  field: string;
  characteristic: string;
  values: Array<{
    value: string;
    unit: string | null;
    sourceUrl: string;
    sourceTitle: string;
  }>;
  status: "needs_review";
  resolution: null;
}

export interface ConflictDetector {
  detect(
    product: CatalogSeedItem,
    characteristics: CandidateCharacteristic[],
  ): ResearchConflict[];
}

export interface MissingInformationDetector {
  detect(characteristics: CandidateCharacteristic[]): string[];
}

export interface CandidateClaim {
  claimId: string;
  productSlug: string;
  subjectType: "product";
  suggestedClaimType: string;
  claimTypeCandidate: string;
  valuePayload: { value: string; unit: string | null };
  scopePayload: Record<string, unknown>;
  rawText: string;
  evidenceCandidateIds: string[];
  confidence: number;
  extractionMethod: CandidateCharacteristic["extractionMethod"];
  status: "candidate";
  verificationStatus: "unverified";
  autoPublish: false;
  needsReview: true;
  warnings: string[];
}

export interface CandidateClaimBuilder {
  build(
    product: CatalogSeedItem,
    characteristics: CandidateCharacteristic[],
  ): CandidateClaim[];
}

export type ResearchStatus =
  | "needs_source"
  | "research_ready"
  | "partially_researched"
  | "blocked";

export type BlockingIssue =
  | "no_official_source"
  | "no_document"
  | "ambiguous_model"
  | "duplicate_candidate"
  | "conflicting_sources"
  | "missing_registration"
  | "download_failed"
  | "parse_failed"
  | "no_characteristics";

export interface ProductResearchReport {
  productSlug: string;
  titleFromCatalog: string;
  normalizedTitle: string;
  manufacturerCandidate: ManufacturerResolution;
  modelCandidate: string | null;
  category: string;
  researchStatus: ResearchStatus;
  sourcesFound: number;
  officialSourcesFound: number;
  documentsFound: number;
  documentsDownloaded: number;
  characteristicsExtracted: number;
  candidateClaimsCreated: number;
  conflictsFound: number;
  missingCriticalFields: string[];
  missingOptionalFields: string[];
  warnings: string[];
  generatedAt: string;
  sources: SourceCandidate[];
  documents: DocumentCandidate[];
  documentVersions: Array<{
    documentKey: string;
    documentVersionId: string;
    sha256: string;
    sourceUrl: string;
    artifactPath: string;
  }>;
  facts: CandidateCharacteristic[];
  evidenceCandidates: EvidenceCandidate[];
  characteristics: CandidateCharacteristic[];
  candidateClaims: CandidateClaim[];
  reviewReadiness: {
    sourceQualityScore: number;
    documentCoverageScore: number;
    characteristicCoverageScore: number;
    conflictPenalty: number;
    readinessScore: number;
  };
  reviewStatus: "pending";
  reviewPriority: "high" | "medium" | "low";
  reviewReasons: string[];
  suggestedReviewerRole: "medical_data_reviewer";
  blockingIssues: BlockingIssue[];
  sourceQualityScore: number;
  readinessScore: number;
  conflicts: ResearchConflict[];
  missingCharacteristics: string[];
  uniqueArtifacts: number;
}

export interface DraftCatalogProduct {
  slug: string;
  title: string;
  titleFromCatalog: string;
  brand: string | null;
  manufacturer: string | null;
  model: string | null;
  category: string;
  catalogPage: number;
  shortDescription: string | null;
  imageUrl: null;
  imageSourceUrl: null;
  officialProductUrl: string | null;
  documents: DocumentCandidate[];
  characteristics: CandidateCharacteristic[];
  sourceCandidates: SourceCandidate[];
  evidenceCandidates: EvidenceCandidate[];
  candidateClaims: CandidateClaim[];
  researchStatus: ResearchStatus;
  status: "draft";
  warning: string;
  researchWarnings: string[];
  sourcesSummary: { total: number; official: number };
  documentsSummary: { total: number; downloaded: number };
  characteristicsPreview: CandidateCharacteristic[];
  candidateClaimsCount: number;
  needsReview: true;
  lastResearchedAt: string;
  missingCriticalFields: string[];
  sourceQualityScore: number;
  readinessScore: number;
  reviewStatus: "pending";
  reviewPriority: ProductResearchReport["reviewPriority"];
  reviewReasons: string[];
  suggestedReviewerRole: ProductResearchReport["suggestedReviewerRole"];
  blockingIssues: BlockingIssue[];
  conflicts: ResearchConflict[];
  missingCharacteristics: string[];
}

export interface CatalogProductsFile {
  generatedAt: string;
  researchProvider: string;
  products: DraftCatalogProduct[];
}

export interface CatalogResearchAggregateReport {
  totalProducts: number;
  processedProducts: number;
  totalSeedItems: number;
  uniqueProducts: number;
  researchedProducts: number;
  partiallyResearchedProducts: number;
  productsNeedingSource: number;
  researchReadyProducts: number;
  blockedProducts: number;
  failedProducts: number;
  totalSourcesFound: number;
  totalOfficialSourcesFound: number;
  totalDocumentsFound: number;
  totalDocumentsDownloaded: number;
  totalArtifactsCreated: number;
  totalFactsExtracted: number;
  totalEvidenceCandidates: number;
  totalCandidateClaims: number;
  totalConflicts: number;
  totalMissingCharacteristics: number;
  duplicateProducts: CatalogImportReport["suspectedDuplicates"];
  productsWithoutSources: string[];
  productsWithoutDocuments: string[];
  productsReadyForHumanReview: string[];
  generatedAt: string;
  warnings: string[];
}

export interface CatalogImportReport {
  generatedAt: string;
  sourceFile: string;
  extractedPositions: number;
  uniqueProducts: number;
  successfullyNormalized: number;
  requiresManualReview: number;
  independentSourcesFound: number;
  productsWithoutSources: number;
  suspectedDuplicates: Array<{
    canonicalKey: string;
    kept: { title: string; page: number };
    duplicate: { title: string; page: number };
  }>;
  uncertainRecognitions: Array<{
    title: string;
    page: number;
    reasons: string[];
  }>;
  warnings: string[];
}
