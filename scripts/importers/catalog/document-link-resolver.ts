import type { SourceCandidate } from "./discovery.ts";
import {
  classifyManufacturerDocumentLink,
  isSafePublicUrl,
  resolveWithAdapter,
} from "./document-resolvers/base-resolver.ts";
import { DefaultDocumentResolverAdapter } from "./document-resolvers/default.ts";
import { AmbuDocumentResolverAdapter } from "./document-resolvers/ambu.ts";
import { DragerDocumentResolverAdapter } from "./document-resolvers/drager.ts";
import { GEDocumentResolverAdapter } from "./document-resolvers/ge.ts";
import { HamiltonDocumentResolverAdapter } from "./document-resolvers/hamilton.ts";
import { MindrayDocumentResolverAdapter } from "./document-resolvers/mindray.ts";
import { PhilipsDocumentResolverAdapter } from "./document-resolvers/philips.ts";
import type {
  ManufacturerDocumentLinkResolver,
  ManufacturerDocumentLinkResolverOptions,
  ResolverAdapter,
  ResolvedDocumentLink,
} from "./document-resolvers/interface.ts";

export { classifyManufacturerDocumentLink };
export type {
  ManufacturerDocumentLinkResolver,
  ManufacturerDocumentLinkResolverOptions,
  ResolvedDocumentLink,
};

const RESOLVER_ADAPTERS: ResolverAdapter[] = [
  new HamiltonDocumentResolverAdapter(),
  new MindrayDocumentResolverAdapter(),
  new AmbuDocumentResolverAdapter(),
  new DragerDocumentResolverAdapter(),
  new PhilipsDocumentResolverAdapter(),
  new GEDocumentResolverAdapter(),
];

const DEFAULT_ADAPTER = new DefaultDocumentResolverAdapter();

function adapterFor(source: SourceCandidate) {
  return RESOLVER_ADAPTERS.find((adapter) => adapter.matches(source)) ?? DEFAULT_ADAPTER;
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
      html = await fetchHtml({
        url: source.url,
        fetchImplementation: this.fetchImplementation,
        timeoutMs: this.timeoutMs,
      });
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

    const adapter = adapterFor(source);
    const result = await resolveWithAdapter({
      source,
      html,
      adapter,
      fetchImplementation: this.fetchImplementation,
      timeoutMs: this.timeoutMs,
      allowedHosts: this.allowedHosts,
    });
    warnings.push(`Resolver adapter used: ${adapter.name}`);
    warnings.push(...result.warnings);
    return {
      links: result.links,
      warnings,
    };
  }
}
