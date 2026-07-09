import { createHash } from "node:crypto";

import type {
  DiscoveryDocumentType,
  DocumentCandidate,
  SourceCandidate,
  TrustTier,
} from "../discovery.ts";
import type {
  ResolverAdapter,
  ResolverDiagnostics,
  ResolverExecutionInput,
  ResolverExecutionResult,
  ResolverLinkCandidate,
  ResolvedDocumentLink,
} from "./interface.ts";

const GENERIC_DOCUMENT_KEYWORDS = [
  "pdf",
  "download",
  "resource",
  "resources",
  "document",
  "documents",
  "manual",
  "operator",
  "instructions",
  "ifu",
  "datasheet",
  "brochure",
  "technical",
  "catalogue",
  "catalog",
  "support",
  "library",
  "downloads",
  "media",
  "attachment",
];

const DIRECT_DOCUMENT_URL_PATTERN = /\.pdf(?:$|[?#])/iu;
const TRACKING_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
]);

export const KNOWN_MANUFACTURER_HOSTS: Record<string, string[]> = {
  "Hamilton Medical": ["hamilton-medical.com"],
  Ambu: ["ambu.com"],
  Mindray: ["mindray.com"],
  SonoScape: ["sonoscape.com"],
  "Dräger": ["draeger.com", "drager.com"],
  Draeger: ["draeger.com", "drager.com"],
  "GE Healthcare": ["gehealthcare.com"],
  Philips: ["philips.com"],
};

export interface DocumentClassification {
  documentType: DiscoveryDocumentType;
  label:
    | "Brochure"
    | "Datasheet"
    | "IFU"
    | "Operator Manual"
    | "Quick Guide"
    | "Service Manual"
    | "Technical Specification"
    | "Clinical Information"
    | "Software"
    | "Safety Information"
    | "Unknown";
  warning: string | null;
}

export function stableId(prefix: string, parts: Array<string | number | null>) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

export function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, "\"")
    .replace(/&#39;/giu, "'")
    .replace(/&rsquo;/giu, "'")
    .replace(/&ldquo;|&rdquo;/giu, "\"")
    .replace(/\s+/gu, " ")
    .trim();
}

export function attributeValue(tag: string, name: string) {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "iu",
  );
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

export function extractLinks(html: string, sourceUrl: string): ResolverLinkCandidate[] {
  const links: ResolverLinkCandidate[] = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/giu)) {
    const href = attributeValue(match[1] ?? "", "href");
    if (!href) continue;
    links.push({
      href,
      text:
        cleanText(match[2] ?? "") ||
        cleanText(attributeValue(match[1] ?? "", "title") ?? "") ||
        cleanText(attributeValue(match[1] ?? "", "aria-label") ?? ""),
      sourceUrl,
      context: "anchor",
    });
  }

  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/giu)) {
    const tag = match[1] ?? "";
    const href =
      attributeValue(tag, "data-href") ??
      attributeValue(tag, "data-url") ??
      attributeValue(tag, "data-download-url") ??
      attributeValue(tag, "formaction") ??
      (attributeValue(tag, "onclick")?.match(
        /(?:location(?:\.href)?|window\.open)\s*(?:=|\()\s*["']([^"']+)["']/iu,
      )?.[1] ??
        null);
    if (!href) continue;
    links.push({
      href,
      text: cleanText(match[2] ?? "") || cleanText(attributeValue(tag, "title") ?? ""),
      sourceUrl,
      context: "button",
    });
  }

  for (const match of html.matchAll(
    /\b(?:url|downloadUrl|fileUrl|file)\s*[:=]\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/giu,
  )) {
    links.push({
      href: match[1] ?? "",
      text: "PDF resource from page metadata",
      sourceUrl,
      context: "metadata",
    });
  }

  return links;
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
      )
    );
  } catch {
    return false;
  }
}

export function hostMatches(host: string, allowed: string) {
  const normalizedHost = host.toLowerCase();
  const normalizedAllowed = allowed.toLowerCase();
  return (
    normalizedHost === normalizedAllowed ||
    normalizedHost.endsWith(`.${normalizedAllowed}`)
  );
}

export function allowedHostsFor(source: SourceCandidate, extraHosts: string[]) {
  const sourceHost = new URL(source.url).hostname;
  return [
    sourceHost,
    ...extraHosts,
    ...(source.manufacturer ? (KNOWN_MANUFACTURER_HOSTS[source.manufacturer] ?? []) : []),
  ];
}

export function classifyManufacturerDocumentLink(input: {
  url: string;
  linkText: string;
}): DocumentClassification {
  const searchable = `${input.linkText} ${input.url}`.toLocaleLowerCase("en-US");
  if (/service\s+manual|service[-_\s]?handbuch|сервисн/.test(searchable)) {
    return { documentType: "service_manual", label: "Service Manual", warning: null };
  }
  if (
    /operator\s+manual|user\s+manual|bedienungshandbuch|operation\s+manual|руководство/.test(
      searchable,
    )
  ) {
    return { documentType: "user_manual", label: "Operator Manual", warning: null };
  }
  if (
    /\bifu\b|instructions?\s+for\s+use|instruction(?:s)?|инструкц/.test(
      searchable,
    )
  ) {
    return { documentType: "ifu", label: "IFU", warning: null };
  }
  if (/quick\s+guide|quick[-_\s]?reference|getting\s+started/.test(searchable)) {
    return { documentType: "user_manual", label: "Quick Guide", warning: null };
  }
  if (
    /technical\s+specifications?|technical\s+data|datasheets?|specifications?|technische\s+spezifikation|tech[-_\s]?specs?|спецификац/.test(
      searchable,
    )
  ) {
    return {
      documentType: "datasheet",
      label: /technical/.test(searchable)
        ? "Technical Specification"
        : "Datasheet",
      warning: null,
    };
  }
  if (/safety\s+(?:and\s+)?performance|safety\s+information|safety-info/.test(searchable)) {
    return {
      documentType: "unknown",
      label: "Safety Information",
      warning: "Safety information is candidate evidence and requires document-type review.",
    };
  }
  if (/clinical\s+(?:information|paper|leaflet)|clinical-information/.test(searchable)) {
    return {
      documentType: "brochure",
      label: "Clinical Information",
      warning: "Clinical information is supporting evidence and cannot replace IFU or datasheet.",
    };
  }
  if (/software|firmware|release\s+note|sw[-_\s]?version/.test(searchable)) {
    return {
      documentType: "unknown",
      label: "Software",
      warning: "Software document type requires human review.",
    };
  }
  if (/brochure|leaflet|catalogue|catalog|broschuere|брошюр/.test(searchable)) {
    return { documentType: "brochure", label: "Brochure", warning: null };
  }
  if (/certificate|declaration|сертификат|деклараци/.test(searchable)) {
    return { documentType: "certificate", label: "Unknown", warning: null };
  }
  return {
    documentType: "unknown",
    label: "Unknown",
    warning: "Document type could not be classified confidently.",
  };
}

export function canonicalDocumentUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const parameter of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMETERS.has(parameter.toLowerCase())) {
      url.searchParams.delete(parameter);
    }
  }
  return url.href;
}

function keywordPattern(words: string[]) {
  return new RegExp(
    words
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
      .join("|"),
    "iu",
  );
}

function isDocumentLike(
  candidate: ResolverLinkCandidate,
  resolvedUrl: string,
  adapter: ResolverAdapter,
) {
  const searchable = `${candidate.text} ${resolvedUrl}`;
  const urlLooksLikeDocumentSection = keywordPattern([
    "download",
    "downloads",
    "resource",
    "resources",
    "document",
    "documents",
    "support",
    "library",
    "media",
    "attachment",
    "brochure",
    "datasheet",
    "ifu",
    "manual",
    "catalogue",
    "catalog",
  ]).test(resolvedUrl);
  return (
    DIRECT_DOCUMENT_URL_PATTERN.test(resolvedUrl) ||
    (urlLooksLikeDocumentSection &&
      keywordPattern([...GENERIC_DOCUMENT_KEYWORDS, ...adapter.linkKeywords]).test(
        searchable,
      ))
  );
}

function isRetryPage(candidate: ResolverLinkCandidate, resolvedUrl: string, adapter: ResolverAdapter) {
  if (DIRECT_DOCUMENT_URL_PATTERN.test(resolvedUrl)) return false;
  const searchable = `${candidate.text} ${resolvedUrl}`;
  return keywordPattern([
    "downloads",
    "download",
    "resources",
    "resource",
    "support",
    "media",
    "library",
    "documentation",
    "documents",
    ...adapter.sectionKeywords,
  ]).test(searchable);
}

function confidenceFor(input: {
  url: string;
  sourceUrl: string;
  linkText: string;
  adapter: ResolverAdapter;
}) {
  const url = new URL(input.url);
  const sourceUrl = new URL(input.sourceUrl);
  const searchable = `${input.linkText} ${input.url}`;
  if (DIRECT_DOCUMENT_URL_PATTERN.test(input.url)) return 1;
  if (/download|downloads|attachment/.test(searchable)) return 0.95;
  if (keywordPattern(input.adapter.sectionKeywords).test(searchable)) return 0.9;
  if (url.hostname === sourceUrl.hostname) return 0.8;
  return 0.7;
}

function documentTitle(
  linkText: string,
  documentType: DiscoveryDocumentType,
  label: DocumentClassification["label"],
) {
  if (linkText) return linkText;
  if (label !== "Unknown") return `Manufacturer ${label}`;
  return documentType === "unknown"
    ? "Unclassified manufacturer document"
    : `Manufacturer ${documentType}`;
}

function documentFromResolvedLink(input: {
  source: SourceCandidate;
  url: string;
  linkText: string;
  classification: DocumentClassification;
  trustTier: TrustTier;
  confidence: number;
  resolverName: string;
  resolvedFromUrl: string;
}) {
  const reasons = [
    `trust_tier:${input.trustTier}`,
    `resolver:${input.resolverName}`,
    `resolver_confidence:${Math.round(input.confidence * 100)}`,
    `resolver_document_label:${input.classification.label}`,
    `resolved_from:${input.resolvedFromUrl}`,
    "resolved from official manufacturer page",
    "document candidate only; download, hash and locator are still required",
    "requires human review before verification",
  ];
  if (input.classification.warning) reasons.push(input.classification.warning);
  return {
    documentId: stableId("document", [
      input.source.productSlug,
      input.source.sourceId,
      input.url,
      input.classification.documentType,
    ]),
    sourceId: input.source.sourceId,
    productSlug: input.source.productSlug,
    documentType: input.classification.documentType,
    url: input.url,
    title: documentTitle(
      input.linkText,
      input.classification.documentType,
      input.classification.label,
    ),
    language: null,
    confidence: input.confidence,
    trustTier: input.trustTier,
    requiresHumanReview: true,
    reasons,
  } satisfies DocumentCandidate;
}

async function fetchHtml(input: {
  url: string;
  fetchImplementation: typeof fetch;
  timeoutMs: number;
}) {
  const response = await input.fetchImplementation(input.url, {
    redirect: "follow",
    signal: AbortSignal.timeout(input.timeoutMs),
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "CyberMedica-Document-Link-Resolver/0.2 (+candidate discovery)",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    ?.toLowerCase();
  if (contentType && !["text/html", "application/xhtml+xml"].includes(contentType)) {
    throw new Error(`expected HTML but received ${contentType}`);
  }
  return response.text();
}

function diagnosticsWarning(diagnostics: ResolverDiagnostics) {
  return [
    `resolver=${diagnostics.resolverName}`,
    `attempts=${diagnostics.attempts.length}`,
    `matchedLinks=${diagnostics.matchedLinks}`,
    `classifiedDocuments=${JSON.stringify(diagnostics.classifiedDocuments)}`,
    `confidenceDistribution=${JSON.stringify(diagnostics.confidenceDistribution)}`,
    `duplicatesRemoved=${diagnostics.duplicatesRemoved}`,
  ].join("; ");
}

export async function resolveWithAdapter(
  input: ResolverExecutionInput,
): Promise<ResolverExecutionResult> {
  const warnings: string[] = [];
  const allowedHosts = allowedHostsFor(input.source, input.allowedHosts);
  const diagnostics: ResolverDiagnostics = {
    resolverName: input.adapter.name,
    attempts: [{ url: input.source.url, label: "product page", depth: 0 }],
    matchedLinks: 0,
    classifiedDocuments: {},
    confidenceDistribution: {},
    duplicatesRemoved: 0,
  };
  const linkPool = extractLinks(input.html, input.source.url);
  const retryPages = new Map<string, ResolverLinkCandidate>();

  for (const candidate of linkPool) {
    let url: URL;
    try {
      url = new URL(candidate.href, candidate.sourceUrl);
    } catch {
      warnings.push(`Resolver skipped invalid href: ${candidate.href}`);
      continue;
    }
    const href = canonicalDocumentUrl(url.href);
    if (!isSafePublicUrl(href)) continue;
    if (!allowedHosts.some((host) => hostMatches(url.hostname, host))) continue;
    if (isRetryPage(candidate, href, input.adapter)) retryPages.set(href, candidate);
  }

  for (const [url, candidate] of [...retryPages.entries()].slice(0, 6)) {
    try {
      diagnostics.attempts.push({ url, label: candidate.text || "retry page", depth: 1 });
      const html = await fetchHtml({
        url,
        fetchImplementation: input.fetchImplementation,
        timeoutMs: input.timeoutMs,
      });
      linkPool.push(...extractLinks(html, url));
    } catch (error) {
      warnings.push(
        `Resolver retry skipped ${url}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  const resolved = new Map<string, ResolvedDocumentLink>();
  let acceptedBeforeDedupe = 0;
  for (const candidate of linkPool) {
    let url: URL;
    try {
      url = new URL(candidate.href, candidate.sourceUrl);
    } catch {
      warnings.push(`Resolver skipped invalid href: ${candidate.href}`);
      continue;
    }
    const href = canonicalDocumentUrl(url.href);
    if (!isSafePublicUrl(href)) {
      warnings.push(`Resolver rejected unsafe document URL: ${href}`);
      continue;
    }
    if (!allowedHosts.some((host) => hostMatches(url.hostname, host))) {
      warnings.push(`Resolver rejected offsite document URL: ${href}`);
      continue;
    }
    if (!isDocumentLike(candidate, href, input.adapter)) continue;

    const classification = classifyManufacturerDocumentLink({
      url: href,
      linkText: candidate.text,
    });
    const confidence = confidenceFor({
      url: href,
      sourceUrl: input.source.url,
      linkText: candidate.text,
      adapter: input.adapter,
    });
    const document = documentFromResolvedLink({
      source: input.source,
      url: href,
      linkText: candidate.text,
      classification,
      trustTier: input.source.trustTier,
      confidence,
      resolverName: input.adapter.name,
      resolvedFromUrl: candidate.sourceUrl,
    });
    acceptedBeforeDedupe += 1;
    diagnostics.classifiedDocuments[classification.label] =
      (diagnostics.classifiedDocuments[classification.label] ?? 0) + 1;
    const confidenceBucket = String(Math.round(confidence * 100));
    diagnostics.confidenceDistribution[confidenceBucket] =
      (diagnostics.confidenceDistribution[confidenceBucket] ?? 0) + 1;
    resolved.set(`${document.url}\u001f${document.documentType}`, {
      documentCandidate: document,
      documentTypeGuess: classification.documentType,
      parentSourceId: input.source.sourceId,
      linkText: candidate.text,
      resolvedFromUrl: candidate.sourceUrl,
      warnings: classification.warning ? [classification.warning] : [],
    });
  }

  diagnostics.matchedLinks = resolved.size;
  diagnostics.duplicatesRemoved = Math.max(0, acceptedBeforeDedupe - resolved.size);
  warnings.push(diagnosticsWarning(diagnostics));
  if (!resolved.size) {
    warnings.push(`Resolver found no document links on ${input.source.url}.`);
  }
  return {
    links: [...resolved.values()].sort((left, right) =>
      left.documentCandidate.url.localeCompare(right.documentCandidate.url),
    ),
    warnings,
    diagnostics,
  };
}
