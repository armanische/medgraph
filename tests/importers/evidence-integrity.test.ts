import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { spawnSync } from "node:child_process";

import {
  auditProductEvidenceGraph,
  removeAbsoluteUserPaths,
  repairProductEvidenceReferences,
  repairReviewEvidenceReferences,
} from "../../scripts/importers/catalog/evidence-integrity.ts";
import type { ReviewQueueProductReport } from "../../scripts/importers/catalog/review-queue.ts";
import {
  canonicalEvidenceId,
  type TrustedDocumentExtractionProductReport,
} from "../../scripts/importers/catalog/trusted-documents.ts";

const locator = {
  page: 7,
  section: null,
  heading: "Technical data",
  table: null,
  paragraph: 3,
};

function fixture() {
  const evidenceId = canonicalEvidenceId({
    documentVersionId: "document_version_test",
    rawText: "Weight: 12 kg",
    locator,
  });
  const extraction = {
    product: {
      productSlug: "wave2-test-device",
      manufacturer: "Test Medical",
      productName: "Test Device",
      model: "T1",
      category: "Test",
    },
    documentVersions: [
      {
        versionId: "document_version_test",
        documentCandidateId: "document_test",
        sourceId: "source_test",
        productSlug: "wave2-test-device",
        documentKey: "trusted-document:document_test",
        documentType: "technical_data",
        title: "Technical data",
        language: "en",
        sourceUrl: "https://manufacturer.example/technical.pdf",
        sha256: "a".repeat(64),
        contentType: "application/pdf",
        byteSize: 100,
        filePath: "data/research/artifacts/test.pdf",
        trustTier: 1,
        requiresHumanReview: true,
        status: "candidate",
      },
    ],
    extractedFactCandidates: [
      {
        factCandidateId: "fact_test",
        productSlug: "wave2-test-device",
        factType: "product.weight",
        label: "Weight",
        value: "12",
        unit: "kg",
        rawText: "Weight: 12 kg",
        documentVersionId: "document_version_test",
        documentCandidateId: "document_test",
        documentSha256: "a".repeat(64),
        sourceUrl: "https://manufacturer.example/technical.pdf",
        locator,
        evidenceCandidateId: evidenceId,
        confidence: 0.9,
        extractionMethod: "pdf_text",
        status: "candidate",
        verificationStatus: "unverified",
        autoPublish: false,
        requiresHumanReview: true,
        warnings: [],
      },
    ],
    evidenceCandidates: [],
    candidateClaims: [
      {
        claimId: "claim_test",
        productSlug: "wave2-test-device",
        subjectType: "product",
        suggestedClaimType: "product.weight",
        valuePayload: { value: "12", unit: "kg" },
        rawText: "Weight: 12 kg",
        evidenceCandidateIds: [evidenceId],
        confidence: 0.9,
        extractionMethod: "pdf_text",
        status: "candidate",
        verificationStatus: "unverified",
        autoPublish: false,
        requiresHumanReview: true,
        warnings: [],
      },
    ],
    extractionProfileSummary: {
      profilesUsed: ["registry"],
      patternsMatched: { weight: 1 },
      normalizedUnits: { kg: 1 },
      failedFields: {},
      coveragePercent: 25,
    },
    warnings: [],
    readiness: {
      hasDownloadedDocuments: true,
      hasExtractedText: true,
      hasCandidateClaims: true,
      canProceedToReview: true,
    },
  } as const;
  const review = {
    product: extraction.product,
    reviewItems: [
      {
        reviewItemId: "review_item_test",
        productSlug: "wave2-test-device",
        productTitle: "Test Device",
        claimCandidateId: "claim_test",
        suggestedClaimType: "product.weight",
        valuePayload: { value: "12", unit: "kg" },
        evidenceCandidateIds: [evidenceId],
        documentVersionIds: ["document_version_test"],
        sourceUrls: ["https://manufacturer.example/technical.pdf"],
        status: "pending_review",
        priority: "medium",
        riskLevel: "medium",
        reasons: [],
        reviewerNotes: null,
        createdAt: "candidate-review-queue",
        updatedAt: "candidate-review-queue",
      },
    ],
    groupedByClaimType: {},
    sourceDocumentSummary: [],
    missingEvidence: [],
    recommendedReviewerAction: "Review",
    warnings: [],
  } as const;
  return {
    evidenceId,
    extraction: structuredClone(
      extraction,
    ) as unknown as TrustedDocumentExtractionProductReport,
    review: structuredClone(review) as unknown as ReviewQueueProductReport,
    discovery: { sourceCandidates: [{ sourceId: "source_test" }] },
    documents: {
      documentVersions: [{ versionId: "document_version_test" }],
    },
  };
}

function audit(input = fixture()) {
  return auditProductEvidenceGraph({
    extraction: input.extraction,
    review: input.review,
    discovery: input.discovery,
    documents: input.documents,
    extractionReportPath:
      "data/research/extraction/products/wave2-test-device.json",
    reviewReportPath: "data/research/review/products/wave2-test-device.json",
    artifactExists: () => true,
  });
}

test("missing evidence is detected at fact, claim and review stages", () => {
  const violations = audit();
  assert.equal(violations.length, 3);
  assert.deepEqual(
    violations.map((item) => item.stage).sort(),
    ["candidate_claim", "extracted_fact", "review_item"],
  );
  assert.ok(
    violations.every(
      (item) => item.repairability === "repairable_deterministic",
    ),
  );
});

test("deterministic repair recreates evidence only from a complete chain", () => {
  const input = fixture();
  const repaired = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations.length, 1);
  assert.equal(repaired.operations[0].repairMethod, "deterministic_regeneration");
  assert.equal(
    repaired.report.evidenceCandidates[0].evidenceCandidateId,
    input.evidenceId,
  );
});

test("exact repair normalizes a legacy reference to one matching evidence", () => {
  const input = fixture();
  const deterministic = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  deterministic.extractedFactCandidates[0].evidenceCandidateId = "evidence_legacy";
  deterministic.candidateClaims[0].evidenceCandidateIds = ["evidence_legacy"];
  const repaired = repairProductEvidenceReferences(deterministic, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations[0].repairMethod, "exact_match");
  assert.equal(
    repaired.report.extractedFactCandidates[0].evidenceCandidateId,
    input.evidenceId,
  );
  assert.deepEqual(repaired.report.candidateClaims[0].evidenceCandidateIds, [
    input.evidenceId,
  ]);
});

test("propagation repair links a claim to its single matching fact", () => {
  const input = fixture();
  const repairedEvidence = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  repairedEvidence.candidateClaims[0].evidenceCandidateIds = ["evidence_old"];
  const repaired = repairProductEvidenceReferences(repairedEvidence, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations[0].repairMethod, "propagation");
  assert.deepEqual(repaired.report.candidateClaims[0].evidenceCandidateIds, [
    input.evidenceId,
  ]);
});

test("review propagation uses the existing claim and document version", () => {
  const input = fixture();
  const extraction = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  input.review.reviewItems[0].evidenceCandidateIds = ["evidence_old"];
  const repaired = repairReviewEvidenceReferences({
    review: input.review,
    extraction,
  });
  assert.equal(repaired.operations.length, 1);
  assert.deepEqual(repaired.report.reviewItems[0].evidenceCandidateIds, [
    input.evidenceId,
  ]);
  assert.deepEqual(repaired.report.reviewItems[0].documentVersionIds, [
    "document_version_test",
  ]);
});

test("audit detects a missing review document-version link", () => {
  const input = fixture();
  input.extraction = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  input.review.reviewItems[0].documentVersionIds = [];
  const violations = audit(input);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].reason, "missing_document_version_link");
  assert.equal(violations[0].repairability, "repairable_exact");
});

test("ambiguous evidence is not repaired", () => {
  const input = fixture();
  const extraction = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  const duplicate = structuredClone(extraction.extractedFactCandidates[0]);
  duplicate.factCandidateId = "fact_duplicate";
  extraction.extractedFactCandidates.push(duplicate);
  extraction.candidateClaims[0].evidenceCandidateIds = ["evidence_unknown"];
  const repaired = repairProductEvidenceReferences(extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations.length, 0);
  assert.deepEqual(repaired.report.candidateClaims[0].evidenceCandidateIds, [
    "evidence_unknown",
  ]);
});

test("missing document version is never substituted", () => {
  const input = fixture();
  input.extraction.documentVersions = [];
  const repaired = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations.length, 0);
  assert.equal(repaired.report.evidenceCandidates.length, 0);
});

test("missing locator is never fabricated", () => {
  const input = fixture();
  input.extraction.extractedFactCandidates[0].locator = {
    page: null,
    section: null,
    heading: null,
    table: null,
    paragraph: null,
  };
  const repaired = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(repaired.operations.length, 0);
  assert.equal(repaired.report.evidenceCandidates.length, 0);
});

test("missing artifact never creates fake evidence", () => {
  const input = fixture();
  const repaired = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => false,
  });
  assert.equal(repaired.operations.length, 0);
  assert.equal(repaired.report.evidenceCandidates.length, 0);
});

test("canonical evidence ID is stable for identical input", () => {
  const first = canonicalEvidenceId({
    documentVersionId: "version",
    rawText: "value",
    locator,
  });
  const second = canonicalEvidenceId({
    documentVersionId: "version",
    rawText: "value",
    locator: { ...locator },
  });
  assert.equal(first, second);
});

test("input object order does not change evidence ID", () => {
  const reordered = {
    paragraph: 3,
    table: null,
    heading: "Technical data",
    section: null,
    page: 7,
  };
  assert.equal(
    canonicalEvidenceId({ documentVersionId: "version", rawText: "value", locator }),
    canonicalEvidenceId({
      documentVersionId: "version",
      rawText: "value",
      locator: reordered,
    }),
  );
});

test("generatedAt cannot affect evidence ID", () => {
  const id = canonicalEvidenceId({
    documentVersionId: "version",
    rawText: "value",
    locator,
  });
  const withGeneratedAt = {
    generatedAt: "tomorrow",
    documentVersionId: "version",
    rawText: "value",
    locator,
  };
  assert.equal(
    id,
    canonicalEvidenceId({
      documentVersionId: withGeneratedAt.documentVersionId,
      rawText: withGeneratedAt.rawText,
      locator: withGeneratedAt.locator,
    }),
  );
});

test("absolute user paths are removed from generated report values", () => {
  const cleaned = removeAbsoluteUserPaths({
    report: "/Users/example/project/data/research/wave2/Test/summary.generated.json",
    officialUrl: "https://manufacturer.example/file.pdf",
  });
  assert.deepEqual(cleaned, {
    report: "data/research/wave2/Test/summary.generated.json",
    officialUrl: "https://manufacturer.example/file.pdf",
  });
});

test("generated research JSON contains no absolute user path", () => {
  const result = spawnSync(
    "rg",
    ["-l", "--glob", "*.json", "/Users/", "data/research"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), "");
});

test("repair is idempotent and the second run adds no operation", () => {
  const input = fixture();
  const first = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  const second = repairProductEvidenceReferences(first.report, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  });
  assert.equal(first.operations.length, 1);
  assert.equal(second.operations.length, 0);
  assert.deepEqual(second.report, first.report);
});

test("violations do not grow after deterministic repair", () => {
  const input = fixture();
  const before = audit(input).length;
  input.extraction = repairProductEvidenceReferences(input.extraction, {
    sourceIds: new Set(["source_test"]),
    artifactExists: () => true,
  }).report;
  const after = audit(input).length;
  assert.equal(before, 3);
  assert.equal(after, 0);
});

test("evidence integrity repair imports no protected writers", async () => {
  const source = await readFile(
    "scripts/importers/catalog/evidence-integrity.ts",
    "utf8",
  );
  assert.doesNotMatch(source, /from\s+["'][^"']*(supabase|publication|verification)/i);
  assert.doesNotMatch(source, /review-decisions\.generated\.json/);
  assert.doesNotMatch(source, /decisions\.manual\.json/);
});

test("repair report confirms no publication, verification, Supabase or review decisions", async () => {
  const report = JSON.parse(
    await readFile(
      "data/research/integrity/evidence-repair.generated.json",
      "utf8",
    ),
  ) as { safetyFlags: Record<string, unknown> };
  assert.deepEqual(report.safetyFlags, {
    publicationCreated: false,
    verifiedClaimsCreated: 0,
    reviewDecisionsChanged: false,
    supabaseWrites: false,
    verificationChanged: false,
  });
});
