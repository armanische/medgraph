import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ReviewPackage } from "./review-adapter.ts";

/** The sole adapter permitted to materialize generated publication/review output. */
export function assertOutputPath(outputPath: string, allowedRoot: string): string {
  const root = path.resolve(allowedRoot);
  const resolved = path.resolve(outputPath);
  if (resolved === root || !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Output path must be a product directory below ${root}`);
  }
  return resolved;
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function writeReviewPackage(
  reviewPackage: ReviewPackage,
  productOutputPath: string,
  allowedRoot: string,
): Promise<string[]> {
  const outputPath = assertOutputPath(productOutputPath, allowedRoot);
  await mkdir(outputPath, { recursive: true });
  const files: Array<[string, unknown, boolean?]> = [
    ["source.json", reviewPackage.source],
    ["extracted.json", reviewPackage.extracted],
    ["normalized-product.json", reviewPackage.normalizedProduct],
    ["publication-candidate.json", reviewPackage.publicationCandidate],
    ["provenance.json", reviewPackage.provenance],
    ["warnings.json", reviewPackage.warnings],
    ["blocking-errors.json", reviewPackage.blockingErrors],
    ["review.json", reviewPackage.review],
    ["existing-product-diff.json", reviewPackage.existingProductDiff],
    ["migration-report.md", reviewPackage.migrationReport, true],
  ];
  await Promise.all(files.map(([filename, value, raw]) =>
    writeFile(path.join(outputPath, filename), raw ? String(value) : stableJson(value), "utf8"),
  ));
  return files.map(([filename]) => path.join(outputPath, filename));
}

export async function cleanRunOutput(runOutputPath: string, allowedRoot: string): Promise<void> {
  const resolved = assertOutputPath(runOutputPath, allowedRoot);
  await rm(resolved, { recursive: true, force: true });
}
