import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const WAVE2_PLANNED_MANUFACTURERS = [
  {
    manufacturer: "Hamilton",
    reportDirectory: "Hamilton",
    executionReport: "Hamilton_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Mindray",
    reportDirectory: "Mindray",
    executionReport: "Mindray_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Dräger",
    reportDirectory: "Drager",
    executionReport: "Drager_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "GE HealthCare",
    reportDirectory: "GE",
    executionReport: "GE_HealthCare_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Philips",
    reportDirectory: "Philips",
    executionReport: "Philips_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Ambu",
    reportDirectory: "Ambu",
    executionReport: "Ambu_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "SonoScape",
    reportDirectory: "SonoScape",
    executionReport: "SonoScape_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Comen",
    reportDirectory: "Comen",
    executionReport: "Comen_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "SLE",
    reportDirectory: "SLE",
    executionReport: "SLE_Wave2_Execution_Report.md",
  },
  {
    manufacturer: "Dixion",
    reportDirectory: "Dixion",
    executionReport: "Dixion_Wave2_Execution_Report.md",
  },
] as const;

const EXPECTED_STAGES = [
  "Discovery",
  "Documents",
  "Downloads",
  "Artifact Store",
  "Extraction",
  "Review Queue",
] as const;

export type Wave2DashboardStatus =
  | "Completed"
  | "In Progress"
  | "Blocked"
  | "Not Started";

interface Wave2AggregateSource {
  generatedAt: string;
  manufacturers: string[];
}

interface Wave2ManufacturerSource {
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
  stages: Array<{
    stage: string;
    status: string;
  }>;
}

export interface Wave2ManufacturerDashboardSummary {
  manufacturer: string;
  status: Wave2DashboardStatus;
  progress: number;
  productsDiscovered: number;
  officialSources: number;
  documents: number;
  downloads: number;
  artifacts: number;
  candidateFacts: number;
  reviewItems: number;
  ready: number;
  blockedProducts: number;
  errors: string[];
  warnings: string[];
  executionReport: string | null;
}

export interface Wave2DashboardData {
  generatedAt: string;
  plannedManufacturers: number;
  completedManufacturers: number;
  remainingManufacturers: number;
  overallProgress: number;
  totals: {
    productsDiscovered: number;
    officialSources: number;
    documents: number;
    downloads: number;
    artifacts: number;
    candidateFacts: number;
    reviewItems: number;
    errors: number;
    warnings: number;
  };
  manufacturers: Wave2ManufacturerDashboardSummary[];
}

export type Wave2DashboardLoadResult =
  | { status: "ready"; data: Wave2DashboardData }
  | { status: "missing" }
  | { status: "invalid" };

function wave2Root() {
  return resolve(process.cwd(), "data/research/wave2");
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAggregateSource(value: unknown): value is Wave2AggregateSource {
  return (
    isRecord(value) &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.manufacturers) &&
    value.manufacturers.every((manufacturer) => typeof manufacturer === "string")
  );
}

function isManufacturerSource(
  value: unknown,
): value is Wave2ManufacturerSource {
  if (!isRecord(value)) return false;

  const numericFields = [
    "productsDiscovered",
    "officialSources",
    "documentsFound",
    "downloads",
    "artifacts",
    "candidateFacts",
    "reviewItems",
    "blockedProducts",
  ];

  return (
    typeof value.manufacturer === "string" &&
    typeof value.generatedAt === "string" &&
    numericFields.every((field) => typeof value[field] === "number") &&
    Array.isArray(value.errors) &&
    value.errors.every((error) => typeof error === "string") &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string") &&
    Array.isArray(value.stages) &&
    value.stages.every(
      (stage) =>
        isRecord(stage) &&
        typeof stage.stage === "string" &&
        typeof stage.status === "string",
    )
  );
}

function stageProgress(stages: Wave2ManufacturerSource["stages"]) {
  const completed = EXPECTED_STAGES.filter((expected) =>
    stages.some(
      (stage) => stage.stage === expected && stage.status === "completed",
    ),
  ).length;
  return Math.round((completed / EXPECTED_STAGES.length) * 100);
}

function manufacturerStatus(
  source: Wave2ManufacturerSource,
): Wave2DashboardStatus {
  if (
    source.errors.length > 0 ||
    source.stages.some((stage) => ["blocked", "failed"].includes(stage.status))
  ) {
    return "Blocked";
  }
  return stageProgress(source.stages) === 100 ? "Completed" : "In Progress";
}

async function executionReportPath(fileName: string) {
  const relativePath = `docs/research/${fileName}`;
  try {
    await access(resolve(process.cwd(), relativePath));
    return `/${relativePath}`;
  } catch {
    return null;
  }
}

function notStartedSummary(
  manufacturer: string,
): Wave2ManufacturerDashboardSummary {
  return {
    manufacturer,
    status: "Not Started",
    progress: 0,
    productsDiscovered: 0,
    officialSources: 0,
    documents: 0,
    downloads: 0,
    artifacts: 0,
    candidateFacts: 0,
    reviewItems: 0,
    ready: 0,
    blockedProducts: 0,
    errors: [],
    warnings: [],
    executionReport: null,
  };
}

async function loadManufacturer(
  planned: (typeof WAVE2_PLANNED_MANUFACTURERS)[number],
) {
  const path = join(
    wave2Root(),
    planned.reportDirectory,
    "summary.generated.json",
  );

  try {
    const value = await readJson(path);
    if (!isManufacturerSource(value)) {
      return {
        ...notStartedSummary(planned.manufacturer),
        status: "Blocked" as const,
        errors: ["Manufacturer summary has an unexpected format."],
      };
    }

    return {
      manufacturer: planned.manufacturer,
      status: manufacturerStatus(value),
      progress: stageProgress(value.stages),
      productsDiscovered: value.productsDiscovered,
      officialSources: value.officialSources,
      documents: value.documentsFound,
      downloads: value.downloads,
      artifacts: value.artifacts,
      candidateFacts: value.candidateFacts,
      reviewItems: value.reviewItems,
      ready: Math.max(0, value.productsDiscovered - value.blockedProducts),
      blockedProducts: value.blockedProducts,
      errors: value.errors,
      warnings: value.warnings,
      executionReport: await executionReportPath(planned.executionReport),
    } satisfies Wave2ManufacturerDashboardSummary;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return notStartedSummary(planned.manufacturer);
    }

    return {
      ...notStartedSummary(planned.manufacturer),
      status: "Blocked" as const,
      errors: ["Manufacturer summary could not be read."],
    };
  }
}

function sum(
  manufacturers: Wave2ManufacturerDashboardSummary[],
  field:
    | "productsDiscovered"
    | "officialSources"
    | "documents"
    | "downloads"
    | "artifacts"
    | "candidateFacts"
    | "reviewItems",
) {
  return manufacturers.reduce((total, manufacturer) => total + manufacturer[field], 0);
}

export async function loadWave2Dashboard(): Promise<Wave2DashboardLoadResult> {
  let aggregate: unknown;
  try {
    aggregate = await readJson(
      join(wave2Root(), "wave2-summary.generated.json"),
    );
  } catch (error) {
    if (error instanceof Error && error.name === "SyntaxError") {
      return { status: "invalid" };
    }
    return { status: "missing" };
  }

  if (!isAggregateSource(aggregate)) return { status: "invalid" };

  const manufacturers = await Promise.all(
    WAVE2_PLANNED_MANUFACTURERS.map(loadManufacturer),
  );
  const completedManufacturers = manufacturers.filter(
    (manufacturer) => manufacturer.status === "Completed",
  ).length;
  const plannedManufacturers = WAVE2_PLANNED_MANUFACTURERS.length;

  return {
    status: "ready",
    data: {
      generatedAt: aggregate.generatedAt,
      plannedManufacturers,
      completedManufacturers,
      remainingManufacturers: plannedManufacturers - completedManufacturers,
      overallProgress: Math.round(
        (completedManufacturers / plannedManufacturers) * 100,
      ),
      totals: {
        productsDiscovered: sum(manufacturers, "productsDiscovered"),
        officialSources: sum(manufacturers, "officialSources"),
        documents: sum(manufacturers, "documents"),
        downloads: sum(manufacturers, "downloads"),
        artifacts: sum(manufacturers, "artifacts"),
        candidateFacts: sum(manufacturers, "candidateFacts"),
        reviewItems: sum(manufacturers, "reviewItems"),
        errors: manufacturers.reduce(
          (total, manufacturer) => total + manufacturer.errors.length,
          0,
        ),
        warnings: manufacturers.reduce(
          (total, manufacturer) => total + manufacturer.warnings.length,
          0,
        ),
      },
      manufacturers,
    },
  };
}
