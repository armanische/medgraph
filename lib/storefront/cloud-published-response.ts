import {
  parsePublishedCatalogProjection,
  type PublishedCatalogProjection,
} from "../published-catalog/contracts.ts";

export type CloudPublishedCatalogErrorCode =
  | "configuration"
  | "transport"
  | "invalid_payload";

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

export async function loadValidatedPublishedCatalogProjection(
  request: () => Promise<Response>,
): Promise<PublishedCatalogProjection> {
  let response: Response;
  try {
    response = await request();
  } catch (error) {
    if (error instanceof CloudPublishedCatalogRepositoryError) throw error;
    throw new CloudPublishedCatalogRepositoryError("transport");
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new CloudPublishedCatalogRepositoryError("transport");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CloudPublishedCatalogRepositoryError("invalid_payload");
  }

  try {
    return parsePublishedCatalogProjection(payload);
  } catch {
    throw new CloudPublishedCatalogRepositoryError("invalid_payload");
  }
}
