import type { ComparisonResult } from "../compare/types.ts";
import type { CompatibilityResult } from "../compatibility/types.ts";
import type { SearchResponse } from "../search/index.ts";
import type { ComplianceResult } from "../tender/types.ts";

export interface WorkspaceSelection {
  primaryProductSlug: string;
  comparedProductSlugs: string[];
  searchQuery: string;
  tenderTitle: string;
}

export interface WorkspaceInsight {
  insightId: string;
  severity: "info" | "attention" | "warning";
  title: string;
  description: string;
  sourcePanel: "search" | "compare" | "compatibility" | "tender";
}

export interface WorkspaceRecommendation {
  recommendationId: string;
  label: string;
  href: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface WorkspaceSession {
  sessionId: string;
  createdAt: string;
  selection: WorkspaceSelection;
  search: SearchResponse;
  comparison: ComparisonResult;
  compatibility: CompatibilityResult;
  tender: ComplianceResult;
  insights: WorkspaceInsight[];
  recommendations: WorkspaceRecommendation[];
  warnings: string[];
}
