import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { buildPublishedCatalog } from "./publication-builder.ts";
import {
  auditPublishedCatalog,
  validatePublishedCatalog,
} from "./publication-validator.ts";
import type {
  PublicationArtifact,
  PublicationBuildInput,
  PublicationIntegrityViolation,
  PublicationReviewDecision,
  PublicationReviewProduct,
  PublishedCatalog,
} from "./types.ts";
import {
  createReviewFixturePublicationInput,
  reviewFixturesEnabled,
} from "../review/fixtures.ts";

const DEFAULT_PUBLIC_ROOT = resolve(process.cwd(), "data/public");
const DEFAULT_REVIEW_ROOT = resolve(process.cwd(), "data/research/review");
const DEFAULT_INTEGRITY_ROOT = resolve(process.cwd(), "data/research/integrity");

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function listJsonFiles(directory: string) {
  try {
    return (await readdir(directory))
      .filter((file) => file.endsWith(".json") && !file.includes(" 2."))
      .sort()
      .map((file) => join(directory, file));
  } catch {
    return [];
  }
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.publication.part`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function syncDirectory<T extends { slug: string }>(directory: string, entries: T[]) {
  await mkdir(directory, { recursive: true });
  const expected = new Set(entries.map((entry) => `${entry.slug}.json`));
  for (const file of await readdir(directory)) {
    if (file.endsWith(".json") && !expected.has(file)) await unlink(join(directory, file));
  }
  await Promise.all(
    entries.map((entry) => writeJsonAtomic(join(directory, `${entry.slug}.json`), entry)),
  );
}

export async function loadPublicationInput(input?: {
  reviewRoot?: string;
  integrityRoot?: string;
}): Promise<PublicationBuildInput> {
  const reviewRoot = input?.reviewRoot ?? DEFAULT_REVIEW_ROOT;
  const integrityRoot = input?.integrityRoot ?? DEFAULT_INTEGRITY_ROOT;
  const reviewProducts = await Promise.all(
    (await listJsonFiles(join(reviewRoot, "products"))).map((path) =>
      readJson<PublicationReviewProduct>(path),
    ),
  );
  const decisionDirectory = resolve(process.cwd(), "data/review-decisions/decisions");
  const decisions = await Promise.all(
    (await listJsonFiles(decisionDirectory)).map((path) =>
      readJson<PublicationReviewDecision>(path),
    ),
  );
  const artifactInventory = await readJson<{ artifacts: PublicationArtifact[] }>(
    join(integrityRoot, "artifact-inventory.generated.json"),
  );
  const evidenceIntegrity = await readJson<{
    current: { totalViolations: number };
    violations: PublicationIntegrityViolation[];
  }>(join(integrityRoot, "evidence-integrity.generated.json"));

  const fixture = reviewFixturesEnabled()
    ? createReviewFixturePublicationInput()
    : null;
  return {
    reviewProducts: [...reviewProducts, ...(fixture?.reviewProducts ?? [])],
    decisions: [...decisions, ...(fixture?.decisions ?? [])],
    artifacts: [...artifactInventory.artifacts, ...(fixture?.artifacts ?? [])],
    integrityViolations:
      evidenceIntegrity.current.totalViolations > 0 ? evidenceIntegrity.violations : [],
    generatedAt: "publication-pipeline-v1",
  };
}

export async function publishCatalog(input?: {
  publicRoot?: string;
  buildInput?: PublicationBuildInput;
}) {
  const publicRoot = input?.publicRoot ?? DEFAULT_PUBLIC_ROOT;
  const result = buildPublishedCatalog(input?.buildInput ?? (await loadPublicationInput()));
  // Validation is performed before any generated file is replaced.
  const validation = validatePublishedCatalog(result.catalog);
  if (!validation.valid) {
    throw new Error(`Publication validation failed: ${validation.issues.map((issue) => issue.code).join(", ")}`);
  }
  await syncDirectory(join(publicRoot, "products"), result.catalog.products);
  await syncDirectory(join(publicRoot, "manufacturers"), result.catalog.manufacturers);
  await syncDirectory(join(publicRoot, "categories"), result.catalog.categories);
  await syncDirectory(join(publicRoot, "knowledge"), result.catalog.knowledge);
  await writeJsonAtomic(join(publicRoot, "summary.generated.json"), result.catalog);
  await writeJsonAtomic(
    join(publicRoot, "publication-manifest.internal.json"),
    result.internalManifest,
  );
  return result;
}

export async function auditPublication(input?: {
  publicRoot?: string;
  buildInput?: PublicationBuildInput;
}) {
  const publicRoot = input?.publicRoot ?? DEFAULT_PUBLIC_ROOT;
  const expected = buildPublishedCatalog(input?.buildInput ?? (await loadPublicationInput()));
  return auditPublishedCatalog(publicRoot, expected.catalog, expected.internalManifest);
}

export async function readPublishedCatalog(publicRoot = DEFAULT_PUBLIC_ROOT) {
  return readJson<PublishedCatalog>(join(publicRoot, "summary.generated.json"));
}
