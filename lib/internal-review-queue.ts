import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const REVIEW_ROOT = resolve(process.cwd(), "data/research/review");
const REVIEW_QUEUE_REPORT_PATH = join(REVIEW_ROOT, "review-queue.generated.json");
const REVIEW_PRODUCTS_DIRECTORY = join(REVIEW_ROOT, "products");

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

export interface ReviewQueueAggregateReport {
  totalItems: number;
  pendingReview: number;
  highPriority: number;
  missingEvidence: number;
  conflicts: number;
  readyForHumanReview: number;
  productsWithReviewItems: number;
  warnings: string[];
}

export interface ReviewQueueProductReport {
  product: {
    productSlug: string;
    manufacturer: string | null;
    productName: string;
    model: string | null;
    category: string;
  };
  reviewItems: ReviewQueueItem[];
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

export type ReviewQueueLoadResult =
  | {
      status: "ready";
      aggregate: ReviewQueueAggregateReport;
      products: ReviewQueueProductReport[];
    }
  | { status: "missing" }
  | { status: "invalid" };

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function loadInternalReviewQueue(): Promise<ReviewQueueLoadResult> {
  try {
    const aggregate = await readJson<ReviewQueueAggregateReport>(
      REVIEW_QUEUE_REPORT_PATH,
    );
    const productFiles = (await readdir(REVIEW_PRODUCTS_DIRECTORY))
      .filter((file) => file.endsWith(".json"))
      .sort();
    const products = (
      await Promise.all(
        productFiles.map((file) =>
          readJson<ReviewQueueProductReport>(
            join(REVIEW_PRODUCTS_DIRECTORY, file),
          ),
        ),
      )
    ).filter((product) => product.reviewItems.length > 0);
    return { status: "ready", aggregate, products };
  } catch (error) {
    if (
      error instanceof Error &&
      ("code" in error || error.name === "SyntaxError")
    ) {
      return error.name === "SyntaxError"
        ? { status: "invalid" }
        : { status: "missing" };
    }
    return { status: "invalid" };
  }
}
