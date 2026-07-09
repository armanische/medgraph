import type {
  DiscoveryDocumentType,
  DocumentCandidate,
  SourceCandidate,
} from "../discovery.ts";

export interface ResolvedDocumentLink {
  documentCandidate: DocumentCandidate;
  documentTypeGuess: DiscoveryDocumentType;
  parentSourceId: string;
  linkText: string;
  resolvedFromUrl: string;
  warnings: string[];
}

export interface ManufacturerDocumentLinkResolver {
  resolve(source: SourceCandidate): Promise<{
    links: ResolvedDocumentLink[];
    warnings: string[];
  }>;
}

export interface ManufacturerDocumentLinkResolverOptions {
  fetchImplementation?: typeof fetch;
  allowedHosts?: string[];
  timeoutMs?: number;
}

export interface ResolverLinkCandidate {
  href: string;
  text: string;
  sourceUrl: string;
  context: "anchor" | "button" | "metadata" | "script";
}

export interface ResolverAttempt {
  url: string;
  label: string;
  depth: number;
}

export interface ResolverDiagnostics {
  resolverName: string;
  attempts: ResolverAttempt[];
  matchedLinks: number;
  classifiedDocuments: Record<string, number>;
  confidenceDistribution: Record<string, number>;
  duplicatesRemoved: number;
}

export interface ResolverAdapter {
  readonly name: string;
  readonly manufacturerMatchers: RegExp[];
  readonly sectionKeywords: string[];
  readonly linkKeywords: string[];
  matches(source: SourceCandidate): boolean;
}

export interface ResolverExecutionInput {
  source: SourceCandidate;
  html: string;
  adapter: ResolverAdapter;
  fetchImplementation: typeof fetch;
  timeoutMs: number;
  allowedHosts: string[];
}

export interface ResolverExecutionResult {
  links: ResolvedDocumentLink[];
  warnings: string[];
  diagnostics: ResolverDiagnostics;
}
