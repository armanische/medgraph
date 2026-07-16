export type ComplianceStatus =
  | "matches"
  | "does_not_match"
  | "partially_matches"
  | "not_verified"
  | "unknown";

export type TenderRiskLevel = "Low" | "Medium" | "High";
export type TenderWorkflowStep =
  | "select_product"
  | "edit_requirements"
  | "analysis"
  | "result";

export type TenderRuleOperator =
  | "numeric_gte"
  | "numeric_lte"
  | "numeric_eq"
  | "boolean"
  | "enum"
  | "string_exact"
  | "string_contains";

export type TenderValue = string | number | boolean | string[];

export interface ComplianceEvidence {
  source: {
    id: string;
    title: string;
    url: string;
    type: string;
  };
  documentVersion: {
    id: string;
    title: string;
    version: string;
  };
  evidenceIds: string[];
  lastUpdated: string;
}

export interface TenderRequirement {
  requirementId: string;
  label: string;
  category: string;
  operator: TenderRuleOperator;
  expectedValue: TenderValue;
  unit: string | null;
}

export interface TenderProductValue {
  characteristicKey: string;
  label: string;
  value: TenderValue | null;
  unit: string | null;
  sourceKind: "published_knowledge" | "publication_ready_report" | "candidate_claim";
  evidence: ComplianceEvidence | null;
}

export interface RequirementResult {
  requirement: TenderRequirement;
  productValue: TenderProductValue | null;
  status: ComplianceStatus;
  actualValueLabel: string;
  expectedValueLabel: string;
  evidence: ComplianceEvidence | null;
  notes: string[];
}

export interface ComplianceResult {
  tenderTitle: string;
  product: {
    slug: string;
    title: string;
    manufacturer: string;
    category: string;
  };
  results: RequirementResult[];
  summary: {
    totalRequirements: number;
    matches: number;
    doesNotMatch: number;
    partiallyMatches: number;
    notVerified: number;
    unknown: number;
    riskLevel: TenderRiskLevel;
  };
  warnings: string[];
}

export interface PublishedTenderProduct {
  slug: string;
  title: string;
  manufacturer: string;
  category: string;
  status: "published_projection";
  values: TenderProductValue[];
}

export interface TenderRequirementDraft {
  characteristicKey: string;
  label: string;
  category: string;
  operator: TenderRuleOperator;
  expectedValueInput: string;
  unit: string | null;
}

export interface TenderWorkflowAnalysisInput {
  tenderTitle: string;
  productSlug: string;
  drafts: TenderRequirementDraft[];
}
