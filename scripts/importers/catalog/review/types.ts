export type HumanReviewStatus =
  | "pending_review"
  | "in_review"
  | "approved"
  | "rejected"
  | "needs_changes"
  | "conflicted"
  | "archived";

export type PublicationReadinessStatus =
  | "not_ready"
  | "ready_for_publication"
  | "published"
  | "publication_blocked";

export type HumanReviewDecisionValue =
  | "start_review"
  | "approve"
  | "reject"
  | "request_changes"
  | "mark_conflict"
  | "reopen"
  | "archive";

export interface ReviewValueSnapshot {
  claimType: string;
  value: string;
  unit: string | null;
  productSlug: string;
  productTitle: string;
  manufacturer: string | null;
  model: string | null;
  category: string;
}

export interface ReviewEvidenceSnapshot {
  evidenceIds: string[];
  valid: boolean;
  integrityViolations: number;
}

export interface ReviewSourceSnapshot {
  urls: string[];
  official: boolean;
}

export interface ReviewDocumentVersionSnapshot {
  ids: string[];
  titles: string[];
  types: string[];
  artifactValid: boolean;
}

export interface PublicationEligibilitySnapshot {
  eligible: boolean;
  status: PublicationReadinessStatus;
  reasons: string[];
}

export interface HumanReviewDecision {
  id: string;
  idempotencyKey: string;
  reviewItemId: string;
  productSlug: string;
  reviewerId: string;
  decision: HumanReviewDecisionValue;
  previousStatus: HumanReviewStatus;
  nextStatus: HumanReviewStatus;
  comment: string;
  reviewedAt: string;
  snapshotHash: string;
  evidenceSnapshot: ReviewEvidenceSnapshot;
  valueSnapshot: ReviewValueSnapshot;
  sourceSnapshot: ReviewSourceSnapshot;
  documentVersionSnapshot: ReviewDocumentVersionSnapshot;
  conflictReason: string | null;
  publicationEligibility: PublicationEligibilitySnapshot;
  schemaVersion: "human-review-decision-v1";
}

export interface HumanReviewItemSnapshot {
  hash: string;
  evidence: ReviewEvidenceSnapshot;
  value: ReviewValueSnapshot;
  sources: ReviewSourceSnapshot;
  documentVersions: ReviewDocumentVersionSnapshot;
}

export interface HumanReviewSummary {
  schemaVersion: "human-review-summary-v1";
  generatedAt: string;
  totalItems: number;
  pending: number;
  inReview: number;
  approved: number;
  rejected: number;
  needsChanges: number;
  conflicted: number;
  archived: number;
  publicationReady: number;
  published: number;
  countsByManufacturer: Record<string, number>;
  countsByCategory: Record<string, number>;
  countsByReviewer: Record<string, number>;
  recentDecisions: Array<{
    id: string;
    reviewItemId: string;
    reviewerId: string;
    decision: HumanReviewDecisionValue;
    reviewedAt: string;
  }>;
}

export interface ReviewAuditIssue {
  code: string;
  message: string;
  decisionId?: string;
}

export interface ReviewAuditResult {
  valid: boolean;
  issues: ReviewAuditIssue[];
  decisions: number;
  orphanDecisions: number;
  duplicateIdempotencyKeys: number;
  staleSnapshots: number;
  invalidTransitions: number;
}

export interface ReviewDecisionStore {
  list(): Promise<HumanReviewDecision[]>;
  append(decision: HumanReviewDecision): Promise<{ decision: HumanReviewDecision; created: boolean }>;
}
