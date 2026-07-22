import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ImportReferenceData } from "../contracts.ts";

/** Compatibility shape for existing offline callers during the transition. */
export interface LocalReferenceData extends Omit<ImportReferenceData, "mappings"> {
  mappings: Array<ImportReferenceData["mappings"][number] & { reviewerRequired: boolean }>;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

/** Filesystem adapter for versioned local Reference Data. */
export async function loadReferenceData(repositoryRoot: string): Promise<LocalReferenceData> {
  const [manufacturers, categories, mappings, applicationAreas] = await Promise.all([
    readJson<{ manufacturers: ImportReferenceData["manufacturers"] }>(path.join(repositoryRoot, "data/reference/manufacturers.json")),
    readJson<{ categories: ImportReferenceData["categories"] }>(path.join(repositoryRoot, "data/reference/categories.json")),
    readJson<{ mappings: ImportReferenceData["mappings"] }>(path.join(repositoryRoot, "data/reference/legacy-category-mapping.json")),
    readJson<{ applicationAreas: ImportReferenceData["applicationAreas"] }>(path.join(repositoryRoot, "data/reference/application-areas.json")),
  ]);
  return {
    manufacturers: manufacturers.manufacturers,
    categories: categories.categories,
    mappings: mappings.mappings.map((mapping) => {
      const { reviewerRequired, ...rest } = mapping as ImportReferenceData["mappings"][number] & { reviewerRequired?: boolean };
      return {
        ...rest,
        requiresManualVerification: reviewerRequired ?? false,
        reviewerRequired: reviewerRequired ?? false,
      };
    }),
    applicationAreas: applicationAreas.applicationAreas,
  };
}
