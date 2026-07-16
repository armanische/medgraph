import type {
  CandidateCharacteristic,
  CharacteristicExtractionInput,
} from "../types.ts";
import type {
  CategoryExtractionProfile,
  ExtractionProfileCoverage,
  ExtractionProfileName,
} from "./base.ts";
import { AnesthesiaExtractionProfile } from "./anesthesia.ts";
import { ConsumablesExtractionProfile } from "./consumables.ts";
import { EndoscopyExtractionProfile } from "./endoscopy.ts";
import { LightingExtractionProfile } from "./lighting.ts";
import { NeonatalExtractionProfile } from "./neonatal.ts";
import { PatientMonitorExtractionProfile } from "./patient-monitor.ts";
import { RegistryExtractionProfile } from "./registry.ts";
import { UltrasoundExtractionProfile } from "./ultrasound.ts";
import { VentilatorExtractionProfile } from "./ventilator.ts";

export const CATEGORY_EXTRACTION_PROFILES: CategoryExtractionProfile[] = [
  new VentilatorExtractionProfile(),
  new UltrasoundExtractionProfile(),
  new AnesthesiaExtractionProfile(),
  new PatientMonitorExtractionProfile(),
  new EndoscopyExtractionProfile(),
  new ConsumablesExtractionProfile(),
  new LightingExtractionProfile(),
  new NeonatalExtractionProfile(),
];

export const REGISTRY_EXTRACTION_PROFILE = new RegistryExtractionProfile();

export function selectCategoryExtractionProfiles(category: string) {
  const categoryProfiles = CATEGORY_EXTRACTION_PROFILES.filter((profile) =>
    profile.matchesCategory(category),
  );
  return [REGISTRY_EXTRACTION_PROFILE, ...categoryProfiles];
}

export function extractWithCategoryProfiles(input: CharacteristicExtractionInput) {
  const profiles = selectCategoryExtractionProfiles(input.product.category);
  const characteristics = profiles.flatMap((profile) => profile.extract(input));
  const coverage = profiles.map((profile) => profile.coverage(characteristics));
  return { profiles, characteristics, coverage };
}

export function profileCoverageForCharacteristics(input: {
  category: string;
  characteristics: CandidateCharacteristic[];
}): ExtractionProfileCoverage[] {
  return selectCategoryExtractionProfiles(input.category).map((profile) =>
    profile.coverage(input.characteristics),
  );
}

export function coverageSummary(coverage: ExtractionProfileCoverage[]) {
  const profileNames = coverage.map((item) => item.profile);
  const patternsMatched: Record<string, number> = {};
  const normalizedUnits: Record<string, number> = {};
  const failedFields: Record<string, string[]> = {};
  for (const item of coverage) {
    failedFields[item.profile] = item.failedFields;
    for (const [key, count] of Object.entries(item.patternsMatched)) {
      patternsMatched[`${item.profile}.${key}`] =
        (patternsMatched[`${item.profile}.${key}`] ?? 0) + count;
    }
    for (const [unit, count] of Object.entries(item.normalizedUnits)) {
      normalizedUnits[unit] = (normalizedUnits[unit] ?? 0) + count;
    }
  }
  const coveragePercent = coverage.length
    ? Math.round(
        coverage.reduce((sum, item) => sum + item.coveragePercent, 0) /
          coverage.length,
      )
    : 0;
  return {
    profilesUsed: profileNames as ExtractionProfileName[],
    patternsMatched,
    normalizedUnits,
    failedFields,
    coveragePercent,
  };
}

export type { CategoryExtractionProfile, ExtractionProfileCoverage };
