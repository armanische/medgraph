import {
  parsePublishedCatalogProjection,
  type PublishedCatalogProjection,
} from "../published-catalog/contracts.ts";

export type CloudPublishedCatalogErrorCode =
  | "configuration"
  | "transport"
  | "invalid_payload"
  | "payload_too_large";

export const CLOUD_PUBLISHED_MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

class PublishedCatalogPayloadTooLargeError extends Error {}
class PublishedCatalogBodyReadError extends Error {}

export interface LoadPublishedCatalogProjectionOptions {
  maximumBytes?: number;
  rethrowFrameworkError: (error: unknown) => void;
}

/**
 * Public-safe error boundary for the published catalog adapter.
 * Deliberately excludes the upstream response, credentials and validation payload.
 */
export class CloudPublishedCatalogRepositoryError extends Error {
  readonly code: CloudPublishedCatalogErrorCode;

  constructor(code: CloudPublishedCatalogErrorCode) {
    super("Published catalog is unavailable.");
    this.name = "CloudPublishedCatalogRepositoryError";
    this.code = code;
  }
}

function declaredContentLength(response: Response): bigint | null {
  const value = response.headers.get("Content-Length");
  if (!value || !/^\d+$/u.test(value)) return null;
  return BigInt(value);
}

async function readBoundedResponseBody(
  response: Response,
  maximumBytes: number,
): Promise<Uint8Array> {
  const declaredBytes = declaredContentLength(response);
  if (declaredBytes !== null && declaredBytes > BigInt(maximumBytes)) {
    await response.body?.cancel().catch(() => undefined);
    throw new PublishedCatalogPayloadTooLargeError();
  }

  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel().catch(() => undefined);
        throw new PublishedCatalogPayloadTooLargeError();
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof PublishedCatalogPayloadTooLargeError) throw error;
    throw new PublishedCatalogBodyReadError();
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  chunks.forEach((chunk) => {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return body;
}

export async function loadValidatedPublishedCatalogProjection(
  request: () => Promise<Response>,
  options: LoadPublishedCatalogProjectionOptions,
): Promise<PublishedCatalogProjection> {
  const maximumBytes = options.maximumBytes ?? CLOUD_PUBLISHED_MAX_RESPONSE_BYTES;
  const { rethrowFrameworkError } = options;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new CloudPublishedCatalogRepositoryError("configuration");
  }

  let response: Response;
  try {
    response = await request();
  } catch (error) {
    rethrowFrameworkError(error);
    if (error instanceof CloudPublishedCatalogRepositoryError) throw error;
    throw new CloudPublishedCatalogRepositoryError("transport");
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new CloudPublishedCatalogRepositoryError("transport");
  }

  let body: Uint8Array;
  try {
    body = await readBoundedResponseBody(response, maximumBytes);
  } catch (error) {
    rethrowFrameworkError(error);
    if (error instanceof PublishedCatalogPayloadTooLargeError) {
      throw new CloudPublishedCatalogRepositoryError("payload_too_large");
    }
    if (error instanceof PublishedCatalogBodyReadError) {
      throw new CloudPublishedCatalogRepositoryError("transport");
    }
    throw new CloudPublishedCatalogRepositoryError("invalid_payload");
  }

  let payload: unknown;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    payload = JSON.parse(text);
  } catch (error) {
    rethrowFrameworkError(error);
    throw new CloudPublishedCatalogRepositoryError("invalid_payload");
  }

  try {
    return parsePublishedCatalogProjection(payload);
  } catch (error) {
    rethrowFrameworkError(error);
    throw new CloudPublishedCatalogRepositoryError("invalid_payload");
  }
}
