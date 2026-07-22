import {
  normalizeBullets,
  normalizeCharacteristics,
  normalizeImages,
  normalizeText,
  slugify,
} from "./normalization.ts";
import { createSourceSnapshot, extractLegacyProduct } from "./parser.ts";
import {
  resolveApplicationAreas,
  resolveCategory,
  resolveManufacturer,
  resolveRegistration,
} from "./resolvers.ts";
import type {
  ImportDiagnostic,
  ImportProvenance,
  LegacyImportRequest,
  NormalizedProduct,
  PipelineError,
  PipelineResult,
  PipelineWarning,
} from "./contracts.ts";

function withoutLegacyResolverCompatibility<T extends { blockingErrors: string[]; reviewerRequired: boolean }>(
  value: T,
): Omit<T, "blockingErrors" | "reviewerRequired"> {
  const { blockingErrors, reviewerRequired, ...coreValue } = value;
  void blockingErrors;
  void reviewerRequired;
  return coreValue;
}

function diagnostic(
  code: string,
  fieldPath: string,
  message: string,
  severity: ImportDiagnostic["severity"],
): ImportDiagnostic {
  return { code, fieldPath, message, severity };
}

function collectDiagnostics(
  request: LegacyImportRequest,
  normalized: NormalizedProduct,
  characteristicWarnings: string[],
): { errors: PipelineError[]; warnings: PipelineWarning[] } {
  const errors: PipelineError[] = [];
  const warnings: PipelineWarning[] = [];
  const addError = (code: string, fieldPath: string, message: string) => {
    errors.push(diagnostic(code, fieldPath, message, "error") as PipelineError);
  };
  const addWarning = (code: string, fieldPath: string, message: string) => {
    warnings.push(diagnostic(code, fieldPath, message, "warning") as PipelineWarning);
  };

  if (!request.source.sourceId || (!request.source.sourceUrl && !request.source.sourcePath)) {
    addError("source_missing", "source", "Source identifier and locator are required.");
  }
  if (!normalized.name) addError("title_missing", "name", "A product title is required.");
  if (!normalized.slug || !/^[a-z0-9][a-z0-9-]*$/u.test(normalized.slug)) {
    addError("slug_invalid", "slug", "A lowercase Latin kebab-case slug is required.");
  }
  normalized.manufacturer.errors.forEach((code) => addError(code, "manufacturerId", normalized.manufacturer.rationale));
  normalized.category.errors.forEach((code) => addError(code, "categoryId", normalized.category.rationale));
  if (!normalized.shortDescription) {
    addError("short_description_missing", "shortDescription", "Product Data Standard requires a short description.");
  }
  if (!normalized.fullDescription) {
    addError("full_description_missing", "description", "Product Data Standard requires a full description.");
  }
  const primary = normalized.images.find(({ roleCandidate }) => roleCandidate === "primary");
  if (!primary) addError("primary_image_missing", "media", "Product Data Standard requires a primary image.");
  if (primary?.rightsStatus !== "confirmed") addWarning("image_rights_unknown", "media", "Image rights require review.");
  if (normalized.registration.warning) addWarning(normalized.registration.warning, "registration", "Registration data is not externally verified.");
  normalized.manufacturer.warnings.forEach((code) => addWarning(code, "manufacturerId", "Manufacturer resolution used an alias."));
  normalized.category.warnings.forEach((code) => addWarning(code, "categoryId", "Category mapping requires attention."));
  normalized.applicationAreas.warnings.forEach((code) => addWarning(code, "applicationAreas", "Application-area resolution is incomplete."));
  normalized.images.flatMap(({ warnings: imageWarnings }) => imageWarnings).forEach((code) => addWarning(code, "media", "Legacy image metadata is incomplete."));
  characteristicWarnings.forEach((code) => addWarning(code, "specifications", "Legacy characteristic requires review."));
  if (!normalized.specifications.length) addWarning("characteristics_sparse", "specifications", "No structured technical characteristics are available.");
  if (!normalized.documents.length) addWarning("documents_absent", "documents", "No legacy documents are available.");
  if (!normalized.accessories.length) addWarning("accessories_absent", "accessories", "No structured accessories are available.");
  if (!normalized.packageContents.length) addWarning("package_contents_absent", "packageContents", "No structured package contents are available.");

  const unique = <T extends ImportDiagnostic>(items: T[]) =>
    [...new Map(items.map((item) => [`${item.code}:${item.fieldPath}`, item])).values()]
      .sort((left, right) => left.code.localeCompare(right.code));
  return { errors: unique(errors) as PipelineError[], warnings: unique(warnings) as PipelineWarning[] };
}

function buildProvenance(normalized: NormalizedProduct, request: LegacyImportRequest): ImportProvenance[] {
  const { source, runTimestamp } = request;
  const rows: ImportProvenance[] = [];
  const add = (
    fieldPath: string,
    rawValue: unknown,
    normalizedValue: unknown,
    sourceType: ImportProvenance["sourceType"],
    transformation: string,
    resolver: string | null,
    confidence: ImportProvenance["confidence"],
  ) => rows.push({
    fieldPath,
    sourceType,
    sourceId: source.sourceId,
    sourceLocation: source.sourceUrl ?? source.sourcePath,
    rawValue,
    normalizedValue,
    transformation,
    resolver,
    confidence,
    createdAt: runTimestamp,
  });

  add("name", source.legacyTitle, normalized.name, "legacy_json", "text_normalization", null, "legacy");
  add("slug", source.legacySlug, normalized.slug, "generated_normalization", "safe_slug_normalization", null, "legacy");
  add("model", source.rawModel ?? null, normalized.model, "legacy_json", "text_normalization", null, "legacy");
  add("manufacturerId", source.rawManufacturer, normalized.manufacturer.id, "manufacturer_reference", "reference_resolution", "Manufacturer Reference Resolver", normalized.manufacturer.confidence);
  add("categoryId", source.rawCategory, normalized.category.id, "category_reference", "legacy_mapping", "Category Reference Resolver", normalized.category.confidence);
  add("applicationAreas", source.rawApplicationAreas, normalized.applicationAreas.applicationAreaIds, "application_area_reference", "reference_resolution", "Application Area Resolver", normalized.applicationAreas.confidence);
  add("shortDescription", source.rawDescription, normalized.shortDescription, "legacy_json", "first_paragraph_only", null, "legacy");
  add("description", source.rawDescription, normalized.fullDescription, "legacy_json", "html_and_whitespace_normalization", null, "legacy");
  add("primaryImage", source.rawImages, normalized.images.find(({ roleCandidate }) => roleCandidate === "primary") ?? null, "legacy_json", "metadata_only_no_download", null, "legacy");
  add("specifications", source.rawCharacteristics, normalized.specifications, "legacy_json", "flat_table_preserving_values", null, "legacy");
  add("registration", source.rawRegistrationData, normalized.registration, "legacy_json", "verification_placeholder", "RU placeholder", "legacy");
  add("documents", source.rawDocuments, normalized.documents, "legacy_json", "no_unverified_public_projection", null, "legacy");
  add("accessories", source.rawAccessories, normalized.accessories, "legacy_json", "text_normalization", null, "legacy");
  add("packageContents", source.rawPackageContents ?? [], normalized.packageContents, "legacy_json", "text_normalization", null, "legacy");
  return rows.sort((left, right) => left.fieldPath.localeCompare(right.fieldPath));
}

/**
 * Pure core orchestration. Inputs are supplied by external adapters; this module
 * does not read Storefront, Review, Publication, Cloud or Supabase state.
 */
export function runLegacyImportPipeline(request: LegacyImportRequest): PipelineResult {
  const source = createSourceSnapshot(request.source);
  const extracted = extractLegacyProduct(source);
  const characteristicResult = normalizeCharacteristics(extracted.characteristicsRaw, source.sourceId);
  const fullDescription = extracted.descriptionRaw ? normalizeText(extracted.descriptionRaw) : null;
  const firstParagraph = fullDescription?.split(/\n\n/u)[0] ?? null;
  const normalizedProduct: NormalizedProduct = {
    sourceId: source.sourceId,
    slug: slugify(source.legacySlug || extracted.titleRaw || ""),
    name: extracted.titleRaw ? normalizeText(extracted.titleRaw) : null,
    model: extracted.modelRaw ? normalizeText(extracted.modelRaw) : null,
    manufacturer: withoutLegacyResolverCompatibility(resolveManufacturer(extracted.manufacturerRaw, request.references.manufacturers)),
    category: withoutLegacyResolverCompatibility(resolveCategory(extracted.categoryRaw, request.references.categories, request.references.mappings)),
    applicationAreas: withoutLegacyResolverCompatibility(resolveApplicationAreas(extracted.applicationAreasRaw, request.references.applicationAreas)),
    shortDescription: firstParagraph && firstParagraph.length <= 240 ? firstParagraph : null,
    fullDescription,
    bulletItems: normalizeBullets(extracted.bulletItemsRaw),
    specifications: characteristicResult.characteristics,
    images: normalizeImages(extracted.imagesRaw),
    documents: extracted.documentsRaw.map((document) => ({
      title: normalizeText(document.title),
      url: document.url ? normalizeText(document.url) : document.url,
      kind: document.kind ?? null,
      language: document.language ?? null,
      official: document.official ?? false,
      confidence: "legacy",
    })),
    accessories: normalizeBullets(extracted.accessoriesRaw),
    packageContents: normalizeBullets(extracted.packageContentsRaw),
    registration: resolveRegistration(extracted.registrationRaw),
    updatedAt: request.runTimestamp,
  };
  const { errors, warnings } = collectDiagnostics(request, normalizedProduct, characteristicResult.warnings);
  const reviewHint = {
    disposition: errors.length ? "blocked" as const : "requires_manual_verification" as const,
    requiredChecks: [
      ...(normalizedProduct.manufacturer.requiresManualVerification ? ["manufacturer"] : []),
      ...(normalizedProduct.category.requiresManualVerification ? ["category"] : []),
      ...(normalizedProduct.applicationAreas.requiresManualVerification ? ["application_areas"] : []),
      ...(normalizedProduct.registration.warning ? ["registration"] : []),
      ...(normalizedProduct.images.some((image) => image.rightsStatus !== "confirmed") ? ["media_rights"] : []),
      ...(errors.length ? ["source_completeness"] : []),
    ].sort(),
    errorCodes: errors.map(({ code }) => code),
    warningCodes: warnings.map(({ code }) => code),
  };
  return {
    source,
    extracted,
    normalizedProduct,
    provenance: buildProvenance(normalizedProduct, request),
    diagnostics: [...errors, ...warnings],
    errors,
    warnings,
    reviewHint,
  };
}
