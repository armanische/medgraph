import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  DefaultManufacturerDocumentLinkResolver,
  type ManufacturerDocumentLinkResolver,
  type ResolvedDocumentLink,
} from "./document-link-resolver.ts";
import type { CatalogSeed, CatalogSeedItem } from "./types.ts";

const SEED_PATH = resolve(process.cwd(), "data/catalog-seed.generated.json");
const MANUAL_SOURCE_SEEDS_PATH = resolve(
  process.cwd(),
  "data/research/source-seeds.manual.json",
);
const DISCOVERY_ROOT = resolve(process.cwd(), "data/research/discovery");
const PRODUCT_DISCOVERY_DIRECTORY = resolve(DISCOVERY_ROOT, "products");
const DISCOVERY_REPORT_PATH = resolve(
  DISCOVERY_ROOT,
  "discovery-report.generated.json",
);

export type DiscoverySourceType =
  | "official_manufacturer_page"
  | "manufacturer_document"
  | "regulator_record"
  | "distributor_page"
  | "scientific_publication"
  | "unknown";

export type DiscoveryDocumentType =
  | "registration_certificate"
  | "ifu"
  | "user_manual"
  | "service_manual"
  | "datasheet"
  | "brochure"
  | "certificate"
  | "unknown";

export type TrustTier = 1 | 2 | 3 | 4;
export type MissingDocumentPriority = "critical" | "high" | "medium" | "low";

export interface SourceCandidate {
  sourceId: string;
  productSlug: string;
  manufacturer: string | null;
  productName: string;
  sourceType: DiscoverySourceType;
  url: string;
  title: string;
  snippet: string;
  discoveredBy: string;
  confidence: number;
  trustTier: TrustTier;
  requiresHumanReview: boolean;
  reasons: string[];
}

export interface DocumentCandidate {
  documentId: string;
  sourceId: string;
  productSlug: string;
  documentType: DiscoveryDocumentType;
  url: string;
  title: string;
  language: string | null;
  confidence: number;
  trustTier: TrustTier;
  requiresHumanReview: boolean;
  reasons: string[];
}

export interface MissingDocumentTask {
  productSlug: string;
  requiredDocumentType: DiscoveryDocumentType;
  priority: MissingDocumentPriority;
  reason: string;
}

export interface DiscoveryProductInput {
  productSlug: string;
  manufacturer: string | null;
  productName: string;
  model: string | null;
  category: string;
}

export interface DiscoveryProvider {
  readonly name: string;
  discoverSources(product: DiscoveryProductInput): Promise<SourceCandidate[]>;
  discoverDocuments(source: SourceCandidate): Promise<DocumentCandidate[]>;
}

interface ManualSeedFile {
  products: Array<{
    slug: string;
    productName?: string;
    manufacturer?: string | null;
    model?: string | null;
    category?: string;
    officialSources?: Array<{
      url: string;
      sourceType?: string;
      publisher?: string;
      title?: string;
      notes?: string;
      trustTier?: TrustTier;
      documents?: Array<{
        url: string;
        documentType?: DiscoveryDocumentType;
        title?: string;
        language?: string | null;
        trustTier?: TrustTier;
        notes?: string;
      }>;
    }>;
    discoverySeeds?: Array<{
      url: string;
      sourceType: DiscoverySourceType;
      title: string;
      notes?: string;
      trustTier?: TrustTier;
      documents?: Array<{
        url: string;
        documentType: DiscoveryDocumentType;
        title: string;
        language?: string | null;
        trustTier?: TrustTier;
        notes?: string;
      }>;
    }>;
  }>;
}

export interface DiscoveryProductReport {
  product: DiscoveryProductInput;
  sourceCandidates: SourceCandidate[];
  documentCandidates: DocumentCandidate[];
  resolvedDocumentLinks: Array<{
    documentId: string;
    url: string;
    title: string;
    documentTypeGuess: DiscoveryDocumentType;
    parentSourceId: string;
    linkText: string;
    resolvedFromUrl: string;
    warnings: string[];
  }>;
  resolverWarnings: string[];
  missingDocumentTasks: MissingDocumentTask[];
  trustSummary: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
    canUseForPublication: number;
    cannotUseForPublication: number;
  };
  readiness: {
    hasOfficialManufacturerPage: boolean;
    hasRegulatorRecord: boolean;
    hasRequiredDocuments: boolean;
    canProceedToExtraction: boolean;
  };
  warnings: string[];
}

export interface DiscoveryAggregateReport {
  productsProcessed: number;
  officialSourcesFound: number;
  documentsFound: number;
  requiredDocumentsMissing: number;
  productsReadyForExtraction: number;
  productsBlocked: number;
  resolvedDocumentLinksFound: number;
  productsWithResolvedDocuments: number;
  productsStillMissingDocuments: number;
  productReports: Array<{
    productSlug: string;
    sources: number;
    documents: number;
    resolvedDocumentLinks: number;
    missingDocumentTasks: number;
    canProceedToExtraction: boolean;
  }>;
  warnings: string[];
}

function stableId(prefix: string, parts: Array<string | number | null>) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

function isSafePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "::1" &&
      !host.endsWith(".local") &&
      !/^10\.|^127\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(
        host,
      )
    );
  } catch {
    return false;
  }
}

function normalizeUrl(value: string) {
  return new URL(value).href;
}

function discoverySourceType(value: string | undefined): DiscoverySourceType {
  if (
    value === "official_manufacturer_page" ||
    value === "manufacturer_product_page" ||
    value === "official_manufacturer"
  ) {
    return "official_manufacturer_page";
  }
  if (
    value === "manufacturer_document" ||
    value === "ifu" ||
    value === "datasheet" ||
    value === "brochure" ||
    value === "service_manual"
  ) {
    return "manufacturer_document";
  }
  if (
    value === "regulator_record" ||
    value === "regulatory_registry" ||
    value === "registration_certificate"
  ) {
    return "regulator_record";
  }
  if (value === "distributor_page" || value === "official_distributor") {
    return "distributor_page";
  }
  if (value === "scientific_publication") return "scientific_publication";
  return "unknown";
}

export function trustTierForSourceType(type: DiscoverySourceType): TrustTier {
  const tiers: Record<DiscoverySourceType, TrustTier> = {
    official_manufacturer_page: 1,
    manufacturer_document: 1,
    regulator_record: 1,
    distributor_page: 3,
    scientific_publication: 3,
    unknown: 4,
  };
  return tiers[type];
}

function confidenceForTier(tier: TrustTier) {
  return ({ 1: 0.92, 2: 0.75, 3: 0.45, 4: 0.15 } as const)[tier];
}

export function canSourceSupportPublication(source: SourceCandidate) {
  return source.trustTier <= 2 && source.requiresHumanReview;
}

function sourceReasons(type: DiscoverySourceType, tier: TrustTier, notes = "") {
  const reasons = [
    `trust_tier:${tier}`,
    type === "official_manufacturer_page"
      ? "official manufacturer page candidate"
      : type === "manufacturer_document"
        ? "manufacturer-hosted document candidate"
        : type === "regulator_record"
          ? "official regulator record candidate"
          : "requires reviewer trust assessment",
    "snippet is not evidence",
    "LLM output is not a source",
  ];
  if (tier >= 3) reasons.push("tier 3/4 cannot support publication");
  if (notes) reasons.push(notes);
  return reasons;
}

function documentTypeFromUrl(
  value: string,
  fallback: DiscoveryDocumentType = "unknown",
): DiscoveryDocumentType {
  const searchable = value.toLocaleLowerCase("en-US");
  if (/registration|регистрац/.test(searchable)) return "registration_certificate";
  if (/\bifu\b|instruction|instructions-for-use|instruk/i.test(searchable)) {
    return "ifu";
  }
  if (/user[\s_-]*manual|operator|bedienungshandbuch|manual/.test(searchable)) {
    return "user_manual";
  }
  if (/service/.test(searchable)) return "service_manual";
  if (/datasheet|technical[\s_-]*spec|specification|specs?/.test(searchable)) {
    return "datasheet";
  }
  if (/brochure|broschuere|брошюр/.test(searchable)) return "brochure";
  if (/certificate|сертификат/.test(searchable)) return "certificate";
  return fallback;
}

function requiredDocuments(product: DiscoveryProductInput): DiscoveryDocumentType[] {
  const text = `${product.category} ${product.productName}`.toLocaleLowerCase(
    "ru-RU",
  );
  if (/ивл|ventilator|дыхан|наркоз|анестез/.test(text)) {
    return ["registration_certificate", "ifu", "datasheet"];
  }
  if (/эндоскоп|broncho|scope|sonoscape|hd-550/.test(text)) {
    return ["registration_certificate", "ifu", "datasheet"];
  }
  return ["registration_certificate", "ifu", "datasheet"];
}

function hasDocumentType(
  documents: DocumentCandidate[],
  type: DiscoveryDocumentType,
) {
  if (type === "ifu") {
    return documents.some(
      (document) =>
        document.documentType === "ifu" || document.documentType === "user_manual",
    );
  }
  return documents.some((document) => document.documentType === type);
}

function missingDocumentTasks(
  product: DiscoveryProductInput,
  documents: DocumentCandidate[],
): MissingDocumentTask[] {
  return requiredDocuments(product)
    .filter((type) => !hasDocumentType(documents, type))
    .map((type) => ({
      productSlug: product.productSlug,
      requiredDocumentType: type,
      priority:
        type === "registration_certificate"
          ? "critical"
          : type === "ifu"
            ? "high"
            : "medium",
      reason: `${type} is required before product can be considered extraction-ready.`,
    }));
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const partPath = `${path}.${stableId("part", [path, JSON.stringify(value)])}.part`;
  await writeFile(partPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(partPath, path);
}

function toDiscoveryProduct(item: CatalogSeedItem): DiscoveryProductInput {
  return {
    productSlug: item.slug,
    manufacturer: item.brandCandidate,
    productName: item.normalizedTitle,
    model: item.modelCandidate,
    category: item.category,
  };
}

function sourceFromSeed(input: {
  product: DiscoveryProductInput;
  url: string;
  title: string;
  sourceType: DiscoverySourceType;
  discoveredBy: string;
  notes?: string;
  trustTier?: TrustTier;
}) {
  const url = normalizeUrl(input.url);
  const tier = input.trustTier ?? trustTierForSourceType(input.sourceType);
  return {
    sourceId: stableId("source", [input.product.productSlug, url]),
    productSlug: input.product.productSlug,
    manufacturer: input.product.manufacturer,
    productName: input.product.productName,
    sourceType: input.sourceType,
    url,
    title: input.title,
    snippet: input.notes ?? "",
    discoveredBy: input.discoveredBy,
    confidence: confidenceForTier(tier),
    trustTier: tier,
    requiresHumanReview: true,
    reasons: sourceReasons(input.sourceType, tier, input.notes),
  } satisfies SourceCandidate;
}

function documentFromSeed(input: {
  source: SourceCandidate;
  url: string;
  title: string;
  documentType?: DiscoveryDocumentType;
  language?: string | null;
  notes?: string;
  trustTier?: TrustTier;
}) {
  const url = normalizeUrl(input.url);
  const type = input.documentType ?? documentTypeFromUrl(`${input.title} ${url}`);
  const tier = input.trustTier ?? input.source.trustTier;
  const reasons = [
    `trust_tier:${tier}`,
    "document candidate only; download, hash and locator are still required",
    "requires human review before verification",
  ];
  if (tier >= 3) reasons.push("tier 3/4 cannot support publication");
  if (input.notes) reasons.push(input.notes);
  return {
    documentId: stableId("document", [
      input.source.productSlug,
      input.source.sourceId,
      url,
      type,
    ]),
    sourceId: input.source.sourceId,
    productSlug: input.source.productSlug,
    documentType: type,
    url,
    title: input.title,
    language: input.language ?? null,
    confidence: confidenceForTier(tier),
    trustTier: tier,
    requiresHumanReview: true,
    reasons,
  } satisfies DocumentCandidate;
}

export class NoNetworkDiscoveryProvider implements DiscoveryProvider {
  readonly name = "no-network-discovery";

  async discoverSources(): Promise<SourceCandidate[]> {
    return [];
  }

  async discoverDocuments(): Promise<DocumentCandidate[]> {
    return [];
  }
}

export class ManualSeedDiscoveryProvider implements DiscoveryProvider {
  readonly name = "manual-seed-discovery";
  private readonly path: string;
  private seedFile: ManualSeedFile | null = null;

  constructor(path = MANUAL_SOURCE_SEEDS_PATH) {
    this.path = path;
  }

  private async readSeeds() {
    if (this.seedFile) return this.seedFile;
    try {
      this.seedFile = JSON.parse(await readFile(this.path, "utf8")) as ManualSeedFile;
    } catch {
      this.seedFile = { products: [] };
    }
    return this.seedFile;
  }

  private async seedsFor(productSlug: string) {
    const file = await this.readSeeds();
    return file.products.find((product) => product.slug === productSlug) ?? null;
  }

  async discoverSources(product: DiscoveryProductInput) {
    const entry = await this.seedsFor(product.productSlug);
    if (!entry) return [];
    const seeds = [
      ...(entry.discoverySeeds ?? []),
      ...(entry.officialSources ?? []).map((seed) => ({
        url: seed.url,
        sourceType: discoverySourceType(seed.sourceType),
        title: seed.title ?? seed.publisher ?? seed.url,
        notes: seed.notes,
        trustTier: seed.trustTier,
        documents: seed.documents,
      })),
    ];
    const sources = new Map<string, SourceCandidate>();
    for (const seed of seeds) {
      if (!isSafePublicUrl(seed.url)) continue;
      const type = discoverySourceType(seed.sourceType);
      const source = sourceFromSeed({
        product,
        url: seed.url,
        title: seed.title,
        sourceType: type,
        discoveredBy: this.name,
        notes: seed.notes,
        trustTier: seed.trustTier,
      });
      sources.set(source.url, source);
    }
    return [...sources.values()].sort((left, right) =>
      left.url.localeCompare(right.url),
    );
  }

  async discoverDocuments(source: SourceCandidate) {
    const entry = await this.seedsFor(source.productSlug);
    if (!entry) return [];
    const allSeeds = [
      ...(entry.discoverySeeds ?? []),
      ...(entry.officialSources ?? []).map((seed) => ({
        url: seed.url,
        sourceType: discoverySourceType(seed.sourceType),
        title: seed.title ?? seed.publisher ?? seed.url,
        notes: seed.notes,
        trustTier: seed.trustTier,
        documents: seed.documents,
      })),
    ];
    const seed = allSeeds.find(
      (candidate) =>
        isSafePublicUrl(candidate.url) && normalizeUrl(candidate.url) === source.url,
    );
    const documents = new Map<string, DocumentCandidate>();
    const sourceDocumentType = documentTypeFromUrl(`${source.title} ${source.url}`);
    if (source.sourceType === "manufacturer_document" || sourceDocumentType !== "unknown") {
      const document = documentFromSeed({
        source,
        url: source.url,
        title: source.title,
        documentType:
          sourceDocumentType === "unknown" ? undefined : sourceDocumentType,
        language: null,
        notes: "source URL is itself a document candidate",
      });
      documents.set(`${document.url}\u001f${document.documentType}`, document);
    }
    for (const documentSeed of seed?.documents ?? []) {
      if (!isSafePublicUrl(documentSeed.url)) continue;
      const document = documentFromSeed({
        source,
        url: documentSeed.url,
        title: documentSeed.title ?? documentSeed.url,
        documentType: documentSeed.documentType,
        language: documentSeed.language ?? null,
        notes: documentSeed.notes,
        trustTier: documentSeed.trustTier,
      });
      documents.set(`${document.url}\u001f${document.documentType}`, document);
    }
    return [...documents.values()].sort((left, right) =>
      left.url.localeCompare(right.url),
    );
  }
}

export class MockDiscoveryProvider implements DiscoveryProvider {
  readonly name = "mock-discovery";
  private readonly sourceFactory: (
    product: DiscoveryProductInput,
  ) => SourceCandidate[] | Promise<SourceCandidate[]>;
  private readonly documentFactory: (
    source: SourceCandidate,
  ) => DocumentCandidate[] | Promise<DocumentCandidate[]>;

  constructor(input: {
    sources: (
      product: DiscoveryProductInput,
    ) => SourceCandidate[] | Promise<SourceCandidate[]>;
    documents?: (
      source: SourceCandidate,
    ) => DocumentCandidate[] | Promise<DocumentCandidate[]>;
  }) {
    this.sourceFactory = input.sources;
    this.documentFactory = input.documents ?? (async () => []);
  }

  async discoverSources(product: DiscoveryProductInput) {
    return this.sourceFactory(product);
  }

  async discoverDocuments(source: SourceCandidate) {
    return this.documentFactory(source);
  }
}

function dedupeSources(sources: SourceCandidate[]) {
  return [...new Map(sources.map((source) => [source.url, source])).values()].sort(
    (left, right) =>
      left.trustTier - right.trustTier ||
      right.confidence - left.confidence ||
      left.url.localeCompare(right.url),
  );
}

function dedupeDocuments(documents: DocumentCandidate[]) {
  return [
    ...new Map(
      documents.map((document) => [
        `${document.url}\u001f${document.documentType}`,
        document,
      ]),
    ).values(),
  ].sort(
    (left, right) =>
      left.trustTier - right.trustTier ||
      right.confidence - left.confidence ||
      left.url.localeCompare(right.url),
  );
}

function resolvedLinkReport(link: ResolvedDocumentLink) {
  return {
    documentId: link.documentCandidate.documentId,
    url: link.documentCandidate.url,
    title: link.documentCandidate.title,
    documentTypeGuess: link.documentTypeGuess,
    parentSourceId: link.parentSourceId,
    linkText: link.linkText,
    resolvedFromUrl: link.resolvedFromUrl,
    warnings: link.warnings,
  };
}

function dedupeResolvedLinks(links: ResolvedDocumentLink[]) {
  return [
    ...new Map(
      links.map((link) => [
        `${link.documentCandidate.url}\u001f${link.documentCandidate.documentType}`,
        link,
      ]),
    ).values(),
  ].sort((left, right) =>
    left.documentCandidate.url.localeCompare(right.documentCandidate.url),
  );
}

export async function discoverProduct(
  product: DiscoveryProductInput,
  provider: DiscoveryProvider,
  resolver?: ManufacturerDocumentLinkResolver | null,
): Promise<DiscoveryProductReport> {
  const warnings: string[] = [];
  const resolverWarnings: string[] = [];
  const resolvedLinks: ResolvedDocumentLink[] = [];
  let sources: SourceCandidate[] = [];
  try {
    sources = await provider.discoverSources(product);
  } catch (error) {
    warnings.push(
      `Discovery provider failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
  const safeSources = dedupeSources(
    sources.filter((source) => {
      const safe = isSafePublicUrl(source.url);
      if (!safe) warnings.push(`Rejected unsafe source URL: ${source.url}`);
      return safe;
    }),
  );

  const documentResults = await Promise.all(
    safeSources.map(async (source) => {
      try {
        return await provider.discoverDocuments(source);
      } catch (error) {
        warnings.push(
          `Document discovery failed for ${source.url}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
        return [];
      }
    }),
  );
  if (resolver) {
    const resolvedResults = await Promise.all(
      safeSources
        .filter((source) => source.sourceType === "official_manufacturer_page")
        .map(async (source) => {
          try {
            return await resolver.resolve(source);
          } catch (error) {
            return {
              links: [],
              warnings: [
                `Resolver failed for ${source.url}: ${
                  error instanceof Error ? error.message : "unknown error"
                }`,
              ],
            };
          }
        }),
    );
    for (const result of resolvedResults) {
      resolvedLinks.push(...result.links);
      resolverWarnings.push(...result.warnings);
    }
  }
  const resolved = dedupeResolvedLinks(resolvedLinks);
  const documents = dedupeDocuments([
    ...documentResults.flat(),
    ...resolved.map((link) => link.documentCandidate),
  ]);
  const missingTasks = missingDocumentTasks(product, documents);
  const hasOfficialManufacturerPage = safeSources.some(
    (source) => source.sourceType === "official_manufacturer_page",
  );
  const hasRegulatorRecord =
    safeSources.some((source) => source.sourceType === "regulator_record") ||
    documents.some(
      (document) => document.documentType === "registration_certificate",
    );
  const hasRequiredDocuments = missingTasks.length === 0;
  const canProceedToExtraction =
    hasOfficialManufacturerPage &&
    documents.some((document) => document.trustTier <= 2) &&
    missingTasks.every((task) => task.priority !== "critical");

  return {
    product,
    sourceCandidates: safeSources,
    documentCandidates: documents,
    resolvedDocumentLinks: resolved.map(resolvedLinkReport),
    resolverWarnings,
    missingDocumentTasks: missingTasks,
    trustSummary: {
      tier1: safeSources.filter((source) => source.trustTier === 1).length,
      tier2: safeSources.filter((source) => source.trustTier === 2).length,
      tier3: safeSources.filter((source) => source.trustTier === 3).length,
      tier4: safeSources.filter((source) => source.trustTier === 4).length,
      canUseForPublication: safeSources.filter(canSourceSupportPublication)
        .length,
      cannotUseForPublication: safeSources.filter(
        (source) => !canSourceSupportPublication(source),
      ).length,
    },
    readiness: {
      hasOfficialManufacturerPage,
      hasRegulatorRecord,
      hasRequiredDocuments,
      canProceedToExtraction,
    },
    warnings: [
      ...warnings,
      ...resolverWarnings,
      ...(!safeSources.length
        ? ["No source candidates found; product remains needs_source."]
        : []),
      "Discovery creates candidates only; no verified claims or publication.",
    ],
  };
}

export async function runDiscoveryForProducts(input: {
  products: DiscoveryProductInput[];
  provider?: DiscoveryProvider;
  resolver?: ManufacturerDocumentLinkResolver | null;
  productReportDirectory?: string;
  aggregateReportPath?: string;
}) {
  const provider = input.provider ?? new ManualSeedDiscoveryProvider();
  const resolver =
    input.resolver === undefined
      ? new DefaultManufacturerDocumentLinkResolver()
      : input.resolver;
  const productReportDirectory =
    input.productReportDirectory ?? PRODUCT_DISCOVERY_DIRECTORY;
  const aggregateReportPath = input.aggregateReportPath ?? DISCOVERY_REPORT_PATH;
  const reports = await Promise.all(
    input.products.map((product) => discoverProduct(product, provider, resolver)),
  );
  const aggregate: DiscoveryAggregateReport = {
    productsProcessed: reports.length,
    officialSourcesFound: reports.reduce(
      (sum, report) =>
        sum +
        report.sourceCandidates.filter((source) => source.trustTier === 1).length,
      0,
    ),
    documentsFound: reports.reduce(
      (sum, report) => sum + report.documentCandidates.length,
      0,
    ),
    requiredDocumentsMissing: reports.reduce(
      (sum, report) => sum + report.missingDocumentTasks.length,
      0,
    ),
    productsReadyForExtraction: reports.filter(
      (report) => report.readiness.canProceedToExtraction,
    ).length,
    productsBlocked: reports.filter(
      (report) => !report.readiness.canProceedToExtraction,
    ).length,
    resolvedDocumentLinksFound: reports.reduce(
      (sum, report) => sum + report.resolvedDocumentLinks.length,
      0,
    ),
    productsWithResolvedDocuments: reports.filter(
      (report) => report.resolvedDocumentLinks.length > 0,
    ).length,
    productsStillMissingDocuments: reports.filter(
      (report) => report.missingDocumentTasks.length > 0,
    ).length,
    productReports: reports.map((report) => ({
      productSlug: report.product.productSlug,
      sources: report.sourceCandidates.length,
      documents: report.documentCandidates.length,
      resolvedDocumentLinks: report.resolvedDocumentLinks.length,
      missingDocumentTasks: report.missingDocumentTasks.length,
      canProceedToExtraction: report.readiness.canProceedToExtraction,
    })),
    warnings: [
      "Discovery output is candidate-only and must not be published directly.",
      "Tier 3/4 sources cannot support publication.",
      "Snippets are not facts and LLM output is not a source.",
    ],
  };

  await Promise.all([
    ...reports.map((report) =>
      writeJsonAtomic(
        join(productReportDirectory, `${report.product.productSlug}.json`),
        report,
      ),
    ),
    writeJsonAtomic(aggregateReportPath, aggregate),
  ]);

  return { reports, aggregate, productReportDirectory, aggregateReportPath };
}

async function readCatalogSeed(path = SEED_PATH) {
  return JSON.parse(await readFile(path, "utf8")) as CatalogSeed;
}

async function readManualSeedFile(path = MANUAL_SOURCE_SEEDS_PATH) {
  try {
    return JSON.parse(await readFile(path, "utf8")) as ManualSeedFile;
  } catch {
    return { products: [] } satisfies ManualSeedFile;
  }
}

function productMatchesQuery(product: DiscoveryProductInput, query: string) {
  const normalized = query.toLocaleLowerCase("ru-RU");
  return [
    product.productSlug,
    product.productName,
    product.manufacturer,
    product.model,
  ]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ru-RU").includes(normalized));
}

export async function runCatalogDiscovery(input: {
  seedPath?: string;
  provider?: DiscoveryProvider;
  resolver?: ManufacturerDocumentLinkResolver | null;
  productReportDirectory?: string;
  aggregateReportPath?: string;
  query?: string;
} = {}) {
  const seed = await readCatalogSeed(input.seedPath);
  const products = seed.items.map(toDiscoveryProduct);
  const selected = input.query
    ? products.filter((product) => productMatchesQuery(product, input.query!))
    : products;
  if (!selected.length && input.query) {
    const manualSeeds = await readManualSeedFile();
    const normalized = input.query.toLocaleLowerCase("ru-RU");
    const manualProducts = manualSeeds.products
      .filter((product) =>
        [
          product.slug,
          product.productName,
          product.manufacturer,
          product.model,
          ...(product.officialSources ?? []).flatMap((source) => [
            source.title,
            source.publisher,
          ]),
          ...(product.discoverySeeds ?? []).map((source) => source.title),
        ]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("ru-RU").includes(normalized)),
      )
      .map((product) => ({
        productSlug: product.slug,
        manufacturer: product.manufacturer ?? null,
        productName: product.productName ?? product.slug,
        model: product.model ?? product.productName ?? product.slug,
        category: product.category ?? "Golden Dataset",
      }));
    if (manualProducts.length) {
      return runDiscoveryForProducts({
        products: manualProducts,
        provider: input.provider,
        resolver: input.resolver,
        productReportDirectory: input.productReportDirectory,
        aggregateReportPath: input.aggregateReportPath,
      });
    }
  }
  if (!selected.length) {
    throw new Error(`No catalog products matched “${input.query}”.`);
  }
  return runDiscoveryForProducts({
    products: selected,
    provider: input.provider,
    resolver: input.resolver,
    productReportDirectory: input.productReportDirectory,
    aggregateReportPath: input.aggregateReportPath,
  });
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  const result = await runCatalogDiscovery({ query: query || undefined });
  process.stdout.write(
    `${JSON.stringify(
      {
        aggregateReportPath: result.aggregateReportPath,
        productReportsDirectory: result.productReportDirectory,
        productsProcessed: result.aggregate.productsProcessed,
        officialSourcesFound: result.aggregate.officialSourcesFound,
        documentsFound: result.aggregate.documentsFound,
        resolvedDocumentLinksFound: result.aggregate.resolvedDocumentLinksFound,
        productsWithResolvedDocuments:
          result.aggregate.productsWithResolvedDocuments,
        productsStillMissingDocuments:
          result.aggregate.productsStillMissingDocuments,
        requiredDocumentsMissing: result.aggregate.requiredDocumentsMissing,
        productsReadyForExtraction: result.aggregate.productsReadyForExtraction,
        productsBlocked: result.aggregate.productsBlocked,
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
      `${error instanceof Error ? error.message : "Discovery failed."}\n`,
    );
    process.exitCode = 1;
  });
}
