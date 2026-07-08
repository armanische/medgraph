import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import type {
  DocumentPlan,
  DocumentVersionPlan,
  DownloadedArtifact,
  IngestionPlan,
  RawArtifact,
} from "./contracts.ts";

export interface ImportManifestRecord {
  provider: string;
  query: string;
  registrationNumber?: string;
  subjectKey?: string;
  productSlug?: string;
  sourceProductKey?: string;
  registryRecordId: string | null;
  importedAt: string;
  sourceUrl: string;
  rawArtifacts: RawArtifact[];
  documents: DocumentPlan[];
  documentVersions: DocumentVersionPlan[];
  downloadedFiles: DownloadedArtifact[];
  sha256: string[];
  previousSha256: string[];
  supersedes: Array<{ versionId: string; supersedes: string }>;
  status: IngestionPlan["status"];
  warnings: string[];
}

export interface ImportManifest {
  schemaVersion: 1;
  updatedAt: string;
  imports: Record<string, ImportManifestRecord>;
}

export interface ImportManifestLock {
  pid: number;
  acquiredAt: string;
  staleAfterMs: number;
  token: string;
}

const DEFAULT_STALE_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function manifestKey(provider: string, subjectKey: string) {
  return `${provider}:${subjectKey
    .replace(/[№#]/g, "")
    .replace(/\s+/g, "")
    .toLocaleUpperCase("ru-RU")}`;
}

function deduplicateBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const identity = key(value);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function recordsEqualWithoutImportTime(
  left: ImportManifestRecord,
  right: ImportManifestRecord,
) {
  return (
    JSON.stringify({ ...left, importedAt: null }) ===
    JSON.stringify({ ...right, importedAt: null })
  );
}

function createVersion(
  artifact: DownloadedArtifact,
  previous: DocumentVersionPlan | null,
): DocumentVersionPlan {
  return {
    versionId: `${artifact.documentKey}:${artifact.sha256}`,
    documentKey: artifact.documentKey,
    sourceUrl: artifact.sourceUrl,
    sha256: artifact.sha256,
    previousSha256: previous?.sha256 ?? null,
    supersedes: previous?.versionId ?? null,
    filePath: artifact.filePath,
    contentType: artifact.contentType,
    byteSize: artifact.byteSize,
    acquiredAt: artifact.capturedAt,
  };
}

export function reconcileIngestionPlan(
  plan: IngestionPlan,
  existing: ImportManifestRecord | null,
) {
  const documentsByKey = new Map<string, DocumentPlan>();

  for (const document of existing?.documents ?? []) {
    documentsByKey.set(document.documentKey, {
      ...document,
      versions: [...document.versions],
    });
  }

  for (const artifact of plan.downloadedFiles) {
    const document =
      documentsByKey.get(artifact.documentKey) ??
      ({
        documentKey: artifact.documentKey,
        externalId: artifact.externalId,
        documentType: artifact.documentType,
        title: artifact.title,
        sourceUrl: artifact.sourceUrl,
        versions: [],
      } satisfies DocumentPlan);

    const sameVersion = document.versions.find(
      (version) => version.sha256 === artifact.sha256,
    );
    if (!sameVersion) {
      const previous = document.versions.at(-1) ?? null;
      document.versions.push(createVersion(artifact, previous));
    }
    documentsByKey.set(document.documentKey, document);
  }

  const documents = Array.from(documentsByKey.values()).sort((left, right) =>
    left.documentKey.localeCompare(right.documentKey),
  );
  const documentVersions = documents.flatMap((document) => document.versions);
  const rawArtifacts = deduplicateBy(
    [...(existing?.rawArtifacts ?? []), ...plan.rawArtifacts],
    (artifact) =>
      `${artifact.kind}:${artifact.sourceUrl}:${artifact.sha256}`,
  );
  const downloadedFiles = deduplicateBy(
    [...(existing?.downloadedFiles ?? []), ...plan.downloadedFiles],
    (artifact) => `${artifact.documentKey}:${artifact.sha256}`,
  );

  const record: ImportManifestRecord = {
    provider: plan.provider,
    query: plan.query,
    registrationNumber: plan.registrationNumber,
    subjectKey: plan.subjectKey,
    productSlug: plan.productSlug,
    sourceProductKey: plan.sourceProductKey,
    registryRecordId: plan.registryRecordId,
    importedAt: new Date().toISOString(),
    sourceUrl: plan.sourceUrl,
    rawArtifacts,
    documents,
    documentVersions,
    downloadedFiles,
    sha256: Array.from(
      new Set([
        ...rawArtifacts.map((artifact) => artifact.sha256),
        ...downloadedFiles.map((artifact) => artifact.sha256),
      ]),
    ),
    previousSha256: documentVersions.flatMap((version) =>
      version.previousSha256 ? [version.previousSha256] : [],
    ),
    supersedes: documentVersions.flatMap((version) =>
      version.supersedes
        ? [{ versionId: version.versionId, supersedes: version.supersedes }]
        : [],
    ),
    status: plan.status,
    warnings: [...plan.warnings],
  };

  return {
    plan: { ...plan, documents, documentVersions },
    record,
  };
}

export class ImportManifestStore {
  readonly manifestPath: string;
  private readonly lockPath: string;
  private readonly staleLockTimeoutMs: number;

  constructor(
    path = resolve(process.cwd(), "tmp/roszdravnadzor/import-manifest.json"),
    options: { staleLockTimeoutMs?: number } = {},
  ) {
    this.manifestPath = resolve(path);
    this.lockPath = `${this.manifestPath}.lock`;
    this.staleLockTimeoutMs =
      options.staleLockTimeoutMs ?? DEFAULT_STALE_LOCK_TIMEOUT_MS;
  }

  private async readManifest(): Promise<ImportManifest> {
    try {
      const value = JSON.parse(
        await readFile(this.manifestPath, "utf8"),
      ) as ImportManifest;
      if (value.schemaVersion !== 1 || typeof value.imports !== "object") {
        throw new Error("Unsupported import manifest format.");
      }
      return value;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return {
          schemaVersion: 1,
          updatedAt: new Date(0).toISOString(),
          imports: {},
        };
      }
      throw error;
    }
  }

  private async removeStaleLock() {
    let lock: ImportManifestLock;
    try {
      lock = JSON.parse(
        await readFile(this.lockPath, "utf8"),
      ) as ImportManifestLock;
    } catch {
      return false;
    }

    const acquiredAt = Date.parse(lock.acquiredAt);
    if (
      !Number.isFinite(acquiredAt) ||
      Date.now() - acquiredAt <= this.staleLockTimeoutMs
    ) {
      return false;
    }

    // Re-read before deletion so a newly acquired lock is not removed.
    const current = JSON.parse(
      await readFile(this.lockPath, "utf8"),
    ) as ImportManifestLock;
    if (current.token !== lock.token) return false;
    await rm(this.lockPath, { force: true });
    return true;
  }

  private async acquireLock() {
    await mkdir(dirname(this.manifestPath), { recursive: true });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const handle = await open(this.lockPath, "wx");
        const metadata = {
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
          staleAfterMs: this.staleLockTimeoutMs,
          token: randomUUID(),
        } satisfies ImportManifestLock;
        try {
          await handle.writeFile(
            `${JSON.stringify(metadata, null, 2)}\n`,
            "utf8",
          );
          await handle.sync();
          return handle;
        } catch (error) {
          await handle.close().catch(() => undefined);
          await rm(this.lockPath, { force: true }).catch(() => undefined);
          throw error;
        }
      } catch (error) {
        if (
          !(
            error instanceof Error &&
            "code" in error &&
            error.code === "EEXIST"
          )
        ) {
          throw error;
        }
        if (await this.removeStaleLock().catch(() => false)) continue;
        await delay(25 * (attempt + 1));
      }
    }
    throw new Error("Import manifest is locked by another importer process.");
  }

  async merge(plan: IngestionPlan) {
    const lock = await this.acquireLock();
    const partPath = `${this.manifestPath}.${randomUUID()}.part`;

    try {
      const manifest = await this.readManifest();
      const subjectKey = plan.subjectKey ?? plan.registrationNumber;
      if (!subjectKey) {
        throw new Error("Import manifest requires registrationNumber or subjectKey.");
      }
      const key = manifestKey(plan.provider, subjectKey);
      const existing = manifest.imports[key] ?? null;
      const reconciled = reconcileIngestionPlan(
        plan,
        existing,
      );

      if (
        existing &&
        recordsEqualWithoutImportTime(existing, reconciled.record)
      ) {
        return {
          manifestPath: relative(process.cwd(), this.manifestPath),
          plan: reconciled.plan,
          record: existing,
          changed: false,
        };
      }

      manifest.imports[key] = reconciled.record;
      manifest.updatedAt = new Date().toISOString();

      const part = await open(partPath, "wx");
      try {
        await part.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
        await part.sync();
      } finally {
        await part.close();
      }
      await rename(partPath, this.manifestPath);

      return {
        manifestPath: relative(process.cwd(), this.manifestPath),
        plan: reconciled.plan,
        record: reconciled.record,
        changed: true,
      };
    } finally {
      await rm(partPath, { force: true }).catch(() => undefined);
      await lock.close().catch(() => undefined);
      await rm(this.lockPath, { force: true }).catch(() => undefined);
    }
  }
}
