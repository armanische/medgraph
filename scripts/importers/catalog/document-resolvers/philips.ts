import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class PhilipsDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "philips";
  readonly manufacturerMatchers = [/philips/iu, /philips\.com/iu];
  readonly sectionKeywords = ["Documentation", "Downloads", "Instructions", "Support", "Resources"];
  readonly linkKeywords = [
    "documentation",
    "downloads",
    "instructions",
    "ifu",
    "manual",
    "product brochure",
    "specifications",
    "support",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
