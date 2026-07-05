import { createHash, randomUUID } from "node:crypto";
import {
  access,
  link,
  mkdir,
  open,
  rm,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { Readable } from "node:stream";

import type { ArtifactKind, RawArtifact } from "./contracts.ts";

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

export interface ArtifactStoreOptions {
  rootDirectory?: string;
  maxBytes?: number;
}

export interface SaveStreamInput {
  kind: ArtifactKind;
  sourceUrl: string;
  capturedAt?: string;
  contentType: string;
  extension: string;
  stream:
    | ReadableStream<Uint8Array>
    | AsyncIterable<Uint8Array | Buffer | string>;
}

function sanitizeExtension(value: string) {
  const extension = value.startsWith(".") ? value : `.${value}`;
  return /^\.[a-z0-9]{1,10}$/i.test(extension) ? extension.toLowerCase() : ".bin";
}

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function* readChunks(
  stream:
    | ReadableStream<Uint8Array>
    | AsyncIterable<Uint8Array | Buffer | string>,
) {
  if ("getReader" in stream) {
    const reader = stream.getReader();
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) return;
        yield result.value;
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    for await (const chunk of stream) yield chunk;
  }
}

export class ContentAddressedArtifactStore {
  readonly rootDirectory: string;
  readonly maxBytes: number;

  constructor(options: ArtifactStoreOptions = {}) {
    this.rootDirectory = resolve(
      options.rootDirectory ?? join(process.cwd(), "tmp/roszdravnadzor"),
    );
    this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  }

  private artifactPath(sha256: string, extension: string) {
    return join(
      this.rootDirectory,
      "artifacts",
      "sha256",
      sha256.slice(0, 2),
      sha256.slice(2, 4),
      `${sha256}${sanitizeExtension(extension)}`,
    );
  }

  async saveBytes(input: {
    kind: ArtifactKind;
    sourceUrl: string;
    capturedAt?: string;
    contentType: string;
    extension: string;
    bytes: Uint8Array;
  }): Promise<RawArtifact> {
    return this.saveStream({
      ...input,
      stream: Readable.from(input.bytes),
    });
  }

  async saveStream(input: SaveStreamInput): Promise<RawArtifact> {
    const stagingDirectory = join(this.rootDirectory, ".staging");
    await mkdir(stagingDirectory, { recursive: true });
    const partPath = join(stagingDirectory, `${randomUUID()}.part`);
    const handle = await open(partPath, "wx");
    const hash = createHash("sha256");
    let byteSize = 0;

    try {
      for await (const chunkValue of readChunks(input.stream)) {
        const chunk = Buffer.isBuffer(chunkValue)
          ? chunkValue
          : Buffer.from(chunkValue as Uint8Array);
        byteSize += chunk.byteLength;
        if (byteSize > this.maxBytes) {
          throw new Error(
            `Artifact exceeds maximum size of ${this.maxBytes} bytes.`,
          );
        }
        hash.update(chunk);
        await handle.write(chunk);
      }

      if (byteSize === 0) {
        throw new Error("Artifact response is empty.");
      }

      await handle.sync();
      await handle.close();
      const sha256 = hash.digest("hex");
      const targetPath = this.artifactPath(sha256, input.extension);
      await mkdir(dirname(targetPath), { recursive: true });

      if (!(await pathExists(targetPath))) {
        try {
          // Hard-link publication is atomic and cannot replace an existing hash.
          await link(partPath, targetPath);
        } catch (error) {
          if (!(await pathExists(targetPath))) throw error;
        }
      }
      await rm(partPath, { force: true });

      return {
        kind: input.kind,
        sourceUrl: input.sourceUrl,
        capturedAt: input.capturedAt ?? new Date().toISOString(),
        contentType: input.contentType,
        sha256,
        byteSize,
        filePath: relative(process.cwd(), targetPath),
      };
    } catch (error) {
      await handle.close().catch(() => undefined);
      await rm(partPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

}
