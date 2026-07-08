import { createHash } from "node:crypto";
import { resolve } from "node:path";

import type {
  DownloadedArtifact,
  IngestionPlan,
  NormalizedDocumentLink,
} from "../core/contracts.ts";
import { ImportManifestStore } from "../core/manifest-store.ts";
import type {
  CatalogSeedItem,
  DocumentCandidate,
  SourceCandidate,
} from "./types.ts";

function documentKey(document: DocumentCandidate) {
  return `catalog-research:${createHash("sha256")
    .update(document.url)
    .digest("hex")
    .slice(0, 32)}`;
}

function coreDocumentType(
  document: DocumentCandidate,
): NormalizedDocumentLink["documentType"] {
  if (document.documentType === "ifu" || document.documentType === "manual") {
    return "ifu";
  }
  if (
    document.documentType === "registration" ||
    document.documentType === "registration_certificate"
  ) {
    return "registration";
  }
  if (document.documentType === "certificate") return "certificate";
  return "other";
}

export class CatalogResearchManifest {
  private readonly store: ImportManifestStore;

  constructor(
    manifestPath = resolve(
      process.cwd(),
      "tmp/catalog-research/import-manifest.json",
    ),
  ) {
    this.store = new ImportManifestStore(manifestPath);
  }

  async record(input: {
    product: CatalogSeedItem;
    sources: SourceCandidate[];
    documents: DocumentCandidate[];
    warnings: string[];
  }) {
    const downloadedFiles: DownloadedArtifact[] = input.documents.flatMap(
      (document) => {
        if (
          !document.sha256 ||
          !document.artifactPath ||
          !document.mimeType ||
          !document.sizeBytes ||
          !document.downloadedAt
        ) {
          return [];
        }
        const key = documentKey(document);
        return [
          {
            documentKey: key,
            documentType: coreDocumentType(document),
            externalId: key,
            title: document.title,
            sourceUrl: document.url,
            contentType: document.mimeType,
            byteSize: document.sizeBytes,
            sha256: document.sha256,
            filePath: document.artifactPath,
            capturedAt: document.downloadedAt,
          },
        ];
      },
    );
    if (!downloadedFiles.length) return null;
    const plan: IngestionPlan = {
      provider: "catalog-research",
      query: input.product.normalizedTitle,
      subjectKey: input.product.slug,
      productSlug: input.product.slug,
      sourceProductKey: input.product.slug,
      registryRecordId: input.product.slug,
      sourceUrl:
        input.sources[0]?.sourceUrl ?? downloadedFiles[0].sourceUrl,
      rawArtifacts: [],
      documents: [],
      documentVersions: [],
      downloadedFiles,
      failedDownloads: [],
      evidenceCandidates: [],
      claimCandidates: [],
      status: "completed",
      warnings: input.warnings,
    };
    return this.store.merge(plan);
  }
}
