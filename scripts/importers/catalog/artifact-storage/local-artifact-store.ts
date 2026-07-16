import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import {
  basename,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

import type {
  ArtifactVerification,
  ResolvedArtifact,
} from "./types.ts";

const WINDOWS_ABSOLUTE_PATH = /^[A-Za-z]:[\\/]/;
const SHA256_FILE_NAME = /^([a-f0-9]{64})(?:\.[^/]*)?$/i;

function portablePath(path: string) {
  return path.replaceAll("\\", "/");
}

function isOutsideRoot(path: string) {
  return path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path);
}

export function isAbsoluteArtifactPath(path: string) {
  return isAbsolute(path) || WINDOWS_ABSOLUTE_PATH.test(path) || path.startsWith("file://");
}

export function resolveArtifact(
  artifactPath: string,
  repositoryRoot = process.cwd(),
): ResolvedArtifact {
  if (!artifactPath || isAbsoluteArtifactPath(artifactPath)) {
    throw new Error(`Artifact path must be repository-relative: ${artifactPath}`);
  }
  const absolutePath = resolve(repositoryRoot, artifactPath);
  const repositoryRelative = relative(resolve(repositoryRoot), absolutePath);
  if (isOutsideRoot(repositoryRelative)) {
    throw new Error(`Artifact path escapes the repository: ${artifactPath}`);
  }
  return {
    relativePath: portablePath(repositoryRelative),
    absolutePath,
  };
}

async function sha256File(path: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolvePromise, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolvePromise);
  });
  return hash.digest("hex");
}

async function inspectHeader(path: string, size: number) {
  if (size === 0) {
    return Buffer.alloc(0);
  }
  const handle = await open(path, "r");
  try {
    const buffer = Buffer.alloc(Math.min(size, 4096));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function detectedMime(header: Buffer) {
  if (header.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  const text = header.toString("utf8").trimStart().toLowerCase();
  if (
    text.startsWith("<!doctype html") ||
    text.startsWith("<html") ||
    text.includes("<html")
  ) {
    return "text/html";
  }
  return "application/octet-stream";
}

function expectedHashFromPath(path: string) {
  return SHA256_FILE_NAME.exec(basename(path))?.[1]?.toLowerCase() ?? null;
}

function hashShardsMatch(relativePath: string, expectedSha256: string | null) {
  if (!expectedSha256) return false;
  const parts = portablePath(relativePath).split("/");
  const shaIndex = parts.lastIndexOf("sha256");
  return (
    shaIndex >= 0 &&
    parts[shaIndex + 1] === expectedSha256.slice(0, 2) &&
    parts[shaIndex + 2] === expectedSha256.slice(2, 4)
  );
}

export async function verifyArtifact(
  artifactPath: string,
  repositoryRoot = process.cwd(),
): Promise<ArtifactVerification> {
  const resolvedArtifact = resolveArtifact(artifactPath, repositoryRoot);
  const metadata = await stat(resolvedArtifact.absolutePath);
  if (!metadata.isFile()) {
    throw new Error(`Artifact is not a regular file: ${artifactPath}`);
  }
  const [sha256, header] = await Promise.all([
    sha256File(resolvedArtifact.absolutePath),
    inspectHeader(resolvedArtifact.absolutePath, metadata.size),
  ]);
  const expectedSha256 = expectedHashFromPath(resolvedArtifact.relativePath);
  const mime = detectedMime(header);
  return {
    relativePath: resolvedArtifact.relativePath,
    sha256,
    expectedSha256,
    shaMatchesPath:
      expectedSha256 === sha256 &&
      hashShardsMatch(resolvedArtifact.relativePath, expectedSha256),
    sizeBytes: metadata.size,
    extension: extname(resolvedArtifact.relativePath).toLowerCase(),
    mime,
    pdfSignature: mime === "application/pdf",
    htmlDetected: mime === "text/html",
    zeroByte: metadata.size === 0,
  };
}
