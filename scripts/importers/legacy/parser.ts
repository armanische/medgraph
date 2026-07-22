import { createHash } from "node:crypto";

import type { ExtractedProduct, LegacySourceInput, SourceSnapshot } from "./contracts.ts";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "sourceChecksum")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function sourceChecksum(source: LegacySourceInput): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(source))).digest("hex");
}

export function createSourceSnapshot(source: LegacySourceInput): SourceSnapshot {
  return { ...source, sourceChecksum: sourceChecksum(source) };
}

/** Copies raw fields into the parser contract without reference resolution. */
export function extractLegacyProduct(source: SourceSnapshot): ExtractedProduct {
  return {
    sourceId: source.sourceId,
    titleRaw: source.legacyTitle,
    manufacturerRaw: source.rawManufacturer,
    categoryRaw: source.rawCategory,
    applicationAreasRaw: [...source.rawApplicationAreas],
    modelRaw: source.rawModel ?? null,
    descriptionRaw: source.rawDescription,
    characteristicsRaw: source.rawCharacteristics.map((item) => ({ ...item })),
    bulletItemsRaw: [...source.rawBulletItems],
    imagesRaw: source.rawImages.map((image) => ({ ...image })),
    documentsRaw: source.rawDocuments.map((document) => ({ ...document })),
    accessoriesRaw: [...source.rawAccessories],
    registrationRaw: source.rawRegistrationData,
    packageContentsRaw: [...(source.rawPackageContents ?? [])],
  };
}
