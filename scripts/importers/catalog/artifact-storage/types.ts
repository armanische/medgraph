export const ARTIFACT_MANIFEST_SCHEMA_VERSION = "artifact-storage-manifest-v1";

export type ArtifactSizeBucket =
  | "0-1 MB"
  | "1-5 MB"
  | "5-10 MB"
  | "10-25 MB"
  | "25-50 MB"
  | ">50 MB";

export interface ResolvedArtifact {
  relativePath: string;
  absolutePath: string;
}

export interface ArtifactVerification {
  relativePath: string;
  sha256: string;
  expectedSha256: string | null;
  shaMatchesPath: boolean;
  sizeBytes: number;
  extension: string;
  mime: string;
  pdfSignature: boolean;
  htmlDetected: boolean;
  zeroByte: boolean;
}

export interface ArtifactInventoryEntry extends ArtifactVerification {
  manufacturer: string | null;
  referencedProducts: string[];
  referencedDocumentVersions: string[];
  referencedReviewItems: string[];
  referenceCount: number;
  orphan: boolean;
  duplicate: boolean;
  temporaryFile: boolean;
  invalidPdf: boolean;
  htmlMasquerading: boolean;
}

export interface DuplicateArtifactGroup {
  sha256: string;
  paths: string[];
  redundantCopies: number;
}

export interface AbsolutePathFinding {
  reportPath: string;
  jsonPath: string;
  value: string;
}

export interface ArtifactInventorySummary {
  artifactCount: number;
  artifactSizeBytes: number;
  sizeBuckets: Record<ArtifactSizeBucket, { count: number; sizeBytes: number }>;
  duplicateHashCount: number;
  duplicateFileCount: number;
  orphanCount: number;
  invalidPdfCount: number;
  htmlMasqueradingCount: number;
  zeroByteCount: number;
  temporaryFileCount: number;
  shaPathMismatchCount: number;
  absolutePathCount: number;
}

export interface ArtifactManifest {
  schemaVersion: typeof ARTIFACT_MANIFEST_SCHEMA_VERSION;
  generatedAt: "artifact-storage-audit-v1";
  artifactRoot: "data/research/artifacts" | string;
  summary: ArtifactInventorySummary;
  artifacts: ArtifactInventoryEntry[];
  duplicateHashes: DuplicateArtifactGroup[];
  duplicateFiles: DuplicateArtifactGroup[];
  orphanArtifacts: string[];
  invalidPdfs: string[];
  htmlMasquerading: string[];
  zeroByteFiles: string[];
  temporaryFiles: string[];
  shaPathMismatches: string[];
  absolutePaths: AbsolutePathFinding[];
  topLargestFiles: Array<{
    relativePath: string;
    sizeBytes: number;
    sha256: string;
  }>;
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CreateManifestOptions {
  repositoryRoot?: string;
  artifactRoot?: string;
  researchRoot?: string;
}
