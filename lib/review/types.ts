export type ReviewerQueueStatus = "pending" | "ready" | "needs_evidence" | "conflict";
export type ReviewerPriority = "critical" | "high" | "medium" | "low";
export type ReviewerRisk = "high" | "medium" | "low";
export type ReviewerFilter = "all" | "pending" | "high" | "conflict" | "needs_evidence";
export type ReviewerDraftDecisionValue =
  | "approve"
  | "reject"
  | "need_more_evidence"
  | "conflict";

export interface ReviewerProductQueueItem {
  productSlug: string;
  productTitle: string;
  manufacturer: string;
  factsCount: number;
  priority: ReviewerPriority;
  status: ReviewerQueueStatus;
  readyCount: number;
  pendingCount: number;
  needsEvidenceCount: number;
  conflictCount: number;
}

export interface ReviewerDocumentPreview {
  documentTitle: string;
  documentVersion: string;
  documentHash: string;
  page: string;
  locator: string;
  sourceUrl: string;
}

export interface ReviewerHistoryEvent {
  eventId: string;
  type: "creation" | "review" | "decision_draft";
  label: string;
  actor: string;
  timestamp: string;
  notes: string;
}

export interface ReviewerCandidateFact {
  factId: string;
  productSlug: string;
  characteristic: string;
  value: string;
  source: string;
  documentVersion: string;
  evidence: string;
  lastUpdated: string;
  status: ReviewerQueueStatus;
  priority: ReviewerPriority;
  risk: ReviewerRisk;
  documentPreview: ReviewerDocumentPreview;
  history: ReviewerHistoryEvent[];
}

export interface ReviewerDecisionDraft {
  draftId: string;
  factId: string;
  decision: ReviewerDraftDecisionValue;
  reviewer: string;
  notes: string;
  createdAt: string;
  localOnly: true;
}

export interface ReviewerWorkspaceStats {
  pending: number;
  highPriority: number;
  ready: number;
  rejectedDraft: number;
  averageReviewTime: string;
}

export interface ReviewerWorkspaceModel {
  generatedAt: string;
  products: ReviewerProductQueueItem[];
  facts: ReviewerCandidateFact[];
  stats: ReviewerWorkspaceStats;
  safetyBoundaries: string[];
}
