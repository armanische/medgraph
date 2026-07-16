import { createHash } from "node:crypto";

import type { PublicationArtifact, PublicationIntegrityViolation, PublicationReviewItem, PublicationReviewProduct } from "../publication/types.ts";
import type { HumanReviewItemSnapshot } from "./types.ts";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function reviewSnapshotHash(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function validArtifact(artifact: PublicationArtifact) {
  return artifact.shaMatchesPath && !artifact.orphan && !artifact.invalidPdf &&
    !artifact.htmlMasquerading && !artifact.zeroByte;
}

export function createReviewItemSnapshot(input: {
  report: PublicationReviewProduct;
  item: PublicationReviewItem;
  artifacts: PublicationArtifact[];
  integrityViolations: PublicationIntegrityViolation[];
}): HumanReviewItemSnapshot {
  const documents = input.report.sourceDocumentSummary.filter((document) =>
    input.item.documentVersionIds.includes(document.documentVersionId),
  );
  const entityIds = new Set([
    input.item.reviewItemId,
    ...input.item.evidenceCandidateIds,
    ...input.item.documentVersionIds,
  ]);
  const violations = input.integrityViolations.filter(
    (violation) =>
      violation.productSlug === input.report.product.productSlug ||
      (violation.entityId ? entityIds.has(violation.entityId) : false) ||
      (violation.missingEvidenceId ? entityIds.has(violation.missingEvidenceId) : false) ||
      (violation.documentVersionId ? entityIds.has(violation.documentVersionId) : false),
  );
  const artifactsValid = input.item.documentVersionIds.every((versionId) =>
    input.artifacts.some(
      (artifact) =>
        artifact.referencedDocumentVersions.includes(versionId) && validArtifact(artifact),
    ),
  );
  const evidence = {
    evidenceIds: [...input.item.evidenceCandidateIds].sort(),
    valid: input.item.evidenceCandidateIds.length > 0 && violations.length === 0,
    integrityViolations: violations.length,
  };
  const value = {
    claimType: input.item.suggestedClaimType,
    value: input.item.valuePayload.value,
    unit: input.item.valuePayload.unit,
    productSlug: input.report.product.productSlug,
    productTitle: input.report.product.productName,
    manufacturer: input.report.product.manufacturer,
    model: input.report.product.model,
    category: input.report.product.category,
  };
  const sources = {
    urls: [...input.item.sourceUrls].sort(),
    official:
      input.item.sourceUrls.length > 0 &&
      input.item.sourceUrls.every((url) => {
        try {
          return new URL(url).protocol === "https:" &&
            documents.some((document) => document.sourceUrl === url);
        } catch {
          return false;
        }
      }),
  };
  const documentVersions = {
    ids: [...input.item.documentVersionIds].sort(),
    titles: documents.map((document) => document.title).sort(),
    types: documents.map((document) => document.documentType).sort(),
    artifactValid:
      input.item.documentVersionIds.length > 0 &&
      documents.length === input.item.documentVersionIds.length &&
      artifactsValid,
  };
  const material = { evidence, value, sources, documentVersions };
  return { hash: reviewSnapshotHash(material), ...material };
}
