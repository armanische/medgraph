import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { parsePublishedCatalogProjection } from "../../lib/published-catalog/contracts.ts";

const outputPath = new URL(
  "../../data/published-catalog-last-known-good.json",
  import.meta.url,
);
const productionProjectRef = "clbzibuusyuajsylcbvl";

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function validateExistingSnapshot() {
  const envelope = JSON.parse(await readFile(outputPath, "utf8")) as {
    projection?: unknown;
  };
  parsePublishedCatalogProjection(envelope.projection);
  console.info("Published catalog LKG seed validated for non-Production build.");
}

async function captureProductionSnapshot() {
  const origin = process.env.CYBERMEDICA_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!origin || !serviceRole) throw new Error("Production snapshot configuration is missing.");
  const url = new URL(origin);
  if (
    url.protocol !== "https:"
    || url.hostname !== `${productionProjectRef}.supabase.co`
    || url.pathname !== "/"
  ) throw new Error("Production snapshot project binding is invalid.");

  const response = await fetch(
    new URL("/rest/v1/rpc/cloud_published_storefront_catalog_v1", url),
    {
      method: "POST",
      redirect: "error",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Accept-Profile": "cloud_api",
        "Content-Profile": "cloud_api",
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error("Production snapshot capture failed.");
  const projection = parsePublishedCatalogProjection(await response.json());
  if (projection.products.length < 70) {
    throw new Error("Production snapshot is unexpectedly incomplete.");
  }
  const checksumInput = { ...projection, generatedAt: undefined };
  const projectionChecksum = createHash("sha256")
    .update(canonicalJson(checksumInput))
    .digest("hex");
  const existing = JSON.parse(await readFile(outputPath, "utf8")) as {
    projectionVersion?: unknown;
  };
  const projectionVersion = Number.isSafeInteger(existing.projectionVersion)
    ? Number(existing.projectionVersion)
    : 1;
  const envelope = {
    schemaVersion: 1,
    projectionVersion,
    projectionChecksum,
    projectionDocumentChecksum: projectionChecksum,
    capturedAt: new Date().toISOString(),
    projection,
  };
  await writeFile(outputPath, `${JSON.stringify(envelope, null, 2)}\n`, { mode: 0o644 });
  console.info(JSON.stringify({
    event: "published_catalog_lkg_captured",
    productCount: projection.products.length,
    checksumPrefix: projectionChecksum.slice(0, 12),
  }));
}

if (process.env.VERCEL_ENV === "production") await captureProductionSnapshot();
else await validateExistingSnapshot();
