import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type {
  PublicationArtifact,
  PublicationIntegrityViolation,
  PublicationReviewItem,
  PublicationReviewProduct,
} from "../publication/types.ts";

function isUnexpectedCopy(file: string) {
  return /(?: [23]| copy| final| new)\.[^.]+$/iu.test(file);
}

export interface ReviewContext {
  reports: PublicationReviewProduct[];
  artifacts: PublicationArtifact[];
  integrityViolations: PublicationIntegrityViolation[];
}

export const FIRST_PUBLICATION_PRODUCT_SLUGS = [
  "wave2-philips-intellivue-mx400",
  "wave2-ge-carescape-b450",
  "wave2-hamilton-h900",
  "wave2-drager-babylog-vn800",
  "wave2-ambu-vivasight-2-dlt",
] as const;

export const PILOT_PRODUCT_SLUGS = FIRST_PUBLICATION_PRODUCT_SLUGS;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function loadReviewContext(input?: {
  researchRoot?: string;
}): Promise<ReviewContext> {
  const root = input?.researchRoot ?? resolve(process.cwd(), "data/research");
  const reviewDirectory = join(root, "review/products");
  const files = (await readdir(reviewDirectory))
    .filter((file) => file.endsWith(".json") && !isUnexpectedCopy(file))
    .sort();
  const reports = await Promise.all(
    files.map((file) => readJson<PublicationReviewProduct>(join(reviewDirectory, file))),
  );
  const artifactInventory = await readJson<{ artifacts: PublicationArtifact[] }>(
    join(root, "integrity/artifact-inventory.generated.json"),
  );
  const integrity = await readJson<{
    current: { totalViolations: number };
    violations: PublicationIntegrityViolation[];
  }>(join(root, "integrity/evidence-integrity.generated.json"));
  return {
    reports,
    artifacts: artifactInventory.artifacts,
    integrityViolations: integrity.current.totalViolations ? integrity.violations : [],
  };
}

export function findReviewItem(context: ReviewContext, reviewItemId: string): {
  report: PublicationReviewProduct;
  item: PublicationReviewItem;
} | null {
  for (const report of context.reports) {
    const item = report.reviewItems.find((candidate) => candidate.reviewItemId === reviewItemId);
    if (item) return { report, item };
  }
  return null;
}

export function selectPilotReports(context: ReviewContext) {
  const order = new Map(PILOT_PRODUCT_SLUGS.map((slug, index) => [slug, index]));
  return context.reports
    .filter((report) => order.has(report.product.productSlug as typeof PILOT_PRODUCT_SLUGS[number]))
    .sort(
      (left, right) =>
        (order.get(left.product.productSlug as typeof PILOT_PRODUCT_SLUGS[number]) ?? 99) -
        (order.get(right.product.productSlug as typeof PILOT_PRODUCT_SLUGS[number]) ?? 99),
    );
}
