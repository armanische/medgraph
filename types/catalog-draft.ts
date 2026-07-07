export type DraftResearchStatus =
  | "needs_source"
  | "research_ready"
  | "partially_researched"
  | "blocked";

export interface DraftCatalogCard {
  slug: string;
  title: string;
  titleFromCatalog: string;
  brand: string | null;
  manufacturer: string | null;
  model: string | null;
  category: string;
  researchStatus: DraftResearchStatus;
  readinessScore: number;
  sourcesSummary: { total: number; official: number };
  documentsSummary: { total: number; downloaded: number };
  candidateClaimsCount: number;
  missingCriticalFields: string[];
}

export interface DraftSourceCandidate {
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  publisher: string;
  confidence: number;
  reason: string;
}

export interface DraftDocumentCandidate {
  documentType: string;
  title: string;
  url: string;
  sha256: string | null;
}

export interface DraftCharacteristic {
  category: string;
  label: string;
  value: string;
  unit: string | null;
  rawText: string;
  sourceUrl: string;
  sourceTitle: string;
  extractionMethod: string;
  confidence: number;
  status: "unverified";
}

export interface DraftEvidenceCandidate {
  evidenceCandidateId: string;
  sourceTitle: string;
  documentVersionId: string | null;
  quotedText: string;
}

export interface DraftCandidateClaim {
  claimId: string;
  suggestedClaimType: string;
  claimTypeCandidate: string;
  valuePayload: { value: string; unit: string | null };
  evidenceCandidateIds: string[];
  verificationStatus: "unverified";
  autoPublish: false;
  status: "candidate";
}

export interface DraftCatalogProduct extends DraftCatalogCard {
  catalogPage: number;
  status: "draft";
  warning: string;
  officialProductUrl: string | null;
  documents: DraftDocumentCandidate[];
  characteristics: DraftCharacteristic[];
  sourceCandidates: DraftSourceCandidate[];
  evidenceCandidates: DraftEvidenceCandidate[];
  candidateClaims: DraftCandidateClaim[];
  researchWarnings: string[];
  needsReview: true;
  lastResearchedAt: string;
  sourceQualityScore: number;
  reviewStatus: "pending";
  reviewPriority: "high" | "medium" | "low";
  reviewReasons: string[];
  suggestedReviewerRole: "medical_data_reviewer";
  blockingIssues: string[];
  conflicts: Array<{
    conflictId: string;
    field: string;
    values: Array<{
      value: string;
      sourceUrl: string;
      sourceTitle: string;
    }>;
  }>;
  missingCharacteristics: string[];
}

export interface CatalogProductsFile {
  generatedAt: string;
  researchProvider: string;
  products: DraftCatalogProduct[];
}
