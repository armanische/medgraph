import { execFile } from "node:child_process";
import { lookup } from "node:dns/promises";
import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { promisify } from "node:util";

import { ContentAddressedArtifactStore } from "../core/artifact-store.ts";
import { StreamingDownloader } from "../core/downloader.ts";
import type { NormalizedDocumentLink } from "../core/contracts.ts";
import { isSafePublicUrl } from "./providers.ts";
import type {
  DocumentCandidate,
  DocumentDownloader,
} from "./types.ts";

const execFileAsync = promisify(execFile);

function documentKey(document: DocumentCandidate) {
  return `catalog:${Buffer.from(document.url).toString("base64url").slice(0, 80)}`;
}

function isPrivateAddress(address: string) {
  const normalized = address.toLocaleLowerCase();
  return (
    /^10\.|^127\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(
      normalized,
    ) ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  );
}

async function assertPublicDns(host: string) {
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Document host resolves to a private or unavailable address.");
  }
}

export class CatalogDocumentDownloader implements DocumentDownloader {
  private readonly artifactStore: ContentAddressedArtifactStore;

  constructor(
    rootDirectory = resolve(process.cwd(), "tmp/catalog-research"),
  ) {
    this.artifactStore = new ContentAddressedArtifactStore({ rootDirectory });
  }

  async download(document: DocumentCandidate): Promise<DocumentCandidate> {
    if (!isSafePublicUrl(document.url)) {
      return {
        ...document,
        warnings: [
          ...document.warnings,
          "Download rejected: URL is not a safe public HTTPS URL.",
        ],
      };
    }
    const host = new URL(document.url).hostname;
    try {
      await assertPublicDns(host);
    } catch (error) {
      return {
        ...document,
        warnings: [
          ...document.warnings,
          `Download rejected: ${
            error instanceof Error ? error.message : "DNS validation failed"
          }`,
        ],
      };
    }
    const key = documentKey(document);
    const downloader = new StreamingDownloader({
      artifactStore: this.artifactStore,
      acceptedHosts: [host],
      timeoutMs: 20_000,
      maxAttempts: 2,
    });
    const link: NormalizedDocumentLink = {
      externalId: key,
      documentKey: key,
      documentType: "other",
      title: document.title,
      url: document.url,
    };
    const result = await downloader.download(link);
    if (!result.artifact) {
      return {
        ...document,
        warnings: [
          ...document.warnings,
          `Download failed: ${result.failure?.reason ?? "unknown error"}`,
        ],
      };
    }
    return {
      ...document,
      mimeType: result.artifact.contentType,
      sizeBytes: result.artifact.byteSize,
      downloadedAt: result.artifact.capturedAt,
      sha256: result.artifact.sha256,
      artifactPath: result.artifact.filePath,
      warnings: document.warnings,
    };
  }
}

async function pathExists(path: string) {
  return access(path).then(() => true).catch(() => false);
}

async function extractPdfText(path: string) {
  const pdftotextCandidates = [
    process.env.PDFTOTEXT_PATH,
    "pdftotext",
    "/opt/homebrew/bin/pdftotext",
    "/usr/local/bin/pdftotext",
  ].filter((value): value is string => Boolean(value));
  for (const executable of pdftotextCandidates) {
    try {
      const { stdout } = await execFileAsync(executable, [path, "-"], {
        maxBuffer: 30 * 1024 * 1024,
      });
      if (stdout.trim()) return stdout;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
    }
  }

  const pythonCandidates = [
    process.env.PYTHON_PATH,
    "python3",
    resolve(
      homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3",
    ),
  ].filter((value): value is string => Boolean(value));
  const script = [
    "from pypdf import PdfReader",
    "import sys",
    "r=PdfReader(sys.argv[1])",
    "sys.stdout.write('\\n\\f\\n'.join((p.extract_text() or '') for p in r.pages))",
  ].join("; ");
  for (const executable of pythonCandidates) {
    try {
      const { stdout } = await execFileAsync(
        executable,
        ["-c", script, path],
        { maxBuffer: 30 * 1024 * 1024 },
      );
      if (stdout.trim()) return stdout;
    } catch {
      // Text extraction is optional; downloaded bytes remain immutable.
    }
  }
  return null;
}

export async function extractDownloadedDocumentText(
  document: DocumentCandidate,
) {
  if (!document.artifactPath) return null;
  const path = isAbsolute(document.artifactPath)
    ? document.artifactPath
    : resolve(process.cwd(), document.artifactPath);
  if (!(await pathExists(path))) return null;
  if (document.mimeType === "application/pdf") return extractPdfText(path);
  if (document.mimeType === "text/plain") {
    return readFile(path, "utf8").catch(() => null);
  }
  return null;
}
