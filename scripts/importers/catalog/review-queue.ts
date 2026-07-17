import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type {
  CandidateClaimHandoff,
  DocumentVersion,
  TrustedDocumentExtractionProductReport,
} from "./trusted-documents.ts";

const EXTRACTION_PRODUCT_DIRECTORY = resolve(
  process.cwd(),
  "data/research/extraction/products",
);
const REVIEW_ROOT = resolve(process.cwd(), "data/research/review");
const REVIEW_PRODUCT_DIRECTORY = resolve(REVIEW_ROOT, "products");
const REVIEW_QUEUE_REPORT_PATH = resolve(
  REVIEW_ROOT,
  "review-queue.generated.json",
);
const GENERATED_AT = "candidate-review-queue";

export type ReviewQueueStatus =
  | "pending_review"
  | "needs_more_evidence"
  | "approved_for_verification"
  | "rejected"
  | "conflict";

export type ReviewPriority = "critical" | "high" | "medium" | "low";
export type ReviewRiskLevel = "high" | "medium" | "low";

export interface ReviewQueueItem {
  reviewItemId: string;
  productSlug: string;
  productTitle: string;
  claimCandidateId: string;
  suggestedClaimType: string;
  valuePayload: { value: string; unit: string | null };
  evidenceCandidateIds: string[];
  documentVersionIds: string[];
  sourceUrls: string[];
  status: ReviewQueueStatus;
  priority: ReviewPriority;
  riskLevel: ReviewRiskLevel;
  reasons: string[];
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQueueProductReport {
  product: TrustedDocumentExtractionProductReport["product"];
  reviewItems: ReviewQueueItem[];
  groupedByClaimType: Record<string, ReviewQueueItem[]>;
  sourceDocumentSummary: Array<{
    documentVersionId: string;
    documentType: string;
    title: string;
    sourceUrl: string;
    sha256: string;
  }>;
  missingEvidence: Array<{
    claimCandidateId: string;
    reason: string;
  }>;
  recommendedReviewerAction: string;
  warnings: string[];
}

export interface ReviewQueueAggregateReport {
  totalItems: number;
  pendingReview: number;
  highPriority: number;
  missingEvidence: number;
  conflicts: number;
  readyForHumanReview: number;
  productsWithReviewItems: number;
  productReports: Array<{
    productSlug: string;
    reviewItems: number;
    pendingReview: number;
    highPriority: number;
    missingEvidence: number;
    conflicts: number;
    readyForHumanReview: number;
  }>;
  warnings: string[];
}

function stableId(prefix: string, parts: Array<string | number | null>) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${stableId("part", [path, JSON.stringify(value)])}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

async function readJsonFile<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function listJsonFiles(directory: string) {
  try {
    return (await readdir(directory))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => join(directory, file));
  } catch {
    return [];
  }
}

function claimRisk(claimType: string): {
  priority: ReviewPriority;
  riskLevel: ReviewRiskLevel;
  reasons: string[];
} {
  if (
    /compatibility|clinical|procurement|safety|warnings|contraindications|risk/i.test(
      claimType,
    )
  ) {
    return {
      priority: "critical",
      riskLevel: "high",
      reasons: ["High-risk clinical, safety, compatibility or procurement claim."],
    };
  }
  if (/registration/i.test(claimType)) {
    return {
      priority: "high",
      riskLevel: "high",
      reasons: ["Registration data requires high-priority human review."],
    };
  }
  if (/manufacturer|model/i.test(claimType)) {
    return {
      priority: "high",
      riskLevel: "medium",
      reasons: ["Identity data affects product matching and review routing."],
    };
  }
  if (/document\.type|document\.title|technical\.term/i.test(claimType)) {
    return {
      priority: "medium",
      riskLevel: "low",
      reasons: ["Document metadata or low-level extracted term requires review."],
    };
  }
  return {
    priority: "medium",
    riskLevel: "medium",
    reasons: ["Candidate claim requires human review before verification."],
  };
}

function documentVersionsForClaim(
  claim: CandidateClaimHandoff,
  report: TrustedDocumentExtractionProductReport,
) {
  const evidenceIds = new Set(claim.evidenceCandidateIds);
  const knownDocumentVersions = new Set(
    report.documentVersions.map((version) => version.versionId),
  );
  const evidence = report.evidenceCandidates.filter((candidate) =>
    evidenceIds.has(candidate.evidenceCandidateId),
  );
  const ids = [
    ...new Set(
      evidence
        .map((candidate) => candidate.documentVersionId)
        .filter((id) => knownDocumentVersions.has(id)),
    ),
  ];
  return ids;
}

function sourceUrlsForClaim(
  claim: CandidateClaimHandoff,
  report: TrustedDocumentExtractionProductReport,
) {
  const evidenceIds = new Set(claim.evidenceCandidateIds);
  const evidence = report.evidenceCandidates.filter((candidate) =>
    evidenceIds.has(candidate.evidenceCandidateId),
  );
  return [...new Set(evidence.map((candidate) => candidate.sourceUrl))].sort();
}

export function buildReviewQueueForProduct(
  report: TrustedDocumentExtractionProductReport,
): ReviewQueueProductReport {
  const warnings = [...report.warnings];
  const missingEvidence: ReviewQueueProductReport["missingEvidence"] = [];
  const reviewItems: ReviewQueueItem[] = [];

  for (const claim of report.candidateClaims) {
    if (!claim.evidenceCandidateIds.length) {
      warnings.push(
        `CandidateClaim ${claim.claimId} skipped: evidenceCandidateIds is empty.`,
      );
      missingEvidence.push({
        claimCandidateId: claim.claimId,
        reason: "CandidateClaim has no evidenceCandidateIds.",
      });
      continue;
    }
    const documentVersionIds = documentVersionsForClaim(claim, report);
    const sourceUrls = sourceUrlsForClaim(claim, report);
    const risk = claimRisk(claim.suggestedClaimType);
    const reasons = [
      ...risk.reasons,
      "Review Queue item is not a Verified Claim.",
      "Reviewer decision does not publish data.",
    ];
    if (!documentVersionIds.length) {
      reasons.push("No DocumentVersion was linked through evidence.");
      missingEvidence.push({
        claimCandidateId: claim.claimId,
        reason: "Evidence exists but no DocumentVersion could be linked.",
      });
    }
    reviewItems.push({
      reviewItemId: stableId("review_item", [
        report.product.productSlug,
        claim.claimId,
        claim.suggestedClaimType,
      ]),
      productSlug: report.product.productSlug,
      productTitle: report.product.productName,
      claimCandidateId: claim.claimId,
      suggestedClaimType: claim.suggestedClaimType,
      valuePayload: claim.valuePayload,
      evidenceCandidateIds: claim.evidenceCandidateIds,
      documentVersionIds,
      sourceUrls,
      status: "pending_review",
      priority: documentVersionIds.length ? risk.priority : "high",
      riskLevel: documentVersionIds.length ? risk.riskLevel : "medium",
      reasons,
      reviewerNotes: null,
      createdAt: GENERATED_AT,
      updatedAt: GENERATED_AT,
    });
  }

  const groupedByClaimType: Record<string, ReviewQueueItem[]> = {};
  for (const item of reviewItems) {
    groupedByClaimType[item.suggestedClaimType] = [
      ...(groupedByClaimType[item.suggestedClaimType] ?? []),
      item,
    ];
  }

  const sourceDocumentSummary = report.documentVersions.map(
    (version: DocumentVersion) => ({
      documentVersionId: version.versionId,
      documentType: version.documentType,
      title: version.title,
      sourceUrl: version.sourceUrl,
      sha256: version.sha256,
    }),
  );

  return {
    product: report.product,
    reviewItems,
    groupedByClaimType,
    sourceDocumentSummary,
    missingEvidence,
    recommendedReviewerAction: reviewItems.length
      ? "Review extracted candidate claims against linked document versions. Do not publish from this queue."
      : "No reviewable candidate claims yet. Collect more evidence before review.",
    warnings,
  };
}

function itemReadyForHumanReview(item: ReviewQueueItem) {
  return (
    item.status === "pending_review" &&
    item.evidenceCandidateIds.length > 0 &&
    item.documentVersionIds.length > 0
  );
}

export async function buildReviewQueueReports(input: {
  extractionReports: TrustedDocumentExtractionProductReport[];
  productReportDirectory?: string;
  aggregateReportPath?: string;
}) {
  const productReportDirectory =
    input.productReportDirectory ?? REVIEW_PRODUCT_DIRECTORY;
  const aggregateReportPath = input.aggregateReportPath ?? REVIEW_QUEUE_REPORT_PATH;
  const productReports = input.extractionReports.map(buildReviewQueueForProduct);

  await Promise.all(
    productReports.map((report) =>
      writeJsonAtomic(
        join(productReportDirectory, `${report.product.productSlug}.json`),
        report,
      ),
    ),
  );

  const allItems = productReports.flatMap((report) => report.reviewItems);
  const aggregate: ReviewQueueAggregateReport = {
    totalItems: allItems.length,
    pendingReview: allItems.filter((item) => item.status === "pending_review")
      .length,
    highPriority: allItems.filter(
      (item) => item.priority === "high" || item.priority === "critical",
    ).length,
    missingEvidence: productReports.reduce(
      (sum, report) => sum + report.missingEvidence.length,
      0,
    ),
    conflicts: allItems.filter((item) => item.status === "conflict").length,
    readyForHumanReview: allItems.filter(itemReadyForHumanReview).length,
    productsWithReviewItems: productReports.filter(
      (report) => report.reviewItems.length > 0,
    ).length,
    productReports: productReports.map((report) => ({
      productSlug: report.product.productSlug,
      reviewItems: report.reviewItems.length,
      pendingReview: report.reviewItems.filter(
        (item) => item.status === "pending_review",
      ).length,
      highPriority: report.reviewItems.filter(
        (item) => item.priority === "high" || item.priority === "critical",
      ).length,
      missingEvidence: report.missingEvidence.length,
      conflicts: report.reviewItems.filter((item) => item.status === "conflict")
        .length,
      readyForHumanReview: report.reviewItems.filter(itemReadyForHumanReview)
        .length,
    })),
    warnings: [
      "Review Queue is candidate-only and must not be read by the Portal directly.",
      "Review decisions do not publish data and do not create Verified Claims.",
      ...productReports.flatMap((report) =>
        report.warnings.map((warning) => `${report.product.productSlug}: ${warning}`),
      ),
    ],
  };

  await writeJsonAtomic(aggregateReportPath, aggregate);
  return { aggregate, productReports };
}

async function loadExtractionReports(directory = EXTRACTION_PRODUCT_DIRECTORY) {
  const files = await listJsonFiles(directory);
  return Promise.all(
    files.map((file) =>
      readJsonFile<TrustedDocumentExtractionProductReport>(file),
    ),
  );
}

export async function buildReviewQueueFromExtractionReports() {
  const extractionReports = await loadExtractionReports();
  if (!extractionReports.length) {
    const aggregate: ReviewQueueAggregateReport = {
      totalItems: 0,
      pendingReview: 0,
      highPriority: 0,
      missingEvidence: 0,
      conflicts: 0,
      readyForHumanReview: 0,
      productsWithReviewItems: 0,
      productReports: [],
      warnings: [
        "Extraction product reports were not found; run npm run process:trusted-documents first.",
        "Review Queue is candidate-only and does not publish data.",
      ],
    };
    await writeJsonAtomic(REVIEW_QUEUE_REPORT_PATH, aggregate);
    return { aggregate, productReports: [] };
  }
  return buildReviewQueueReports({ extractionReports });
}

export async function readReviewQueueSummary() {
  try {
    return readJsonFile<ReviewQueueAggregateReport>(REVIEW_QUEUE_REPORT_PATH);
  } catch {
    return (await buildReviewQueueFromExtractionReports()).aggregate;
  }
}

async function runCli() {
  const mode = process.argv[2] ?? "build";
  if (mode === "summary") {
    const summary = await readReviewQueueSummary();
    console.log(
      JSON.stringify(
        {
          totalItems: summary.totalItems,
          pendingReview: summary.pendingReview,
          highPriority: summary.highPriority,
          missingEvidence: summary.missingEvidence,
          conflicts: summary.conflicts,
          readyForHumanReview: summary.readyForHumanReview,
          productsWithReviewItems: summary.productsWithReviewItems,
        },
        null,
        2,
      ),
    );
    return;
  }
  const result = await buildReviewQueueFromExtractionReports();
  console.log(
    `Review queue: items=${result.aggregate.totalItems}, pending=${result.aggregate.pendingReview}, high=${result.aggregate.highPriority}, ready=${result.aggregate.readyForHumanReview}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
