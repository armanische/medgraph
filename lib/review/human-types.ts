import type {
  HumanReviewDecisionValue,
  HumanReviewStatus,
  PublicationReadinessStatus,
} from "../../scripts/importers/catalog/review/types.ts";

export type HumanReviewerWorkspaceScope = "pilot" | "all";

export interface HumanReviewerHistoryEntry {
  id: string;
  reviewerId: string;
  decision: HumanReviewDecisionValue;
  previousStatus: HumanReviewStatus;
  nextStatus: HumanReviewStatus;
  comment: string;
  reviewedAt: string;
  snapshotHash: string;
  snapshotValue: string;
  snapshotUnit: string | null;
  publicationEligible: boolean;
  publicationReasons: string[];
}

export interface HumanReviewerItem {
  reviewItemId: string;
  snapshotHash: string;
  productSlug: string;
  productTitle: string;
  manufacturer: string;
  category: string;
  characteristic: string;
  value: string;
  unit: string | null;
  rawText: string;
  evidenceSource: string;
  officialSourceUrl: string;
  documentType: string;
  documentVersion: string;
  artifactStatus: "valid" | "invalid" | "missing";
  locator: string;
  extractionProfile: string;
  confidence: number | null;
  warnings: string[];
  updatedAt: string;
  currentStatus: HumanReviewStatus;
  publicationStatus: PublicationReadinessStatus;
  publicationReasons: string[];
  priority: "critical" | "high" | "medium" | "low";
  risk: "high" | "medium" | "low";
  history: HumanReviewerHistoryEntry[];
}

export interface HumanReviewerProduct {
  productSlug: string;
  productTitle: string;
  manufacturer: string;
  category: string;
  total: number;
  approved: number;
  rejected: number;
  missing: number;
  conflicts: number;
  coverage: number;
  evidenceCompleteness: number;
  documents: number;
  compatibility: number;
  publicationStatus: PublicationReadinessStatus;
  publicationReasons: string[];
}

export interface HumanReviewerWorkspaceModel {
  reviewerIdConfigured: boolean;
  fixtureMode: boolean;
  products: HumanReviewerProduct[];
  items: HumanReviewerItem[];
  counters: {
    pending: number;
    inReview: number;
    approved: number;
    rejected: number;
    needsChanges: number;
    conflicted: number;
    readyForPublication: number;
    published: number;
  };
}
