import type {
  DocumentPortalDetection,
  ManufacturerProvider,
  ManufacturerSection,
  NormalizedUrlResult,
  ProviderCandidate,
  ProviderDiagnostics,
  ProviderInput,
  ProviderUrlCandidate,
  RegionalSiteResolution,
} from "./types.ts";

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

const SECTION_PATTERNS: Array<[ManufacturerSection, RegExp]> = [
  ["customer_portal", /customer[\s/_-]*portal|partner[\s/_-]*(?:connect|portal)|login|sign[\s_-]*in/iu],
  ["technical_documentation", /technical[\s/_-]*(?:documentation|documents|data)|tdoc/iu],
  ["documentation", /documentation|documents|manuals?|instructions|ifu/iu],
  ["downloads", /downloads?|attachments?/iu],
  ["resources", /resources?/iu],
  ["support", /support|service/iu],
  ["library", /library/iu],
  ["media", /media(?:[\s/_-]*center)?/iu],
  ["professional", /professional/iu],
  ["products", /products?|productfinder|catalog(?:ue)?/iu],
];

const REGION_SEGMENT = /^(?:[a-z]{2}(?:[-_][a-z]{2,5}){0,2}|en|de|fr|es|it|pt|ru)$/iu;

export interface ProviderConfiguration {
  name: string;
  strategy: string;
  manufacturerMatchers: RegExp[];
  officialHosts: string[];
  preferredSections?: ManufacturerSection[];
}

function classify(candidate: ProviderUrlCandidate): ManufacturerSection | null {
  const searchable = `${candidate.title ?? ""} ${candidate.url}`;
  return SECTION_PATTERNS.find(([, pattern]) => pattern.test(searchable))?.[0] ?? null;
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return !["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase()) &&
      !url.hostname.toLowerCase().endsWith(".local");
  } catch {
    return false;
  }
}

export abstract class BaseManufacturerProvider implements ManufacturerProvider {
  readonly name: string;
  readonly strategy: string;
  protected readonly manufacturerMatchers: RegExp[];
  protected readonly officialHosts: string[];
  protected readonly preferredSections: ManufacturerSection[];

  protected constructor(configuration: ProviderConfiguration) {
    this.name = configuration.name;
    this.strategy = configuration.strategy;
    this.manufacturerMatchers = configuration.manufacturerMatchers;
    this.officialHosts = configuration.officialHosts.map((host) => host.toLowerCase());
    this.preferredSections = configuration.preferredSections ?? [];
  }

  matches(manufacturer: string | null) {
    return this.manufacturerMatchers.some((matcher) => matcher.test(manufacturer ?? ""));
  }

  protected isOfficial(value: string) {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return this.officialHosts.some((official) => host === official || host.endsWith(`.${official}`));
    } catch {
      return false;
    }
  }

  protected candidates(input: ProviderInput, sections: ManufacturerSection[]) {
    const normalized = this.normalizeUrls(input.urls);
    const originals = new Map(
      input.urls.map((candidate) => [this.normalizeUrls([candidate]).urls[0], candidate]),
    );
    return normalized.urls.flatMap((url): ProviderCandidate[] => {
      const original = originals.get(url) ?? { url };
      const section = classify({ ...original, url });
      if (!section || !sections.includes(section) || !this.isOfficial(url)) return [];
      return [{ ...original, url, section }];
    });
  }

  discoverOfficialPages(input: ProviderInput) {
    return this.candidates(input, ["products"]);
  }

  discoverDocumentation(input: ProviderInput) {
    return this.candidates(input, [
      "documentation",
      "technical_documentation",
      "resources",
      "library",
      "media",
      "professional",
      "support",
    ]);
  }

  discoverDownloads(input: ProviderInput) {
    return this.candidates(input, ["downloads"]);
  }

  normalizeUrls(candidates: ProviderUrlCandidate[]): NormalizedUrlResult {
    const blockedUrls: string[] = [];
    const normalized: string[] = [];
    for (const candidate of candidates) {
      const value = candidate.canonicalUrl ?? candidate.url;
      if (!safeUrl(value)) {
        blockedUrls.push(candidate.url);
        continue;
      }
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        blockedUrls.push(candidate.url);
        continue;
      }
      url.protocol = "https:";
      url.hostname = url.hostname.toLowerCase();
      url.hash = "";
      for (const parameter of [...url.searchParams.keys()]) {
        if (TRACKING_PARAMETERS.has(parameter.toLowerCase())) url.searchParams.delete(parameter);
      }
      url.searchParams.sort();
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/u, "");
      normalized.push(url.href);
    }
    const urls = [...new Set(normalized)];
    return {
      urls,
      duplicatesRemoved: normalized.length - urls.length,
      blockedUrls,
    };
  }

  resolveRegionalSites(candidates: ProviderUrlCandidate[]): RegionalSiteResolution[] {
    return this.normalizeUrls(candidates).urls.map((url) => {
      const parsed = new URL(url);
      const firstSegment = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
      return {
        url,
        region: firstSegment && REGION_SEGMENT.test(firstSegment) ? firstSegment : null,
        official: this.isOfficial(url),
      };
    });
  }

  detectDocumentPortals(candidates: ProviderUrlCandidate[]): DocumentPortalDetection[] {
    return this.normalizeUrls(candidates).urls.flatMap((url) => {
      const section = classify({ url });
      if (!section || !["customer_portal", "technical_documentation", "documentation", "library", "support"].includes(section)) return [];
      const requiresAuthentication = section === "customer_portal";
      return [{
        url,
        portalType: section,
        supported: this.isOfficial(url) && !requiresAuthentication,
        requiresAuthentication,
        reason: requiresAuthentication
          ? "Authentication-gated portal detected; discovery does not attempt authorization."
          : "Public official documentation portal detected.",
      }];
    });
  }

  diagnostics(input: ProviderInput): ProviderDiagnostics {
    const normalization = this.normalizeUrls(input.urls);
    const portals = this.detectDocumentPortals(input.urls);
    return {
      providerName: this.name,
      strategyUsed: this.strategy,
      pagesVisited: normalization.urls.filter((url) => this.isOfficial(url)),
      candidateUrls: input.urls.map((candidate) => candidate.url),
      normalizedUrls: normalization.urls,
      duplicatesRemoved: normalization.duplicatesRemoved,
      blockedUrls: normalization.blockedUrls,
      unsupportedPortals: portals.filter((portal) => !portal.supported),
      warnings: [
        ...(normalization.blockedUrls.length
          ? [`Provider blocked ${normalization.blockedUrls.length} unsafe or unsupported URL(s).`]
          : []),
        ...(portals.some((portal) => !portal.supported)
          ? ["Authentication-gated portal detected; no authorization was attempted."]
          : []),
      ],
    };
  }
}
