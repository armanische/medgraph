export type ComparisonValueStatus =
  | "published"
  | "publication_ready"
  | "verified"
  | "not_available";

export type ComparisonDataSource =
  | "published_knowledge"
  | "publication_ready_report"
  | "candidate_claims";

export interface ComparisonEvidence {
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
    sha256: string;
  };
  evidenceIds: string[];
  confidence: number;
  lastUpdated: string;
}

export interface ComparisonValue {
  value: string | number | boolean | null;
  unit: string | null;
  status: ComparisonValueStatus;
  source: ComparisonEvidence["source"] | null;
  documentVersion: ComparisonEvidence["documentVersion"] | null;
  evidenceIds: string[];
  confidence: number | null;
  lastUpdated: string | null;
}

export interface ComparisonCharacteristic {
  key: string;
  label: string;
  group: string;
  value: ComparisonValue;
}

export interface ComparisonProduct {
  productId: string;
  slug: string;
  title: string;
  manufacturer: string;
  model: string;
  category: string;
  dataSource: ComparisonDataSource;
  characteristics: ComparisonCharacteristic[];
}

export type ComparisonDifferenceType =
  | "same"
  | "different"
  | "missing"
  | "unit_mismatch"
  | "status_mismatch";

export interface ComparisonRow {
  characteristicKey: string;
  label: string;
  group: string;
  left: ComparisonValue;
  right: ComparisonValue;
  differenceType: ComparisonDifferenceType;
  hasDifference: boolean;
  notes: string[];
}

export interface ComparisonResult {
  products: {
    left: ComparisonProduct;
    right: ComparisonProduct | null;
  };
  rows: ComparisonRow[];
  summary: {
    totalCharacteristics: number;
    comparableCharacteristics: number;
    differences: number;
    missingValues: number;
    unitMismatches: number;
    statusMismatches: number;
  };
  warnings: string[];
}
