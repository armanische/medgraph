export interface PublicationReviewItem {
  reviewItemId: string;
  claimCandidateId?: string;
  productSlug: string;
  productTitle: string;
  suggestedClaimType: string;
  valuePayload: { value: string; unit: string | null };
  evidenceCandidateIds: string[];
  documentVersionIds: string[];
  sourceUrls: string[];
  status: string;
  priority?: "critical" | "high" | "medium" | "low";
  riskLevel?: "high" | "medium" | "low";
  reasons?: string[];
  updatedAt: string;
}

export interface PublicationReviewProduct {
  product: {
    productSlug: string;
    manufacturer: string | null;
    productName: string;
    model: string | null;
    category: string;
  };
  reviewItems: PublicationReviewItem[];
  sourceDocumentSummary: Array<{
    documentVersionId: string;
    documentType: string;
    title: string;
    sourceUrl: string;
    sha256: string;
  }>;
}

export interface PublicationReviewDecision {
  id: string;
  reviewItemId: string;
  productSlug: string;
  decision: "start_review" | "approve" | "reject" | "request_changes" | "mark_conflict" | "reopen" | "archive";
  nextStatus: "pending_review" | "in_review" | "approved" | "rejected" | "needs_changes" | "conflicted" | "archived";
  reviewedAt: string;
  snapshotHash: string;
  publicationEligibility: {
    eligible: boolean;
    status: "not_ready" | "ready_for_publication" | "published" | "publication_blocked";
    reasons: string[];
  };
}

export interface PublicationArtifact {
  sha256: string;
  referencedDocumentVersions: string[];
  referencedReviewItems: string[];
  orphan: boolean;
  invalidPdf: boolean;
  htmlMasquerading: boolean;
  zeroByte: boolean;
  shaMatchesPath: boolean;
}

export interface PublicationIntegrityViolation {
  productSlug?: string;
  entityId?: string;
  missingEvidenceId?: string | null;
  documentVersionId?: string | null;
}

export interface PublishedSpecification {
  type: string;
  value: string;
  unit: string | null;
}

export interface PublishedDocument {
  title: string;
  type: string;
  url: string;
}

export interface PublishedSource {
  title: string;
  url: string;
}

export interface PublishedProduct {
  id: string;
  slug: string;
  manufacturer: string;
  manufacturerSlug: string;
  model: string | null;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  specifications: PublishedSpecification[];
  compatibility: string[];
  documents: PublishedDocument[];
  officialSources: PublishedSource[];
  updatedAt: string;
  verificationLevel: "reviewed";
  coverage: number;
  status: "published";
}

export interface PublishedManufacturer {
  id: string;
  slug: string;
  name: string;
  categories: string[];
  productSlugs: string[];
  productCount: number;
}

export interface PublishedCategory {
  id: string;
  slug: string;
  name: string;
  productSlugs: string[];
  productCount: number;
}

export interface PublishedKnowledgeEntry {
  id: string;
  slug: string;
  productSlug: string;
  title: string;
  description: string;
  specifications: PublishedSpecification[];
  compatibility: string[];
  documents: PublishedDocument[];
  officialSources: PublishedSource[];
  updatedAt: string;
}

export type PublicationBlockReason =
  | "not_ready"
  | "rejected"
  | "missing_evidence"
  | "missing_document_version"
  | "missing_artifact"
  | "missing_source"
  | "integrity_violation"
  | "verification_conflict"
  | "invalid_product_identity"
  | "invalid_decision"
  | "stale_approval"
  | "not_selected"
  | "required_field_missing";

export interface PublicationBlockedItem {
  productSlug: string;
  reason: PublicationBlockReason;
}

export interface PublicationKpi {
  publishedProducts: number;
  publishedItems: number;
  blocked: number;
  rejected: number;
  manufacturers: number;
  categories: number;
  knowledgeEntries: number;
}

export interface PublishedCatalog {
  schemaVersion: "published-catalog-v2";
  generatedAt: string;
  products: PublishedProduct[];
  manufacturers: PublishedManufacturer[];
  categories: PublishedCategory[];
  knowledge: PublishedKnowledgeEntry[];
  kpi: PublicationKpi;
  blockedByReason: Partial<Record<PublicationBlockReason, number>>;
}

export interface PublicationBuildInput {
  reviewProducts: PublicationReviewProduct[];
  decisions: PublicationReviewDecision[];
  artifacts: PublicationArtifact[];
  integrityViolations: PublicationIntegrityViolation[];
  verificationConflictReviewItemIds?: string[];
  selectedProductSlugs?: string[];
  generatedAt?: string;
}

export interface FirstPublicationCandidate {
  productSlug: string;
  productName: string;
  manufacturer: string;
  available: boolean;
  totalItems: number;
  approvedItems: number;
  rejectedItems: number;
  pendingItems: number;
  publicationEligible: boolean;
  blockingReasons: Partial<Record<PublicationBlockReason, number>>;
  reviewerPath: "/internal/reviewer";
}

export interface FirstPublicationCandidateReport {
  schemaVersion: "first-publication-candidates-v1";
  candidates: FirstPublicationCandidate[];
  eligibleProducts: number;
  approvedItems: number;
  automaticApprovalsCreated: 0;
}

export interface PublicationBuildResult {
  catalog: PublishedCatalog;
  blockedItems: PublicationBlockedItem[];
  internalManifest: {
    schemaVersion: "publication-approval-manifest-v1";
    generatedAt: string;
    products: Array<{ productSlug: string; approvedDecisionIds: string[] }>;
  };
}

export interface PublicationAuditIssue {
  code: string;
  message: string;
  path?: string;
}

export interface PublicationAuditResult {
  valid: boolean;
  issues: PublicationAuditIssue[];
  kpi: PublicationKpi;
}
