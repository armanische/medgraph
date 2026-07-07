import { extname } from "node:path";

import { ContentAddressedArtifactStore } from "./artifact-store.ts";
import type {
  DownloadedArtifact,
  FailedDownload,
  NormalizedDocumentLink,
} from "./contracts.ts";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const ACCEPTED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/octet-stream",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export interface DownloaderOptions {
  artifactStore: ContentAddressedArtifactStore;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
  maxAttempts?: number;
  acceptedHosts?: string[];
  signatureValidator?: DocumentSignatureValidator;
  defaultHeaders?: Record<string, string>;
}

export interface DocumentSignatureValidator {
  requiredBytes(contentType: string): number;
  validate(input: {
    contentType: string;
    sourceUrl: string;
    prefix: Uint8Array;
  }): { valid: boolean; reason?: string };
}

export class DownloadRejectedError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "DownloadRejectedError";
    this.retryable = retryable;
  }
}

function contentTypeWithoutParameters(value: string | null) {
  return value?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function extensionForContentType(contentType: string, url: string) {
  if (contentType === "application/pdf") return ".pdf";
  if (contentType === "application/msword") return ".doc";
  if (
    contentType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return ".docx";
  }
  return extname(new URL(url).pathname) || ".bin";
}

function isTemporaryNetworkError(error: unknown) {
  if (error instanceof DownloadRejectedError) return error.retryable;
  if (!(error instanceof Error)) return false;
  const message = `${error.name} ${error.message}`.toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

export const defaultDocumentSignatureValidator: DocumentSignatureValidator = {
  requiredBytes(contentType) {
    return contentType === "application/pdf" ? 5 : 0;
  },
  validate({ contentType, prefix }) {
    if (
      contentType === "application/pdf" &&
      Buffer.from(prefix.subarray(0, 5)).toString("ascii") !== "%PDF-"
    ) {
      return { valid: false, reason: "PDF signature %PDF- is missing." };
    }

    // TODO(MVP-2): add DOC/CFB, DOCX/ZIP and application/octet-stream
    // signature classifiers without coupling them to a provider adapter.
    return { valid: true };
  },
};

async function* validateSignature(
  stream: ReadableStream<Uint8Array>,
  validator: DocumentSignatureValidator,
  input: { contentType: string; sourceUrl: string },
) {
  const requiredBytes = validator.requiredBytes(input.contentType);
  const reader = stream.getReader();
  const buffered: Uint8Array[] = [];
  let bufferedBytes = 0;

  try {
    while (bufferedBytes < requiredBytes) {
      const result = await reader.read();
      if (result.done) break;
      buffered.push(result.value);
      bufferedBytes += result.value.byteLength;
    }

    const prefix = Buffer.concat(buffered.map((chunk) => Buffer.from(chunk)));
    const validation = validator.validate({ ...input, prefix });
    if (!validation.valid) {
      throw new DownloadRejectedError(
        validation.reason ?? "Document signature validation failed.",
      );
    }

    for (const chunk of buffered) yield chunk;
    while (true) {
      const result = await reader.read();
      if (result.done) return;
      yield result.value;
    }
  } finally {
    reader.releaseLock();
  }
}

export class StreamingDownloader {
  private readonly artifactStore: ContentAddressedArtifactStore;
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly acceptedHosts: Set<string>;
  private readonly signatureValidator: DocumentSignatureValidator;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: DownloaderOptions) {
    this.artifactStore = options.artifactStore;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.acceptedHosts = new Set(
      options.acceptedHosts ?? ["elk.roszdravnadzor.gov.ru"],
    );
    this.signatureValidator =
      options.signatureValidator ?? defaultDocumentSignatureValidator;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  private assertAcceptedUrl(value: string) {
    const url = new URL(value);
    if (url.protocol !== "https:" || !this.acceptedHosts.has(url.hostname)) {
      throw new DownloadRejectedError(
        `Document URL is outside the provider allowlist: ${url.href}`,
      );
    }
  }

  private async downloadOnce(link: NormalizedDocumentLink) {
    this.assertAcceptedUrl(link.url);
    const response = await this.fetchImplementation(link.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        ...this.defaultHeaders,
        Accept:
          "application/pdf,application/octet-stream,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "User-Agent":
          "CyberMedica-Regulatory-Importer/0.2 (+manual ingestion review)",
      },
    });

    this.assertAcceptedUrl(response.url || link.url);

    if (!response.ok) {
      throw new DownloadRejectedError(
        `HTTP ${response.status} ${response.statusText}`,
        RETRYABLE_STATUS_CODES.has(response.status),
      );
    }

    const contentType = contentTypeWithoutParameters(
      response.headers.get("content-type"),
    );
    if (!ACCEPTED_CONTENT_TYPES.has(contentType)) {
      throw new DownloadRejectedError(
        `Rejected document content type: ${contentType || "missing"}`,
      );
    }
    if (!response.body) {
      throw new DownloadRejectedError("Document response has no body.");
    }

    const artifact = await this.artifactStore.saveStream({
      kind: "document",
      sourceUrl: link.url,
      contentType,
      extension: extensionForContentType(contentType, link.url),
      stream: validateSignature(response.body, this.signatureValidator, {
        contentType,
        sourceUrl: link.url,
      }),
    });

    return {
      documentKey: link.documentKey,
      documentType: link.documentType,
      externalId: link.externalId,
      title: link.title,
      sourceUrl: link.url,
      contentType: artifact.contentType,
      byteSize: artifact.byteSize,
      sha256: artifact.sha256,
      filePath: artifact.filePath,
      capturedAt: artifact.capturedAt,
    } satisfies DownloadedArtifact;
  }

  async download(link: NormalizedDocumentLink) {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return {
          artifact: await this.downloadOnce(link),
          failure: null,
        };
      } catch (error) {
        lastError = error;
        if (!isTemporaryNetworkError(error) || attempt === this.maxAttempts) {
          break;
        }
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, 250 * 2 ** (attempt - 1)),
        );
      }
    }

    const failure = {
      documentKey: link.documentKey,
      title: link.title,
      sourceUrl: link.url,
      reason:
        lastError instanceof Error
          ? lastError.message
          : "Unknown document download error.",
      retryable: isTemporaryNetworkError(lastError),
    } satisfies FailedDownload;

    return { artifact: null, failure };
  }
}
