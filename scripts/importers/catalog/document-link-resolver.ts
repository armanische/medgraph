import { createHash } from "node:crypto";

import type {
  DiscoveryDocumentType,
  DocumentCandidate,
  SourceCandidate,
  TrustTier,
} from "./discovery.ts";

const DOCUMENT_LINK_TEXT_PATTERN =
  /\b(manual|user manual|operator manual|instructions?|instructions for use|ifu|datasheet|technical specifications?|brochure|leaflet|specifications?|downloads?|documents?|service manual|certificate|declaration)\b|инструкц|руководств|спецификац|брошюр|документ/iu;

const DOCUMENT_URL_PATTERN =
  /\.pdf(?:$|[?#])|\/(?:manual|ifu|datasheet|brochure|download|downloads|documents|certificate|declaration|specification)s?(?:\/|$|[?#])/iu;
const DIRECT_DOCUMENT_URL_PATTERN = /\.pdf(?:$|[?#])/iu;

const KNOWN_MANUFACTURER_HOSTS: Record<string, string[]> = {
  "Hamilton Medical": ["hamilton-medical.com"],
  Ambu: ["ambu.com"],
  Mindray: ["mindray.com"],
  SonoScape: ["sonoscape.com"],
  "Dräger": ["draeger.com", "drager.com"],
  Draeger: ["draeger.com", "drager.com"],
  "GE Healthcare": ["gehealthcare.com"],
  Philips: ["philips.com"],
};

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

interface LinkCandidate {
  href: string;
  text: string;
}

function stableId(prefix: string, parts: Array<string | number | null>) {
  return `${prefix}_${createHash("sha256")
    .update(parts.map((part) => String(part ?? "")).join("\u001f"))
    .digest("hex")
    .slice(0, 24)}`;
}

function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, "\"")
    .replace(/&#39;/giu, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

function attributeValue(tag: string, name: string) {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "iu",
  );
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function extractLinks(html: string): LinkCandidate[] {
  const links: LinkCandidate[] = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/giu)) {
    const href = attributeValue(match[1] ?? "", "href");
    if (!href) continue;
    links.push({ href, text: cleanText(match[2] ?? "") });
  }

  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/giu)) {
    const tag = match[1] ?? "";
    const href =
      attributeValue(tag, "data-href") ??
      attributeValue(tag, "data-url") ??
      attributeValue(tag, "formaction") ??
      (attributeValue(tag, "onclick")?.match(
        /(?:location(?:\.href)?|window\.open)\s*(?:=|\()\s*["']([^"']+)["']/iu,
      )?.[1] ??
        null);
    if (!href) continue;
    links.push({ href, text: cleanText(match[2] ?? "") });
  }

  return links;
}

export function classifyManufacturerDocumentLink(input: {
  url: string;
  linkText: string;
}): { documentType: DiscoveryDocumentType; warning: string | null } {
  const searchable = `${input.linkText} ${input.url}`.toLocaleLowerCase("en-US");
  if (/service\s+manual|service[-_\s]?handbuch|сервисн/.test(searchable)) {
    return { documentType: "service_manual", warning: null };
  }
  if (
    /user\s+manual|operator\s+manual|bedienungshandbuch|руководство/.test(
      searchable,
    )
  ) {
    return { documentType: "user_manual", warning: null };
  }
  if (
    /\bifu\b|instructions?\s+for\s+use|instruction(?:s)?|инструкц/.test(
      searchable,
    )
  ) {
    return { documentType: "ifu", warning: null };
  }
  if (
    /technical\s+specifications?|datasheets?|specifications?|technische\s+spezifikation|tech[-_\s]?specs?|спецификац/.test(
      searchable,
    )
  ) {
    return { documentType: "datasheet", warning: null };
  }
  if (/brochure|leaflet|broschuere|брошюр/.test(searchable)) {
    return { documentType: "brochure", warning: null };
  }
  if (/certificate|declaration|сертификат|деклараци/.test(searchable)) {
    return { documentType: "certificate", warning: null };
  }
  return {
    documentType: "unknown",
    warning: "Document type could not be classified confidently.",
  };
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

function hostMatches(host: string, allowed: string) {
  const normalizedHost = host.toLowerCase();
  const normalizedAllowed = allowed.toLowerCase();
  return (
    normalizedHost === normalizedAllowed ||
    normalizedHost.endsWith(`.${normalizedAllowed}`)
  );
}

function allowedHostsFor(source: SourceCandidate, extraHosts: string[]) {
  const sourceHost = new URL(source.url).hostname;
  return [
    sourceHost,
    ...extraHosts,
    ...(source.manufacturer ? (KNOWN_MANUFACTURER_HOSTS[source.manufacturer] ?? []) : []),
  ];
}

function documentTitle(linkText: string, documentType: DiscoveryDocumentType) {
  if (linkText) return linkText;
  return documentType === "unknown"
    ? "Unclassified manufacturer document"
    : `Manufacturer ${documentType}`;
}

function isDocumentLike(candidate: LinkCandidate, resolvedUrl: string) {
  return (
    DIRECT_DOCUMENT_URL_PATTERN.test(resolvedUrl) ||
    (DOCUMENT_LINK_TEXT_PATTERN.test(candidate.text) &&
      DOCUMENT_URL_PATTERN.test(resolvedUrl))
  );
}

function documentFromResolvedLink(input: {
  source: SourceCandidate;
  url: string;
  linkText: string;
  documentType: DiscoveryDocumentType;
  trustTier: TrustTier;
  warning: string | null;
}) {
  const reasons = [
    `trust_tier:${input.trustTier}`,
    "resolved from official manufacturer page",
    "document candidate only; download, hash and locator are still required",
    "requires human review before verification",
  ];
  if (input.warning) reasons.push(input.warning);
  return {
    documentId: stableId("document", [
      input.source.productSlug,
      input.source.sourceId,
      input.url,
      input.documentType,
    ]),
    sourceId: input.source.sourceId,
    productSlug: input.source.productSlug,
    documentType: input.documentType,
    url: input.url,
    title: documentTitle(input.linkText, input.documentType),
    language: null,
    confidence: input.documentType === "unknown" ? 0.58 : 0.86,
    trustTier: input.trustTier,
    requiresHumanReview: true,
    reasons,
  } satisfies DocumentCandidate;
}

export class DefaultManufacturerDocumentLinkResolver
  implements ManufacturerDocumentLinkResolver
{
  private readonly fetchImplementation: typeof fetch;
  private readonly allowedHosts: string[];
  private readonly timeoutMs: number;

  constructor(options: ManufacturerDocumentLinkResolverOptions = {}) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.allowedHosts = options.allowedHosts ?? [];
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  async resolve(source: SourceCandidate) {
    const warnings: string[] = [];
    if (source.sourceType !== "official_manufacturer_page") {
      return { links: [], warnings };
    }
    if (!isSafePublicUrl(source.url)) {
      return {
        links: [],
        warnings: [`Resolver rejected unsafe source URL: ${source.url}`],
      };
    }

    let html = "";
    try {
      const response = await this.fetchImplementation(source.url, {
        redirect: "follow",
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent":
            "CyberMedica-Document-Link-Resolver/0.1 (+candidate discovery)",
        },
      });
      if (!response.ok) {
        return {
          links: [],
          warnings: [`Resolver fetch failed for ${source.url}: HTTP ${response.status}`],
        };
      }
      const contentType = response.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        ?.toLowerCase();
      if (contentType && !["text/html", "application/xhtml+xml"].includes(contentType)) {
        return {
          links: [],
          warnings: [
            `Resolver skipped ${source.url}: expected HTML but received ${contentType}.`,
          ],
        };
      }
      html = await response.text();
    } catch (error) {
      return {
        links: [],
        warnings: [
          `Resolver fetch failed for ${source.url}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        ],
      };
    }

    const allowedHosts = allowedHostsFor(source, this.allowedHosts);
    const resolved = new Map<string, ResolvedDocumentLink>();
    for (const candidate of extractLinks(html)) {
      let url: URL;
      try {
        url = new URL(candidate.href, source.url);
      } catch {
        warnings.push(`Resolver skipped invalid href: ${candidate.href}`);
        continue;
      }
      url.hash = "";
      const href = url.href;
      if (!isSafePublicUrl(href)) {
        warnings.push(`Resolver rejected unsafe document URL: ${href}`);
        continue;
      }
      if (!allowedHosts.some((host) => hostMatches(url.hostname, host))) {
        warnings.push(`Resolver rejected offsite document URL: ${href}`);
        continue;
      }
      if (!isDocumentLike(candidate, href)) continue;
      const classification = classifyManufacturerDocumentLink({
        url: href,
        linkText: candidate.text,
      });
      const document = documentFromResolvedLink({
        source,
        url: href,
        linkText: candidate.text,
        documentType: classification.documentType,
        trustTier: source.trustTier,
        warning: classification.warning,
      });
      resolved.set(`${document.url}\u001f${document.documentType}`, {
        documentCandidate: document,
        documentTypeGuess: classification.documentType,
        parentSourceId: source.sourceId,
        linkText: candidate.text,
        resolvedFromUrl: source.url,
        warnings: classification.warning ? [classification.warning] : [],
      });
    }

    if (!resolved.size) {
      warnings.push(`Resolver found no document links on ${source.url}.`);
    }
    return {
      links: [...resolved.values()].sort((left, right) =>
        left.documentCandidate.url.localeCompare(right.documentCandidate.url),
      ),
      warnings,
    };
  }
}
