import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class MindrayDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "mindray";
  readonly manufacturerMatchers = [/mindray/iu, /mindray\.com/iu];
  readonly sectionKeywords = [
    "Resources",
    "Support",
    "Downloads",
    "Safety Information",
    "Brochure",
    "Clinical Information",
  ];
  readonly linkKeywords = [
    "resources",
    "support",
    "downloads",
    "safety information",
    "safety and performance",
    "clinical information",
    "clinical paper",
    "product brochure",
    "leaflet",
    "datasheet",
    "manual",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
