import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class GEDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "ge";
  readonly manufacturerMatchers = [/ge\s+healthcare/iu, /gehealthcare\.com/iu];
  readonly sectionKeywords = ["Support", "Resources", "Library", "Downloads", "Documents"];
  readonly linkKeywords = [
    "support",
    "resources",
    "library",
    "downloads",
    "manual",
    "technical data",
    "brochure",
    "datasheet",
    "quick guide",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
