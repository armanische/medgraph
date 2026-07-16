import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalEvidenceId,
  type EvidenceCandidateReference,
  type ExtractedFactCandidate,
  type TrustedDocumentExtractionProductReport,
} from "./trusted-documents.ts";
import type { ReviewQueueProductReport } from "./review-queue.ts";

const RESEARCH_ROOT = resolve(process.cwd(), "data/research");
const DISCOVERY_PRODUCTS = resolve(RESEARCH_ROOT, "discovery/products");
const DOCUMENT_PRODUCTS = resolve(RESEARCH_ROOT, "documents/products");
const EXTRACTION_PRODUCTS = resolve(RESEARCH_ROOT, "extraction/products");
const REVIEW_PRODUCTS = resolve(RESEARCH_ROOT, "review/products");
const INTEGRITY_ROOT = resolve(RESEARCH_ROOT, "integrity");
const INTEGRITY_REPORT = resolve(
  INTEGRITY_ROOT,
  "evidence-integrity.generated.json",
);
const REPAIR_REPORT = resolve(
  INTEGRITY_ROOT,
  "evidence-repair.generated.json",
);
const EXTRACTION_AGGREGATE = resolve(
  RESEARCH_ROOT,
  "extraction/extraction-report.generated.json",
);
const WAVE2_AGGREGATE = resolve(
  RESEARCH_ROOT,
  "wave2/wave2-summary.generated.json",
);
const GENERATED_AT = "evidence-integrity-v1";
const MANUFACTURER_ORDER = [
  "Drager",
  "Philips",
  "Hamilton Medical",
  "GE HealthCare",
  "SLE",
  "Mindray",
  "SonoScape",
] as const;

type JsonRecord = Record<string, unknown>;

export type EvidenceRepairability =
  | "repairable_exact"
  | "repairable_deterministic"
  | "missing_locator"
  | "missing_document_version"
  | "missing_artifact"
  | "orphan_reference"
  | "ambiguous"
  | "unrecoverable";

export type EvidenceStage =
  | "extracted_fact"
  | "candidate_claim"
  | "review_item"
  | "evidence_candidate"
  | "document_version";

export interface EvidenceIntegrityViolation {
  manufacturer: string;
  productId: string;
  productSlug: string;
  stage: EvidenceStage;
  entityId: string;
  missingEvidenceId: string | null;
  documentVersionId: string | null;
  sourceId: string | null;
  locator: EvidenceCandidateReference["locator"] | null;
  reportPath: string;
  reason: string;
  repairability: EvidenceRepairability;
}

export interface EvidenceIntegritySummary {
  totalViolations: number;
  uniqueMissingEvidenceIds: number;
  byManufacturer: Record<string, number>;
  byStage: Record<string, number>;
  byReason: Record<string, number>;
  byRepairability: Record<string, number>;
  affectedProducts: string[];
  affectedDocumentVersions: string[];
}

export interface ProductGraphInput {
  extraction: TrustedDocumentExtractionProductReport;
  review?: ReviewQueueProductReport | null;
  discovery?: JsonRecord | null;
  documents?: JsonRecord | null;
  extractionReportPath: string;
  reviewReportPath?: string;
  artifactExists?: (path: string) => boolean;
}

export interface EvidenceRepairOperation {
  entityType: "EvidenceCandidate" | "ExtractedFact" | "CandidateClaim" | "ReviewItem";
  entityId: string;
  productSlug: string;
  manufacturer: string;
  oldEvidenceId: string;
  newEvidenceId: string;
  repairMethod: "deterministic_regeneration" | "exact_match" | "propagation";
  basis: string;
  confidence: "deterministic only";
  sourceId: string;
  documentVersionId: string;
  locator: EvidenceCandidateReference["locator"];
}

interface RepairProductResult {
  report: TrustedDocumentExtractionProductReport;
  operations: EvidenceRepairOperation[];
  blockedEvidenceIds: string[];
}

interface LoadedProductGraph extends ProductGraphInput {
  fileName: string;
}

function stableId(prefix: string, parts: string[]) {
  return `${prefix}_${createHash("sha256")
    .update(parts.join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function hasLocator(locator: EvidenceCandidateReference["locator"] | null) {
  return Boolean(
    locator &&
      [
        locator.page,
        locator.section,
        locator.heading,
        locator.table,
        locator.paragraph,
      ].some((value) => value !== null && value !== ""),
  );
}

function sameLocator(
  left: EvidenceCandidateReference["locator"],
  right: EvidenceCandidateReference["locator"],
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function relativeReportPath(path: string) {
  return path.startsWith(process.cwd()) ? relative(process.cwd(), path) : path;
}

function increment(target: Record<string, number>, key: string) {
  target[key] = (target[key] ?? 0) + 1;
}

function classifyMissingEvidence(input: {
  evidenceId: string;
  facts: ExtractedFactCandidate[];
  evidence: EvidenceCandidateReference[];
  versions: Map<string, JsonRecord>;
  sourceIds: Set<string>;
  artifactExists: (path: string) => boolean;
}): {
  repairability: EvidenceRepairability;
  fact: ExtractedFactCandidate | null;
  version: JsonRecord | null;
} {
  const matchingFacts = input.facts.filter(
    (fact) => fact.evidenceCandidateId === input.evidenceId,
  );
  if (!matchingFacts.length) {
    return { repairability: "orphan_reference", fact: null, version: null };
  }
  if (matchingFacts.length > 1) {
    const identities = new Set(
      matchingFacts.map((fact) =>
        JSON.stringify([
          fact.documentVersionId,
          fact.rawText,
          fact.locator,
          fact.factType,
          fact.value,
        ]),
      ),
    );
    if (identities.size > 1) {
      return { repairability: "ambiguous", fact: null, version: null };
    }
  }
  const fact = matchingFacts[0];
  if (!hasLocator(fact.locator)) {
    return { repairability: "missing_locator", fact, version: null };
  }
  const version = input.versions.get(fact.documentVersionId) ?? null;
  if (!version) {
    return { repairability: "missing_document_version", fact, version };
  }
  const artifactPath = asString(version.filePath);
  if (!artifactPath || !input.artifactExists(artifactPath)) {
    return { repairability: "missing_artifact", fact, version };
  }
  const sourceId = asString(version.sourceId);
  if (!sourceId || !input.sourceIds.has(sourceId)) {
    return { repairability: "unrecoverable", fact, version };
  }
  const canonicalId = canonicalEvidenceId({
    documentVersionId: fact.documentVersionId,
    rawText: fact.rawText,
    locator: fact.locator,
  });
  if (canonicalId === input.evidenceId) {
    return { repairability: "repairable_deterministic", fact, version };
  }
  const exact = input.evidence.find(
    (candidate) =>
      candidate.documentVersionId === fact.documentVersionId &&
      candidate.quotedText === fact.rawText &&
      sameLocator(candidate.locator, fact.locator),
  );
  return {
    repairability: exact ? "repairable_exact" : "ambiguous",
    fact,
    version,
  };
}

export function auditProductEvidenceGraph(
  input: ProductGraphInput,
): EvidenceIntegrityViolation[] {
  const violations: EvidenceIntegrityViolation[] = [];
  const extraction = input.extraction;
  const productSlug = extraction.product.productSlug;
  const manufacturer = extraction.product.manufacturer ?? "Unknown";
  const productRecord = extraction.product as unknown as JsonRecord;
  const productId = asString(productRecord.productId) ?? productSlug;
  const artifactExists = input.artifactExists ?? existsSync;
  const evidenceById = new Map(
    extraction.evidenceCandidates.map((item) => [item.evidenceCandidateId, item]),
  );
  const versions = new Map<string, JsonRecord>(
    extraction.documentVersions.map((version) => [
      version.versionId,
      version as unknown as JsonRecord,
    ]),
  );
  const documentVersionIds = new Set(
    asRecords(input.documents?.documentVersions)
      .map((version) => asString(version.versionId))
      .filter((value): value is string => Boolean(value)),
  );
  const sourceIds = new Set(
    asRecords(input.discovery?.sourceCandidates)
      .map((source) => asString(source.sourceId))
      .filter((value): value is string => Boolean(value)),
  );

  const contextForEvidence = (evidenceId: string) => {
    const classification = classifyMissingEvidence({
      evidenceId,
      facts: extraction.extractedFactCandidates,
      evidence: extraction.evidenceCandidates,
      versions,
      sourceIds,
      artifactExists,
    });
    const fact = classification.fact;
    const version = classification.version;
    return {
      repairability: classification.repairability,
      documentVersionId: fact?.documentVersionId ?? null,
      sourceId: asString(version?.sourceId),
      locator: fact?.locator ?? null,
    };
  };

  const addMissingEvidence = (inputViolation: {
    stage: EvidenceStage;
    entityId: string;
    evidenceId: string;
    reportPath: string;
  }) => {
    const context = contextForEvidence(inputViolation.evidenceId);
    violations.push({
      manufacturer,
      productId,
      productSlug,
      stage: inputViolation.stage,
      entityId: inputViolation.entityId,
      missingEvidenceId: inputViolation.evidenceId,
      documentVersionId: context.documentVersionId,
      sourceId: context.sourceId,
      locator: context.locator,
      reportPath: relativeReportPath(inputViolation.reportPath),
      reason: "missing_evidence_reference",
      repairability: context.repairability,
    });
  };

  for (const fact of extraction.extractedFactCandidates) {
    if (
      fact.evidenceCandidateId &&
      !evidenceById.has(fact.evidenceCandidateId)
    ) {
      addMissingEvidence({
        stage: "extracted_fact",
        entityId: fact.factCandidateId,
        evidenceId: fact.evidenceCandidateId,
        reportPath: input.extractionReportPath,
      });
    }
    if (!versions.has(fact.documentVersionId)) {
      violations.push({
        manufacturer,
        productId,
        productSlug,
        stage: "extracted_fact",
        entityId: fact.factCandidateId,
        missingEvidenceId: fact.evidenceCandidateId,
        documentVersionId: fact.documentVersionId,
        sourceId: null,
        locator: fact.locator,
        reportPath: relativeReportPath(input.extractionReportPath),
        reason: "missing_document_version_reference",
        repairability: "missing_document_version",
      });
    }
  }

  for (const claim of extraction.candidateClaims) {
    for (const evidenceId of claim.evidenceCandidateIds) {
      if (!evidenceById.has(evidenceId)) {
        addMissingEvidence({
          stage: "candidate_claim",
          entityId: claim.claimId,
          evidenceId,
          reportPath: input.extractionReportPath,
        });
      }
    }
  }

  for (const item of input.review?.reviewItems ?? []) {
    for (const evidenceId of item.evidenceCandidateIds) {
      if (!evidenceById.has(evidenceId)) {
        addMissingEvidence({
          stage: "review_item",
          entityId: item.reviewItemId,
          evidenceId,
          reportPath: input.reviewReportPath ?? input.extractionReportPath,
        });
      }
    }
    for (const documentVersionId of item.documentVersionIds) {
      if (!versions.has(documentVersionId)) {
        violations.push({
          manufacturer,
          productId,
          productSlug,
          stage: "review_item",
          entityId: item.reviewItemId,
          missingEvidenceId: null,
          documentVersionId,
          sourceId: null,
          locator: null,
          reportPath: relativeReportPath(
            input.reviewReportPath ?? input.extractionReportPath,
          ),
          reason: "missing_document_version_reference",
          repairability: "missing_document_version",
        });
      }
    }
    const linkedEvidence = item.evidenceCandidateIds
      .map((evidenceId) => evidenceById.get(evidenceId))
      .filter((value): value is EvidenceCandidateReference => Boolean(value));
    const expectedVersionIds = [
      ...new Set(linkedEvidence.map((value) => value.documentVersionId)),
    ];
    const missingLinkedVersion = expectedVersionIds.find(
      (versionId) => !item.documentVersionIds.includes(versionId),
    );
    if (missingLinkedVersion) {
      const linkedVersion = versions.get(missingLinkedVersion);
      violations.push({
        manufacturer,
        productId,
        productSlug,
        stage: "review_item",
        entityId: item.reviewItemId,
        missingEvidenceId: null,
        documentVersionId: missingLinkedVersion,
        sourceId: asString(linkedVersion?.sourceId),
        locator: linkedEvidence[0]?.locator ?? null,
        reportPath: relativeReportPath(
          input.reviewReportPath ?? input.extractionReportPath,
        ),
        reason: "missing_document_version_link",
        repairability: "repairable_exact",
      });
    }
  }

  for (const candidate of extraction.evidenceCandidates) {
    const version = versions.get(candidate.documentVersionId);
    if (!version) {
      violations.push({
        manufacturer,
        productId,
        productSlug,
        stage: "evidence_candidate",
        entityId: candidate.evidenceCandidateId,
        missingEvidenceId: null,
        documentVersionId: candidate.documentVersionId,
        sourceId: null,
        locator: candidate.locator,
        reportPath: relativeReportPath(input.extractionReportPath),
        reason: "missing_document_version_reference",
        repairability: "missing_document_version",
      });
      continue;
    }
    if (!hasLocator(candidate.locator)) {
      violations.push({
        manufacturer,
        productId,
        productSlug,
        stage: "evidence_candidate",
        entityId: candidate.evidenceCandidateId,
        missingEvidenceId: null,
        documentVersionId: candidate.documentVersionId,
        sourceId: asString(version.sourceId),
        locator: candidate.locator,
        reportPath: relativeReportPath(input.extractionReportPath),
        reason: "missing_locator",
        repairability: "missing_locator",
      });
    }
  }

  for (const [versionId, version] of versions) {
    const sourceId = asString(version.sourceId);
    const artifactPath = asString(version.filePath);
    const base = {
      manufacturer,
      productId,
      productSlug,
      stage: "document_version" as const,
      entityId: versionId,
      missingEvidenceId: null,
      documentVersionId: versionId,
      sourceId,
      locator: null,
      reportPath: relativeReportPath(input.extractionReportPath),
    };
    if (documentVersionIds.size > 0 && !documentVersionIds.has(versionId)) {
      violations.push({
        ...base,
        reason: "document_version_missing_from_download_report",
        repairability: "missing_document_version",
      });
    }
    if (!sourceId || !sourceIds.has(sourceId)) {
      violations.push({
        ...base,
        reason: "missing_source_reference",
        repairability: "unrecoverable",
      });
    }
    if (!artifactPath || !artifactExists(artifactPath)) {
      violations.push({
        ...base,
        reason: "missing_artifact_path",
        repairability: "missing_artifact",
      });
    }
  }

  return violations;
}

export function summarizeEvidenceViolations(
  violations: EvidenceIntegrityViolation[],
): EvidenceIntegritySummary {
  const summary: EvidenceIntegritySummary = {
    totalViolations: violations.length,
    uniqueMissingEvidenceIds: new Set(
      violations
        .map((item) => item.missingEvidenceId)
        .filter((value): value is string => Boolean(value)),
    ).size,
    byManufacturer: {},
    byStage: {},
    byReason: {},
    byRepairability: {},
    affectedProducts: [
      ...new Set(violations.map((item) => item.productSlug)),
    ].sort(),
    affectedDocumentVersions: [
      ...new Set(
        violations
          .map((item) => item.documentVersionId)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
  };
  for (const violation of violations) {
    increment(summary.byManufacturer, violation.manufacturer);
    increment(summary.byStage, violation.stage);
    increment(summary.byReason, violation.reason);
    increment(summary.byRepairability, violation.repairability);
  }
  return summary;
}

function evidenceFromFact(
  fact: ExtractedFactCandidate,
): EvidenceCandidateReference {
  return {
    evidenceCandidateId: canonicalEvidenceId({
      documentVersionId: fact.documentVersionId,
      rawText: fact.rawText,
      locator: fact.locator,
    }),
    kind:
      fact.extractionMethod === "document_metadata"
        ? "document_metadata"
        : "document_excerpt",
    documentVersionId: fact.documentVersionId,
    documentCandidateId: fact.documentCandidateId,
    sha256: fact.documentSha256,
    sourceUrl: fact.sourceUrl,
    locator: fact.locator,
    quotedText: fact.rawText,
    status: "candidate",
    requiresHumanReview: true,
  };
}

export function repairProductEvidenceReferences(
  report: TrustedDocumentExtractionProductReport,
  input?: {
    sourceIds?: Set<string>;
    artifactExists?: (path: string) => boolean;
  },
): RepairProductResult {
  const repairedReport = structuredClone(report);
  const artifactExists = input?.artifactExists ?? existsSync;
  const sourceIds = input?.sourceIds ?? new Set(
    repairedReport.documentVersions.map((version) => version.sourceId),
  );
  const evidence = [...repairedReport.evidenceCandidates];
  const knownEvidence = new Set(evidence.map((item) => item.evidenceCandidateId));
  const versions = new Map<string, JsonRecord>(
    repairedReport.documentVersions.map((version) => [
      version.versionId,
      version as unknown as JsonRecord,
    ]),
  );
  const operations: EvidenceRepairOperation[] = [];
  const blockedEvidenceIds: string[] = [];

  for (const fact of repairedReport.extractedFactCandidates) {
    const evidenceId = fact.evidenceCandidateId;
    if (!evidenceId || knownEvidence.has(evidenceId)) continue;
    const version = versions.get(fact.documentVersionId);
    const sourceId = asString(version?.sourceId);
    const artifactPath = asString(version?.filePath);
    const canonicalId = canonicalEvidenceId({
      documentVersionId: fact.documentVersionId,
      rawText: fact.rawText,
      locator: fact.locator,
    });
    const exact = evidence.find(
      (candidate) =>
        candidate.documentVersionId === fact.documentVersionId &&
        candidate.quotedText === fact.rawText &&
        sameLocator(candidate.locator, fact.locator),
    );
    if (exact && canonicalId !== evidenceId) {
      fact.evidenceCandidateId = exact.evidenceCandidateId;
      for (const claim of repairedReport.candidateClaims) {
        claim.evidenceCandidateIds = claim.evidenceCandidateIds.map((id) =>
          id === evidenceId ? exact.evidenceCandidateId : id,
        );
      }
      operations.push({
        entityType: "ExtractedFact",
        entityId: fact.factCandidateId,
        productSlug: repairedReport.product.productSlug,
        manufacturer: repairedReport.product.manufacturer ?? "Unknown",
        oldEvidenceId: evidenceId,
        newEvidenceId: exact.evidenceCandidateId,
        repairMethod: "exact_match",
        basis:
          "A single existing evidence candidate has the same document version, quoted text, and normalized locator.",
        confidence: "deterministic only",
        sourceId: sourceId ?? "",
        documentVersionId: fact.documentVersionId,
        locator: fact.locator,
      });
      continue;
    }
    if (
      !version ||
      !sourceId ||
      !sourceIds.has(sourceId) ||
      !artifactPath ||
      !artifactExists(artifactPath) ||
      !hasLocator(fact.locator) ||
      canonicalId !== evidenceId
    ) {
      blockedEvidenceIds.push(evidenceId);
      continue;
    }
    evidence.push(evidenceFromFact(fact));
    knownEvidence.add(evidenceId);
    operations.push({
      entityType: "EvidenceCandidate",
      entityId: evidenceId,
      productSlug: repairedReport.product.productSlug,
      manufacturer: repairedReport.product.manufacturer ?? "Unknown",
      oldEvidenceId: evidenceId,
      newEvidenceId: evidenceId,
      repairMethod: "deterministic_regeneration",
      basis:
        "Existing fact, canonical evidence ID, document version, source, locator, and content-addressed artifact all match.",
      confidence: "deterministic only",
      sourceId,
      documentVersionId: fact.documentVersionId,
      locator: fact.locator,
    });
  }

  for (const claim of repairedReport.candidateClaims) {
    if (
      claim.evidenceCandidateIds.length > 0 &&
      claim.evidenceCandidateIds.every((id) => knownEvidence.has(id))
    ) {
      continue;
    }
    const matchingFacts = repairedReport.extractedFactCandidates.filter(
      (fact) =>
        fact.factType === claim.suggestedClaimType &&
        fact.value === claim.valuePayload.value &&
        fact.rawText === claim.rawText &&
        Boolean(fact.evidenceCandidateId) &&
        knownEvidence.has(fact.evidenceCandidateId ?? ""),
    );
    if (matchingFacts.length !== 1 || !matchingFacts[0].evidenceCandidateId) {
      claim.evidenceCandidateIds.forEach((id) => blockedEvidenceIds.push(id));
      continue;
    }
    const oldEvidenceId = claim.evidenceCandidateIds.join(",") || "(empty)";
    claim.evidenceCandidateIds = [matchingFacts[0].evidenceCandidateId];
    const version = versions.get(matchingFacts[0].documentVersionId);
    operations.push({
      entityType: "CandidateClaim",
      entityId: claim.claimId,
      productSlug: repairedReport.product.productSlug,
      manufacturer: repairedReport.product.manufacturer ?? "Unknown",
      oldEvidenceId,
      newEvidenceId: matchingFacts[0].evidenceCandidateId,
      repairMethod: "propagation",
      basis:
        "A single fact matches claim type, value, raw text, and an existing evidence candidate.",
      confidence: "deterministic only",
      sourceId: asString(version?.sourceId) ?? "",
      documentVersionId: matchingFacts[0].documentVersionId,
      locator: matchingFacts[0].locator,
    });
  }

  return {
    report: {
      ...repairedReport,
      evidenceCandidates: evidence,
    },
    operations,
    blockedEvidenceIds: [...new Set(blockedEvidenceIds)].sort(),
  };
}

export function repairReviewEvidenceReferences(input: {
  review: ReviewQueueProductReport;
  extraction: TrustedDocumentExtractionProductReport;
}) {
  const review = structuredClone(input.review);
  const evidenceIds = new Set(
    input.extraction.evidenceCandidates.map((item) => item.evidenceCandidateId),
  );
  const claims = new Map(
    input.extraction.candidateClaims.map((claim) => [claim.claimId, claim]),
  );
  const evidence = new Map(
    input.extraction.evidenceCandidates.map((item) => [
      item.evidenceCandidateId,
      item,
    ]),
  );
  const versions = new Map(
    input.extraction.documentVersions.map((version) => [version.versionId, version]),
  );
  const operations: EvidenceRepairOperation[] = [];
  const repairedClaimIds = new Set<string>();
  for (const item of review.reviewItems) {
    const claim = claims.get(item.claimCandidateId);
    if (
      !claim ||
      !claim.evidenceCandidateIds.length ||
      !claim.evidenceCandidateIds.every((id) => evidenceIds.has(id))
    ) {
      continue;
    }
    const linkedEvidence = claim.evidenceCandidateIds
      .map((id) => evidence.get(id))
      .filter((value): value is EvidenceCandidateReference => Boolean(value));
    const linkedVersions = [
      ...new Set(linkedEvidence.map((value) => value.documentVersionId)),
    ].filter((id) => versions.has(id));
    if (!linkedVersions.length) continue;
    const evidenceIsCurrent =
      item.evidenceCandidateIds.length === claim.evidenceCandidateIds.length &&
      item.evidenceCandidateIds.every(
        (id, index) => id === claim.evidenceCandidateIds[index],
      );
    const versionsAreCurrent = linkedVersions.every((id) =>
      item.documentVersionIds.includes(id),
    );
    if (evidenceIsCurrent && versionsAreCurrent) continue;
    const oldEvidenceId = item.evidenceCandidateIds.join(",") || "(empty)";
    item.evidenceCandidateIds = [...claim.evidenceCandidateIds];
    item.documentVersionIds = linkedVersions;
    item.sourceUrls = [
      ...new Set(linkedEvidence.map((value) => value.sourceUrl)),
    ].sort();
    item.reasons = item.reasons.filter(
      (reason) => reason !== "No DocumentVersion was linked through evidence.",
    );
    repairedClaimIds.add(item.claimCandidateId);
    const firstEvidence = linkedEvidence[0];
    const firstVersion = versions.get(firstEvidence.documentVersionId);
    operations.push({
      entityType: "ReviewItem",
      entityId: item.reviewItemId,
      productSlug: input.extraction.product.productSlug,
      manufacturer: input.extraction.product.manufacturer ?? "Unknown",
      oldEvidenceId,
      newEvidenceId: claim.evidenceCandidateIds.join(","),
      repairMethod: "propagation",
      basis:
        "The review item references a single existing claim whose evidence and document versions are valid.",
      confidence: "deterministic only",
      sourceId: firstVersion?.sourceId ?? "",
      documentVersionId: firstEvidence.documentVersionId,
      locator: firstEvidence.locator,
    });
  }
  review.missingEvidence = review.missingEvidence.filter(
    (item) => !repairedClaimIds.has(item.claimCandidateId),
  );
  review.groupedByClaimType = {};
  for (const item of review.reviewItems) {
    review.groupedByClaimType[item.suggestedClaimType] = [
      ...(review.groupedByClaimType[item.suggestedClaimType] ?? []),
      item,
    ];
  }
  return { report: review, operations };
}

export function removeAbsoluteUserPaths(value: unknown): unknown {
  if (typeof value === "string") {
    if (!value.startsWith("/Users/")) return value;
    const researchIndex = value.indexOf("/data/research/");
    if (researchIndex >= 0) return value.slice(researchIndex + 1);
    return value;
  }
  if (Array.isArray(value)) return value.map(removeAbsoluteUserPaths);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        removeAbsoluteUserPaths(item),
      ]),
    );
  }
  return value;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${stableId("part", [
    relative(process.cwd(), path),
    JSON.stringify(value),
  ])}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

async function listProductFiles() {
  return (await readdir(EXTRACTION_PRODUCTS))
    .filter(
      (file) =>
        file.endsWith(".json") &&
        !/(?: [23]| copy| final| new)\.[^.]+$/iu.test(file),
    )
    .sort();
}

async function optionalJson<T>(path: string): Promise<T | null> {
  try {
    return await readJson<T>(path);
  } catch {
    return null;
  }
}

async function loadProductGraphs(): Promise<LoadedProductGraph[]> {
  const files = await listProductFiles();
  return Promise.all(
    files.map(async (fileName) => {
      const extractionPath = join(EXTRACTION_PRODUCTS, fileName);
      const reviewPath = join(REVIEW_PRODUCTS, fileName);
      return {
        fileName,
        extraction: await readJson<TrustedDocumentExtractionProductReport>(
          extractionPath,
        ),
        review: await optionalJson<ReviewQueueProductReport>(reviewPath),
        discovery: await optionalJson<JsonRecord>(
          join(DISCOVERY_PRODUCTS, fileName),
        ),
        documents: await optionalJson<JsonRecord>(join(DOCUMENT_PRODUCTS, fileName)),
        extractionReportPath: extractionPath,
        reviewReportPath: reviewPath,
      };
    }),
  );
}

async function auditRepository() {
  const graphs = await loadProductGraphs();
  const violations = graphs.flatMap((graph) =>
    auditProductEvidenceGraph(graph),
  );
  return {
    graphs,
    violations,
    summary: summarizeEvidenceViolations(violations),
  };
}

async function refreshExtractionAggregate() {
  const reports = await Promise.all(
    (await listProductFiles()).map((file) =>
      readJson<TrustedDocumentExtractionProductReport>(
        join(EXTRACTION_PRODUCTS, file),
      ),
    ),
  );
  const aggregate = await readJson<JsonRecord>(EXTRACTION_AGGREGATE);
  const includedSlugs = new Set(
    asRecords(aggregate.productReports)
      .map((item) => asString(item.productSlug))
      .filter((value): value is string => Boolean(value)),
  );
  aggregate.evidenceCandidates = reports
    .filter(
      (report) =>
        includedSlugs.size === 0 ||
        includedSlugs.has(report.product.productSlug),
    )
    .reduce(
      (total, report) => total + report.evidenceCandidates.length,
      0,
    );
  await writeJsonAtomic(EXTRACTION_AGGREGATE, aggregate);
}

async function cleanPersistedAbsolutePaths() {
  const current = await readJson<unknown>(WAVE2_AGGREGATE);
  const cleaned = removeAbsoluteUserPaths(current);
  if (JSON.stringify(current) !== JSON.stringify(cleaned)) {
    await writeJsonAtomic(WAVE2_AGGREGATE, cleaned);
    return [relative(process.cwd(), WAVE2_AGGREGATE)];
  }
  return [];
}

async function runRepair() {
  const before = await auditRepository();
  const existingRepair = await optionalJson<{
    violationsBefore: number;
    uniqueMissingEvidenceIdsBefore: number;
    repairedExact: number;
    repairedDeterministic: number;
    repairedPropagation: number;
    normalizedLegacyIds: number;
    affectedManufacturers: string[];
    affectedProducts: string[];
    changedFiles: string[];
    checkpoints: Array<{
      manufacturer: string;
      violationsBefore: number;
      violationsAfter: number;
    }>;
    operations: EvidenceRepairOperation[];
    violationsAfter: number;
  }>(REPAIR_REPORT);
  const existingAudit = await optionalJson<{
    baseline: EvidenceIntegritySummary;
    baselineViolations: EvidenceIntegrityViolation[];
  }>(INTEGRITY_REPORT);
  if (before.summary.totalViolations === 0) {
    if (existingRepair?.violationsAfter === 0) {
      process.stdout.write(`${JSON.stringify(existingRepair, null, 2)}\n`);
      return;
    }
  }
  const operations: EvidenceRepairOperation[] = [];
  const blocked = new Set<string>();
  const changedFiles = new Set<string>();
  const checkpoints: Array<{
    manufacturer: string;
    violationsBefore: number;
    violationsAfter: number;
  }> = [];
  let priorCount = before.summary.totalViolations;

  for (const manufacturer of MANUFACTURER_ORDER) {
    const graphs = (await loadProductGraphs()).filter(
      (graph) => graph.extraction.product.manufacturer === manufacturer,
    );
    for (const graph of graphs) {
      const sourceIds = new Set(
        asRecords(graph.discovery?.sourceCandidates)
          .map((source) => asString(source.sourceId))
          .filter((value): value is string => Boolean(value)),
      );
      const repaired = repairProductEvidenceReferences(graph.extraction, {
        sourceIds,
      });
      if (repaired.operations.length) {
        await writeJsonAtomic(graph.extractionReportPath, repaired.report);
        changedFiles.add(relative(process.cwd(), graph.extractionReportPath));
        operations.push(...repaired.operations);
      }
      if (graph.review) {
        const repairedReview = repairReviewEvidenceReferences({
          review: graph.review,
          extraction: repaired.report,
        });
        if (repairedReview.operations.length) {
          await writeJsonAtomic(graph.reviewReportPath ?? join(REVIEW_PRODUCTS, graph.fileName), repairedReview.report);
          changedFiles.add(
            relative(
              process.cwd(),
              graph.reviewReportPath ?? join(REVIEW_PRODUCTS, graph.fileName),
            ),
          );
          operations.push(...repairedReview.operations);
        }
      }
      repaired.blockedEvidenceIds.forEach((id) => blocked.add(id));
    }
    const checkpoint = await auditRepository();
    if (checkpoint.summary.totalViolations > priorCount) {
      throw new Error(
        `Integrity violations increased after ${manufacturer}: ${priorCount} -> ${checkpoint.summary.totalViolations}`,
      );
    }
    checkpoints.push({
      manufacturer,
      violationsBefore: priorCount,
      violationsAfter: checkpoint.summary.totalViolations,
    });
    priorCount = checkpoint.summary.totalViolations;
  }

  if (operations.length) {
    await refreshExtractionAggregate();
    changedFiles.add(relative(process.cwd(), EXTRACTION_AGGREGATE));
  }
  for (const path of await cleanPersistedAbsolutePaths()) changedFiles.add(path);

  const after = await auditRepository();
  const propagationOperations = operations.filter(
    (operation) => operation.repairMethod === "propagation",
  ).length;
  const repairedPropagation = propagationOperations + Math.max(
    0,
    before.summary.totalViolations - after.summary.totalViolations - operations.length,
  );
  const safetyFlags = {
    publicationCreated: false,
    verifiedClaimsCreated: 0,
    reviewDecisionsChanged: false,
    supabaseWrites: false,
    verificationChanged: false,
  };
  const inputReports = [
    "data/research/discovery/products/*.json",
    "data/research/documents/products/*.json",
    "data/research/extraction/products/*.json",
    "data/research/review/products/*.json",
  ];
  const combinedOperations = [
    ...(existingRepair?.operations ?? []),
    ...operations,
  ].filter(
    (operation, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.entityType === operation.entityType &&
          candidate.entityId === operation.entityId &&
          candidate.repairMethod === operation.repairMethod,
      ) === index,
  );
  const historicalViolationsBefore =
    existingRepair?.violationsBefore ?? before.summary.totalViolations;
  const historicalDeterministic =
    existingRepair?.repairedDeterministic ??
    operations.filter(
      (operation) => operation.repairMethod === "deterministic_regeneration",
    ).length;
  const historicalExact =
    (existingRepair?.repairedExact ?? 0) +
    operations.filter((operation) => operation.repairMethod === "exact_match")
      .length;
  const historicalPropagation = Math.max(
    existingRepair?.repairedPropagation ?? 0,
    repairedPropagation,
    combinedOperations.filter(
      (operation) => operation.repairMethod === "propagation",
    ).length +
      Math.max(
        0,
        historicalViolationsBefore -
          after.summary.totalViolations -
          combinedOperations.length,
      ),
  );
  const combinedChangedFiles = [
    ...(existingRepair?.changedFiles ?? []),
    ...changedFiles,
  ].filter((path, index, all) => all.indexOf(path) === index).sort();
  const auditReport = {
    generatedAt: GENERATED_AT,
    inputReports,
    baseline: existingAudit?.baseline ?? before.summary,
    current: after.summary,
    baselineViolations: existingAudit?.baselineViolations ?? before.violations,
    violations: after.violations,
    safetyFlags,
  };
  const repairReport = {
    generatedAt: GENERATED_AT,
    inputReports,
    violationsBefore: historicalViolationsBefore,
    uniqueMissingEvidenceIdsBefore:
      existingRepair?.uniqueMissingEvidenceIdsBefore ??
      before.summary.uniqueMissingEvidenceIds,
    repairedExact: historicalExact,
    repairedDeterministic: historicalDeterministic,
    repairedPropagation: historicalPropagation,
    normalizedLegacyIds: existingRepair?.normalizedLegacyIds ?? 0,
    blockedItems: blocked.size,
    unrecoverableItems: after.violations.filter(
      (item) =>
        item.repairability !== "repairable_exact" &&
        item.repairability !== "repairable_deterministic",
    ).length,
    violationsAfter: after.summary.totalViolations,
    affectedManufacturers: [
      ...(existingRepair?.affectedManufacturers ?? []),
      ...Object.keys(before.summary.byManufacturer),
    ].filter((value, index, all) => all.indexOf(value) === index).sort(),
    affectedProducts: [
      ...(existingRepair?.affectedProducts ?? []),
      ...before.summary.affectedProducts,
    ].filter((value, index, all) => all.indexOf(value) === index).sort(),
    changedFiles: combinedChangedFiles,
    checkpoints: existingRepair?.checkpoints ?? checkpoints,
    operations: combinedOperations,
    safetyFlags,
  };
  await writeJsonAtomic(INTEGRITY_REPORT, auditReport);
  await writeJsonAtomic(REPAIR_REPORT, repairReport);
  process.stdout.write(`${JSON.stringify(repairReport, null, 2)}\n`);
}

async function main() {
  const command = process.argv[2] ?? "audit";
  if (command === "audit") {
    const audit = await auditRepository();
    process.stdout.write(
      `${JSON.stringify({ generatedAt: GENERATED_AT, ...audit.summary }, null, 2)}\n`,
    );
    return;
  }
  if (command === "repair") {
    await runRepair();
    return;
  }
  throw new Error(`Unknown evidence integrity command: ${command}`);
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
