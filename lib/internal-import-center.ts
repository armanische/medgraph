import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function wave2Root() {
  return resolve(process.cwd(), "data/research/wave2");
}

function wave2AggregatePath() {
  return join(wave2Root(), "wave2-summary.generated.json");
}

export interface ImportCenterSafetyFlags {
  publicationCreated: boolean;
  supabaseWrites: boolean;
  verificationChanged: boolean;
  reviewDecisionsChanged: boolean;
}

export interface ImportCenterManufacturerSummary {
  manufacturer: string;
  generatedAt: string;
  productsDiscovered: number;
  officialSources: number;
  documentsFound: number;
  downloads: number;
  artifacts: number;
  candidateFacts: number;
  reviewItems: number;
  blockedProducts: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  retries: Array<{
    stage: string;
    attempts: number;
    reason: string;
  }>;
  stages: Array<{
    stage: string;
    status: string;
  }>;
}

export interface ImportCenterAggregateReport {
  generatedAt: string;
  manufacturers: string[];
  totals: {
    productsDiscovered: number;
    officialSources: number;
    documentsFound: number;
    downloads: number;
    artifacts: number;
    candidateFacts: number;
    reviewItems: number;
    blockedProducts: number;
    errors: number;
    warnings: number;
    durationMs: number;
  };
  reports: Array<{
    manufacturer: string;
    path: string;
  }>;
  safety: ImportCenterSafetyFlags;
}

export type ImportCenterLoadResult =
  | {
      status: "ready";
      aggregate: ImportCenterAggregateReport;
      manufacturers: ImportCenterManufacturerSummary[];
    }
  | { status: "missing" }
  | { status: "invalid" };

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function reportPathFor(manufacturer: string) {
  return join(wave2Root(), manufacturer, "summary.generated.json");
}

export async function loadInternalImportCenter(): Promise<ImportCenterLoadResult> {
  try {
    const aggregate = await readJson<ImportCenterAggregateReport>(
      wave2AggregatePath(),
    );
    const manufacturers = await Promise.all(
      aggregate.manufacturers.map((manufacturer) =>
        readJson<ImportCenterManufacturerSummary>(reportPathFor(manufacturer)),
      ),
    );
    return {
      status: "ready",
      aggregate,
      manufacturers,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "SyntaxError") {
      return { status: "invalid" };
    }
    return { status: "missing" };
  }
}
