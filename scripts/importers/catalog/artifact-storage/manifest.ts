import { readdir, readFile } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";

import { isAbsoluteArtifactPath, verifyArtifact } from "./local-artifact-store.ts";
import {
  ARTIFACT_MANIFEST_SCHEMA_VERSION,
  type AbsolutePathFinding,
  type ArtifactInventoryEntry,
  type ArtifactManifest,
  type ArtifactSizeBucket,
  type CreateManifestOptions,
  type DuplicateArtifactGroup,
  type ManifestValidationResult,
} from "./types.ts";

type JsonRecord = Record<string, unknown>;

interface ArtifactReference {
  manufacturers: Set<string>;
  products: Set<string>;
  documentVersions: Set<string>;
  reviewItems: Set<string>;
  expectsPdf: boolean;
}

const GENERATED_AT = "artifact-storage-audit-v1" as const;
const TEMPORARY_EXTENSION = /\.(?:part|tmp|bak)$/i;
const SHA256 = /^[a-f0-9]{64}$/;
const UNEXPECTED_COPY = /(?: [23]| copy| final| new)\.[^.]+$/iu;
const SIZE_BUCKETS: ArtifactSizeBucket[] = [
  "0-1 MB",
  "1-5 MB",
  "5-10 MB",
  "10-25 MB",
  "25-50 MB",
  ">50 MB",
];

function portablePath(path: string) {
  return path.replaceAll("\\", "/");
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function walkFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function walk(directory: string) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && !UNEXPECTED_COPY.test(entry.name)) files.push(path);
    }
  }
  await walk(root);
  return files;
}

async function loadJson(path: string): Promise<JsonRecord | null> {
  try {
    const value: unknown = JSON.parse(await readFile(path, "utf8"));
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function emptyReference(): ArtifactReference {
  return {
    manufacturers: new Set(),
    products: new Set(),
    documentVersions: new Set(),
    reviewItems: new Set(),
    expectsPdf: false,
  };
}

function referenceKeys(version: JsonRecord) {
  return [asString(version.filePath), asString(version.sha256)]
    .filter((value): value is string => Boolean(value))
    .map((value) => portablePath(value));
}

async function collectReferences(researchRoot: string) {
  const references = new Map<string, ArtifactReference>();
  const versionsById = new Map<string, Set<string>>();
  for (const area of ["documents/products", "extraction/products"]) {
    for (const path of await walkFiles(resolve(researchRoot, area))) {
      if (extname(path) !== ".json") continue;
      const report = await loadJson(path);
      if (!report) continue;
      const product = isRecord(report.product) ? report.product : {};
      const manufacturer = asString(product.manufacturer);
      const productSlug = asString(product.productSlug);
      for (const version of asRecords(report.documentVersions)) {
        const versionId = asString(version.versionId);
        const keys = referenceKeys(version);
        for (const key of keys) {
          const reference = references.get(key) ?? emptyReference();
          if (manufacturer) reference.manufacturers.add(manufacturer);
          if (productSlug) reference.products.add(productSlug);
          if (versionId) reference.documentVersions.add(versionId);
          if (asString(version.contentType)?.toLowerCase().includes("pdf")) {
            reference.expectsPdf = true;
          }
          references.set(key, reference);
        }
        if (versionId) versionsById.set(versionId, new Set(keys));
      }
    }
  }
  for (const path of await walkFiles(resolve(researchRoot, "review/products"))) {
    if (extname(path) !== ".json") continue;
    const report = await loadJson(path);
    if (!report) continue;
    for (const item of asRecords(report.reviewItems)) {
      const reviewItemId = asString(item.reviewItemId);
      if (!reviewItemId) continue;
      for (const versionId of asStrings(item.documentVersionIds)) {
        for (const key of versionsById.get(versionId) ?? []) {
          const reference = references.get(key) ?? emptyReference();
          reference.reviewItems.add(reviewItemId);
          references.set(key, reference);
        }
      }
    }
  }
  return references;
}

function findAbsoluteValues(
  value: unknown,
  reportPath: string,
  jsonPath: string,
  findings: AbsolutePathFinding[],
) {
  if (typeof value === "string" && isAbsoluteArtifactPath(value)) {
    findings.push({ reportPath, jsonPath, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findAbsoluteValues(item, reportPath, `${jsonPath}[${index}]`, findings),
    );
    return;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      findAbsoluteValues(child, reportPath, `${jsonPath}.${key}`, findings);
    }
  }
}

async function collectAbsolutePaths(researchRoot: string, repositoryRoot: string) {
  const findings: AbsolutePathFinding[] = [];
  for (const path of await walkFiles(researchRoot)) {
    if (extname(path) !== ".json") continue;
    const report = await loadJson(path);
    if (!report) continue;
    const reportPath = portablePath(relative(repositoryRoot, path));
    findAbsoluteValues(report, reportPath, "$", findings);
  }
  return findings.sort((a, b) =>
    `${a.reportPath}:${a.jsonPath}`.localeCompare(`${b.reportPath}:${b.jsonPath}`),
  );
}

function sizeBucket(sizeBytes: number): ArtifactSizeBucket {
  const mb = 1024 * 1024;
  if (sizeBytes <= mb) return "0-1 MB";
  if (sizeBytes <= 5 * mb) return "1-5 MB";
  if (sizeBytes <= 10 * mb) return "5-10 MB";
  if (sizeBytes <= 25 * mb) return "10-25 MB";
  if (sizeBytes <= 50 * mb) return "25-50 MB";
  return ">50 MB";
}

export function detectDuplicateGroups(
  artifacts: Array<Pick<ArtifactInventoryEntry, "sha256" | "relativePath">>,
): DuplicateArtifactGroup[] {
  const byHash = new Map<string, string[]>();
  for (const artifact of artifacts) {
    const paths = byHash.get(artifact.sha256) ?? [];
    paths.push(artifact.relativePath);
    byHash.set(artifact.sha256, paths);
  }
  return [...byHash.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([sha256, paths]) => ({
      sha256,
      paths: paths.sort(),
      redundantCopies: paths.length - 1,
    }))
    .sort((a, b) => a.sha256.localeCompare(b.sha256));
}

export async function createManifest(
  options: CreateManifestOptions = {},
): Promise<ArtifactManifest> {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const artifactRoot = resolve(
    options.artifactRoot ?? join(repositoryRoot, "data/research/artifacts"),
  );
  const researchRoot = resolve(
    options.researchRoot ?? join(repositoryRoot, "data/research"),
  );
  if (relative(repositoryRoot, artifactRoot).startsWith("..") || isAbsolute(relative(repositoryRoot, artifactRoot))) {
    throw new Error("Artifact root must be inside the repository");
  }
  const references = await collectReferences(researchRoot);
  const absolutePaths = await collectAbsolutePaths(researchRoot, repositoryRoot);
  const artifactPaths = await walkFiles(artifactRoot);
  const artifacts: ArtifactInventoryEntry[] = [];
  for (const absolutePath of artifactPaths) {
    const repositoryPath = portablePath(relative(repositoryRoot, absolutePath));
    const verification = await verifyArtifact(repositoryPath, repositoryRoot);
    const reference =
      references.get(repositoryPath) ??
      references.get(verification.sha256) ??
      emptyReference();
    const manufacturers = [...reference.manufacturers].sort();
    const referencedProducts = [...reference.products].sort();
    const referencedDocumentVersions = [...reference.documentVersions].sort();
    const referencedReviewItems = [...reference.reviewItems].sort();
    const temporaryFile = TEMPORARY_EXTENSION.test(repositoryPath);
    artifacts.push({
      ...verification,
      manufacturer:
        manufacturers.length === 0
          ? null
          : manufacturers.length === 1
            ? manufacturers[0]
            : manufacturers.join(" | "),
      referencedProducts,
      referencedDocumentVersions,
      referencedReviewItems,
      referenceCount:
        referencedDocumentVersions.length + referencedReviewItems.length,
      orphan: referencedDocumentVersions.length === 0,
      duplicate: false,
      temporaryFile,
      invalidPdf: verification.extension === ".pdf" && !verification.pdfSignature,
      htmlMasquerading:
        verification.htmlDetected &&
        (verification.extension === ".pdf" ||
          verification.extension === ".aspx" ||
          reference.expectsPdf),
    });
  }
  artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const duplicateHashes = detectDuplicateGroups(artifacts);
  const duplicatePaths = new Set(duplicateHashes.flatMap((group) => group.paths));
  for (const artifact of artifacts) artifact.duplicate = duplicatePaths.has(artifact.relativePath);
  const bucketSummary = Object.fromEntries(
    SIZE_BUCKETS.map((bucket) => [bucket, { count: 0, sizeBytes: 0 }]),
  ) as ArtifactManifest["summary"]["sizeBuckets"];
  for (const artifact of artifacts) {
    const bucket = sizeBucket(artifact.sizeBytes);
    bucketSummary[bucket].count += 1;
    bucketSummary[bucket].sizeBytes += artifact.sizeBytes;
  }
  const pathsWhere = (predicate: (entry: ArtifactInventoryEntry) => boolean) =>
    artifacts.filter(predicate).map((entry) => entry.relativePath);
  const orphanArtifacts = pathsWhere((entry) => entry.orphan);
  const invalidPdfs = pathsWhere((entry) => entry.invalidPdf);
  const htmlMasquerading = pathsWhere((entry) => entry.htmlMasquerading);
  const zeroByteFiles = pathsWhere((entry) => entry.zeroByte);
  const temporaryFiles = pathsWhere((entry) => entry.temporaryFile);
  const shaPathMismatches = pathsWhere((entry) => !entry.shaMatchesPath);
  const duplicateFileCount = duplicateHashes.reduce(
    (total, group) => total + group.redundantCopies,
    0,
  );
  return {
    schemaVersion: ARTIFACT_MANIFEST_SCHEMA_VERSION,
    generatedAt: GENERATED_AT,
    artifactRoot: portablePath(relative(repositoryRoot, artifactRoot)),
    summary: {
      artifactCount: artifacts.length,
      artifactSizeBytes: artifacts.reduce((sum, entry) => sum + entry.sizeBytes, 0),
      sizeBuckets: bucketSummary,
      duplicateHashCount: duplicateHashes.length,
      duplicateFileCount,
      orphanCount: orphanArtifacts.length,
      invalidPdfCount: invalidPdfs.length,
      htmlMasqueradingCount: htmlMasquerading.length,
      zeroByteCount: zeroByteFiles.length,
      temporaryFileCount: temporaryFiles.length,
      shaPathMismatchCount: shaPathMismatches.length,
      absolutePathCount: absolutePaths.length,
    },
    artifacts,
    duplicateHashes,
    duplicateFiles: duplicateHashes,
    orphanArtifacts,
    invalidPdfs,
    htmlMasquerading,
    zeroByteFiles,
    temporaryFiles,
    shaPathMismatches,
    absolutePaths,
    topLargestFiles: [...artifacts]
      .sort((a, b) => b.sizeBytes - a.sizeBytes || a.relativePath.localeCompare(b.relativePath))
      .slice(0, 50)
      .map(({ relativePath, sizeBytes, sha256 }) => ({ relativePath, sizeBytes, sha256 })),
  };
}

export function validateManifest(manifest: ArtifactManifest): ManifestValidationResult {
  const errors: string[] = [];
  if (manifest.schemaVersion !== ARTIFACT_MANIFEST_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${manifest.schemaVersion}`);
  }
  if (isAbsoluteArtifactPath(manifest.artifactRoot)) {
    errors.push("artifactRoot must be repository-relative");
  }
  const paths = new Set<string>();
  for (const artifact of manifest.artifacts) {
    if (isAbsoluteArtifactPath(artifact.relativePath)) {
      errors.push(`Absolute artifact path: ${artifact.relativePath}`);
    }
    if (paths.has(artifact.relativePath)) {
      errors.push(`Duplicate artifact path: ${artifact.relativePath}`);
    }
    paths.add(artifact.relativePath);
    if (!SHA256.test(artifact.sha256)) {
      errors.push(`Invalid SHA256: ${artifact.relativePath}`);
    }
  }
  if (manifest.summary.artifactCount !== manifest.artifacts.length) {
    errors.push("summary.artifactCount does not match artifacts length");
  }
  const totalSize = manifest.artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0);
  if (manifest.summary.artifactSizeBytes !== totalSize) {
    errors.push("summary.artifactSizeBytes does not match artifact sizes");
  }
  return { valid: errors.length === 0, errors };
}
