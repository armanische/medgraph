/**
 * Import contracts are framework- and storage-agnostic.
 *
 * They are the only types shared by parser, normalization and the core pipeline.
 * Storefront, Review, Publication and Cloud adapters deliberately define their
 * own projections outside this module.
 */

export const CONFIDENCE_LEVELS = [
  "verified",
  "reviewed",
  "legacy",
  "inferred",
  "unknown",
] as const;

export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export interface LegacyCharacteristicInput {
  label: string;
  value: string | null;
  group?: string | null;
}

export interface LegacyImageInput {
  sourceUrl?: string | null;
  localSourcePath?: string | null;
  filename: string;
  role?: "primary" | "gallery" | "document_preview" | "unknown";
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  checksum?: string | null;
  rightsStatus?: "confirmed" | "unknown" | "restricted";
}

export interface LegacyDocumentInput {
  title: string;
  url: string;
  kind?: string | null;
  language?: string | null;
  official?: boolean;
}

/** Raw, factual input from a legacy product source. */
export interface LegacySourceInput {
  sourceId: string;
  sourceKind: "legacy_product" | "existing_storefront_control";
  sourceUrl: string | null;
  sourcePath: string;
  legacySlug: string;
  legacyTitle: string | null;
  rawManufacturer: string | null;
  rawCategory: string | null;
  rawApplicationAreas: string[];
  rawDescription: string | null;
  rawCharacteristics: LegacyCharacteristicInput[];
  rawBulletItems: string[];
  rawImages: LegacyImageInput[];
  rawDocuments: LegacyDocumentInput[];
  rawAccessories: string[];
  rawRegistrationData: string | null;
  rawModel?: string | null;
  rawPackageContents?: string[];
  extractedAt: string;
  sourceChecksum?: string;
}

export interface SourceSnapshot extends LegacySourceInput {
  sourceChecksum: string;
}

/** Parser output. Values are copied from the source before reference resolution. */
export interface ExtractedProduct {
  sourceId: string;
  titleRaw: string | null;
  manufacturerRaw: string | null;
  categoryRaw: string | null;
  applicationAreasRaw: string[];
  modelRaw: string | null;
  descriptionRaw: string | null;
  characteristicsRaw: LegacyCharacteristicInput[];
  bulletItemsRaw: string[];
  imagesRaw: LegacyImageInput[];
  documentsRaw: LegacyDocumentInput[];
  accessoriesRaw: string[];
  registrationRaw: string | null;
  packageContentsRaw: string[];
}

/** A normalized lookup result. It does not imply a Review workflow decision. */
export interface NormalizedReference {
  id: string | null;
  matchedBy: string | null;
  matchedValue: string | null;
  confidence: Confidence;
  candidates: string[];
  warnings: string[];
  errors: string[];
  requiresManualVerification: boolean;
  rationale: string;
}

export type NormalizedManufacturer = NormalizedReference;

export interface NormalizedCategory extends NormalizedReference {
  mappingType: string | null;
  matchedLegacyValue: string | null;
}

export interface NormalizedApplicationArea {
  applicationAreaIds: string[];
  matchedValues: Array<{ rawValue: string; applicationAreaId: string; matchedBy: string }>;
  unresolvedValues: string[];
  confidence: Confidence;
  warnings: string[];
  requiresManualVerification: boolean;
}

export interface NormalizedSpecification {
  key: string;
  displayName: string;
  rawValue: string;
  normalizedValue: string;
  unit: string | null;
  sourceReference: string;
  confidence: Confidence;
  requiresManualVerification: boolean;
  sortOrder: number;
}

/** Backwards-compatible name for a normalized specification. */
export type NormalizedCharacteristic = NormalizedSpecification;

export interface NormalizedImage {
  sourceUrl: string | null;
  localSourcePath: string | null;
  legacyFilename: string;
  proposedFilename: string;
  roleCandidate: "primary" | "gallery" | "document_preview" | "unknown";
  width: number | null;
  height: number | null;
  mimeType: string | null;
  checksum: string | null;
  rightsStatus: "confirmed" | "unknown" | "restricted";
  confidence: Confidence;
  warnings: string[];
}

export interface NormalizedDocument {
  title: string;
  url: string;
  kind: string | null;
  language: string | null;
  official: boolean;
  confidence: Confidence;
}

export type RegistrationStatus = "no_data" | "legacy_claim_only";

export interface NormalizedRegistration {
  status: RegistrationStatus;
  rawValue: string | null;
  publicValue: null;
  warning: string | null;
}

export interface ImportProvenance {
  fieldPath: string;
  sourceType:
    | "legacy_page"
    | "legacy_json"
    | "manufacturer_reference"
    | "category_reference"
    | "application_area_reference"
    | "generated_normalization";
  sourceId: string;
  sourceLocation: string;
  rawValue: unknown;
  normalizedValue: unknown;
  transformation: string;
  resolver: string | null;
  confidence: Confidence;
  createdAt: string;
}

/** The storage-agnostic result of parsing and normalizing one legacy record. */
export interface NormalizedProduct {
  sourceId: string;
  slug: string;
  name: string | null;
  model: string | null;
  manufacturer: NormalizedManufacturer;
  category: NormalizedCategory;
  applicationAreas: NormalizedApplicationArea;
  shortDescription: string | null;
  fullDescription: string | null;
  bulletItems: string[];
  specifications: NormalizedSpecification[];
  images: NormalizedImage[];
  documents: NormalizedDocument[];
  accessories: string[];
  packageContents: string[];
  registration: NormalizedRegistration;
  updatedAt: string;
}

export type ImportDiagnosticSeverity = "warning" | "error";

export interface ImportDiagnostic {
  code: string;
  fieldPath: string;
  message: string;
  severity: ImportDiagnosticSeverity;
}

export interface PipelineError extends ImportDiagnostic {
  severity: "error";
}

export interface PipelineWarning extends ImportDiagnostic {
  severity: "warning";
}

/** A portable hint for downstream human-facing adapters, not a Review state. */
export interface NormalizedReviewHint {
  disposition: "blocked" | "requires_manual_verification";
  requiredChecks: string[];
  errorCodes: string[];
  warningCodes: string[];
}

export interface PipelineResult {
  source: SourceSnapshot;
  extracted: ExtractedProduct;
  normalizedProduct: NormalizedProduct;
  provenance: ImportProvenance[];
  diagnostics: ImportDiagnostic[];
  errors: PipelineError[];
  warnings: PipelineWarning[];
  reviewHint: NormalizedReviewHint;
}

export interface ManufacturerReference {
  id: string;
  canonicalName: string;
  displayName: string;
  aliases: string[];
  confidence: Confidence;
  publicationStatus: string;
}

export interface CategoryReference {
  id: string;
  canonicalName: string;
  displayName: string;
  aliases: string[];
  assignable: boolean;
  level: "root" | "child" | "leaf";
  confidence: Confidence;
  publicationStatus: string;
}

export interface LegacyCategoryMapping {
  legacyValue: string;
  normalizedLegacyValue: string;
  targetCategoryId: string | null;
  targetCategoryCandidates: string[];
  mappingType: string;
  confidence: Confidence;
  requiresManualVerification: boolean;
  blocksPublication: boolean;
  rationale: string;
}

export interface ApplicationAreaReference {
  id: string;
  canonicalName: string;
  displayName: string;
  aliases: string[];
  confidence: Confidence;
}

export interface ImportReferenceData {
  manufacturers: ManufacturerReference[];
  categories: CategoryReference[];
  mappings: LegacyCategoryMapping[];
  applicationAreas: ApplicationAreaReference[];
}

export interface LegacyImportRequest {
  source: LegacySourceInput;
  references: ImportReferenceData;
  runTimestamp: string;
}

export interface PilotManifestProduct {
  sourceId: string;
  legacySlug: string;
  sourcePath: string;
  expectedExistingProductSlug: string | null;
  notes: string[];
}

export interface PilotManifest {
  version: "1.0.0";
  runId: string;
  runTimestamp: string;
  products: PilotManifestProduct[];
}

/** Compatibility aliases retained for consumers during the architectural split. */
export type ResolutionResult = NormalizedReference;
export type CategoryResolution = NormalizedCategory;
export type ApplicationAreaResolution = NormalizedApplicationArea;
export type RegistrationResolution = NormalizedRegistration;
export type FieldProvenance = ImportProvenance;
