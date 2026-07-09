export type CompatibilityStatus =
  | "compatible"
  | "compatible_with_conditions"
  | "not_verified"
  | "not_compatible"
  | "unknown";

export type CompatibilityType =
  | "consumable_device"
  | "accessory_device"
  | "sensor_monitor"
  | "cable_equipment"
  | "software_equipment"
  | "option_equipment";

export type CompatibilityReviewStatus =
  | "reviewed"
  | "needs_review"
  | "not_verified";

export interface CompatibilityProductRef {
  slug: string;
  title: string;
  manufacturer: string;
  category: string;
}

export interface CompatibilityEvidence {
  evidenceIds: string[];
  sourceUrls: string[];
  documentVersionIds: string[];
  reviewStatus: CompatibilityReviewStatus;
  lastUpdated: string;
  notes: string[];
}

export interface CompatibilityRecord {
  compatibilityId: string;
  productA: CompatibilityProductRef;
  productB: CompatibilityProductRef;
  compatibilityType: CompatibilityType;
  status: CompatibilityStatus;
  evidence: CompatibilityEvidence;
}

export interface CompatibilityGroup {
  type: CompatibilityType;
  label: string;
  records: CompatibilityRecord[];
}

export interface CompatibilityResult {
  productSlug: string;
  totalRecords: number;
  groups: CompatibilityGroup[];
  warnings: string[];
}
