import type { SourceCandidate } from "../discovery.ts";
import type { ResolverAdapter } from "./interface.ts";

export class DragerDocumentResolverAdapter implements ResolverAdapter {
  readonly name = "drager";
  readonly manufacturerMatchers = [/dr[äa]ger/iu, /draeger\.com/iu, /drager\.com/iu];
  readonly sectionKeywords = ["Downloads", "Media Center", "Manuals", "Documents", "Resources"];
  readonly linkKeywords = [
    "downloads",
    "media center",
    "manuals",
    "instructions for use",
    "technical data",
    "brochure",
    "software",
  ];

  matches(source: SourceCandidate) {
    return this.manufacturerMatchers.some((pattern) =>
      pattern.test(`${source.manufacturer ?? ""} ${source.url} ${source.title}`),
    );
  }
}
