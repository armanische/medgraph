export type ImportStatus =
  | "completed"
  | "partial"
  | "blocked"
  | "not-found";

export type ImportOutputStatus = ImportStatus | "completed_with_warnings";

export type ArtifactKind =
  | "registry-json"
  | "registry-html"
  | "document";

export interface RawArtifact {
  kind: ArtifactKind;
  sourceUrl: string;
  capturedAt: string;
  contentType: string;
  sha256: string;
  byteSize: number;
  filePath: string;
}

export interface RawRegistryRecord {
  provider: string;
  query: string;
  registrationNumber: string;
  registryRecordId: string | null;
  sourceUrl: string;
  capturedAt: string;
  payloads: unknown[];
  htmlArtifacts: RawArtifact[];
  jsonArtifacts: RawArtifact[];
  metadata: Record<string, unknown>;
}

export interface NormalizedDocumentLink {
  externalId: string;
  documentKey: string;
  documentType:
    | "registration"
    | "application"
    | "ifu"
    | "certificate"
    | "other";
  title: string;
  url: string;
}

export interface NormalizedRecord {
  provider: string;
  query: string;
  registrationNumber: string;
  registryRecordId: string | null;
  medicalDeviceName: string | null;
  manufacturer: string | null;
  status: string | null;
  issueDate: string | null;
  updatedDate: string | null;
  sourceUrl: string;
  documentLinks: NormalizedDocumentLink[];
}

export interface DownloadedArtifact {
  documentKey: string;
  documentType: NormalizedDocumentLink["documentType"];
  externalId: string;
  title: string;
  sourceUrl: string;
  contentType: string;
  byteSize: number;
  sha256: string;
  filePath: string;
  capturedAt: string;
}

export interface FailedDownload {
  documentKey: string;
  title: string;
  sourceUrl: string;
  reason: string;
  retryable: boolean;
}

export interface DocumentVersionPlan {
  versionId: string;
  documentKey: string;
  sourceUrl: string;
  sha256: string;
  previousSha256: string | null;
  supersedes: string | null;
  filePath: string;
  contentType: string;
  byteSize: number;
  acquiredAt: string;
}

export interface DocumentPlan {
  documentKey: string;
  externalId: string;
  documentType: NormalizedDocumentLink["documentType"];
  title: string;
  sourceUrl: string;
  versions: DocumentVersionPlan[];
}

export interface IngestionPlan {
  provider: string;
  query: string;
  registrationNumber?: string;
  subjectKey?: string;
  productSlug?: string;
  sourceProductKey?: string;
  registryRecordId: string | null;
  sourceUrl: string;
  rawArtifacts: RawArtifact[];
  documents: DocumentPlan[];
  documentVersions: DocumentVersionPlan[];
  downloadedFiles: DownloadedArtifact[];
  failedDownloads: FailedDownload[];
  evidenceCandidates: Array<{
    kind: "registry_record";
    locator: string;
    quotedText: string;
    status: "candidate";
    requiresHumanReview: true;
  }>;
  claimCandidates: Array<{
    suggestedClaimType: "product.registration_number";
    valuePayload: { number: string };
    status: "candidate";
    verificationStatus: "unverified";
    autoPublish: false;
  }>;
  status: ImportStatus;
  warnings: string[];
}

export interface ImportOutput {
  normalizedRecord: NormalizedRecord | null;
  ingestionPlan: IngestionPlan | null;
  manifestPath: string | null;
  downloadedArtifactPaths: string[];
  status: ImportOutputStatus;
  warnings: string[];
  diagnosticsPath?: string;
}

export interface ProviderAdapter {
  readonly provider: string;
  fetchRawRecord(query: string): Promise<RawRegistryRecord | null>;
  normalize(rawRecord: RawRegistryRecord): Promise<NormalizedRecord>;
  createIngestionPlan(
    rawRecord: RawRegistryRecord,
    normalizedRecord: NormalizedRecord,
  ): Promise<IngestionPlan>;
}
