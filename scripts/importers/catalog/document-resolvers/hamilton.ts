import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class HamiltonDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "hamilton";
  readonly manufacturerMatchers = [/hamilton\s+medical/iu, /hamilton-medical\.com/iu];
  readonly sectionKeywords = [
    "Documentation",
    "Downloads",
    "Technical Data",
    "Technical specifications",
    "Documents",
    "Resources",
  ];
  readonly linkKeywords = [
    "documentation",
    "downloads",
    "technical data",
    "technical specification",
    "bedienungshandbuch",
    "brochure",
    "software",
    "transport",
    "storage",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
