import type {
  ApplicationAreaReference,
  CategoryReference,
  CategoryResolution,
  LegacyCategoryMapping,
  ManufacturerReference,
  RegistrationResolution,
  ResolutionResult,
} from "./contracts.ts";
import { normalizeLookup } from "./normalization.ts";

type LegacyResolutionCompatibility = {
  /** @deprecated Use errors. */
  blockingErrors: string[];
  /** @deprecated Use requiresManualVerification. */
  reviewerRequired: boolean;
};

type ResolverResult = ResolutionResult & LegacyResolutionCompatibility;
type CategoryResolverResult = CategoryResolution & LegacyResolutionCompatibility;
type ApplicationAreaResolverResult = import("./contracts.ts").ApplicationAreaResolution & LegacyResolutionCompatibility;

function withLegacyCompatibility<T extends ResolutionResult | import("./contracts.ts").ApplicationAreaResolution>(
  result: T,
): T & LegacyResolutionCompatibility {
  const errors = "errors" in result ? result.errors : [];
  const requiresManualVerification = result.requiresManualVerification;
  return {
    ...result,
    blockingErrors: [...errors],
    reviewerRequired: requiresManualVerification,
  };
}

function emptyResolution(blockingError: string, rationale: string): ResolverResult {
  return withLegacyCompatibility({
    id: null,
    matchedBy: null,
    matchedValue: null,
    confidence: "unknown",
    candidates: [],
    warnings: [],
    errors: [blockingError],
    requiresManualVerification: true,
    rationale,
  });
}

export function resolveManufacturer(
  rawValue: string | null,
  manufacturers: ManufacturerReference[],
): ResolverResult {
  if (!rawValue?.trim()) return emptyResolution("manufacturer_unresolved", "Legacy manufacturer is absent.");
  const normalized = normalizeLookup(rawValue);
  const matches: Array<{ reference: ManufacturerReference; matchedBy: string; matchedValue: string }> = [];

  for (const reference of manufacturers) {
    if (normalizeLookup(reference.canonicalName) === normalized) {
      matches.push({ reference, matchedBy: "canonical_exact", matchedValue: reference.canonicalName });
      continue;
    }
    if (normalizeLookup(reference.displayName) === normalized) {
      matches.push({ reference, matchedBy: "display_exact", matchedValue: reference.displayName });
      continue;
    }
    const alias = reference.aliases.find((value) => normalizeLookup(value) === normalized);
    if (alias) matches.push({ reference, matchedBy: "alias_exact", matchedValue: alias });
  }

  const unique = [...new Map(matches.map((match) => [match.reference.id, match])).values()];
  if (unique.length === 0) {
    return emptyResolution("manufacturer_unresolved", `No exact reference match for "${rawValue}"; fuzzy creation is prohibited.`);
  }
  if (unique.length > 1) {
    return withLegacyCompatibility({
      ...emptyResolution("manufacturer_ambiguous", `Manufacturer value "${rawValue}" matches multiple references.`),
      candidates: unique.map(({ reference }) => reference.id).sort(),
    });
  }
  const match = unique[0];
  const aliasWarning = match.matchedBy === "alias_exact" ? ["manufacturer_matched_by_alias"] : [];
  return withLegacyCompatibility({
    id: match.reference.id,
    matchedBy: match.matchedBy,
    matchedValue: match.matchedValue,
    confidence: match.reference.confidence,
    candidates: [match.reference.id],
    warnings: aliasWarning,
      errors: [],
      requiresManualVerification: match.reference.confidence !== "verified",
    rationale: `Resolved by ${match.matchedBy} against the manufacturer reference.`,
  });
}

export function resolveCategory(
  rawValue: string | null,
  categories: CategoryReference[],
  mappings: LegacyCategoryMapping[],
): CategoryResolverResult {
  const base = emptyResolution("category_unresolved", "Legacy category is absent or unknown.");
  if (!rawValue?.trim()) return withLegacyCompatibility({ ...base, mappingType: null, matchedLegacyValue: null });
  const normalized = normalizeLookup(rawValue);
  const mapping = mappings.find(
    (item) => normalizeLookup(item.legacyValue) === normalized || normalizeLookup(item.normalizedLegacyValue) === normalized,
  );

  if (!mapping) {
    const direct = categories.filter((category) =>
      [category.canonicalName, category.displayName, ...category.aliases]
        .some((value) => normalizeLookup(value) === normalized),
    );
    if (direct.length !== 1) {
      return withLegacyCompatibility({
        ...base,
        candidates: direct.map(({ id }) => id).sort(),
        rationale: direct.length > 1 ? "Category alias is ambiguous." : `No mapping for "${rawValue}".`,
        matchedLegacyValue: rawValue,
        mappingType: null,
      });
    }
    const category = direct[0];
    if (!category.assignable || category.level === "root") {
      return withLegacyCompatibility({
        ...base,
        candidates: [category.id],
        errors: ["category_target_not_assignable"],
        rationale: `Direct category match ${category.id} is not assignable.`,
        matchedLegacyValue: rawValue,
        mappingType: "normalized",
      });
    }
    return withLegacyCompatibility({
      id: category.id,
      matchedBy: "category_alias",
      matchedValue: rawValue,
      confidence: category.confidence,
      candidates: [category.id],
      warnings: ["category_mapping_normalized"],
      errors: [],
      requiresManualVerification: category.confidence !== "verified",
      rationale: "Resolved directly from canonical category names and aliases.",
      mappingType: "normalized",
      matchedLegacyValue: rawValue,
    });
  }

  if (mapping.mappingType === "split") {
    return withLegacyCompatibility({
      ...base,
      matchedBy: "legacy_mapping",
      matchedValue: mapping.legacyValue,
      confidence: mapping.confidence,
      candidates: [...mapping.targetCategoryCandidates].sort(),
      warnings: ["category_mapping_split"],
      errors: ["category_split_without_reviewer_decision"],
      requiresManualVerification: true,
      rationale: mapping.rationale,
      mappingType: mapping.mappingType,
      matchedLegacyValue: mapping.legacyValue,
    });
  }

  if (!mapping.targetCategoryId) {
    return withLegacyCompatibility({
      ...base,
      matchedBy: "legacy_mapping",
      matchedValue: mapping.legacyValue,
      confidence: mapping.confidence,
      candidates: [...mapping.targetCategoryCandidates].sort(),
      rationale: mapping.rationale,
      mappingType: mapping.mappingType,
      matchedLegacyValue: mapping.legacyValue,
    });
  }

  const category = categories.find(({ id }) => id === mapping.targetCategoryId);
  if (!category || !category.assignable || category.level === "root") {
    return withLegacyCompatibility({
      ...base,
      matchedBy: "legacy_mapping",
      matchedValue: mapping.legacyValue,
      confidence: mapping.confidence,
      candidates: [mapping.targetCategoryId],
      errors: [category ? "category_target_not_assignable" : "category_target_missing"],
      rationale: mapping.rationale,
      mappingType: mapping.mappingType,
      matchedLegacyValue: mapping.legacyValue,
    });
  }
  if (category.publicationStatus === "archived") {
    return withLegacyCompatibility({
      ...base,
      candidates: [category.id],
      errors: ["category_target_archived"],
      rationale: mapping.rationale,
      mappingType: mapping.mappingType,
      matchedLegacyValue: mapping.legacyValue,
    });
  }
  return withLegacyCompatibility({
    id: category.id,
    matchedBy: "legacy_mapping",
    matchedValue: mapping.legacyValue,
    confidence: mapping.confidence,
    candidates: [category.id],
    warnings: mapping.mappingType === "normalized" ? ["category_mapping_normalized"] : [],
    errors: [],
    requiresManualVerification: mapping.requiresManualVerification || mapping.confidence !== "verified",
    rationale: mapping.rationale,
    mappingType: mapping.mappingType,
    matchedLegacyValue: mapping.legacyValue,
  });
}

export function resolveApplicationAreas(
  rawValues: string[],
  references: ApplicationAreaReference[],
): ApplicationAreaResolverResult {
  const matchedValues: import("./contracts.ts").ApplicationAreaResolution["matchedValues"] = [];
  const unresolvedValues: string[] = [];
  const ids = new Set<string>();
  for (const rawValue of rawValues) {
    const normalized = normalizeLookup(rawValue);
    const matches = references.filter((reference) =>
      [reference.canonicalName, reference.displayName, ...reference.aliases]
        .some((value) => normalizeLookup(value) === normalized),
    );
    if (matches.length !== 1) {
      unresolvedValues.push(rawValue);
      continue;
    }
    const reference = matches[0];
    if (!ids.has(reference.id)) {
      matchedValues.push({
        rawValue,
        applicationAreaId: reference.id,
        matchedBy: normalizeLookup(reference.canonicalName) === normalized ? "canonical_exact" : "alias_exact",
      });
      ids.add(reference.id);
    }
  }
  return withLegacyCompatibility({
    applicationAreaIds: [...ids].sort(),
    matchedValues,
    unresolvedValues: [...new Set(unresolvedValues)].sort(),
    confidence: unresolvedValues.length ? "unknown" : matchedValues.length ? "reviewed" : "unknown",
    warnings: unresolvedValues.length ? ["application_area_unresolved"] : matchedValues.length ? [] : ["application_areas_absent"],
    requiresManualVerification: unresolvedValues.length > 0,
  });
}

export function resolveRegistration(rawValue: string | null): RegistrationResolution {
  if (!rawValue?.trim()) return { status: "no_data", rawValue: null, publicValue: null, warning: "ru_absent" };
  return {
    status: "legacy_claim_only",
    rawValue,
    publicValue: null,
    warning: "ru_legacy_claim_requires_verification",
  };
}
