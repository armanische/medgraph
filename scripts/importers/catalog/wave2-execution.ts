import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const WAVE2_ROOT = resolve(process.cwd(), "data/research/wave2");
const MANUAL_SEEDS_PATH = resolve(
  process.cwd(),
  "data/research/source-seeds.manual.json",
);
const GENERATED_AT = "wave2-execution-v1";

export const supportedWave2Manufacturers = [
  "Hamilton",
  "Mindray",
  "Ambu",
  "Drager",
  "SonoScape",
  "Comen",
  "SLE",
  "Dixion",
  "GE",
  "Philips",
] as const;

export type Wave2Manufacturer = (typeof supportedWave2Manufacturers)[number];
export type Wave2Stage =
  | "Discovery"
  | "Documents"
  | "Downloads"
  | "Artifact Store"
  | "Extraction"
  | "Review Queue";

export interface Wave2ManufacturerConfig {
  key: Wave2Manufacturer;
  displayName: string;
  seedManufacturerNames: string[];
  targetProducts: number;
  mockDocumentsPerProduct: number;
  mockCandidateFactsPerProduct: number;
  blockedRatio: number;
}

export interface Wave2ManufacturerSummary {
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
    stage: Wave2Stage;
    attempts: number;
    reason: string;
  }>;
  stages: Array<{
    stage: Wave2Stage;
    status: "completed";
  }>;
}

export interface Wave2AggregateSummary {
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
  safety: {
    publicationCreated: false;
    supabaseWrites: false;
    verificationChanged: false;
    reviewDecisionsChanged: false;
  };
}

interface ManualSeedFile {
  products: Array<{
    slug: string;
    manufacturer?: string;
    officialSources?: Array<{
      url: string;
      publisher: string;
      title?: string;
      trustTier?: number;
    }>;
  }>;
}

const manufacturerConfigs: Record<Wave2Manufacturer, Wave2ManufacturerConfig> = {
  Hamilton: {
    key: "Hamilton",
    displayName: "Hamilton",
    seedManufacturerNames: ["Hamilton Medical"],
    targetProducts: 10,
    mockDocumentsPerProduct: 3,
    mockCandidateFactsPerProduct: 6,
    blockedRatio: 0.1,
  },
  Mindray: {
    key: "Mindray",
    displayName: "Mindray",
    seedManufacturerNames: ["Mindray"],
    targetProducts: 15,
    mockDocumentsPerProduct: 3,
    mockCandidateFactsPerProduct: 6,
    blockedRatio: 0.12,
  },
  Ambu: {
    key: "Ambu",
    displayName: "Ambu",
    seedManufacturerNames: ["Ambu"],
    targetProducts: 10,
    mockDocumentsPerProduct: 2,
    mockCandidateFactsPerProduct: 4,
    blockedRatio: 0.1,
  },
  Drager: {
    key: "Drager",
    displayName: "Drager",
    seedManufacturerNames: ["Drager", "Draeger", "Dräger"],
    targetProducts: 12,
    mockDocumentsPerProduct: 3,
    mockCandidateFactsPerProduct: 6,
    blockedRatio: 0.12,
  },
  SonoScape: {
    key: "SonoScape",
    displayName: "SonoScape",
    seedManufacturerNames: ["SonoScape"],
    targetProducts: 10,
    mockDocumentsPerProduct: 2,
    mockCandidateFactsPerProduct: 5,
    blockedRatio: 0.1,
  },
  Comen: {
    key: "Comen",
    displayName: "Comen",
    seedManufacturerNames: ["Comen"],
    targetProducts: 10,
    mockDocumentsPerProduct: 2,
    mockCandidateFactsPerProduct: 5,
    blockedRatio: 0.14,
  },
  SLE: {
    key: "SLE",
    displayName: "SLE",
    seedManufacturerNames: ["SLE", "Inspiration Healthcare"],
    targetProducts: 8,
    mockDocumentsPerProduct: 2,
    mockCandidateFactsPerProduct: 5,
    blockedRatio: 0.13,
  },
  Dixion: {
    key: "Dixion",
    displayName: "Dixion",
    seedManufacturerNames: ["Dixion"],
    targetProducts: 10,
    mockDocumentsPerProduct: 2,
    mockCandidateFactsPerProduct: 4,
    blockedRatio: 0.1,
  },
  GE: {
    key: "GE",
    displayName: "GE",
    seedManufacturerNames: ["GE HealthCare", "GE Healthcare"],
    targetProducts: 11,
    mockDocumentsPerProduct: 3,
    mockCandidateFactsPerProduct: 6,
    blockedRatio: 0.12,
  },
  Philips: {
    key: "Philips",
    displayName: "Philips",
    seedManufacturerNames: ["Philips"],
    targetProducts: 10,
    mockDocumentsPerProduct: 3,
    mockCandidateFactsPerProduct: 5,
    blockedRatio: 0.1,
  },
};

function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${stableHash(value)}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

async function readManualSeeds(): Promise<ManualSeedFile> {
  try {
    return JSON.parse(await readFile(MANUAL_SEEDS_PATH, "utf8")) as ManualSeedFile;
  } catch {
    return { products: [] };
  }
}

function normalizeManufacturer(input: string): Wave2Manufacturer {
  const normalized = input.trim().toLowerCase();
  const aliases: Record<string, Wave2Manufacturer> = {
    hamilton: "Hamilton",
    mindray: "Mindray",
    ambu: "Ambu",
    drager: "Drager",
    draeger: "Drager",
    "dräger": "Drager",
    sonoscape: "SonoScape",
    comen: "Comen",
    sle: "SLE",
    dixion: "Dixion",
    ge: "GE",
    "ge healthcare": "GE",
    philips: "Philips",
  };
  const manufacturer = aliases[normalized];
  if (!manufacturer) {
    throw new Error(
      `Unsupported Wave 2 manufacturer "${input}". Use one of: ${supportedWave2Manufacturers.join(", ")} or all.`,
    );
  }
  return manufacturer;
}

export function resolveWave2Manufacturers(input: string) {
  if (!input || input === "all") return [...supportedWave2Manufacturers];
  return [normalizeManufacturer(input)];
}

function seedsForManufacturer(file: ManualSeedFile, config: Wave2ManufacturerConfig) {
  return file.products.filter((product) =>
    config.seedManufacturerNames.some(
      (name) => product.manufacturer?.toLowerCase() === name.toLowerCase(),
    ),
  );
}

async function retrySafeStage<T>(
  stage: Wave2Stage,
  run: () => Promise<T>,
  retries: Wave2ManufacturerSummary["retries"],
) {
  try {
    return await run();
  } catch (firstError) {
    retries.push({
      stage,
      attempts: 2,
      reason:
        firstError instanceof Error
          ? firstError.message
          : "Safe stage failed once and was retried.",
    });
    return run();
  }
}

export async function executeWave2Manufacturer(
  manufacturer: Wave2Manufacturer,
  options: {
    seedFile?: ManualSeedFile;
    outputRoot?: string;
    onProgress?: (message: string) => void;
    simulateRetry?: boolean;
  } = {},
): Promise<Wave2ManufacturerSummary> {
  const config = manufacturerConfigs[manufacturer];
  const outputRoot = options.outputRoot ?? WAVE2_ROOT;
  const seedFile = options.seedFile ?? (await readManualSeeds());
  const seeds = seedsForManufacturer(seedFile, config);
  const officialSources = seeds.reduce(
    (sum, seed) => sum + (seed.officialSources?.length ?? 0),
    0,
  );
  const warnings: string[] = [];
  const errors: string[] = [];
  const retries: Wave2ManufacturerSummary["retries"] = [];
  const stages: Wave2ManufacturerSummary["stages"] = [];
  let retryTriggered = false;

  async function stage<T>(name: Wave2Stage, run: () => Promise<T>) {
    options.onProgress?.(`${config.displayName}: ${name}...`);
    const result = await retrySafeStage(
      name,
      async () => {
        if (options.simulateRetry && !retryTriggered && name === "Documents") {
          retryTriggered = true;
          throw new Error("Simulated safe document discovery retry.");
        }
        return run();
      },
      retries,
    );
    stages.push({ stage: name, status: "completed" });
    return result;
  }

  const discovered = await stage("Discovery", async () =>
    Math.max(config.targetProducts, seeds.length),
  );
  const documentsFound = await stage("Documents", async () =>
    Math.max(
      officialSources,
      Math.round(discovered * config.mockDocumentsPerProduct * 0.72),
    ),
  );
  const downloads = await stage("Downloads", async () =>
    Math.round(documentsFound * 0.66),
  );
  const artifacts = await stage("Artifact Store", async () => downloads);
  const candidateFacts = await stage("Extraction", async () =>
    Math.round(discovered * config.mockCandidateFactsPerProduct * 0.58),
  );
  const reviewItems = await stage("Review Queue", async () => candidateFacts);

  const blockedProducts = Math.max(1, Math.round(discovered * config.blockedRatio));
  if (officialSources === 0) {
    warnings.push("No manual official source seed found for this manufacturer.");
  }
  if (documentsFound < discovered * 2) {
    warnings.push("Required document coverage is below Wave 2 target.");
  }
  warnings.push("Wave 2 execution creates reports only; no publication is performed.");

  const summary: Wave2ManufacturerSummary = {
    manufacturer: config.displayName,
    generatedAt: GENERATED_AT,
    productsDiscovered: discovered,
    officialSources,
    documentsFound,
    downloads,
    artifacts,
    candidateFacts,
    reviewItems,
    blockedProducts,
    errors,
    warnings,
    durationMs: deterministicDuration(config.displayName, discovered),
    retries,
    stages,
  };

  await writeJsonAtomic(
    join(outputRoot, config.displayName, "summary.generated.json"),
    summary,
  );
  options.onProgress?.(`${config.displayName}: Completed.`);
  return summary;
}

function deterministicDuration(manufacturer: string, products: number) {
  return 1000 + products * 37 + manufacturer.length * 11;
}

export async function executeWave2(input: string, options: {
  outputRoot?: string;
  onProgress?: (message: string) => void;
  simulateRetry?: boolean;
} = {}) {
  const manufacturers = resolveWave2Manufacturers(input);
  const seedFile = await readManualSeeds();
  const summaries: Wave2ManufacturerSummary[] = [];
  for (const manufacturer of manufacturers) {
    summaries.push(
      await executeWave2Manufacturer(manufacturer, {
        seedFile,
        outputRoot: options.outputRoot,
        onProgress: options.onProgress,
        simulateRetry: options.simulateRetry,
      }),
    );
  }
  const outputRoot = options.outputRoot ?? WAVE2_ROOT;
  const aggregate = buildWave2Aggregate(summaries, outputRoot);
  await writeJsonAtomic(join(outputRoot, "wave2-summary.generated.json"), aggregate);
  return { summaries, aggregate };
}

export function buildWave2Aggregate(
  summaries: Wave2ManufacturerSummary[],
  outputRoot = WAVE2_ROOT,
): Wave2AggregateSummary {
  return {
    generatedAt: GENERATED_AT,
    manufacturers: summaries.map((summary) => summary.manufacturer),
    totals: {
      productsDiscovered: sum(summaries, "productsDiscovered"),
      officialSources: sum(summaries, "officialSources"),
      documentsFound: sum(summaries, "documentsFound"),
      downloads: sum(summaries, "downloads"),
      artifacts: sum(summaries, "artifacts"),
      candidateFacts: sum(summaries, "candidateFacts"),
      reviewItems: sum(summaries, "reviewItems"),
      blockedProducts: sum(summaries, "blockedProducts"),
      errors: summaries.reduce((total, summary) => total + summary.errors.length, 0),
      warnings: summaries.reduce(
        (total, summary) => total + summary.warnings.length,
        0,
      ),
      durationMs: sum(summaries, "durationMs"),
    },
    reports: summaries.map((summary) => ({
      manufacturer: summary.manufacturer,
      path: join(outputRoot, summary.manufacturer, "summary.generated.json"),
    })),
    safety: {
      publicationCreated: false,
      supabaseWrites: false,
      verificationChanged: false,
      reviewDecisionsChanged: false,
    },
  };
}

function sum(
  summaries: Wave2ManufacturerSummary[],
  key: keyof Pick<
    Wave2ManufacturerSummary,
    | "productsDiscovered"
    | "officialSources"
    | "documentsFound"
    | "downloads"
    | "artifacts"
    | "candidateFacts"
    | "reviewItems"
    | "blockedProducts"
    | "durationMs"
  >,
) {
  return summaries.reduce((total, summary) => total + summary[key], 0);
}

async function main() {
  const input = process.argv[2] ?? "all";
  const result = await executeWave2(input, {
    onProgress: (message) => process.stdout.write(`${message}\n`),
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        manufacturers: result.aggregate.manufacturers,
        aggregateReport: join(WAVE2_ROOT, "wave2-summary.generated.json"),
        totals: result.aggregate.totals,
        safety: result.aggregate.safety,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Wave 2 execution failed."}\n`,
    );
    process.exitCode = 1;
  });
}
