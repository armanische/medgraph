import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadReferenceData } from "./adapters/reference-file-adapter.ts";
import {
  createStorefrontAdapterResult,
  loadExistingStorefrontProducts,
} from "./adapters/storefront-adapter.ts";
import { createReviewPackage } from "./adapters/review-adapter.ts";
import { cleanRunOutput, writeReviewPackage } from "./adapters/publication-adapter.ts";
import { runLegacyImportPipeline } from "./core-pipeline.ts";
import type { LegacySourceInput, PilotManifest } from "./contracts.ts";

export * from "./contracts.ts";
export * from "./parser.ts";
export * from "./normalization.ts";
export * from "./resolvers.ts";
export * from "./core-pipeline.ts";
export { loadReferenceData } from "./adapters/reference-file-adapter.ts";
export { loadExistingStorefrontProducts as loadExistingProducts } from "./adapters/storefront-adapter.ts";
export * from "./adapters/storefront-adapter.ts";
export * from "./adapters/review-adapter.ts";
export * from "./adapters/publication-adapter.ts";
export type * from "./adapters/cloud-adapter.ts";

interface CliOptions {
  manifest: string;
  product: string | null;
  output: string | null;
  dryRun: boolean;
  cleanOutput: boolean;
  failOnBlocking: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    manifest: "data/import/pilot-manifest.json",
    product: null,
    output: null,
    dryRun: false,
    cleanOutput: false,
    failOnBlocking: false,
    verbose: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--manifest" || argument === "--product" || argument === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
      if (argument === "--manifest") options.manifest = value;
      if (argument === "--product") options.product = value;
      if (argument === "--output") options.output = value;
      index += 1;
      continue;
    }
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--clean-output") options.cleanOutput = true;
    else if (argument === "--fail-on-blocking") options.failOnBlocking = true;
    else if (argument === "--verbose") options.verbose = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

/**
 * Legacy CLI composition root. The core pipeline stays independent: this entrypoint
 * is where optional Storefront, Review and Publication adapters are explicitly
 * selected for the historical pilot command.
 */
export async function buildReviewPackage(options: {
  source: LegacySourceInput;
  manifestProduct: PilotManifest["products"][number];
  repositoryRoot: string;
  runTimestamp: string;
  references?: Awaited<ReturnType<typeof loadReferenceData>>;
  existingProducts?: Awaited<ReturnType<typeof loadExistingStorefrontProducts>>;
}) {
  const references = options.references ?? await loadReferenceData(options.repositoryRoot);
  const existingProducts = options.existingProducts ?? await loadExistingStorefrontProducts(options.repositoryRoot);
  const result = runLegacyImportPipeline({
    source: options.source,
    references,
    runTimestamp: options.runTimestamp,
  });
  const storefront = createStorefrontAdapterResult({
    result,
    expectedExistingProductSlug: options.manifestProduct.expectedExistingProductSlug,
    existingProducts,
  });
  return createReviewPackage({
    result,
    identity: storefront.identity,
    publicationCandidate: storefront.candidate,
    existingProductDiff: storefront.existingProductDiff,
    notes: options.manifestProduct.notes,
  });
}

export async function runLegacyPilot(argv: string[], repositoryRoot = process.cwd()) {
  const options = parseArgs(argv);
  const manifestPath = path.resolve(repositoryRoot, options.manifest);
  const manifest = await readJson<PilotManifest>(manifestPath);
  if (manifest.version !== "1.0.0") throw new Error(`Unsupported manifest version: ${manifest.version}`);
  const selected = manifest.products.filter((product) =>
    !options.product || product.legacySlug === options.product || product.sourceId === options.product,
  );
  if (!selected.length) throw new Error(`No manifest product matches ${options.product ?? "selection"}`);

  const allowedRoot = path.join(repositoryRoot, "data/review");
  const runOutput = options.output
    ? path.resolve(repositoryRoot, options.output)
    : path.join(allowedRoot, "legacy-import-v1", manifest.runId);
  if (options.cleanOutput && !options.dryRun) await cleanRunOutput(runOutput, allowedRoot);

  const summaries = [];
  for (const manifestProduct of selected) {
    const sourcePath = path.resolve(repositoryRoot, manifestProduct.sourcePath);
    const source = await readJson<LegacySourceInput>(sourcePath);
    if (source.sourceId !== manifestProduct.sourceId || source.legacySlug !== manifestProduct.legacySlug) {
      throw new Error(`Manifest/source identity mismatch for ${manifestProduct.sourceId}`);
    }
    const reviewPackage = await buildReviewPackage({
      source,
      manifestProduct,
      repositoryRoot,
      runTimestamp: manifest.runTimestamp,
    });
    const productOutput = path.join(runOutput, manifestProduct.legacySlug);
    const files = options.dryRun ? [] : await writeReviewPackage(reviewPackage, productOutput, allowedRoot);
    const summary = {
      sourceId: source.sourceId,
      slug: manifestProduct.legacySlug,
      status: reviewPackage.review.status,
      publicationCandidate: reviewPackage.publicationCandidate.status,
      blockingErrors: reviewPackage.blockingErrors.length,
      warnings: reviewPackage.warnings.length,
      existingProductMatch: reviewPackage.existingProductDiff.existingProductSlug,
      output: options.dryRun ? null : path.relative(repositoryRoot, productOutput),
      files: files.length,
    };
    summaries.push(summary);
    if (options.verbose) process.stdout.write(`${JSON.stringify(summary)}\n`);
  }

  const result = {
    runId: manifest.runId,
    dryRun: options.dryRun,
    products: summaries,
    totals: {
      processed: summaries.length,
      candidates: summaries.filter(({ publicationCandidate }) => publicationCandidate === "candidate").length,
      blocked: summaries.filter(({ blockingErrors }) => blockingErrors > 0).length,
      blockingErrors: summaries.reduce((sum, item) => sum + item.blockingErrors, 0),
      warnings: summaries.reduce((sum, item) => sum + item.warnings, 0),
      existingProductMatches: summaries.filter(({ existingProductMatch }) => existingProductMatch).length,
    },
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (options.failOnBlocking && result.totals.blocked) process.exitCode = 2;
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLegacyPilot(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
