import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  CatalogSeedItem,
  DocumentCandidate,
  DocumentCandidateType,
  ManualSourceSeedFile,
  ResearchDiscovery,
  ResearchProvider,
  SearchResult,
  SourceCandidate,
  SourceCandidateType,
  SourceRanker,
} from "./types.ts";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 10;
const MANUAL_SOURCE_SEEDS_PATH = resolve(
  process.cwd(),
  "data/research/source-seeds.manual.json",
);

const OFFICIAL_HOSTS: Record<string, string[]> = {
  SLE: ["sle.co.uk"],
  "Hamilton Medical": ["hamilton-medical.com"],
  "GE Healthcare": ["gehealthcare.com"],
  DIXION: ["dixion.ru"],
  SonoScape: ["sonoscape.com"],
  "Pentax Medical": ["pentaxmedical.com"],
  Mindray: ["mindray.com"],
  Comen: ["comen.com"],
  "B. Braun": ["bbraun.com"],
  MIR: ["spirometry.com"],
  Ambu: ["ambu.com"],
  Airtraq: ["airtraq.com"],
  "Fresenius Kabi": ["fresenius-kabi.com"],
  Longfian: ["longfian.com"],
};

const REJECTED_HOST_PATTERNS = [
  /amazon\./i,
  /aliexpress\./i,
  /alibaba\./i,
  /ebay\./i,
  /ozon\./i,
  /wildberries\./i,
  /avito\./i,
  /market\.yandex\./i,
];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tag(item: string, name: string) {
  return decodeXml(
    item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"))?.[1] ?? "",
  ).trim();
}

export function isSafePublicUrl(value: string) {
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
      ) &&
      !REJECTED_HOST_PATTERNS.some((pattern) => pattern.test(host))
    );
  } catch {
    return false;
  }
}

function brandOfficialHosts(item: CatalogSeedItem) {
  return item.brandCandidate ? OFFICIAL_HOSTS[item.brandCandidate] ?? [] : [];
}

function hostMatches(host: string, candidates: string[]) {
  return candidates.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
}

function documentType(value: string): DocumentCandidateType | null {
  if (/service[\s_-]*manual|сервисн.*руковод/i.test(value)) {
    return "service_manual";
  }
  if (/\bifu\b|instruction|инструкц.*примен/i.test(value)) return "ifu";
  if (/datasheet|data[\s_-]*sheet/i.test(value)) return "datasheet";
  if (/brochure|брошюр|каталог производителя/i.test(value)) return "brochure";
  if (/registration|регистрац.*удостовер/i.test(value)) {
    return "registration";
  }
  if (/certificate|сертификат/i.test(value)) return "certificate";
  if (/technical[\s_-]*spec|техническ.*характер/i.test(value)) {
    return "technical_specification";
  }
  if (/manual|руководств/i.test(value)) return "manual";
  if (/\.pdf(?:$|\?)/i.test(value)) return "other";
  return null;
}

function classifySource(
  result: SearchResult,
  item: CatalogSeedItem,
): SourceCandidateType {
  const url = new URL(result.url);
  const host = url.hostname.toLowerCase();
  const searchable = `${result.title} ${url.pathname}`.toLocaleLowerCase();
  if (host.endsWith("roszdravnadzor.gov.ru")) return "regulatory_registry";
  if (host.endsWith("fda.gov")) return "fda";
  if (host.includes("eudamed")) return "eudamed";
  if (/pubmed\.ncbi\.nlm\.nih\.gov|doi\.org/.test(host)) {
    return "scientific_publication";
  }
  const official = hostMatches(host, brandOfficialHosts(item));
  const detectedDocumentType = documentType(searchable);
  if (official && detectedDocumentType && detectedDocumentType !== "other") {
    if (detectedDocumentType === "manual") return "ifu";
    if (detectedDocumentType === "technical_specification") return "datasheet";
    if (
      detectedDocumentType === "registration" ||
      detectedDocumentType === "registration_certificate" ||
      detectedDocumentType === "certificate"
    ) {
      return "official_manufacturer";
    }
    return detectedDocumentType;
  }
  return official ? "official_manufacturer" : "other";
}

function sourceConfidence(type: SourceCandidateType) {
  if (type === "regulatory_registry" || type === "fda" || type === "eudamed") {
    return 0.95;
  }
  if (
    ["datasheet", "ifu", "brochure", "service_manual"].includes(type)
  ) {
    return 0.9;
  }
  if (
    type === "official_manufacturer" ||
    type === "manufacturer_product_page"
  ) return 0.85;
  if (type === "official_distributor") return 0.65;
  if (type === "scientific_publication") return 0.7;
  return 0.3;
}

export class DefaultSourceRanker implements SourceRanker {
  rank(source: SourceCandidate) {
    const scores: Record<SourceCandidateType, number> = {
      manufacturer_product_page: 100,
      official_manufacturer: 100,
      regulatory_registry: 98,
      fda: 98,
      eudamed: 98,
      ifu: 96,
      datasheet: 95,
      brochure: 94,
      service_manual: 94,
      scientific_publication: 90,
      official_distributor: 80,
      other: 40,
    };
    return scores[source.sourceType];
  }
}

function detectedValue(candidate: string | null, searchable: string) {
  return candidate &&
    searchable
      .toLocaleLowerCase("ru-RU")
      .includes(candidate.toLocaleLowerCase("ru-RU"))
    ? candidate
    : null;
}

export function validateSourceCandidate(
  value: SourceCandidate,
): SourceCandidate {
  if (!value.sourceUrl || !isSafePublicUrl(value.sourceUrl)) {
    throw new Error("SourceCandidate requires a safe public HTTPS sourceUrl.");
  }
  if (!value.sourceType) {
    throw new Error("SourceCandidate requires sourceType.");
  }
  return value;
}

function toCandidates(
  results: SearchResult[],
  item: CatalogSeedItem,
  discoveredAt: string,
) {
  const sources: SourceCandidate[] = [];
  const documents: DocumentCandidate[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (!isSafePublicUrl(result.url)) continue;
    const url = new URL(result.url);
    if (seen.has(url.href)) continue;
    seen.add(url.href);
    const sourceType = classifySource(result, item);
    const searchable = `${result.title} ${result.description} ${url.pathname}`;
    const source = validateSourceCandidate({
      sourceTitle: result.title,
      sourceUrl: url.href,
      sourceType,
      publisher: url.hostname,
      detectedManufacturer: detectedValue(item.brandCandidate, searchable),
      detectedModel: detectedValue(item.modelCandidate, searchable),
      confidence: sourceConfidence(sourceType),
      rankScore: 0,
      reason:
        sourceType === "other"
          ? "Найден поиском; авторитетность и принадлежность требуют проверки."
          : "Домен или тип результата соответствует приоритетному источнику.",
      discoveredAt,
      status: "candidate",
      warnings: ["Поисковый результат не является Evidence до проверки."],
    });
    source.rankScore = new DefaultSourceRanker().rank(source);
    sources.push(source);

    const detectedDocumentType = documentType(
      `${result.title} ${url.pathname}`,
    );
    if (detectedDocumentType) {
      documents.push({
        documentType: detectedDocumentType,
        title: result.title,
        url: url.href,
        publisher: url.hostname,
        mimeType: /\.pdf(?:$|\?)/i.test(url.href)
          ? "application/pdf"
          : null,
        sizeBytes: null,
        downloadedAt: null,
        sha256: null,
        artifactPath: null,
        sourceUrl: url.href,
        status: "candidate",
        warnings: ["Документ обнаружен поиском и требует проверки идентичности."],
      });
    }
  }
  return { sources, documents };
}

export class WebSearchResearchProvider implements ResearchProvider {
  readonly name = "web-search-rss";

  async discover(item: CatalogSeedItem): Promise<ResearchDiscovery> {
    const query = [
      item.normalizedTitle,
      item.brandCandidate,
      item.modelCandidate,
      "official IFU datasheet manual PDF",
    ]
      .filter(Boolean)
      .join(" ");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = new URL("https://www.bing.com/search");
      url.searchParams.set("format", "rss");
      url.searchParams.set("q", query);
      const response = await fetch(url, {
        headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Search returned HTTP ${response.status}`);
      }
      const xml = await response.text();
      const results = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
        .slice(0, MAX_RESULTS)
        .map((match) => ({
          title: tag(match[1], "title"),
          url: tag(match[1], "link"),
          description: tag(match[1], "description"),
        }))
        .filter((result) => result.title && result.url);
      return {
        ...toCandidates(results, item, new Date().toISOString()),
        warnings: [],
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class NoNetworkResearchProvider implements ResearchProvider {
  readonly name = "no-network";

  async discover(): Promise<ResearchDiscovery> {
    return {
      sources: [],
      documents: [],
      warnings: [
        "Independent research could not run due to network restriction.",
      ],
    };
  }
}

export class ManualSourceSeedResearchProvider implements ResearchProvider {
  readonly name = "manual-source-seeds";
  private readonly path: string;

  constructor(path = MANUAL_SOURCE_SEEDS_PATH) {
    this.path = path;
  }

  async discover(item: CatalogSeedItem): Promise<ResearchDiscovery> {
    let file: ManualSourceSeedFile;
    try {
      file = JSON.parse(await readFile(this.path, "utf8")) as ManualSourceSeedFile;
    } catch {
      return {
        sources: [],
        documents: [],
        warnings: ["Manual source seed file is missing or unreadable."],
      };
    }
    const entry = file.products.find((product) => product.slug === item.slug);
    if (!entry) {
      return {
        sources: [],
        documents: [],
        warnings: [],
      };
    }

    const discoveredAt = new Date().toISOString();
    const sources: SourceCandidate[] = [];
    const documents: DocumentCandidate[] = [];
    for (const seed of entry.officialSources) {
      if (!isSafePublicUrl(seed.url)) continue;
      const url = new URL(seed.url);
      const sourceType = seed.sourceType ?? "manufacturer_product_page";
      const source = validateSourceCandidate({
        sourceTitle: seed.title ?? `${seed.publisher} official source`,
        sourceUrl: url.href,
        sourceType,
        publisher: seed.publisher,
        detectedManufacturer: seed.publisher,
        detectedModel: item.modelCandidate,
        confidence: sourceConfidence(sourceType),
        rankScore: 0,
        reason:
          "Manual official source seed; URL still creates only candidate data.",
        discoveredAt,
        status: "candidate",
        warnings: [
          "Manual source seed requires human review before verification.",
        ],
      });
      source.rankScore = new DefaultSourceRanker().rank(source);
      sources.push(source);

      const detectedDocumentType = documentType(`${seed.title ?? ""} ${url.pathname}`);
      if (detectedDocumentType) {
        documents.push({
          documentType: detectedDocumentType,
          title: seed.title ?? `${seed.publisher} document`,
          url: url.href,
          publisher: seed.publisher,
          mimeType: /\.pdf(?:$|\?)/i.test(url.href)
            ? "application/pdf"
            : null,
          sizeBytes: null,
          downloadedAt: null,
          sha256: null,
          artifactPath: null,
          sourceUrl: url.href,
          status: "candidate",
          warnings: [
            "Document came from manual source seed and requires review.",
          ],
        });
      }
    }
    return { sources, documents, warnings: [] };
  }
}

export class CompositeResearchProvider implements ResearchProvider {
  readonly name: string;
  private readonly providers: ResearchProvider[];

  constructor(providers: ResearchProvider[]) {
    this.providers = providers;
    this.name = providers.map((provider) => provider.name).join("+");
  }

  async discover(item: CatalogSeedItem): Promise<ResearchDiscovery> {
    const discoveries = await Promise.all(
      this.providers.map((provider) => provider.discover(item)),
    );
    const sources = new Map<string, SourceCandidate>();
    const documents = new Map<string, DocumentCandidate>();
    const warnings: string[] = [];
    for (const discovery of discoveries) {
      discovery.sources.forEach((source) => sources.set(source.sourceUrl, source));
      discovery.documents.forEach((document) => documents.set(document.url, document));
      warnings.push(...discovery.warnings);
    }
    return {
      sources: [...sources.values()],
      documents: [...documents.values()],
      warnings,
    };
  }
}

export class MockResearchProvider implements ResearchProvider {
  readonly name = "mock-research";
  private readonly factory: (
    item: CatalogSeedItem,
  ) => ResearchDiscovery | Promise<ResearchDiscovery>;

  constructor(
    factory: (
      item: CatalogSeedItem,
    ) => ResearchDiscovery | Promise<ResearchDiscovery>,
  ) {
    this.factory = factory;
  }

  async discover(item: CatalogSeedItem) {
    return this.factory(item);
  }
}
