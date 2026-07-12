export type ManufacturerSection =
  | "products"
  | "downloads"
  | "resources"
  | "support"
  | "documentation"
  | "library"
  | "media"
  | "professional"
  | "technical_documentation"
  | "customer_portal";

export interface ProviderUrlCandidate {
  url: string;
  title?: string;
  canonicalUrl?: string;
}

export interface ProviderInput {
  manufacturer: string | null;
  urls: ProviderUrlCandidate[];
}

export interface ProviderCandidate extends ProviderUrlCandidate {
  section: ManufacturerSection;
}

export interface NormalizedUrlResult {
  urls: string[];
  duplicatesRemoved: number;
  blockedUrls: string[];
}

export interface RegionalSiteResolution {
  url: string;
  region: string | null;
  official: boolean;
}

export interface DocumentPortalDetection {
  url: string;
  portalType: ManufacturerSection;
  supported: boolean;
  requiresAuthentication: boolean;
  reason: string;
}

export interface ProviderDiagnostics {
  providerName: string;
  strategyUsed: string;
  pagesVisited: string[];
  candidateUrls: string[];
  normalizedUrls: string[];
  duplicatesRemoved: number;
  blockedUrls: string[];
  unsupportedPortals: DocumentPortalDetection[];
  warnings: string[];
}

export interface ManufacturerProvider {
  readonly name: string;
  readonly strategy: string;
  matches(manufacturer: string | null): boolean;
  discoverOfficialPages(input: ProviderInput): ProviderCandidate[];
  discoverDocumentation(input: ProviderInput): ProviderCandidate[];
  discoverDownloads(input: ProviderInput): ProviderCandidate[];
  normalizeUrls(urls: ProviderUrlCandidate[]): NormalizedUrlResult;
  resolveRegionalSites(urls: ProviderUrlCandidate[]): RegionalSiteResolution[];
  detectDocumentPortals(urls: ProviderUrlCandidate[]): DocumentPortalDetection[];
  diagnostics(input: ProviderInput): ProviderDiagnostics;
}
